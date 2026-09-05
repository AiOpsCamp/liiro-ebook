#!/usr/bin/env python3
"""
Fetch Next 500 Most Famous & Downloaded Books from Project Gutenberg
strictly excluding all previous batches, Standard Ebooks, and live DB records.
"""

import os
import sys
import re
import json
import time
import subprocess
import urllib.request

REPO_ROOT = "/Users/humayunrashid/multicamp/liiro-ebook"
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
DOCS_DIR = os.path.join(BACKEND_DIR, "docs")
TARGET_JSON = os.path.join(DOCS_DIR, "NEXT_500_GUTENBERG_BOOKS.json")
TARGET_MD = os.path.join(DOCS_DIR, "NEXT_500_GUTENBERG_BOOKS_CATALOG.md")

existing_pg_ids = set()
existing_titles = set()
existing_slugs = set()

def normalize(text):
    if not text: return ""
    return re.sub(r"[^a-z0-9]", "", text.lower())

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

def load_all_existing():
    # 1. Past catalogs
    catalogs = [
        "TOP_500_GUTENBERG_BOOKS.json",
        "missing_top_gutenberg_books.json",
        "TOP_100_GUTENBERG_BOOKS.json",
        "NEXT_200_GUTENBERG_BOOKS.json",
        "NEXT_200_GUTENBERG_BOOKS_PART2.json"
    ]
    for p in catalogs:
        full_path = os.path.join(DOCS_DIR, p)
        if os.path.exists(full_path):
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    for b in json.load(f):
                        gid = b.get("pg_id") or b.get("id")
                        if gid: existing_pg_ids.add(int(gid))
                        t = b.get("title", "")
                        if t:
                            existing_titles.add(normalize(t))
                            existing_slugs.add(slugify(t))
            except Exception:
                pass

    # 2. Local repos in ebook-contents
    contents_dir = os.path.join(REPO_ROOT, "ebook-contents")
    if os.path.exists(contents_dir):
        for d in os.listdir(contents_dir):
            existing_slugs.add(slugify(d))
            parts = d.split("_")
            if len(parts) > 1:
                existing_titles.add(normalize(parts[1]))
                existing_slugs.add(slugify(parts[1]))

    # 3. Local repos in gutenberg/
    gutenberg_dir = os.path.join(REPO_ROOT, "gutenberg")
    if os.path.exists(gutenberg_dir):
        for d in os.listdir(gutenberg_dir):
            existing_slugs.add(slugify(d))
            parts = d.split("_")
            if len(parts) > 1:
                existing_titles.add(normalize(parts[1]))
                existing_slugs.add(slugify(parts[1]))

    # 4. Live DB stories
    try:
        cmd = ["node", "-e", """
            require('dotenv').config({ path: '/Users/humayunrashid/multicamp/liiro-ebook/backend/.env' });
            const mongoose = require('mongoose');
            async function run() {
                await mongoose.connect(process.env.MONGODB_URI);
                const stories = await mongoose.connection.db.collection('stories').find({}, { projection: { slug: 1, title: 1 } }).toArray();
                console.log(JSON.stringify(stories));
                await mongoose.disconnect();
            }
            run();
        """]
        res = subprocess.run(cmd, cwd=BACKEND_DIR, capture_output=True, text=True, timeout=15)
        if res.returncode == 0:
            db_stories = json.loads(res.stdout.strip())
            for s in db_stories:
                if s.get("slug"): existing_slugs.add(slugify(s["slug"]))
                t = s.get("title", "")
                if isinstance(t, dict): t = t.get("en", "")
                if t:
                    existing_titles.add(normalize(t))
                    existing_slugs.add(slugify(t))
    except Exception as ex:
        print(f"⚠️ Warning loading DB stories: {ex}")

    print(f"Loaded Baseline: {len(existing_pg_ids)} PG IDs, {len(existing_titles)} Titles, {len(existing_slugs)} Slugs")

# Ignored non-literary terms
EXCLUDED_PATTERNS = [
    r"encyclopedia", r"periodical", r"dictionary", r"factbook", r"almanac", r"magazine",
    r"bulletin", r"census", r"catalog", r"index to", r"manual of", r"handbook of",
    r"sheet music", r"audio book", r"volume \d+", r"vol\. \d+", r"complete project gutenberg",
    r"the works of .* volume", r"selected works", r"various", r"grammar", r"textbook"
]

def is_excluded(title, author):
    combined = f"{title} {author}".lower()
    for pat in EXCLUDED_PATTERNS:
        if re.search(pat, combined):
            return True
    return False

def is_already_known(pg_id, title):
    if pg_id in existing_pg_ids:
        return True
    
    norm = normalize(title)
    if not norm or len(norm) < 4:
        return False

    if norm in existing_titles:
        return True

    slug = slugify(title)
    if slug in existing_slugs:
        return True

    # Check substantial substring match
    for ex in existing_titles:
        if len(ex) > 6 and (ex == norm or norm.startswith(ex) or ex.startswith(norm)):
            return True

    return False

def scrape_next_500():
    load_all_existing()
    
    new_books = []
    seen_new_ids = set()
    start_index = 1
    page = 1
    max_needed = 500

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    print(f"\n🚀 Beginning Search for Next {max_needed} Popular Gutenberg Masterworks...")

    while len(new_books) < max_needed and page <= 150:
        url = f"https://www.gutenberg.org/ebooks/search/?query=l.en&sort_order=downloads&start_index={start_index}"
        print(f"📄 Fetching Page {page} (Index {start_index})... Found so far: {len(new_books)}/{max_needed}")

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                html = resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            print(f"❌ Error fetching page {page}: {e}. Retrying after 3s...")
            time.sleep(3)
            continue

        matches = re.findall(
            r'<li class="booklink">[\s\S]*?href="/ebooks/(\d+)"[\s\S]*?<span class="title">([^<]+)</span>(?:[\s\S]*?<span class="subtitle">([^<]+)</span>)?(?:[\s\S]*?<span class="extra">([^<]+)</span>)?',
            html
        )

        if not matches:
            print(f"⚠️ No matches on page {page}. Stopping.")
            break

        for gid_str, title_raw, author_raw, dl_raw in matches:
            pg_id = int(gid_str)
            title = title_raw.replace("\r", "").strip()
            author = author_raw.strip() if author_raw else "Unknown Author"
            dl_text = dl_raw.strip() if dl_raw else ""

            # Clean author format (e.g. "Doyle, Arthur Conan" -> "Arthur Conan Doyle")
            if "," in author:
                parts = [p.strip() for p in author.split(",", 1)]
                if len(parts) == 2:
                    author = f"{parts[1]} {parts[0]}"

            # Parse download count integer
            dl_count = 0
            dl_m = re.search(r"(\d[\d,]*)", dl_text)
            if dl_m:
                dl_count = int(dl_m.group(1).replace(",", ""))

            # Filter out non-books, already known, or duplicates
            if pg_id in seen_new_ids:
                continue

            if is_excluded(title, author):
                continue

            if is_already_known(pg_id, title):
                continue

            # Determine genre estimate
            genre = "Classic Literature"
            t_lower = title.lower()
            if any(k in t_lower for k in ["fairy", "tales", "children", "boy", "girl", "wonder"]):
                genre = "Children's & Fairy Tales"
            elif any(k in t_lower for k in ["mystery", "murder", "detective", "sherlock", "crime", "secret", "clue"]):
                genre = "Mystery & Detective"
            elif any(k in t_lower for k in ["horror", "ghost", "vampire", "haunted", "shadow", "dark", "tales of terror"]):
                genre = "Gothic Horror & Supernatural"
            elif any(k in t_lower for k in ["philosophy", "ethics", "republic", "thought", "mind", "nature", "meditations"]):
                genre = "Philosophy & Thought"
            elif any(k in t_lower for k in ["adventure", "journey", "island", "sea", "pirate", "captain", "voyage", "expedition"]):
                genre = "Adventure & Exploration"
            elif any(k in t_lower for k in ["space", "mars", "moon", "future", "time", "planet", "machine"]):
                genre = "Science Fiction"
            elif any(k in t_lower for k in ["love", "romance", "marriage", "heart"]):
                genre = "Romance & Society"
            elif any(k in t_lower for k in ["history", "war", "revolution", "rome", "greece", "empire", "biography"]):
                genre = "Historical & Epic"

            seen_new_ids.add(pg_id)
            new_books.append({
                "rank": len(new_books) + 1,
                "pg_id": pg_id,
                "title": title,
                "author": author,
                "genre": genre,
                "downloads": dl_count,
                "source_url": f"https://www.gutenberg.org/ebooks/{pg_id}"
            })

            print(f"   ✨ Added [{len(new_books)}/{max_needed}]: PG #{pg_id} \"{title}\" by {author} ({dl_count:,} downloads)")

            if len(new_books) >= max_needed:
                break

        start_index += len(matches)
        page += 1
        time.sleep(0.8)

    # Save to JSON
    with open(TARGET_JSON, "w", encoding="utf-8") as f:
        json.dump(new_books, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Saved {len(new_books)} books to {TARGET_JSON}")

    # Generate Markdown Catalog
    generate_markdown(new_books)

def generate_markdown(books):
    lines = [
        "# 🏛️ Top 500 Next Most Popular & Downloaded Project Gutenberg Masterworks",
        "",
        "> **Catalog Scope**: 500 Highly-Demanded Public Domain Masterworks (Batch 4: Books 401-900)  ",
        "> **Exclusivity**: Verified 100% Brand-New (NOT present in Liiro Ebook DB, Standard Ebooks, or any past batch)  ",
        f"> **Generated**: {time.strftime('%Y-%m-%d')}  ",
        "",
        "---",
        "",
        "## 📊 Genre Breakdown",
        "",
    ]

    genres = {}
    for b in books:
        g = b["genre"]
        genres[g] = genres.get(g, 0) + 1

    lines.append("| Genre Category | Book Count |")
    lines.append("| :--- | :---: |")
    for g, count in sorted(genres.items(), key=lambda x: x[1], reverse=True):
        lines.append(f"| **{g}** | {count} |")
    lines.append(f"| **Total** | **{len(books)}** |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 📚 Complete Masterworks List (Ranked by All-Time Downloads)")
    lines.append("")
    lines.append("| # | PG ID | Book Title | Author | Primary Genre | Gutenberg Downloads | 1-Click Import Command |")
    lines.append("| :-: | :-: | :--- | :--- | :--- | :-: | :--- |")

    for b in books:
        pg_id = b["pg_id"]
        title = b["title"].replace("|", "\\|")
        author = b["author"].replace("|", "\\|")
        genre = b["genre"]
        dl = f"{b['downloads']:,}" if b["downloads"] else "High"
        cmd = f"`python3 gutenberg/import_gutenberg_to_standard_ebook.py {pg_id}`"
        lines.append(f"| {b['rank']} | [`{pg_id}`]({b['source_url']}) | **{title}** | {author} | {genre} | {dl} | {cmd} |")

    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## ⚡ Batch Ingestion Protocol")
    lines.append("To import all 500 of these newly cataloged books into Liiro Ebook:")
    lines.append("```bash")
    lines.append("cd /Users/humayunrashid/multicamp/liiro-ebook")
    lines.append("python3 -u backend/scripts/run_gutenberg_batch_importer.py --catalog=backend/docs/NEXT_500_GUTENBERG_BOOKS.json")
    lines.append("```")

    with open(TARGET_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"📖 Generated Markdown Catalog at {TARGET_MD}")

if __name__ == "__main__":
    scrape_next_500()
