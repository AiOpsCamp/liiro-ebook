#!/usr/bin/env python3
import os
import re
import pymongo
from pymongo import UpdateOne

MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27018/liiro_prod?authSource=admin&directConnection=true")
client = pymongo.MongoClient(MONGO_URI)
db = client['liiro_prod']

def sanitize_content():
    print("=== 1. Sanitizing XML/Doc headers in storychapters.content ===", flush=True)
    cursor = db.storychapters.find(
        {"content": {"$regex": r"<\?xml|<!DOCTYPE|<head", "$options": "i"}},
        {"_id": 1, "content": 1}
    )
    
    bulk_ops = []
    total_scanned = 0
    for doc in cursor:
        total_scanned += 1
        raw_html = doc.get("content", "")
        cleaned_html = re.sub(r"<\?xml[^>]*\?>", "", raw_html, flags=re.I)
        cleaned_html = re.sub(r"<!DOCTYPE[^>]*>", "", cleaned_html, flags=re.I)
        cleaned_html = re.sub(r"<head[^>]*>[\s\S]*?<\/head>", "", cleaned_html, flags=re.I)
        cleaned_html = re.sub(r"<\/?html[^>]*>", "", cleaned_html, flags=re.I)
        cleaned_html = re.sub(r"<\/?body[^>]*>", "", cleaned_html, flags=re.I)
        cleaned_html = cleaned_html.strip()
        if cleaned_html != raw_html:
            bulk_ops.append(UpdateOne({"_id": doc["_id"]}, {"$set": {"content": cleaned_html}}))
        
        if len(bulk_ops) >= 500:
            db.storychapters.bulk_write(bulk_ops)
            print(f"Sanitized batch of {len(bulk_ops)} chapters...", flush=True)
            bulk_ops = []
            
    if bulk_ops:
        db.storychapters.bulk_write(bulk_ops)
        print(f"Sanitized final batch of {len(bulk_ops)} chapters.", flush=True)
        
    print(f"Finished sanitizing! Total matching chapters processed: {total_scanned}", flush=True)

def find_and_partition_30_books():
    print("\n=== 2. Finding & Partitioning 30 Short Audiobooks (<= 15 chapters) ===", flush=True)
    live_stories = list(db.stories.find({"hasAudio": True}, {"slug": 1, "title": 1}))
    
    short_books = []
    for s in live_stories:
        slug = s["slug"]
        if "sherlock" in slug or "holmes" in slug:
            continue
        c_count = db.storychapters.count_documents({"storySlug": slug})
        if c_count <= 15:
            short_books.append((slug, s.get("title", slug), c_count))
            
    short_books.sort(key=lambda x: (x[2], x[0]))
    
    print(f"Found {len(short_books)} short live audiobooks:", flush=True)
    for idx, (slug, title, ch) in enumerate(short_books, 1):
        print(f"{idx:2d}. {slug:50s} ({ch:2d} ch) - {title}", flush=True)
        
    mac_books = short_books[0:10]
    vm1_books = short_books[10:20]
    vm2_books = short_books[20:30]
    
    print("\n--- Worker 1 (Mac) 10 Books ---", flush=True)
    for b in mac_books:
        print(f"  {b[0]} ({b[2]} ch)", flush=True)
    print("SLUGS:", " ".join([b[0] for b in mac_books]), flush=True)
    
    print("\n--- Worker 2 (Hetzner VM Queue A) 10 Books ---", flush=True)
    for b in vm1_books:
        print(f"  {b[0]} ({b[2]} ch)", flush=True)
    print("SLUGS:", " ".join([b[0] for b in vm1_books]), flush=True)
    
    print("\n--- Worker 3 (Hetzner VM Queue B) 10 Books ---", flush=True)
    for b in vm2_books:
        print(f"  {b[0]} ({b[2]} ch)", flush=True)
    print("SLUGS:", " ".join([b[0] for b in vm2_books]), flush=True)

if __name__ == "__main__":
    sanitize_content()
    find_and_partition_30_books()
