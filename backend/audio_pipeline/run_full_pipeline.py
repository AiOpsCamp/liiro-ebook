#!/usr/bin/env python3
"""
🚀 Enterprise Audio Generation Pipeline Orchestrator
===================================================
Master single-command CLI script that extracts chapter texts from MongoDB,
sanitizes text (deduplicates headings, strips asterisks & special noise symbols),
synthesizes Kokoro ONNX speech, generates Whispersync forced-alignment timestamps,
transcodes to HLS VOD format, uploads to Hetzner S3, and links to MongoDB `liiro_prod`.

Usage:
  python3 backend/audio_pipeline/run_full_pipeline.py --slug the-strange-case-of-dr-jekyll-and-mr-hyde --voice am_adam --upload --hls
"""

import os
import sys
import json
import argparse
import subprocess
from pymongo import MongoClient

# Add audio_pipeline directory to sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from cleaner import prepare_tts_script
from synthesizer import AudioSynthesizer
from aligner import generate_sentence_timestamps
from transcoder import transcode_to_hls

MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true")

def run_pipeline(slug: str, voice: str = "am_adam", speed: float = 1.0, upload: bool = True, hls: bool = True, chapter_limit: int = 0):
    print(f"\n=======================================================")
    print(f"🚀 STARTING AUDIO GENERATION PIPELINE FOR '{slug}'")
    print(f"   Voice: {voice} | Speed: {speed}x | Upload: {upload} | HLS: {hls}")
    print(f"=======================================================\n")

    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client.get_database("liiro_prod")

    story = db.stories.find_one({"slug": slug})
    if not story:
        print(f"❌ Error: Story with slug '{slug}' not found in MongoDB.")
        sys.exit(1)

    chapters = list(db.storychapters.find({"storyId": story["_id"]}).sort("chapterNumber", 1))
    if not chapters:
        print(f"❌ Error: No chapters found for story '{slug}'.")
        sys.exit(1)

    if chapter_limit > 0:
        chapters = chapters[:chapter_limit]

    print(f"📖 Found {len(chapters)} chapters to process.\n")

    synthesizer = AudioSynthesizer()
    out_base_dir = f"/tmp/audio_pipeline_out/{slug}"
    os.makedirs(out_base_dir, exist_ok=True)

    voice_clean_key = voice.replace("am_", "").replace("af_", "").lower()

    for idx, ch in enumerate(chapters, 1):
        ch_num = ch.get("chapterNumber") or ch.get("chapterIndex") or idx
        ch_title = ch.get("title", {})
        if isinstance(ch_title, dict):
            ch_title = ch_title.get("en", f"Chapter {ch_num}")

        ch_text = ch.get("textPayload", {})
        if isinstance(ch_text, dict):
            ch_text = ch_text.get("en", "")
        if not ch_text:
            ch_text = ch.get("content", "")
            if isinstance(ch_text, dict):
                ch_text = ch_text.get("en", "")

        print(f"🎧 [Chapter {ch_num}/{len(chapters)}] '{ch_title}'")

        # Step 1: Text Sanitization & Header Deduplication
        tts_script = prepare_tts_script(ch_title, ch_text, chapter_number=ch_num)
        print(f"   🧹 Sanitized script ({len(tts_script)} chars). Clean heading: '{tts_script.splitlines()[0]}'")

        # Step 2: Kokoro ONNX Speech Synthesis
        wav_path = os.path.join(out_base_dir, f"chapter_{ch_num}.wav")
        mp3_path = os.path.join(out_base_dir, f"chapter_{ch_num}.mp3")

        duration_sec = synthesizer.synthesize_to_file(tts_script, wav_path, voice=voice, speed=speed)
        print(f"   🔊 Synthesized audio: {duration_sec:.2f}s ({duration_sec/60:.2f} mins)")

        # Convert WAV to MP3 using FFmpeg
        subprocess.run(["ffmpeg", "-y", "-i", wav_path, "-b:a", "128k", mp3_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Step 3: Whispersync Timestamp Alignment
        timestamps = generate_sentence_timestamps(mp3_path, tts_script, duration_sec)
        timestamps_json_path = os.path.join(out_base_dir, f"chapter_{ch_num}_timestamps.json")
        with open(timestamps_json_path, "w", encoding="utf-8") as f:
            json.dump(timestamps, f, indent=2)
        print(f"   ⏱️ Generated {len(timestamps)} sentence alignment timestamps.")

        # Step 4: HLS VOD Transcoding (Optional)
        if hls:
            hls_dir = os.path.join(out_base_dir, "hls", f"chapter_{ch_num}")
            transcode_to_hls(mp3_path, hls_dir)

        # Step 5: S3 Upload & MongoDB Link (Optional)
        if upload:
            uploader_script = os.path.join(SCRIPT_DIR, "uploader.js")
            cmd = ["node", uploader_script, mp3_path, slug, str(ch_num), str(duration_sec), timestamps_json_path, voice_clean_key]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print(f"   📤 Uploaded & Linked Chapter {ch_num} in MongoDB.")
            else:
                print(f"   ⚠️ Upload error on Chapter {ch_num}: {res.stderr}")

        print(f"   ✅ Chapter {ch_num} complete.\n")

    print("=======================================================")
    print(f"🎉 AUDIO PIPELINE COMPLETE FOR '{slug}' ({len(chapters)} Chapters)")
    print("=======================================================")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Liiro Ebook Audio Generation Pipeline")
    parser.add_argument("--slug", type=str, required=True, help="Story slug identifier")
    parser.add_argument("--voice", type=str, default="am_adam", help="Kokoro voice key (e.g. am_adam, af_heart)")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech speed multiplier (default 1.0)")
    parser.add_argument("--upload", action="store_true", default=True, help="Upload audio files to Hetzner S3 and link MongoDB")
    parser.add_argument("--no-upload", action="store_false", dest="upload", help="Skip uploading to S3")
    parser.add_argument("--hls", action="store_true", default=True, help="Transcode audio to HLS VOD format")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of chapters to process (0 = all)")

    args = parser.parse_args()
    run_pipeline(args.slug, voice=args.voice, speed=args.speed, upload=args.upload, hls=args.hls, chapter_limit=args.limit)
