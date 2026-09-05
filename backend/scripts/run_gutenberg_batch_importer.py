#!/usr/bin/env python3
"""
Automated Batch Importer and Ingestion Loop for Project Gutenberg Exclusives
- Downloads and converts books to Standard Ebooks Git Repositories
- Ingests text, covers, and reviews into Hetzner MongoDB & S3
"""

import os
import sys
import json
import time
import subprocess
import urllib.request
import re

REPO_ROOT = "/Users/humayunrashid/multicamp/liiro-ebook"
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
GUTENBERG_DIR = os.path.join(REPO_ROOT, "gutenberg")
SCRIPTS_DIR = os.path.join(BACKEND_DIR, "scripts")
DOCS_DIR = os.path.join(BACKEND_DIR, "docs")

# Default or CLI-specified catalog
CATALOG_ARG = None
for arg in sys.argv[1:]:
    if arg.startswith("--catalog="):
        CATALOG_ARG = arg.split("=", 1)[1]
    elif not arg.startswith("-"):
        CATALOG_ARG = arg

if CATALOG_ARG and os.path.isabs(CATALOG_ARG):
    CATALOG_JSON = CATALOG_ARG
elif CATALOG_ARG:
    CATALOG_JSON = os.path.join(REPO_ROOT, CATALOG_ARG)
else:
    CATALOG_JSON = os.path.join(DOCS_DIR, "missing_top_gutenberg_books.json")

base_name = os.path.splitext(os.path.basename(CATALOG_JSON))[0]
STATUS_JSON = os.path.join(DOCS_DIR, f"{base_name}_status.json")

sys.path.insert(0, GUTENBERG_DIR)
try:
    from import_gutenberg_to_standard_ebook import build_standard_ebook_repo, slugify
except ImportError as e:
    print(f"❌ Could not import build_standard_ebook_repo: {e}")
    sys.exit(1)

def get_existing_db_slugs():
    """Query MongoDB via quick node script to fetch all existing story slugs."""
    cmd = ["node", "-e", """
        require('dotenv').config({ path: '/Users/humayunrashid/multicamp/liiro-ebook/backend/.env' });
        const mongoose = require('mongoose');
        async function run() {
            await mongoose.connect(process.env.MONGODB_URI);
            const slugs = await mongoose.connection.db.collection('stories').distinct('slug');
            console.log(JSON.stringify(slugs));
            await mongoose.disconnect();
        }
        run();
    """]
    try:
        res = subprocess.run(cmd, cwd=BACKEND_DIR, capture_output=True, text=True, timeout=15)
        if res.returncode == 0:
            return set(json.loads(res.stdout.strip()))
    except Exception as ex:
        print(f"⚠️ Warning: Could not fetch DB slugs ({ex}). Falling back to empty set.")
    return set()

def load_status():
    if os.path.exists(STATUS_JSON):
        try:
            with open(STATUS_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"completed": [], "failed": [], "skipped": [], "last_updated": None}

def save_status(status):
    status["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(STATUS_JSON, "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)

def run_batch():
    print("=======================================================================")
    print("🚀 STARTING AUTOMATED GUTENBERG BATCH IMPORTER & REPO GENERATOR LOOP")
    print("=======================================================================\n")

    if not os.path.exists(CATALOG_JSON):
        print(f"❌ Catalog file not found: {CATALOG_JSON}")
        return

    with open(CATALOG_JSON, "r", encoding="utf-8") as f:
        missing_books = json.load(f)

    status = load_status()
    completed_ids = set(status.get("completed", []))
    
    db_slugs = get_existing_db_slugs()
    print(f"📖 Using Catalog: {CATALOG_JSON}")
    print(f"📚 Total Candidates in Catalog: {len(missing_books)}")
    print(f"📦 Already Ingested in DB: {len(db_slugs)}")
    print(f"🔄 Previously Processed in Batch Status: {len(completed_ids)}\n")

    consecutive_failures = 0

    for idx, book in enumerate(missing_books, 1):
        pg_id = book.get("pg_id") or book.get("id")
        title = book.get("title", "Untitled")
        author = book.get("author", "Unknown Author")
        author_slug = slugify(author)
        title_slug = slugify(title)
        repo_name = f"{author_slug}_{title_slug}"

        print(f"\n───────────────────────────────────────────────────────────────────────")
        print(f"[{idx}/{len(missing_books)}] 📖 Processing PG #{pg_id}: \"{title}\" by {author}")

        # Check if already in DB
        if title_slug in db_slugs or repo_name in db_slugs:
            print(f"   ⏩ Already in DB ('{title_slug}'). Skipping...")
            if pg_id not in completed_ids:
                status["completed"].append(pg_id)
                save_status(status)
            continue

        if pg_id in completed_ids:
            print(f"   ⏩ Marked completed in batch status. Skipping...")
            continue

        # Step 1: Download and build local Standard Ebooks git repository
        print(f"   🚀 Building Standard Ebooks Git repo for PG #{pg_id}...")
        try:
            repo_path = build_standard_ebook_repo(pg_id, target_base_dir=GUTENBERG_DIR)
        except Exception as ex:
            print(f"   ❌ Conversion error: {ex}")
            repo_path = None

        if not repo_path or not os.path.exists(repo_path):
            print(f"   ⚠️ Could not build repository for PG #{pg_id}. Moving to next.")
            if pg_id not in status["failed"]:
                status["failed"].append(pg_id)
            save_status(status)
            consecutive_failures += 1
            if consecutive_failures >= 10:
                print("🛑 10 consecutive failures. Stopping batch to prevent runaway errors.")
                break
            time.sleep(2)
            continue

        consecutive_failures = 0
        actual_repo_name = os.path.basename(repo_path)
        print(f"   ✅ Local Git Repository Created: {actual_repo_name}")

        # Step 2: Ingest into MongoDB & Hetzner S3 CDN
        print(f"   📤 Ingesting into MongoDB & S3 CDN via ingest_standard_ebook.js...")
        ingest_cmd = ["node", os.path.join(SCRIPTS_DIR, "ingest_standard_ebook.js"), actual_repo_name]
        try:
            res = subprocess.run(ingest_cmd, cwd=BACKEND_DIR, capture_output=True, text=True, timeout=120)
            if res.returncode == 0:
                print(f"   🎉 Successfully ingested \"{title}\" into Liiro DB!")
                status["completed"].append(pg_id)
                db_slugs.add(title_slug)
                db_slugs.add(actual_repo_name)
            else:
                print(f"   ❌ Ingestion script returned code {res.returncode}:")
                for line in res.stderr.strip().split("\n")[:5]:
                    print(f"      {line}")
                if pg_id not in status["failed"]:
                    status["failed"].append(pg_id)
        except subprocess.TimeoutExpired:
            print(f"   ❌ Ingestion timed out after 120s for {actual_repo_name}")
            if pg_id not in status["failed"]:
                status["failed"].append(pg_id)
        except Exception as ex:
            print(f"   ❌ Error running ingestion: {ex}")
            if pg_id not in status["failed"]:
                status["failed"].append(pg_id)

        save_status(status)

        # Respectful delay between Gutenberg requests
        time.sleep(1.5)

    print("\n=======================================================================")
    print("🏁 GUTENBERG BATCH PROCESSING COMPLETE / CYCLE FINISHED")
    print(f"   Completed: {len(status.get('completed', []))}")
    print(f"   Failed: {len(status.get('failed', []))}")
    print("=======================================================================")

if __name__ == "__main__":
    run_batch()
