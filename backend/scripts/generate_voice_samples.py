#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kokoro ONNX All English Studio Voices 30-Second Sample Generator
Synthesizes 30-second audio samples for all 28 English voices (US & UK, Male & Female)
Saves MP3 files to scratch/kokoro_english_voice_samples/ and uploads to Hetzner S3 CDN.
"""

import os
import sys
import soundfile as sf
import numpy as np
import boto3
from kokoro_onnx import Kokoro

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, "scratch", "kokoro_english_voice_samples")
os.makedirs(OUT_DIR, exist_ok=True)

MODEL_PATH = os.path.join(BASE_DIR, "kokoro-v1.0.onnx")
VOICES_PATH = os.path.join(BASE_DIR, "voices-v1.0.bin")

# Hetzner S3 CDN Setup
HETZNER_BUCKET = "multicamp-prod-storage"
HETZNER_CDN_BASE = "https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/voice_samples"

s3_client = boto3.client(
    "s3",
    endpoint_url="https://nbg1.your-objectstorage.com",
    aws_access_key_id=os.getenv("HETZNER_S3_KEY", "KVFSGG7GLKG95GYEJOE3"),
    aws_secret_access_key=os.getenv("HETZNER_S3_SECRET", "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK")
)

# 30-Second Sample Literary Prose Passage (~80 words)
SAMPLE_TEXT = (
    "Curiosity killed the cat, but satisfaction brought it back. Alice opened the door into the garden "
    "and found herself standing in a sunny clearing of vibrant, talking flowers. The Red Queen smiled, "
    "her crown sparkling in the noon sun as she explained the rules of the living chessboard. "
    "'Always speak the truth, think before you speak, and write it down afterwards,' she advised with timeless grace and authority."
)

ENGLISH_VOICES = [
    # US Female Voices
    ("af_heart", "Heart", "US Female Studio (Default)", "01_af_heart_us_female.mp3"),
    ("af_bella", "Bella", "US Female Warm & Expressive", "02_af_bella_us_female.mp3"),
    ("af_nicole", "Nicole", "US Female Gentle & Clear", "03_af_nicole_us_female.mp3"),
    ("af_aoede", "Aoede", "US Female Deep Melodic", "04_af_aoede_us_female.mp3"),
    ("af_jessica", "Jessica", "US Female Modern Friendly", "05_af_jessica_us_female.mp3"),
    ("af_kore", "Kore", "US Female Serene & Calm", "06_af_kore_us_female.mp3"),
    ("af_nova", "Nova", "US Female Energetic Crisp", "07_af_nova_us_female.mp3"),
    ("af_river", "River", "US Female Smooth Soft", "08_af_river_us_female.mp3"),
    ("af_sarah", "Sarah", "US Female Natural Reader", "09_af_sarah_us_female.mp3"),
    ("af_sky", "Sky", "US Female Light & Bright", "10_af_sky_us_female.mp3"),
    ("af_alloy", "Alloy", "US Female Neutral Studio", "11_af_alloy_us_female.mp3"),

    # US Male Voices
    ("am_adam", "Adam", "US Male Studio Narrator", "12_am_adam_us_male.mp3"),
    ("am_michael", "Michael", "US Male Rich Baritone", "13_am_michael_us_male.mp3"),
    ("am_echo", "Echo", "US Male Resonant Warm", "14_am_echo_us_male.mp3"),
    ("am_eric", "Eric", "US Male Smooth Conversational", "15_am_eric_us_male.mp3"),
    ("am_fenrir", "Fenrir", "US Male Deep Dramatic", "16_am_fenrir_us_male.mp3"),
    ("am_liam", "Liam", "US Male Youthful Clear", "17_am_liam_us_male.mp3"),
    ("am_onyx", "Onyx", "US Male Deep Bass Studio", "18_am_onyx_us_male.mp3"),
    ("am_puck", "Puck", "US Male Lively Character", "19_am_puck_us_male.mp3"),
    ("am_santa", "Santa", "US Male Festive Warm Baritone", "20_am_santa_us_male.mp3"),

    # UK Female Voices
    ("bf_emma", "Emma", "UK Female Literary Accent", "21_bf_emma_uk_female.mp3"),
    ("bf_alice", "Alice", "UK Female Elegant Classic", "22_bf_alice_uk_female.mp3"),
    ("bf_isabella", "Isabella", "UK Female Soft Sophisticated", "23_bf_isabella_uk_female.mp3"),
    ("bf_lily", "Lily", "UK Female Bright & Cheerful", "24_bf_lily_uk_female.mp3"),

    # UK Male Voices
    ("bm_george", "George", "UK Male Classic Storyteller", "25_bm_george_uk_male.mp3"),
    ("bm_daniel", "Daniel", "UK Male Deep Academic", "26_bm_daniel_uk_male.mp3"),
    ("bm_fable", "Fable", "UK Male Expressive Tale Narrator", "27_bm_fable_uk_male.mp3"),
    ("bm_lewis", "Lewis", "UK Male Gentle Literary Baritone", "28_bm_lewis_uk_male.mp3"),
]

def generate_voice_samples():
    print("=======================================================================")
    print("🎙️ KOKORO ONNX: GENERATING 30-SECOND SAMPLES FOR ALL 28 ENGLISH VOICES")
    print(f"   Output Folder: {OUT_DIR}")
    print("=======================================================================")

    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
    results = []

    for idx, (voice_id, name, desc, filename) in enumerate(ENGLISH_VOICES, start=1):
        wav_path = os.path.join(OUT_DIR, filename.replace(".mp3", ".wav"))
        mp3_path = os.path.join(OUT_DIR, filename)

        print(f"\n🎧 [{idx}/28] Synthesizing Voice: {name} ({voice_id}) - {desc}...")
        try:
            samples, sr = kokoro.create(SAMPLE_TEXT, voice=voice_id, speed=1.0, lang="en-us")
            if samples is None or getattr(samples, "size", 0) == 0:
                print(f"⚠️ Failed to synthesize voice {voice_id}")
                continue

            sf.write(wav_path, samples, sr)
            duration_sec = round(len(samples) / sr, 2)

            # Transcode to 128k MP3
            os.system(f"ffmpeg -y -i \"{wav_path}\" -ac 2 -b:a 128k \"{mp3_path}\" >/dev/null 2>&1")
            if os.path.exists(wav_path):
                os.remove(wav_path)

            # Upload to Hetzner S3 CDN
            s3_key = f"LangoReads-Prod/voice_samples/{filename}"
            with open(mp3_path, "rb") as f:
                s3_client.put_object(
                    Bucket=HETZNER_BUCKET,
                    Key=s3_key,
                    Body=f,
                    ACL="public-read",
                    ContentType="audio/mpeg",
                    CacheControl="public, max-age=31536000, immutable"
                )

            cdn_url = f"{HETZNER_CDN_BASE}/{filename}"
            print(f"   ✅ Saved MP3 ({duration_sec}s): {filename}")
            print(f"   ☁️ CDN URL: {cdn_url}")

            results.append({
                "index": idx,
                "id": voice_id,
                "name": name,
                "description": desc,
                "filename": filename,
                "local_path": mp3_path,
                "cdn_url": cdn_url,
                "duration": duration_sec
            })

        except Exception as ex:
            print(f"❌ Error generating voice {voice_id}: {ex}")

    print("\n=======================================================================")
    print(f"🎉 SUCCESS! Generated {len(results)}/28 English Voice Samples in:")
    print(f"   📂 {OUT_DIR}")
    print("=======================================================================")

    # Write summary catalog markdown
    catalog_path = os.path.join(OUT_DIR, "VOICE_SAMPLES_CATALOG.md")
    with open(catalog_path, "w", encoding="utf-8") as cat:
        cat.write("# 🎙️ Kokoro ONNX 28 English Voices Audio Catalog\n\n")
        cat.write(f"Sample Text: *\"{SAMPLE_TEXT}\"*\n\n")
        cat.write("| # | Voice ID | Narrator Name | Accent / Persona | Duration | Local Audio Link | S3 CDN Web Link |\n")
        cat.write("| :---: | :--- | :--- | :--- | :---: | :--- | :--- |\n")
        for r in results:
            cat.write(f"| **{r['index']}** | `{r['id']}` | **{r['name']}** | {r['description']} | {r['duration']}s | [{r['filename']}](file://{r['local_path']}) | [Listen on CDN]({r['cdn_url']}) |\n")

    print(f"📄 Voice catalog document created at: {catalog_path}")

if __name__ == "__main__":
    generate_voice_samples()
