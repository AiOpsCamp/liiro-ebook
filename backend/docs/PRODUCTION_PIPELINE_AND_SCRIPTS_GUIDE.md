# 📚 Liiro Ebook — Canonical Production Pipeline & Scripts Reference

> **Document Version**: 2.0 (Production Verified)  
> **Target Architecture**: Liiro Ebook Platform (Web + Mobile React Native Expo & Node.js Express API)  
> **Database & Storage**: Hetzner Production MongoDB (`10.43.172.242:27017` / tunneled `127.0.0.1:27017`), Hetzner S3 CDN (`multicamp-prod-storage` / `LangoReads-Prod`)

---

## 🏛️ The 3 Core Canonical Production Pipelines

All previous experimental or redundant scripts have been pruned. The entire ingestion and audiobook generation workflows now operate through **3 battle-tested canonical scripts**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LIIRO PRODUCTION WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
      ┌────────────────────────────────────────┼────────────────────────────────────────┐
      ▼                                        ▼                                        ▼
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│ 1. Gutenberg Converter    │    │ 2. Master Book Ingestor   │    │ 3. Studio Audio Generator │
│ `gutenberg/import_...py`  │    │ `node ingest_...js`       │    │ `python3 generate_...py`  │
│                           │    │                           │    │                           │
│ - Fetches Gutenberg HTML  │    │ - Parses Standard Ebooks  │    │ - Kokoro TTS v1.0 ONNX    │
│ - Formats to SE XHTML/CSS │    │   or Gutenberg repos      │    │ - Spoken Intro & Preamble │
│ - Generates clean EPUB    │    │ - Uploads S3 WebP Covers  │    │ - 1-to-1 Exact Timestamps │
│   structure & git repo    │    │ - Auto-seeds 3 Reviews    │    │ - Multi-Bitrate (64k MP3) │
│                           │    │ - Syncs to MongoDB Prod   │    │ - Dual Voices (Ana & Mic) │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 🛠️ 1. Project Gutenberg Importer (`gutenberg/import_gutenberg_to_standard_ebook.py`)

Converts any Project Gutenberg book into the standard Standard Ebooks repository format with semantic XHTML chapters, TOC, metadata, and CSS.

### File Location:
[`gutenberg/import_gutenberg_to_standard_ebook.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/gutenberg/import_gutenberg_to_standard_ebook.py)

### Usage:
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/gutenberg
python3 import_gutenberg_to_standard_ebook.py <PG_ID_OR_SLUG>

# Example:
python3 import_gutenberg_to_standard_ebook.py 1661  # The Adventures of Sherlock Holmes
python3 import_gutenberg_to_standard_ebook.py 35    # The Time Machine
```

### Features:
- Automatically scrapes metadata, clean chapters, illustrations, and cover art.
- Builds standard `src/epub/` folder structure: `content.opf`, `toc.xhtml`, `css/core.css`, `text/chapter-*.xhtml`.
- Initializes local git repository matching Standard Ebooks specifications.

---

## 📖 2. Master Book Ingestor (`backend/scripts/ingest_standard_ebook.js`)

The single master ingestion script for inserting books into MongoDB and uploading covers to S3.

### File Location:
[`backend/scripts/ingest_standard_ebook.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js)

### Usage:
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# Ingest any Standard Ebooks or Gutenberg repository by slug:
node scripts/ingest_standard_ebook.js <author_slug>_<title_slug>

# Examples:
node scripts/ingest_standard_ebook.js arthur-conan-doyle_the-adventures-of-sherlock-holmes
node scripts/ingest_standard_ebook.js j-m-barrie_peter-and-wendy
node scripts/ingest_standard_ebook.js h-g-wells_the-time-machine
```

### What It Does:
1. Automatically detects whether the repository lives in `ebook-contents/` (Standard Ebooks) or `gutenberg/` (Project Gutenberg).
2. Parses XHTML text, images, chapters, and metadata.
3. Generates and uploads optimized WebP covers to Hetzner S3 CDN.
4. Auto-seeds 3 authentic Goodreads-style book reviews.
5. Links author, category, series, and tags in MongoDB `liiro_prod`.

---

## 🎙️ 3. Studio Audiobook Generator (`backend/scripts/generate_audio_single_master.py`)

The single production-grade audiobook synthesis pipeline powering Liiro Ebook audio and Whispersync.

### File Location:
[`backend/scripts/generate_audio_single_master.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_single_master.py)

### Usage:
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# Generate Audio for specific book (all chapters):
python3 -u scripts/generate_audio_single_master.py <title_slug> --voices ana,michael --qualities standard

# Generate Audio for specific chapters only:
python3 -u scripts/generate_audio_single_master.py peter-and-wendy --voices ana,michael --qualities standard --chapters 1 --force

# Fast generation (Deterministic Sentence/Paragraph Timestamps):
python3 -u scripts/generate_audio_single_master.py <title_slug> --voices ana,michael --qualities standard --skip-whisper
```

### Key Technical Innovations & Parameters:
- **Spoken Brand Intro & Book Preamble**: In Chapter 1, naturally introduces the book (*"Welcome to Liiro Ebook. You are listening to [Title], written by [Author]."*).
- **Logical Paragraph Timestamp Indexing**:
  - `paragraphIndex: -1` -> Brand Intro (No body text highlight).
  - `paragraphIndex: 0` -> Spoken Chapter Header (No body text highlight).
  - `paragraphIndex: 1..N` -> Body Paragraphs 0..N-1 (1-to-1 accurate highlighting).
- **Natural Breathing Pauses**:
  - `1.40s` after Brand Intro.
  - `2.20s` after Chapter Title.
  - `0.80s` between dialogue lines.
  - `1.20s` between standard paragraphs.
- **Dual Voice Architecture**: Synthesizes **Ana** (US Female, `af_heart`) and **Michael** (US Male, `am_michael`).
- **Direct S3 Upload**: Encodes multi-bitrate 64k Standard MP3s and uploads directly to Hetzner S3 CDN.
- **MongoDB Sync**: Updates `storychapters` and `stories` with `hasAudio: true`, CDN URLs, durations, and paragraph timestamps.

---

## 🗂️ Active Utility & Maintenance Scripts Inventory

| Script Name | Purpose |
| :--- | :--- |
| [`batch_ingest_top_100.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/batch_ingest_top_100.js) | Batch ingest the top 100 most popular classics into MongoDB. |
| [`ingest_complete_1000_standard_ebooks.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_complete_1000_standard_ebooks.js) | Ingest the entire 1,500+ Standard Ebooks catalog. |
| [`create_and_populate_book_series.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/create_and_populate_book_series.js) | Organize and populate multi-book series (Sherlock Holmes, Oz, Barsoom, etc.). |
| [`generate_and_upload_ambient_soundscapes.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_and_upload_ambient_soundscapes.py) | Generate and upload background ambient soundscapes (Soft Piano, Rain, Strings). |
| [`seed_liiro_prod_database.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/seed_liiro_prod_database.js) | Seed categories, featured flags, and tags for production database. |
| [`seed_book_reels.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/seed_book_reels.js) | Seed interactive TikTok/Reels style vertical video quotes. |
| [`seed_user_activities.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/seed_user_activities.js) | Seed realistic social reading feed and activities. |
| [`configure_s3_cors.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/configure_s3_cors.js) | Set CORS rules on Hetzner S3 bucket for audio streaming. |
| [`sync_ebook_metadata.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/sync_ebook_metadata.js) | Sync chapter counts, word counts, and estimated reading times. |

---

## 🎯 Verification Checklist for Any Book

1. **Ingest Book**: `node backend/scripts/ingest_standard_ebook.js <author_slug>_<title_slug>`
2. **Generate Audio**: `python3 backend/scripts/generate_audio_single_master.py <title_slug> --voices ana,michael --qualities standard`
3. **Verify Web Reader & Whispersync**:  
   `http://localhost:8086/read/<title_slug>?audio=true&lang=en&voice=ana`
