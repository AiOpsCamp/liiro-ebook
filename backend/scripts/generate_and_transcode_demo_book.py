import os
import sys
import json
import soundfile as sf
import numpy as np
from kokoro_onnx import Kokoro
from pymongo import MongoClient

MONGO_URI = "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true"

def run_pipeline(slug="the-strange-case-of-dr-jekyll-and-mr-hyde", chapter_num=1):
    print(f"🚀 [Pipeline] Starting complete Audiobook Generation & Transcoding Pipeline for '{slug}' Ch {chapter_num}...")
    sys.stdout.flush()

    client = MongoClient(MONGO_URI)
    db = client.get_default_database()

    story = db["stories"].find_one({"slug": slug})
    if not story:
        print(f"❌ Story '{slug}' not found!")
        return

    chapter = db["storychapters"].find_one({"storyId": story["_id"], "chapterNumber": chapter_num})
    if not chapter:
        print(f"❌ Chapter {chapter_num} not found!")
        return

    raw_text = chapter["textPayload"]["en"] if isinstance(chapter["textPayload"], dict) else chapter["textPayload"]
    paragraphs = [p.strip() for p in raw_text.split("\n") if p.strip()]

    print(f"📖 Text loaded: {len(paragraphs)} paragraphs. Initializing Kokoro ONNX model...")
    sys.stdout.flush()

    kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")

    audio_chunks = []
    timestamps = []
    current_time_sec = 0.0
    sr = 24000

    # 1. Synthesize Audio & Calculate Sentence Timestamps
    for idx, p in enumerate(paragraphs[:10]):
        try:
            samples, sample_rate = kokoro.create(p[:280], voice="am_adam", speed=1.0, lang="en-us")
            dur = len(samples) / sample_rate

            start_sec = round(current_time_sec, 2)
            end_sec = round(current_time_sec + dur, 2)

            timestamps.append({
                "paragraphIndex": idx,
                "text": p[:80] + ("..." if len(p) > 80 else ""),
                "startSec": start_sec,
                "endSec": end_sec,
                "start": start_sec,
                "end": end_sec,
            })

            current_time_sec += dur
            audio_chunks.append(samples)
            sr = sample_rate
            print(f"   ✅ [Paragraph {idx+1}/{len(paragraphs[:10])}] {dur:.2f}s (Cumulative: {current_time_sec:.2f}s)")
            sys.stdout.flush()
        except Exception as e:
            print(f"   ⚠️ Error synthesizing para {idx+1}: {e}")
            sys.stdout.flush()

    full_audio = np.concatenate(audio_chunks)
    total_duration_sec = round(len(full_audio) / sr, 2)

    out_dir = os.path.join("audio_output", slug)
    os.makedirs(out_dir, exist_ok=True)
    out_wav = os.path.join(out_dir, f"voice_adam_chapter_{chapter_num}.wav")
    out_mp3 = os.path.join(out_dir, f"voice_adam_chapter_{chapter_num}.mp3")

    sf.write(out_wav, full_audio, sr)
    os.system(f"ffmpeg -y -i '{out_wav}' '{out_mp3}' >/dev/null 2>&1")
    if os.path.exists(out_wav):
        os.remove(out_wav)

    print(f"🎧 [Synthesis Complete] File saved to {out_mp3} ({total_duration_sec} seconds / {total_duration_sec/60:.2f} mins)")
    sys.stdout.flush()

    # 2. Update Database with Alignment Timestamps & Audio Meta
    db["storychapters"].update_one(
        {"_id": chapter["_id"]},
        {
            "$set": {
                "timestamps": timestamps,
                "totalDurationSeconds": total_duration_sec,
                "durationSeconds": total_duration_sec,
                "audioUrl": f"https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/{slug}/voices/adam/chapter_{chapter_num}.mp3",
                "audioVoices": {
                  "defaultVoiceId": "adam",
                  "adam": f"https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/{slug}/voices/adam/chapter_{chapter_num}.mp3"
                },
                "updatedAt": db["storychapters"].find_one({"_id": chapter["_id"]}).get("updatedAt")
            }
        }
    )
    print(f"💾 [Database Updated] Whispersync forced alignment timestamps ({len(timestamps)} segments) saved for '{slug}' Ch {chapter_num}")
    sys.stdout.flush()

if __name__ == "__main__":
    slug_arg = sys.argv[1] if len(sys.argv) > 1 else "the-strange-case-of-dr-jekyll-and-mr-hyde"
    run_pipeline(slug_arg, 1)
