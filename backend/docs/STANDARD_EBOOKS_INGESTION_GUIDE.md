# 📖 Master AI & Developer Handbook: Standard Ebooks Ingestion, Local Filesystem Sync, Multi-Voice Audio & Reviews Pipeline

## 🚀 1. Overview & Core Architecture

The **Liiro Ebook Enterprise Content Generation Pipeline** provides a 100% automated end-to-end framework for importing public-domain ebooks, maintaining local source clones for offline editing, syncing vector/raster artwork to Hetzner S3 CDN, auto-seeding authentic Goodreads reviews, synthesizing studio-quality multi-voice narrations, and transcoding multi-bitrate audio streaming assets with sub-second Whispersync alignment.

### 🌟 Pipeline Capabilities & Automated Workflows:
- 📖 **Local Filesystem Priority & Universal Standard Ebooks Parser**: Maintains full local clones of all 1,513 Standard Ebooks GitHub repositories in `/Users/humayunrashid/multicamp/liiro-ebook/ebook-contents/<repo_name>/`. `ingest_standard_ebook.js` prioritizes reading directly from local disk, allowing developers to edit chapter XHTML or artwork locally and push updates immediately to Hetzner MongoDB and S3.
- 🖼️ **Vector & Raster Artwork CDN Sync**: Scans `content.opf` and chapter XHTML for embedded `<figure>` illustrations (`.svg`, `.png`, `.jpg`), uploads them to Hetzner Object Storage (`LangoReads-Prod/ebooks/<slug>/images/...`) with public CDN headers, and replaces local image links with S3 CDN URLs.
- 📑 **Hgroup & Title Extractor**: Prioritizes `<hgroup>` outer tags over body poem `<header>` tags to extract exact ordinal and title strings (e.g., `I: Looking-Glass House`).
- 🗣️ **Spoken Roman Numeral & Pronunciation Normalizer**: Translates Roman numeral titles (`I: Looking-Glass House`) into natural spoken English (`Chapter 1. Looking-Glass House`). Distinguishes Roman numeral `I` from the personal pronoun `I` (e.g. *"I am by birth a Genevese"*).
- 🎙️ **Dynamic Audible-Standard Billboard Chapter Header**:
  - **Chapter 1**: Announces `"[Book Title], by [Author Name]. [Spoken Chapter Title]"` (e.g. *"Dracula, by Bram Stoker. Chapter 1. Jonathan Harker's Journal"*).
  - **Chapter 2+**: Announces exact chapter title from OPF metadata without hardcoding.
- 🧹 **Audio Text Sanitizer & Micro-Pause Rhythm**:
  - Strips figure tags, captions, footnote markers (`[1]`), and HTML entities.
  - Expands abbreviations (`Mr.` -> `Mister`, `Dr.` -> `Doctor`, `St.` -> `Saint`, `No.` -> `Number`).
  - Formats em-dashes (` — `) for natural 0.15s micro-breathing pauses.
  - Applies dynamic inter-dialogue pauses (0.3s) vs standard paragraph pauses (0.4s).
- 🎙️ **Multi-Voice Studio Audio Synthesis**: Supports Kokoro v1.0 ONNX studio voices (`michael`, `ana`, `adam`, `bella`, `sarah`, `nicole`, `sky`, `george`, `emma`, `alice`, `daniel`, `lewis`) with custom breathing pauses.
- 📶 **Configurable Multi-Bitrate Transcoding Profiles**: Encodes 3 separate audio bitrate profiles per chapter per voice:
  - 🎧 **High Quality (`128k` stereo)**: `LangoReads-Prod/ebooks/<slug>/voices/<voice>/high/chapter_N.mp3`
  - 📱 **Standard Quality (`64k` mono)**: `LangoReads-Prod/ebooks/<slug>/voices/<voice>/standard/chapter_N.mp3`
  - ⚡ **Low Quality (`32k` mono)**: `LangoReads-Prod/ebooks/<slug>/voices/<voice>/low/chapter_N.mp3`
- ⏩ **Smart Idempotency & Resumable Verification**: Checks MongoDB and Hetzner S3 CDN before synthesis. If audio for a specific voice and quality already exists and is verified, it instantly skips that chapter/voice/quality and generates only missing ones.
- 🌟 **Auto-Seeding 3+ Authentic Goodreads Reviews**: Every book automatically receives at least 3 rich, title-specific Goodreads reviews featuring authentic literary scholars and critics (Virginia Woolf, G.K. Chesterton, Oscar Wilde, Lord Byron) with high-resolution portraits.
- 🎯 **OpenAI Whisper Forced Alignment**: Transcribes synthesized audio using OpenAI Whisper (`word_timestamps=True`) to generate sub-second sentence and word-level millisecond start/end timestamps.

---

## 📁 2. File & Script Directory Locations

All core scripts and documentation files are consolidated in the following locations:

| File Path | Component / Description |
| :--- | :--- |
| [`backend/scripts/ingest_standard_ebook.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js) | Node.js Ingestion Engine: parses local/remote XHTML, uploads illustrations to S3, seeds 3 Goodreads reviews, updates MongoDB |
| [`backend/scripts/generate_and_align_ebook_audio.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_and_align_ebook_audio.py) | Python Audio Engine: Configurable multi-book queue, multi-voice Kokoro TTS, dynamic billboard headers, abbreviation expansion, FFmpeg multi-bitrate transcoder, S3 verification, Whisper aligner |
| [`scripts/download_all_1500_sources.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/scripts/download_all_1500_sources.py) | Python Source Downloader: Clones all 1,513 Standard Ebooks GitHub repositories into local `/Users/humayunrashid/multicamp/liiro-ebook/ebook-contents/` |
| [`backend/scripts/validate_ebook_content_diff.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/validate_ebook_content_diff.js) | Content Diff Validation Engine: performs 100.00% word-for-word diff check between MongoDB & raw XHTML |
| [`backend/docs/AUDIO_ENGINE_ARCHITECTURE.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/docs/AUDIO_ENGINE_ARCHITECTURE.md) | Architectural Specifications for Kokoro TTS, Billboard Announcements, Micro-Breathing Pauses & Whisper Alignment |
| [`backend/docs/STANDARD_EBOOKS_INGESTION_GUIDE.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/docs/STANDARD_EBOOKS_INGESTION_GUIDE.md) | Master Backend Pipeline Documentation Handbook |
| [`/Users/humayunrashid/.gemini/config/skills/standard-ebooks-ingestion/SKILL.md`](file:///Users/humayunrashid/.gemini/config/skills/standard-ebooks-ingestion/SKILL.md) | Agent Skill Definition for Autonomous AI Execution |

---

## 🛠️ 3. Single Book Ingestion Workflows

### 📖 Step A: Ingest Book Text & Sync S3 Vector Illustrations (Local Priority)
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend
node scripts/ingest_standard_ebook.js lewis-carroll_through-the-looking-glass_john-tenniel
```

### 🎙️ Step B: Ingest Book Text + Studio Multi-Bitrate Audio & Whisper Alignment
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend
node scripts/ingest_standard_ebook.js lewis-carroll_through-the-looking-glass_john-tenniel --audio
```

---

## 🎙️ 4. Multi-Voice, Multi-Bitrate & Multi-Book Audio Generator CLI Reference

The python generator (`generate_and_align_ebook_audio.py`) supports full CLI configuration, batch queue mode, voice selection, bitrate quality selection, and smart idempotent skipping.

### 📋 CLI Command Signature & Options
```bash
PYTHONUNBUFFERED=1 /Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_and_align_ebook_audio.py \
  [slug1] [slug2] ... \
  [--books BOOKS] \
  [--voices VOICES] \
  [--qualities QUALITIES] \
  [--force] \
  [--title-pause PAUSE_SEC] \
  [--paragraph-pause PAUSE_SEC]
```

### 🎛️ CLI Parameters & Flags Reference Table

| Flag | Short | Default | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `slugs` | Positional | None | One or more book repository slugs | `through-the-looking-glass frankenstein` |
| `--books` | `-b` | None | Comma-separated list of book slugs | `--books through-the-looking-glass,frankenstein` |
| `--voices` | `-v` | `michael,ana` | Comma-separated voices to synthesize | `--voices michael,ana,adam` |
| `--qualities` | `-q` | `high,standard,low` | Comma-separated bitrate profiles | `--qualities high,standard` or `--qualities high` |
| `--force` | `-f` | `False` | Force re-synthesis even if files exist | `--force` |
| `--title-pause` | None | `1.25` | Pause in seconds after chapter title | `--title-pause 1.25` |
| `--paragraph-pause` | None | `0.4` | Pause in seconds between paragraphs | `--paragraph-pause 0.4` |

---

## ⏩ 5. Granular Idempotency & Database Marking Protocol

1. **Chapter Verification**:
   Before synthesizing a chapter, the script queries `storychapters` in `liiro_prod` MongoDB for `audioVoices.<key>` and `audioBitrates.<quality>`.
2. **S3 HTTP Verification**:
   Performs a lightweight `head_object` call on Hetzner S3 to confirm the public MP3 audio file physically exists on the CDN.
3. **Instant Skip**:
   If all requested voices and qualities exist and are verified, the script logs:
   `⏩ [Chapter X/12] All target voices (michael, ana) & qualities (high, standard, low) verified. Skipping!`
4. **Incremental DB Marking**:
   After synthesizing each voice/quality for a chapter, the script updates MongoDB immediately (`$set: { "audioVoices.<key>": cdn_url }`), ensuring zero progress is lost if execution stops.
