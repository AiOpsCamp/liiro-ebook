#!/usr/bin/env python3
"""
📚 Batch Catalog Audio Generator
================================
Scans MongoDB `liiro_prod` stories and enqueues/processes full audiobooks (all chapters)
for multiple books in parallel.
"""

import os
import sys
import time
import argparse
from pymongo import MongoClient
from run_full_pipeline import run_pipeline

MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true")

def batch_generate_catalog(voice: str = "am_adam", limit: int = 10):
    print(f"\n=======================================================")
    print(f"📚 STARTING BATCH CATALOG AUDIO GENERATION (Limit: {limit})")
    print(f"=======================================================\n")

    client = MongoClient(MONGO_URI)
    db = client.get_database("liiro_prod")

    # Find stories that need audio generation
    stories = list(db.stories.find({"isPublished": True}).limit(limit))
    print(f"📖 Found {len(stories)} books in catalog to process.\n")

    start_time = time.time()
    total_audio_mins = 0

    for idx, story in enumerate(stories, 1):
        slug = story.get("slug")
        title = story.get("title", {})
        if isinstance(title, dict):
            title = title.get("en", slug)

        print(f"────────────── [{idx}/{len(stories)}] Processing Book: '{title}' ({slug}) ──────────────")
        try:
            run_pipeline(slug, voice=voice, upload=True, hls=True)
            print(f"✅ Successfully finished book '{title}'\n")
        except Exception as e:
            print(f"❌ Error processing book '{title}': {e}\n")

    elapsed_mins = (time.time() - start_time) / 60
    print("=======================================================")
    print(f"🎉 BATCH CATALOG GENERATION COMPLETE ({len(stories)} Books)")
    print(f"   Total Real-Time Processing Time: {elapsed_mins:.2f} Minutes")
    print("=======================================================")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch Catalog Audio Generator")
    parser.add_argument("--voice", type=str, default="am_adam", help="Default voice key")
    parser.add_argument("--limit", type=int, default=5, help="Number of books to process")

    args = parser.parse_args()
    batch_generate_catalog(voice=args.voice, limit=args.limit)
