import os
import sys
import json
import urllib.request
from datetime import datetime, timezone
import soundfile as sf
import numpy as np
import boto3
from botocore.exceptions import NoCredentialsError
import pymongo
from kokoro_onnx import Kokoro
import whisper

# Force unbuffered stdout for live progress logging
sys.stdout.reconfigure(line_buffering=True)

DEFAULT_MONGO = "mongodb://127.0.0.1:27017/liiro_prod"
MONGO_URI = os.getenv("MONGO_URL", DEFAULT_MONGO)

def get_mongo_client():
    if "PROD_PASSWORD" in MONGO_URI:
        try:
            client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            return client
        except Exception:
            pass
    return pymongo.MongoClient("mongodb://127.0.0.1:27017/liiro_prod")

HETZNER_BUCKET = "multicamp-prod-storage"
HETZNER_ENDPOINT = "https://nbg1.your-objectstorage.com"
HETZNER_CDN_BASE = "https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ebooks"

AWS_KEY = os.getenv("HETZNER_ACCESS_KEY_ID", os.getenv("HETZNER_S3_KEY", "KVFSGG7GLKG95GYEJOE3"))
AWS_SECRET = os.getenv("HETZNER_SECRET_ACCESS_KEY", os.getenv("HETZNER_S3_SECRET", "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK"))

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "kokoro-v1.0.onnx")
VOICES_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "voices-v1.0.bin")

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=HETZNER_ENDPOINT,
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET
    )

def download_if_missing(url, path):
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        print(f"📥 Downloading Kokoro weights {os.path.basename(path)}...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"✅ Downloaded {os.path.basename(path)}")

def generate_audio_for_text(kokoro, full_text, voice_id="am_adam"):
    paragraphs = [p.strip() for p in full_text.split("\n") if p.strip()]
    audio_chunks = []
    final_sr = 24000

    for p in paragraphs:
        chunk_size = 350
        for i in range(0, len(p), chunk_size):
            segment = p[i:i+chunk_size].strip()
            if not segment:
                continue
            try:
                samples, sr = kokoro.create(segment, voice=voice_id, speed=1.0, lang="en-us")
                audio_chunks.append(samples)
                final_sr = sr
            except Exception as ex:
                pass

    if not audio_chunks:
        return None, 24000
    return np.concatenate(audio_chunks), final_sr

def transcode_and_upload_multi_bitrates(s3_client, wav_path, slug, ch_num, out_dir):
    """
    Production Multi-Bitrate Transcoding Profiles:
    - high: 128kbps stereo MP3 (Desktop Web, iPad, WiFi)
    - standard: 64kbps mono MP3 (Cellular 4G/5G mobile)
    - low: 32kbps mono MP3 (3G mobile & fast offline chapter downloads)
    """
    profiles = {
        "high": {"bitrate": "128k", "args": "-b:a 128k"},
        "standard": {"bitrate": "64k", "args": "-ac 1 -b:a 64k"},
        "low": {"bitrate": "32k", "args": "-ac 1 -b:a 32k"}
    }

    bitrate_urls = {}

    for quality, p in profiles.items():
        mp3_filename = f"chapter_{ch_num}_{quality}.mp3"
        local_mp3 = os.path.join(out_dir, mp3_filename)
        os.system(f"ffmpeg -y -i \"{wav_path}\" {p['args']} \"{local_mp3}\" >/dev/null 2>&1")

        s3_key = f"LangoReads-Prod/ebooks/{slug}/audio/{quality}/chapter_{ch_num}.mp3"
        print(f"   ☁️ Uploading {quality.upper()} ({p['bitrate']}) MP3 to Hetzner S3 CDN...")

        with open(local_mp3, "rb") as f:
            s3_client.put_object(
                Bucket=HETZNER_BUCKET,
                Key=s3_key,
                Body=f,
                ACL="public-read",
                ContentType="audio/mpeg",
                CacheControl="public, max-age=31536000, immutable"
            )

        bitrate_urls[quality] = f"{HETZNER_CDN_BASE}/{slug}/audio/{quality}/chapter_{ch_num}.mp3"

    # Set default root audio URL to standard quality (for backwards compatibility)
    default_s3_key = f"LangoReads-Prod/ebooks/{slug}/chapter_{ch_num}.mp3"
    local_std_mp3 = os.path.join(out_dir, f"chapter_{ch_num}_standard.mp3")
    with open(local_std_mp3, "rb") as f:
        s3_client.put_object(
            Bucket=HETZNER_BUCKET,
            Key=default_s3_key,
            Body=f,
            ACL="public-read",
            ContentType="audio/mpeg",
            CacheControl="public, max-age=31536000, immutable"
        )
    bitrate_urls["default"] = f"{HETZNER_CDN_BASE}/{slug}/chapter_{ch_num}.mp3"

    return bitrate_urls, local_std_mp3

def generate_and_align_ebook_audio(slug):
    client = get_mongo_client()
    db = client["liiro_prod"]

    story = db["stories"].find_one({"slug": slug})
    if not story:
        print(f"❌ Story not found in MongoDB: {slug}")
        sys.exit(1)

    story_title = story.get("title", {})
    if isinstance(story_title, dict):
        story_title = story_title.get("en", slug)

    chapters = list(db["storychapters"].find({"storyId": story["_id"]}).sort("chapterNumber", 1))
    print("=======================================================================")
    print(f"🎙️ ENTERPRISE MULTI-BITRATE AUDIO GENERATION & WHISPER ALIGNMENT")
    print(f"   Book: \"{story_title}\" ({slug})")
    print(f"   Total Chapters to Process: {len(chapters)}")
    print("=======================================================================")

    download_if_missing(MODEL_URL, MODEL_PATH)
    download_if_missing(VOICES_URL, VOICES_PATH)

    print("🎙️ Initializing Kokoro v1.0 ONNX Engine...")
    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

    print("🤖 Loading OpenAI Whisper Forced Alignment Model (tiny.en)...")
    whisper_model = whisper.load_model("tiny.en")

    s3_client = get_s3_client()
    out_dir = os.path.join(os.path.dirname(__file__), "..", "scratch", "audio_out", slug)
    os.makedirs(out_dir, exist_ok=True)

    for ch in chapters:
        ch_num = ch.get("chapterNumber", 1)
        raw_text = ch.get("textPayload", "")
        if isinstance(raw_text, dict):
            raw_text = raw_text.get("en", "")

        raw_title = ch.get("title", f"Chapter {ch_num}")
        if isinstance(raw_title, dict):
            raw_title = raw_title.get("en", f"Chapter {ch_num}")

        full_chapter_text = f"{raw_title}.\n\n" + raw_text.strip()
        print(f"\n🎧 [Chapter {ch_num}/{len(chapters)}] Synthesizing Multi-Bitrate Audio for \"{raw_title}\"...")

        wav_path = os.path.join(out_dir, f"chapter_{ch_num}.wav")

        samples, sr = generate_audio_for_text(kokoro, full_chapter_text, voice_id="am_adam")
        if samples is None or len(samples) == 0:
            print(f"⚠️ Failed to generate audio for Chapter {ch_num}")
            continue

        sf.write(wav_path, samples, sr)

        # Transcode & Upload 3 Multi-Bitrate Profiles (High 128k, Standard 64k, Low 32k)
        bitrate_urls, local_whisper_mp3 = transcode_and_upload_multi_bitrates(s3_client, wav_path, slug, ch_num, out_dir)

        print(f"🎯 Running OpenAI Whisper Sentence & Word Alignment for Chapter {ch_num}...")
        alignment_res = whisper_model.transcribe(local_whisper_mp3, word_timestamps=True)

        exercise_sentences = []
        schema_timestamps = []

        for seg in alignment_res.get("segments", []):
            seg_text = seg.get("text", "").strip()
            seg_start = round(float(seg.get("start", 0.0)), 3)
            seg_end = round(float(seg.get("end", 0.0)), 3)

            word_list = []
            schema_words = []

            for w in seg.get("words", []):
                w_text = w.get("word", "").strip()
                if "start" in w and "end" in w:
                    w_start = round(float(w["start"]), 3)
                    w_end = round(float(w["end"]), 3)
                    word_list.append({
                        "text": w_text,
                        "word": w_text,
                        "start": w_start,
                        "end": w_end,
                        "startSec": w_start,
                        "endSec": w_end
                    })
                    schema_words.append({
                        "word": w_text,
                        "startSec": w_start,
                        "endSec": w_end
                    })

            if word_list:
                exercise_sentences.append({
                    "text": seg_text,
                    "start": seg_start,
                    "end": seg_end,
                    "startSec": seg_start,
                    "endSec": seg_end,
                    "words": word_list
                })
                schema_timestamps.append({
                    "text": seg_text,
                    "startSec": seg_start,
                    "endSec": seg_end,
                    "words": schema_words
                })

        duration_sec = exercise_sentences[-1]["endSec"] if exercise_sentences else 0.0

        db["storychapters"].update_one(
            {"_id": ch["_id"]},
            {
                "$set": {
                    "audioUrl": bitrate_urls["default"],
                    "audioBitrates": {
                        "high": bitrate_urls["high"],
                        "standard": bitrate_urls["standard"],
                        "low": bitrate_urls["low"]
                    },
                    "audioVoices": {
                        "defaultVoiceId": "adam",
                        "adam": bitrate_urls["standard"],
                        "voices": [
                            {"id": "am_adam", "key": "adam", "name": "Adam (Studio Male)", "url": bitrate_urls["standard"]}
                        ]
                    },
                    "wordTimestamps.en": exercise_sentences,
                    "timestamps": schema_timestamps,
                    "durationSeconds.en": duration_sec,
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        print(f"   ✅ Chapter {ch_num} Multi-Bitrate Audio & Alignment Saved to MongoDB! (Duration: {duration_sec:.1f}s, Sentences: {len(schema_timestamps)})")

    db["stories"].update_one(
        {"_id": story["_id"]},
        {"$set": {"hasAudio": True, "isAudiobook": True, "updatedAt": datetime.now(timezone.utc)}}
    )

    print("\n=======================================================================")
    print(f"🎉 MULTI-BITRATE AUDIO GENERATION & ALIGNMENT COMPLETE FOR \"{story_title.upper()}\"!")
    print(f"   High Quality (128k): {HETZNER_CDN_BASE}/{slug}/audio/high")
    print(f"   Standard Quality (64k): {HETZNER_CDN_BASE}/{slug}/audio/standard")
    print(f"   Data Saver Quality (32k): {HETZNER_CDN_BASE}/{slug}/audio/low")
    print("=======================================================================")

if __name__ == "__main__":
    slug_input = sys.argv[1] if len(sys.argv) > 1 else "through-the-looking-glass"
    generate_and_align_ebook_audio(slug_input)
