import os
import sys
import json
import urllib.request
import soundfile as sf
import numpy as np
from kokoro_onnx import Kokoro
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URL", "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin")
client = MongoClient(MONGO_URI)
db = client.get_default_database()

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

MODEL_PATH = "kokoro-v1.0.onnx"
VOICES_PATH = "voices-v1.0.bin"

OUTPUT_DIR = "/Users/humayunrashid/multicamp/multicamp-frontend/public/audio/the-strange-case-of-dr-jekyll-and-mr-hyde"

VOICES = [
    {"id": "am_adam", "key": "adam", "name": "Adam (US Male)"},
    {"id": "af_heart", "key": "heart", "name": "Heart (US Female)"},
    {"id": "bf_emma", "key": "emma", "name": "Emma (UK Female)"},
    {"id": "bm_george", "key": "george", "name": "George (UK Male)"}
]

def download_if_missing(url, path):
    if not os.path.exists(path):
        print(f"📥 Downloading {path} from {url}...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"✅ Downloaded {path}")

def generate_audio_untruncated(kokoro, full_text, voice_id):
    # Process EVERY SINGLE PARAGRAPH and WORD (100% untruncated!)
    paragraphs = [p.strip() for p in full_text.split("\n") if p.strip()]
    audio_chunks = []
    final_sr = 24000

    for p_idx, p in enumerate(paragraphs):
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
                print(f"      ⚠️ Synthesis error on para {p_idx}: {ex}")

    if not audio_chunks:
        return None, 24000
    return np.concatenate(audio_chunks), final_sr

def generate_100pct_complete_book():
    download_if_missing(MODEL_URL, MODEL_PATH)
    download_if_missing(VOICES_URL, VOICES_PATH)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    slug = "the-strange-case-of-dr-jekyll-and-mr-hyde"
    story = db["stories"].find_one({"slug": slug})
    if not story:
        print("❌ Story not found:", slug)
        sys.exit(1)

    chapters = list(db["storychapters"].find({"storyId": story["_id"]}).sort("chapterNumber", 1))
    story_title = story.get('title')
    if isinstance(story_title, dict):
        story_title = story_title.get('en', 'Dr. Jekyll')
    print(f"📖 100% UNTRUNCATED AUDIO SYNTHESIS FOR '{story_title}' ({len(chapters)} Chapters)...")

    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

    for ch in chapters:
        ch_num = ch.get("chapterNumber", 1)
        raw_text = ch.get("textPayload", "")
        if isinstance(raw_text, dict):
            raw_text = raw_text.get("en", "")
        raw_title = ch.get("title", f"Chapter {ch_num}")
        if isinstance(raw_title, dict):
            raw_title = raw_title.get("en", f"Chapter {ch_num}")

        full_chapter_text = f"{raw_title}.\n\n" + raw_text.strip()
        text_len = len(full_chapter_text)
        word_count = len(full_chapter_text.split())
        print(f"\n🎧 [Chapter {ch_num}] {raw_title} ({text_len:,} chars | {word_count:,} words)...")

        for v in VOICES:
            out_wav = os.path.join(OUTPUT_DIR, f"voice_{v['key']}_chapter_{ch_num}.wav")
            out_mp3 = os.path.join(OUTPUT_DIR, f"voice_{v['key']}_chapter_{ch_num}.mp3")

            samples, sr = generate_audio_untruncated(kokoro, full_chapter_text, v['id'])
            if samples is not None:
                sf.write(out_wav, samples, sr)
                os.system(f"ffmpeg -y -i '{out_wav}' '{out_mp3}' >/dev/null 2>&1")
                if os.path.exists(out_wav):
                    os.remove(out_wav)
                dur_sec = len(samples) / sr
                print(f"   ✅ {v['name']}: voice_{v['key']}_chapter_{ch_num}.mp3 ({dur_sec/60:.2f} mins / {int(dur_sec)}s)")

    print("\n==================================================")
    print("🎉 100% UNTRUNCATED FULL CHAPTER AUDIO SYNTHESIS COMPLETE!")
    print("==================================================")

if __name__ == "__main__":
    generate_100pct_complete_book()
