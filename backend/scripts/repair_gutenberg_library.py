#!/usr/bin/env python3
"""
Gutenberg Library Batch Repair & Re-ingestion Script
Iterates through Project Gutenberg repositories, identifies books affected by
the legacy CRLF newline and chapter splitting bug, rebuilds their semantic Standard Ebooks
structure using the upgraded parser, commits to git, and re-ingests into MongoDB & Hetzner S3 CDN.
"""

import os
import sys
import re
import json
import time
import subprocess
import argparse

REPO_ROOT = "/Users/humayunrashid/multicamp/liiro-ebook"
GUTENBERG_DIR = os.path.join(REPO_ROOT, "gutenberg")
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
SCRIPTS_DIR = os.path.join(BACKEND_DIR, "scripts")
DOCS_DIR = os.path.join(BACKEND_DIR, "docs")
STATUS_FILE = os.path.join(DOCS_DIR, "gutenberg_repair_status.json")

sys.path.insert(0, GUTENBERG_DIR)
try:
    from import_gutenberg_to_standard_ebook import build_standard_ebook_repo, slugify
except ImportError as e:
    print(f"❌ Error importing build_standard_ebook_repo: {e}")
    sys.exit(1)

def extract_pg_id_from_repo(repo_path):
    readme_path = os.path.join(repo_path, "README.md")
    if os.path.exists(readme_path):
        try:
            with open(readme_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                m = re.search(r"Project Gutenberg \(ID:\s*(\d+)\)", content)
                if m:
                    return m.group(1)
                m = re.search(r"gutenberg\.org/ebooks/(\d+)", content)
                if m:
                    return m.group(1)
        except Exception:
            pass

    opf_path = os.path.join(repo_path, "src", "epub", "content.opf")
    if os.path.exists(opf_path):
        try:
            with open(opf_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                m = re.search(r"gutenberg\.org/ebooks/(\d+)", content)
                if m:
                    return m.group(1)
        except Exception:
            pass
    return None

def inspect_repo(repo_path):
    """
    Fast inspection: checks chapter-1.xhtml and chapter count.
    Returns (needs_repair, reason, chaps_count, total_paras)
    """
    text_dir = os.path.join(repo_path, "src", "epub", "text")
    if not os.path.isdir(text_dir):
        return (False, "no_text_dir", 0, 0)

    try:
        entries = os.listdir(text_dir)
    except Exception:
        return (False, "unreadable_dir", 0, 0)

    chapter_files = [f for f in entries if f.startswith("chapter-") and f.endswith(".xhtml")]
    if not chapter_files:
        return (False, "no_chapter_files", 0, 0)

    ch1_path = os.path.join(text_dir, "chapter-1.xhtml")
    if not os.path.exists(ch1_path):
        return (False, "no_ch1", len(chapter_files), 0)

    try:
        with open(ch1_path, "r", encoding="utf-8", errors="ignore") as f:
            c = f.read()
    except Exception:
        return (False, "read_error", len(chapter_files), 0)

    paras = re.findall(r"<p[^>]*>(.*?)</p>", c, re.DOTALL)
    total_paras = len(paras)

    # If chapter 1 has only 1 paragraph and > 3000 chars, it suffered the CRLF collapse
    if len(paras) <= 1 and len(c) > 3000:
        return (True, "giant_unsplit_paragraph", len(chapter_files), total_paras)

    # If single chapter, check if undetected chapter headings exist inside
    if len(chapter_files) == 1:
        if re.search(r"\b(?:CHAP(?:TER|\.)?|BOOK|PART|ACT)\s+(?:[0-9IVXLCDM]+|[A-Z]+)\b", c, re.I):
            return (True, "single_chapter_with_hidden_headings", 1, total_paras)

    return (False, "ok", len(chapter_files), total_paras)

def load_status():
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "repaired": [],
        "failed": [],
        "skipped": [],
        "last_updated": None
    }

def save_status(status):
    status["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="Repair Gutenberg books affected by CRLF / chapter splitting")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of books to repair in this run")
    parser.add_argument("--dry-run", action="store_true", help="Only scan and report candidates without modifying")
    parser.add_argument("--force", action="store_true", help="Force repair even if already marked repaired")
    parser.add_argument("--repo", type=str, default=None, help="Specific repo folder name to repair")
    args = parser.parse_args()

    print("=======================================================================")
    print("🛠️  GUTENBERG LIBRARY BATCH REPAIR & RE-INGESTION ENGINE")
    print("=======================================================================")

    all_repos = sorted([os.path.join(GUTENBERG_DIR, d) for d in os.listdir(GUTENBERG_DIR) if os.path.isdir(os.path.join(GUTENBERG_DIR, d))])
    print(f"📦 Total Gutenberg repositories on disk: {len(all_repos)}")

    status = load_status()
    repaired_set = set(status.get("repaired", []))
    failed_set = set(status.get("failed", []))

    if args.repo:
        target_path = os.path.join(GUTENBERG_DIR, args.repo) if not os.path.isabs(args.repo) else args.repo
        candidates = [target_path] if os.path.isdir(target_path) else []
    else:
        candidates = all_repos

    repair_queue = []
    for rpath in candidates:
        rname = os.path.basename(rpath)
        if not args.force and rname in repaired_set:
            continue
        needs_repair, reason, ch_count, para_count = inspect_repo(rpath)
        if needs_repair or args.force:
            pg_id = extract_pg_id_from_repo(rpath)
            if pg_id:
                repair_queue.append({
                    "repo_path": rpath,
                    "repo_name": rname,
                    "pg_id": pg_id,
                    "reason": reason,
                    "old_chapters": ch_count,
                    "old_paras": para_count
                })

    print(f"🎯 Books requiring repair: {len(repair_queue)}")
    if args.dry_run:
        print("\n🔍 DRY-RUN MODE: Listing top 20 candidates:")
        for idx, item in enumerate(repair_queue[:20], 1):
            print(f"  {idx}. [{item['repo_name']}] PG #{item['pg_id']} - Reason: {item['reason']} ({item['old_chapters']} ch, {item['old_paras']} paras)")
        return

    if args.limit:
        repair_queue = repair_queue[:args.limit]
        print(f"⚡ Processing limited batch of {len(repair_queue)} books")

    success_count = 0
    fail_count = 0

    for idx, item in enumerate(repair_queue, 1):
        rname = item["repo_name"]
        rpath = item["repo_path"]
        pg_id = item["pg_id"]

        print(f"\n───────────────────────────────────────────────────────────────────────")
        print(f"[{idx}/{len(repair_queue)}] 🔧 Repairing {rname} (PG #{pg_id})")
        print(f"   Reason: {item['reason']} | Previous: {item['old_chapters']} ch, {item['old_paras']} paras")

        # Step 1: Re-parse using upgraded builder
        try:
            new_repo_path = build_standard_ebook_repo(pg_id, target_base_dir=GUTENBERG_DIR)
        except Exception as ex:
            print(f"   ❌ Rebuild exception for PG #{pg_id}: {ex}")
            new_repo_path = None

        if not new_repo_path or not os.path.exists(new_repo_path):
            print(f"   ⚠️ Could not rebuild {rname}. Skipping...")
            if rname not in status["failed"]:
                status["failed"].append(rname)
            save_status(status)
            fail_count += 1
            continue

        # Inspect new repo
        _, _, new_ch, new_paras = inspect_repo(new_repo_path)
        print(f"   ✅ Upgraded structure: {new_ch} chapters, {new_paras} paragraphs")

        # Step 2: Commit clean changes to git
        try:
            subprocess.run(["git", "add", "."], cwd=new_repo_path, check=True, capture_output=True)
            commit_res = subprocess.run(
                ["git", "commit", "-m", f"Fix CRLF newlines and upgrade semantic chapter formatting (PG #{pg_id})"],
                cwd=new_repo_path,
                capture_output=True,
                text=True
            )
            if commit_res.returncode == 0:
                print(f"   💾 Git commit created cleanly")
        except Exception as ex:
            print(f"   ⚠️ Git commit notice: {ex}")

        # Step 3: Ingest into MongoDB & Hetzner S3
        actual_name = os.path.basename(new_repo_path)
        print(f"   📤 Ingesting into MongoDB & S3 CDN via ingest_standard_ebook.js...")
        ingest_cmd = ["node", os.path.join(SCRIPTS_DIR, "ingest_standard_ebook.js"), actual_name]
        try:
            res = subprocess.run(ingest_cmd, cwd=BACKEND_DIR, capture_output=True, text=True, timeout=120)
            if res.returncode == 0:
                print(f"   🎉 Successfully re-ingested \"{actual_name}\" into Liiro DB!")
                if rname not in status["repaired"]:
                    status["repaired"].append(rname)
                if rname in status["failed"]:
                    status["failed"].remove(rname)
                success_count += 1
            else:
                print(f"   ❌ Ingestion script returned code {res.returncode}")
                for line in res.stderr.strip().split("\n")[:4]:
                    if line.strip(): print(f"      {line}")
                if rname not in status["failed"]:
                    status["failed"].append(rname)
                fail_count += 1
        except subprocess.TimeoutExpired:
            print(f"   ❌ Ingestion timed out after 120s")
            if rname not in status["failed"]:
                status["failed"].append(rname)
            fail_count += 1
        except Exception as ex:
            print(f"   ❌ Error running ingestion: {ex}")
            if rname not in status["failed"]:
                status["failed"].append(rname)
            fail_count += 1

        save_status(status)
        time.sleep(1.0)

    print("\n=======================================================================")
    print(f"🏁 BATCH REPAIR CYCLE COMPLETE")
    print(f"   Successfully Repaired: {success_count}")
    print(f"   Failed / Skipped: {fail_count}")
    print(f"   Total Repaired in Status: {len(status['repaired'])}")
    print("=======================================================================")

if __name__ == "__main__":
    main()
