# 📖 Liiro Ebook — Master Production Architecture & Autonomous Swarm Handbook

> **System Version**: `1.0.0-PROD`  
> **Backend Service**: Express API on Port `5012` (`http://localhost:5012/api/v1`)  
> **Frontend Web App**: Expo React Native Web on Port `8086` (`http://localhost:8086`)  
> **Database**: `liiro_prod` (Hetzner K3s MongoDB via SSH Tunnel `127.0.0.1:27017`)  
> **Hetzner S3 Storage**: `multicamp-prod-storage` / `LangoReads-Prod/ebooks`  
> **Python Virtualenv**: `/Users/humayunrashid/multicamp/.venv/bin/python`

---

## 🏛️ Executive Architecture Overview

Liiro Ebook is an enterprise-grade classic ebook and neural audiobook streaming platform designed for mobile (iOS & Android) and web platforms.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Liiro Ebook Frontend (Expo / RN)                   │
│                       http://localhost:8086                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP API Calls / RTK Query
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Liiro Express Backend (Node.js)                      │
│                       http://localhost:5012                             │
└──────────┬─────────────────────────┬─────────────────────────┬──────────┘
           │                         │                         │
┌──────────▼──────────┐   ┌──────────▼──────────┐   ┌──────────▼──────────┐
│  Hetzner K3s Mongo  │   │   Hetzner S3 CDN    │   │  Neural Audio Pipeline│
│     `liiro_prod`    │   │  (Public Artworks & │   │  Kokoro TTS ONNX &  │
│  `127.0.0.1:27017`  │   │     Audio MP3s)     │   │   Whisper Aligner   │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

---

## 🏷️ Liiro Branding & Replacement Policy

To ensure complete platform ownership and consistent branding:
1. **Tag Replacement**: All third-party tags like `standard-ebooks-classic` are automatically mapped to **`Liiro Masterwork Classic`** (`liiro-masterwork-classic`).
2. **Text & Content Sanitization**: Any string containing `"Standard Ebooks"`, `"standardebooks.org"`, or `"produced by Standard Ebooks"` is dynamically replaced during ingestion with **`Liiro Ebook`**, **`liiro.app`**, and **`curated & published by Liiro Ebook`**.
3. **Automated Branding Replacer Script**: [`backend/scripts/replace_branding.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/replace_branding.js) sanitizes all DB collections (`stories`, `storychapters`, `ebooktags`, `bookseries`).

---

## 🛠️ Complete Active Script Registry & Command Reference

| Script Name & Path | Executable CLI Command | Role & Specialization |
| :--- | :--- | :--- |
| **`ingest_standard_ebook.js`**<br>[`backend/scripts/ingest_standard_ebook.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js) | `node scripts/ingest_standard_ebook.js <repo-name> [--audio]` | **Standard Ebooks Ingestion**: Parses XHTML, applies Liiro branding, uploads covers/artworks to Hetzner S3, seeds Goodreads reviews, and validates content diffs. |
| **`generate_audio_parallel_master.py`**<br>[`backend/scripts/generate_audio_parallel_master.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_parallel_master.py) | `/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --workers 4 --voice michael` | **Parallel Neural Audio Production**: Multi-process CPU execution (4x-8x speedup), `--ch1-only` and `--chapters` filtering, title duplication fix, immediate S3 upload & Mongo linking. |
| **`deploy_category_batch.js`**<br>[`backend/scripts/deploy_category_batch.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/deploy_category_batch.js) | `node scripts/deploy_category_batch.js <category-key> [--audio] [--ch1-only] [--limit=N]` | **Dynamic Category Batch Deployer**: Reads `backend/data/category_repositories.json` and deploys all books in an entire category (`children`, `gothic`, `scifi`, `mystery`, etc.). |
| **`deploy_series_batch.js`**<br>[`backend/scripts/deploy_series_batch.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/deploy_series_batch.js) | `node scripts/deploy_series_batch.js <series-slug> [--audio] [--ch1-only]` | **Book Series Full Ingestion**: Ingests, uploads artwork to S3, generates audio, and links all volumes of a multi-book saga (`oz`, `alice`, `sherlock`, `dolittle`, etc.). |
| **`replace_branding.js`**<br>[`backend/scripts/replace_branding.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/replace_branding.js) | `node scripts/replace_branding.js` | **Liiro Platform Branding Replacer**: Replaces third-party tags and text strings across all MongoDB collections with Liiro Ebook branding. |
| **`generate_category_catalog.js`**<br>[`backend/scripts/generate_category_catalog.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_category_catalog.js) | `node scripts/generate_category_catalog.js` | **Automated Category Catalog Scanner**: Scans 1,513 repos in `ebook-contents/`, extracts OPF metadata/subjects, and builds `backend/data/category_repositories.json`. |
| **`generate_series_catalog.js`**<br>[`backend/scripts/generate_series_catalog.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_series_catalog.js) | `node scripts/generate_series_catalog.js` | **Automated Series OPF Metadata Parser**: Scans OPF `belongs-to-collection` properties across 1,513 repos and builds `backend/data/series_catalog.json`. |
| **`ingest_and_link_book_series.js`**<br>[`backend/scripts/ingest_and_link_book_series.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_and_link_book_series.js) | `node scripts/ingest_and_link_book_series.js` | **Book Series Interconnection Engine**: Upserts `BookSeries` documents in MongoDB and links `seriesId`, `seriesName`, `seriesOrder`, and `relatedBooks`. |
| **`relink_and_clean_categories.js`**<br>[`backend/scripts/relink_and_clean_categories.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/relink_and_clean_categories.js) | `node scripts/relink_and_clean_categories.js` | **Category Purge & Relinker**: Updates category `bookCount` and purges dead categories with 0 books from MongoDB. |
| **`clean_dead_series.js`**<br>[`backend/scripts/clean_dead_series.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/clean_dead_series.js) | `node scripts/clean_dead_series.js` | **Series Purge & Relinker**: Purges dead series documents with 0 active books from MongoDB. |
| **`audit_ingested_books.js`**<br>[`backend/scripts/audit_ingested_books.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/audit_ingested_books.js) | `node scripts/audit_ingested_books.js` | **Comprehensive Book Integrity Auditor**: Verifies 100% word-match diffs, Chapter 1 text rendering, cover CDN HTTP 200 URLs, and audio streams for all ingested books. |

---

## 🤖 Autonomous Agent Swarm Directory

All agents are registered in [`Agents/README.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/README.md):

1. **`Category_Batch_Deployment_Agent`**: [`Agents/CATEGORY_BATCH_DEPLOYMENT_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/CATEGORY_BATCH_DEPLOYMENT_AGENT.md)
2. **`Series_Full_Ingestion_Agent`**: [`Agents/SERIES_FULL_INGESTION_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/SERIES_FULL_INGESTION_AGENT.md)
3. **`Ebook_Import_Agent`**: [`Agents/EBOOK_IMPORT_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/EBOOK_IMPORT_AGENT.md)
4. **`Parallel_Audio_Agent`**: [`Agents/PARALLEL_AUDIO_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/PARALLEL_AUDIO_AGENT.md)
5. **`Book_Series_Agent`**: [`Agents/BOOK_SERIES_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/BOOK_SERIES_AGENT.md)
6. **`Frontend_UI_Agent`**: [`Agents/FRONTEND_UI_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/FRONTEND_UI_AGENT.md)
7. **`Production_Health_Agent`**: [`Agents/PRODUCTION_HEALTH_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/PRODUCTION_HEALTH_AGENT.md)

---

## 📊 Live System Verification Status

- **Total Ingested Books**: 11 Books (100% Passed Integrity Audit)
- **Active Categories**: 5 Curated Categories (All dead 0-book categories purged)
- **Active Book Series**: 4 Multi-Book Sagas (All dead 0-book series purged)
- **Branding Status**: 100% Liiro Ebook Platform Branding Applied
- **Backend API**: `http://localhost:5012/health` — `{"status":"healthy","dbConnected":true}`
- **Frontend App**: `http://localhost:8086/` — HTTP 200 OK (Clean Apple/Audible UI)
