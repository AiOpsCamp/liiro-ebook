# 📖 Ebook Import Agent — Operational Specification & Full Context

> **Agent Name**: `Ebook_Import_Agent`  
> **Role**: Standard Ebooks Ingestion, Content Cleaning, Image CDN Upload & Post-Import Validation Specialist  
> **Primary Script**: [`backend/scripts/ingest_standard_ebook.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js)  
> **Target Database**: `liiro_prod` (`mongodb://127.0.0.1:27017/liiro_prod`)  
> **Target Hetzner S3 CDN**: `https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ebooks`

---

## 1. Context & Responsibilities

The `Ebook_Import_Agent` is responsible for ingesting public domain ebooks from Standard Ebooks GitHub repositories into the Liiro Ebook platform.

### Core Objectives:
1. **Repository Discovery & Fetching**:
   - Inspects local `/Users/humayunrashid/multicamp/ebook-contents/<repo-name>` or fetches directly from `github.com/standardebooks/<repo-name>`.
2. **XHTML & Metadata Extraction**:
   - Parses `toc.xhtml`, `titlepage.xhtml`, `colophon.xhtml`, and all chapter `.xhtml` files.
   - Extracts Book Title, Author Name, Original Publication Year, Language, and Chapter List.
   - Auto-categorizes the book into one of Liiro's 18 Master Categories (`Gothic & Dark Fantasy`, `Victorian Literature`, `Children's Classics`, `Philosophy & Ethics`, `Sci-Fi & Dystopian`, `Mystery & Detective`, `Adventure & Sea Stories`, etc.).
   - Generates clickable `#hashtags` from book subject tags.
3. **Hetzner S3 Artwork CDN Upload**:
   - Uploads cover image (`cover.svg` / `cover.jpg`) and all embedded chapter illustrations directly to Hetzner S3 bucket (`multicamp-prod-storage`).
   - Sets public read permissions (`ACL="public-read"`) and returns CDN URLs (`https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ebooks/<slug>/images/...`).
4. **Goodreads & Social Proof Seeding**:
   - Auto-seeds 3 authentic Goodreads reviews, famous quotes, and Sparks executive summary key takeaways.
5. **Initial Audio State Flags**:
   - Sets `hasAudio: false`, `isAudiobook: false`, `availableVoices: []`, `contentType: "ebook"` during initial ingestion.
6. **Automated Post-Import Validation**:
   - Performs a 100% word-match diff validation comparing MongoDB stored text payload with original XHTML files.
   - Verifies HTTP 200 status for S3 CDN cover image.
7. **Liiro Masterwork Branding & Replacement Policy**:
   - Replaces third-party branding tags (`standard-ebooks-classic` -> `liiro-masterwork-classic`).
   - Sanitizes parsed text replacing `"Standard Ebooks"` with `"Liiro Ebook"`, `"standardebooks.org"` with `"liiro.app"`, and `"produced by Standard Ebooks"` with `"curated & published by Liiro Ebook"`.

---

## 2. CLI Execution Commands

```bash
# Ingest single book repository
cd /Users/humayunrashid/multicamp/liiro-ebook/backend
node scripts/ingest_standard_ebook.js <repo-name>

# Ingest book AND automatically trigger Python audio pipeline
node scripts/ingest_standard_ebook.js <repo-name> --audio

# Example
node scripts/ingest_standard_ebook.js bram-stoker_dracula
```

---

## 3. Error Handling & Recovery Protocols

- **MongoDB Timeout Error (`ETIMEDOUT`)**:
  - Re-establish the SSH tunnel:
    `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -o ServerAliveInterval=30 -N -L 27017:10.43.172.242:27017 root@46.224.188.251 &`
- **S3 Upload Error**:
  - Verify credentials `HETZNER_S3_KEY` and `HETZNER_S3_SECRET` in `backend/.env`.
