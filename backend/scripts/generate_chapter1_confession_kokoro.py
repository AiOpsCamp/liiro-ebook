import os
import sys
import json
import urllib.request
import soundfile as sf
import numpy as np
from kokoro_onnx import Kokoro
from pymongo import MongoClient

# Cloud MongoDB Atlas URI
MONGO_URI = os.getenv("MONGO_URL", "mongodb+srv://raahatrashid09_db_user:TNYegxNgSWRhV5Xn@cluster0.xips3wo.mongodb.net/langoreads")
client = MongoClient(MONGO_URI)
db = client.get_database()

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

MODEL_PATH = "kokoro-v1.0.onnx"
VOICES_PATH = "voices-v1.0.bin"

SLUG = "a-confession_aylmer-maude"
OUTPUT_DIR = f"/Users/humayunrashid/multicamp/liiro-ebook/frontend/public/audio/{SLUG}"

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

def generate_audio_for_text(kokoro, full_text, voice_id):
    # Process text paragraphs
    text_segment = full_text[:3000]
    paragraphs = [p.strip() for p in text_segment.split("\n") if p.strip()]
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
                print(f"      ⚠️ Chunk synth error: {ex}")

    if not audio_chunks:
        return None, 24000
    return np.concatenate(audio_chunks), final_sr

def main():
    download_if_missing(MODEL_URL, MODEL_PATH)
    download_if_missing(VOICES_URL, VOICES_PATH)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    story = db["stories"].find_one({"slug": SLUG})
    if not story:
        print(f"❌ Story not found with slug: {SLUG}")
        sys.exit(1)

    story_id = story["_id"]
    story_title = story.get("title", {})
    if isinstance(story_title, dict):
        story_title = story_title.get("en", SLUG)

    print(f"📖 Found Story: '{story_title}' ({story_id})")

    # Fetch Chapter 1
    ch = db["storychapters"].find_one({"storyId": story_id, "chapterNumber": 1})
    if not ch:
        ch = db["storychapters"].find_one({"storyId": story_id})
    if not ch:
        print("❌ Chapter 1 not found!")
        sys.exit(1)

    ch_num = ch.get("chapterNumber", 1)
    ch_id = ch["_id"]
    ch_title = ch.get("title", {})
    if isinstance(ch_title, dict):
        ch_title = ch_title.get("en", f"Chapter {ch_num}")

    raw_content = ch.get("content", {})
    if isinstance(raw_content, dict):
        raw_text = raw_content.get("en", "")
    else:
        raw_text = str(raw_content or "")

    if not raw_text:
        raw_text = ch.get("textPayload", "")
        if isinstance(raw_text, dict):
            raw_text = raw_text.get("en", "")

    full_chapter_text = f"Chapter {ch_num}. {ch_title}.\n\n" + raw_text.strip()
    print(f"🎙️ Chapter {ch_num}: '{ch_title}' ({len(full_chapter_text)} chars)")

    print("🎙️ Initializing Kokoro v1.0 ONNX Engine...")
    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

    audio_stream_urls = {}

    for v in VOICES:
        out_wav = os.path.join(OUTPUT_DIR, f"voice_{v['key']}_chapter_{ch_num}.wav")
        print(f"  🔊 Generating voice '{v['name']}' ({v['id']}) -> {out_wav}...")

        samples, sr = generate_audio_for_text(kokoro, full_chapter_text, v["id"])
        if samples is not None:
            sf.write(out_wav, samples, sr)
            print(f"  ✅ Saved {out_wav} ({len(samples)/sr:.1f} sec)")
            stream_url = f"http://localhost:8086/audio/{SLUG}/voice_{v['key']}_chapter_{ch_num}.wav"
            audio_stream_urls[v['key']] = stream_url

    default_audio_url = audio_stream_urls.get("adam") or audio_stream_urls.get("heart") or list(audio_stream_urls.values())[0]

    # Update Cloud MongoDB Atlas
    print("\n💾 Updating MongoDB Atlas database record...")
    db["storychapters"].update_one(
        {"_id": ch_id},
        {"$set": {
            "audioUrl": default_audio_url,
            "audioStreamUrls": audio_stream_urls,
            "isAudioAvailable": True
        }}
    )

    db["stories"].update_one(
        {"_id": story_id},
        {"$set": {
            "contentType": "both",
            "isAudioAvailable": True
        }}
    )

    print(f"🎉 SUCCESS! Chapter 1 Kokoro TTS generation complete for '{SLUG}'!")
    print(f"🔗 Audio Stream URL: {default_audio_url}")

if __name__ == "__main__":
    main()
