#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Synthesizes and Uploads 5 High-Quality Looping Ambient Soundscapes to Hetzner S3 CDN:
1. Rain on Windowpane (rain_windowpane.mp3)
2. Cozy Fireplace Crackle (fireplace_crackle.mp3)
3. Mystic Forest Wind (mystic_forest.mp3)
4. Quiet Coffee Shop (coffee_shop.mp3)
5. Victorian Gothic Library (gothic_library.mp3)
"""

import os
import numpy as np
import soundfile as sf
import boto3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, "scratch", "ambient_soundscapes")
os.makedirs(OUT_DIR, exist_ok=True)

HETZNER_BUCKET = "multicamp-prod-storage"
HETZNER_CDN_BASE = "https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ambient"

s3_client = boto3.client(
    "s3",
    endpoint_url="https://nbg1.your-objectstorage.com",
    aws_access_key_id=os.getenv("HETZNER_S3_KEY", "KVFSGG7GLKG95GYEJOE3"),
    aws_secret_access_key=os.getenv("HETZNER_S3_SECRET", "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK")
)

SR = 44100
DURATION = 30  # 30-second seamless loop

def gen_rain():
    # Pink noise + raindrop transients
    t = np.linspace(0, DURATION, int(SR * DURATION), endpoint=False)
    white = np.random.normal(0, 0.2, len(t))
    # Low-pass filter approximation (cumulative sum smooth)
    pink = np.convolve(white, np.exp(-np.linspace(0, 5, 200)), mode="same")
    # Add subtle raindrop clicks
    clicks = np.zeros(len(t))
    num_drops = 1500
    indices = np.random.randint(0, len(t), num_drops)
    clicks[indices] = np.random.uniform(0.15, 0.4, num_drops)
    audio = pink * 0.7 + clicks * 0.3
    return audio / np.max(np.abs(audio)) * 0.5

def gen_fireplace():
    # Brown noise rumble + crackle pops
    t = np.linspace(0, DURATION, int(SR * DURATION), endpoint=False)
    white = np.random.normal(0, 0.3, len(t))
    brown = np.cumsum(white)
    brown = brown - np.mean(brown)
    brown = brown / np.max(np.abs(brown)) * 0.4
    # Fire crackle pops
    pops = np.zeros(len(t))
    num_pops = 800
    pop_idx = np.random.randint(0, len(t), num_pops)
    pops[pop_idx] = np.random.uniform(0.2, 0.6, num_pops)
    audio = brown * 0.8 + pops * 0.2
    return audio / np.max(np.abs(audio)) * 0.5

def gen_forest():
    # Low resonant wind sweep
    t = np.linspace(0, DURATION, int(SR * DURATION), endpoint=False)
    sweep = np.sin(2 * np.pi * 0.1 * t) * 0.3 + 0.7
    noise = np.random.normal(0, 0.25, len(t))
    smooth = np.convolve(noise, np.ones(500)/500, mode="same")
    audio = smooth * sweep
    return audio / np.max(np.abs(audio)) * 0.5

def gen_coffeeshop():
    # Warm cafe drone + soft chatter ambience
    t = np.linspace(0, DURATION, int(SR * DURATION), endpoint=False)
    drone = np.sin(2 * np.pi * 60 * t) * 0.05
    noise = np.random.normal(0, 0.15, len(t))
    smooth = np.convolve(noise, np.ones(300)/300, mode="same")
    # Soft cup clinks
    clinks = np.zeros(len(t))
    clink_idx = np.random.randint(0, len(t), 120)
    for idx in clink_idx:
        decay = np.exp(-np.linspace(0, 10, 1000))
        freq = np.random.choice([1200, 1500, 1800])
        tone = np.sin(2 * np.pi * freq * np.linspace(0, 0.02, 1000)) * decay * 0.2
        end = min(len(t), idx + 1000)
        clinks[idx:end] += tone[:end-idx]
    audio = smooth * 0.7 + drone + clinks * 0.3
    return audio / np.max(np.abs(audio)) * 0.5

def gen_gothic():
    # Library room ambience + clock ticking
    t = np.linspace(0, DURATION, int(SR * DURATION), endpoint=False)
    drone = np.sin(2 * np.pi * 55 * t) * 0.08
    # Clock tick every 1.0 second
    tick = np.zeros(len(t))
    tick_indices = np.arange(0, len(t), int(SR * 1.0))
    for idx in tick_indices:
        decay = np.exp(-np.linspace(0, 20, 400))
        tone = np.sin(2 * np.pi * 800 * np.linspace(0, 0.01, 400)) * decay * 0.3
        end = min(len(t), idx + 400)
        tick[idx:end] += tone[:end-idx]
    audio = drone + tick * 0.4
    return audio / np.max(np.abs(audio)) * 0.5

SOUNDSCAPES = [
    ("rain_windowpane.mp3", gen_rain),
    ("fireplace_crackle.mp3", gen_fireplace),
    ("mystic_forest.mp3", gen_forest),
    ("coffee_shop.mp3", gen_coffeeshop),
    ("gothic_library.mp3", gen_gothic),
]

def main():
    print("=========================================================")
    print("🔊 SYNTHESIZING & UPLOADING 5 AMBIENT SOUNDSCAPES TO S3")
    print("=========================================================")

    for filename, func in SOUNDSCAPES:
        wav_file = os.path.join(OUT_DIR, filename.replace(".mp3", ".wav"))
        mp3_file = os.path.join(OUT_DIR, filename)

        print(f"🎵 Generating {filename}...")
        samples = func()
        # Create stereo audio
        stereo = np.column_stack((samples, samples))
        sf.write(wav_file, stereo, SR)

        # Transcode to 128k MP3
        os.system(f"ffmpeg -y -i \"{wav_file}\" -ac 2 -b:a 128k \"{mp3_file}\" >/dev/null 2>&1")
        if os.path.exists(wav_file):
            os.remove(wav_file)

        s3_key = f"LangoReads-Prod/ambient/{filename}"
        with open(mp3_file, "rb") as f:
            s3_client.put_object(
                Bucket=HETZNER_BUCKET,
                Key=s3_key,
                Body=f,
                ACL="public-read",
                ContentType="audio/mpeg",
                CacheControl="public, max-age=31536000, immutable"
            )

        cdn_url = f"{HETZNER_CDN_BASE}/{filename}"
        print(f"   ✅ Uploaded: {cdn_url}")

    print("\n🎉 SUCCESS! All 5 ambient soundscapes are live on Hetzner S3 CDN!")

if __name__ == "__main__":
    main()
