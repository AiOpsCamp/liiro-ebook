#!/usr/bin/env python3
"""
📚 Curated 5 Classic Audiobooks Batch Generator
================================================
Processes the 5 curated classic ebooks with their custom voice narrators:
1. Sherlock Holmes (the-adventures-of-sherlock-holmes) -> am_michael
2. Frankenstein (frankenstein) -> am_adam
3. Pride and Prejudice (pride-and-prejudice) -> af_bella
4. The Great Gatsby (the-great-gatsby) -> am_michael
5. Peter Pan (peter-and-wendy) -> af_heart
"""

import os
import sys
import time
import re
from pymongo import MongoClient
from run_full_pipeline import run_pipeline

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/liiro_prod")

CURATED_BOOKS = [
    {
        "slug": "the-strange-case-of-dr-jekyll-and-mr-hyde",
        "title": "The Strange Case of Dr Jekyll and Mr Hyde",
        "voice": "am_adam",
    },
    {
        "slug": "frankenstein",
        "title": "Frankenstein",
        "voice": "am_adam",
    },
    {
        "slug": "pride-and-prejudice",
        "title": "Pride and Prejudice",
        "voice": "af_bella",
    },
    {
        "slug": "the-great-gatsby",
        "title": "The Great Gatsby",
        "voice": "am_michael",
    },
    {
        "slug": "peter-and-wendy",
        "title": "Peter Pan",
        "voice": "af_heart",
    },
]

def batch_generate_curated():
    print(f"\n=======================================================")
    print(f"📚 STARTING BATCH SYNTHESIS FOR 5 CURATED CLASSIC AUDIOBOOKS")
    print(f"=======================================================\n")

    try:
        client = MongoClient("mongodb://127.0.0.1:27017/liiro_prod", serverSelectionTimeoutMS=3000)
        client.server_info()
    except Exception:
        client = MongoClient("mongodb://127.0.0.1:27017/liiro_prod")
    db = client.get_database("liiro_prod")

    start_time = time.time()

    for idx, item in enumerate(CURATED_BOOKS, 1):
        slug = item["slug"]
        title = item["title"]
        voice = item["voice"]

        print(f"────────────── [{idx}/5] Processing Audiobook: '{title}' ({slug}) | Voice: '{voice}' ──────────────")
        try:
            run_pipeline(slug, voice=voice, upload=True, hls=True)

            # Update parent story document in MongoDB to set hasAudio: true and isAudiobook: true
            voice_key = re.sub(r"^(am_|af_)", "", voice)
            db.stories.update_one(
                {"slug": slug},
                {
                    "$set": {
                        "hasAudio": True,
                        "isAudiobook": True,
                        "defaultVoiceId": voice_key,
                        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                }
            )
            print(f"✅ Successfully finished & marked story '{title}' as hasAudio: True in MongoDB\n")
        except Exception as e:
            print(f"❌ Error processing book '{title}': {e}\n")

    elapsed_mins = (time.time() - start_time) / 60
    print("=======================================================")
    print(f"🎉 5 CURATED CLASSIC AUDIOBOOKS GENERATION COMPLETE!")
    print(f"   Total Real-Time Processing Time: {elapsed_mins:.2f} Minutes")
    print("=======================================================")

if __name__ == "__main__":
    batch_generate_curated()
