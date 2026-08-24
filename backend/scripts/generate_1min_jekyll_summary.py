#!/usr/bin/env python3
import os
import sys
import boto3
from gtts import gTTS
import pymongo

# 1-Minute Summary Text
SUMMARY_TEXT = (
    "Welcome to Liiro's 1-Minute Executive Summary of The Strange Case of Dr. Jekyll and Mr. Hyde by Robert Louis Stevenson. "
    "Dr. Henry Jekyll creates a chemical serum to isolate his dark desires, unintentionally birthing Edward Hyde—a sinister persona free from moral restraint. "
    "What begins as a controlled scientific experiment quickly spirals into an uncontrollable addiction, as Hyde gradually dominates Jekyll's life. "
    "Stevenson's Gothic masterpiece warns us that every human harbors dual natures of good and evil, and attempting to repress or isolate our dark side only grants it terrifying power. "
    "Master world classics in minutes with Liiro."
)

OUTPUT_MP3 = "backend/public/dr_jekyll_1min_summary.mp3"
S3_BUCKET = "multicamp-prod-storage"
S3_KEY = "Liiro-Ebook-Prod/audio/summaries/dr_jekyll_1min_summary.mp3"
S3_URL = f"https://multicamp-prod-storage.nbg1.your-objectstorage.com/{S3_KEY}"

def generate_summary_audio():
    print("🎙️ Synthesizing 1-Minute Audio Summary with gTTS...")
    os.makedirs(os.path.dirname(OUTPUT_MP3), exist_ok=True)
    
    tts = gTTS(text=SUMMARY_TEXT, lang="en", slow=False)
    tts.save(OUTPUT_MP3)
    print(f"✅ Generated local MP3 file: {OUTPUT_MP3} (Size: {os.path.getsize(OUTPUT_MP3)} bytes)")

    # Upload to Hetzner Ceph S3
    print(f"☁️ Uploading audio to Hetzner Ceph S3 key: {S3_KEY}...")
    s3_endpoint = os.environ.get("S3_ENDPOINT", "https://nbg1.your-objectstorage.com")
    access_key = os.environ.get("S3_ACCESS_KEY_ID")
    secret_key = os.environ.get("S3_SECRET_ACCESS_KEY")

    if access_key and secret_key:
        s3 = boto3.client(
            "s3",
            endpoint_url=s3_endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )
        s3.upload_file(
            OUTPUT_MP3,
            S3_BUCKET,
            S3_KEY,
            ExtraArgs={"ContentType": "audio/mpeg"}
        )
        print(f"🎉 Successfully uploaded to S3: {S3_URL}")
    else:
        print("⚠️ S3 Credentials missing, skipping S3 upload. Local MP3 is ready!")

    # Update MongoDB BookSummary record
    mongo_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/liiro_prod")
    client = pymongo.MongoClient(mongo_uri)
    db = client.get_default_database()
    
    res = db["booksummaries"].update_one(
        {"slug": "the-strange-case-of-dr-jekyll-and-mr-hyde"},
        {"$set": {
            "summaryAudioUrl": S3_URL,
            "estimatedAudioMinutes": 1,
            "estimatedReadMinutes": 1,
        }}
    )
    print(f"✅ Updated MongoDB BookSummary record (Matched: {res.matched_count}, Modified: {res.modified_count})")

if __name__ == "__main__":
    generate_summary_audio()
