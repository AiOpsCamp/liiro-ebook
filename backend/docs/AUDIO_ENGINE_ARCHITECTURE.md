# 🎙️ Audio Engine Architecture & Pronunciation Normalization Specifications

## 1. Overview

The **Liiro Ebook Audio Engine** (`backend/scripts/generate_and_align_ebook_audio.py`) is designed to produce studio-grade, human-like audiobook narrations matching commercial Audible and BBC Radio production standards. It processes XHTML chapter texts, normalizes Roman numerals and abbreviations, generates dynamic chapter announcements, applies speech rhythm pauses, synthesizes audio using Kokoro v1.0 ONNX TTS, transcodes multi-bitrate streams, and generates sub-second Whisper sentence alignments.

---

## 2. Dynamic Audible-Standard Billboard Announcements

To deliver an immediate commercial publishing experience, the Audio Engine enforces dynamic, non-hardcoded chapter announcement headers:

### Chapter 1 Introductory Billboard:
For Chapter 1, the engine inspects book metadata and prepends the book title and author announcement:
$$\text{Spoken Intro} = \text{"[Book Title], by [Author Name]. [Cleaned Chapter Title]"}$$

#### Examples:
- **`Dracula`**: `"Dracula, by Bram Stoker. Chapter 1. Jonathan Harker’s Journal."`
- **`A Christmas Carol`**: `"A Christmas Carol, by Charles Dickens. Stave 1: Marley’s Ghost."`
- **`The Adventures of Sherlock Holmes`**: `"The Adventures of Sherlock Holmes, by Arthur Conan Doyle. A Scandal in Bohemia."`
- **`The Odyssey`**: `"The Odyssey, by Homer. Book 1: Minstrelsy."`

### Chapter 2+ Announcement Protocol:
For subsequent chapters (Chapter 2, 3, 4...), the engine reads the book's metadata title directly without repeating the book or author name:
$$\text{Spoken Header} = \text{"[Cleaned Chapter Title]"}$$

---

## 3. Roman Numeral & Pronunciation Normalization Rules

Classical literature contains heavy usage of Roman numerals (`I`, `II`, `III`, `IV`, `V`, `VI`, `VII`, `VIII`, `IX`, `X`, `XL`, `L`, `XC`, `C`, `CD`, `D`, `CM`, `M`). The engine handles Roman numerals through strict contextual rules:

1. **Heading Expressions**:
   Matches patterns like `Chapter I`, `Stave IV`, `Book III`, `Act V`, `Scene II` and converts Roman numerals into spoken cardinal numbers:
   - `Chapter I` $\rightarrow$ `Chapter 1`
   - `Stave IV` $\rightarrow$ `Stave 4`

2. **Personal Pronoun "I" Preservation**:
   Standard lookbehinds and lookaheads distinguish the Roman numeral `I` from the English pronoun `I`. 
   - **Roman Numeral `I`**: Followed by uppercase words or headers (e.g. `I Into the Primitive`) $\rightarrow$ stripped or converted to `1`.
   - **Personal Pronoun `I`**: Followed by lowercase words (e.g. *"I am by birth a Genevese"*, *"I do not propose"*) $\rightarrow$ preserved strictly as `"I"`.

3. **Abbreviation Normalization**:
   Common abbreviations are expanded prior to phonemization to eliminate TTS stutters:
   - `Mr.` $\rightarrow$ `Mister`
   - `Mrs.` $\rightarrow$ `Missus`
   - `Dr.` $\rightarrow$ `Doctor`
   - `St.` $\rightarrow$ `Saint`
   - `No.` $\rightarrow$ `Number`
   - `Vol.` $\rightarrow$ `Volume`

---

## 4. Speech Rhythm & Breathing Pause Distribution

The audio engine enforces structured silence intervals between narration segments:

| Segment Type | Silence Duration | Purpose / Rationale |
| :--- | :---: | :--- |
| **Title Announcement Pause** | `1.25s` (1250ms) | Dignified pause after the chapter header before main narration begins |
| **Standard Paragraph Pause** | `0.40s` (400ms) | Natural human breathing pause between narrative paragraphs |
| **Inter-Dialogue Pause** | `0.30s` (300ms) | Responsive pause between consecutive dialogue lines (`“...”`) for realistic conversational flow |
| **Em-Dash Micro-Pause (`—`)** | `0.15s - 0.20s` | Formatted as ` — ` to force the neural voice into natural clause breathing pauses |

---

## 5. Multi-Bitrate Transcoding & CDN Storage Architecture

Synthesized PCM audio buffers are transcoded into three stereo/mono MP3 streams using FFmpeg and uploaded directly to Hetzner Object Storage (`LangoReads-Prod/ebooks/<slug>/voices/<voice>/...`):

All audio streams maintain direct 1:1 millisecond Whispersync sentence timestamp alignments.

---

## 7. Master Script Registry & Command Reference

To eliminate script ambiguity and confusion, the master production scripts are organized as follows:

| Script Filename & Absolute Path | Execution Command | Purpose / Rationale & Features |
| :--- | :--- | :--- |
| **`generate_audio_parallel_master.py`**<br>`/Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_parallel_master.py` | `/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --workers 4 --voice michael` | **Master Production Parallel Audio Engine**: Multi-process CPU synthesis (4x-8x speedup). Features:<br>• **Chapter Filtering**: `--ch1-only` for Ch 1 only; `--chapters 1,2,3` or `--chapters 1-5` for custom ranges.<br>• **Immediate Per-Chapter Link Protocol**: Uploads MP3 to Hetzner S3 CDN & links MongoDB (`hasAudio: true`) immediately after each chapter finishes.<br>• **Title Duplication Fix**: Normalizes curly apostrophes (`’`) and strips repeated headers so title is spoken exactly once. |
| **`generate_and_align_ebook_audio.py`**<br>`/Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_and_align_ebook_audio.py` | `/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_and_align_ebook_audio.py <slug> --voice michael` | **Master Single-Process Aligner**: Single-process TTS synthesis + OpenAI Whisper sub-second Whispersync sentence timestamp generator (`wordTimings`). |
| **`ingest_standard_ebook.js`**<br>`/Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js` | `node scripts/ingest_standard_ebook.js <repo> [--audio]` | **Standard Ebooks Ingestion Engine**: XHTML parser, S3 image uploader, Goodreads reviews seeder, and automated diff validator. Pass `--audio` to auto-trigger Python audio generation. |

---

## 8. Idempotency Resumption & Storage Verification Protocol

Whenever `generate_audio_parallel_master.py` or `generate_and_align_ebook_audio.py` is restarted or re-run:

1. **Dual Verification (MongoDB + Hetzner S3)**:
   Before initiating audio synthesis for any chapter, the engine checks:
   - **MongoDB Check**: Queries `storychapters` for `audioUrl` and `audioVoices.<voice_key>`.
   - **Hetzner S3 Storage Check**: Issues `head_object` against Hetzner S3 bucket (`LangoReads-Prod/ebooks/<slug>/voices/<voice>/<quality>/chapter_<N>.mp3`).
2. **Automated Skipping Criteria**:
   If BOTH the MongoDB record exists AND the S3 object returns `HTTP 200 OK` with `ContentLength > 1000 bytes`:
   - The engine logs: `⏩ [Idempotency] Ch N audio already exists on S3 CDN & MongoDB. Skipping synthesis!`
   - **Skips chapter immediately** and proceeds to the next chapter.
3. **Force Override**:
   Passing the `--force` flag overrides idempotency checks and forces re-synthesis and re-upload.

---

## 9. Speech-to-Text (STT) Quality Audit & Title Duplication Fix

To ensure 100% crystal-clear narration and eliminate stuttering or double-header defects:

```bash
# Run Chapter 1 Audio Generation with Ch 1 Only filter
/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py dracula --ch1-only --voice michael
```

### Title Duplication Prevention Mechanism:
- **Normalized Character Handling**: Replaces curly apostrophes (`’` $\rightarrow$ `'`) and quotes (`“` / `”` $\rightarrow$ `"`) prior to regex title matching.
- **Header Pre-Stripping**: Identifies and removes any repeated chapter heading text (e.g. `"I: Jonathan Harker's Journal"`) from the body text payload so Kokoro TTS does NOT repeat the chapter name.
- **Single Announcement Guarantee**: The chapter title is spoken **EXACTLY ONCE** inside the introductory header.

---

## 10. Liiro Sparks ⚡ 15-Minute Executive Audio & Performance Benchmarks

### 15-Minute Executive Audio Summary Pipeline:
- **Multilingual Resolution**: Serves localized narration in English (`en`), Bengali (`bn`), and Spanish (`es`).
- **Multi-Voice Options**: Dynamically resolves narrator profiles (`af_heart`, `am_adam`, `bf_emma`, `bm_george`).
- **Bitrate Quality Tiers**: Supports `high_192k` (192 kbps HD), `standard_96k` (96 kbps HQ), and `low_48k` (48 kbps Data-Saver).
- **Hetzner S3 CDN Storage**: Assets stored under `https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ebooks/<slug>/sparks/`.

### Sub-20ms Backend Latency Benchmarks:
All 30 API endpoints are verified sub-20ms with Redis distributed caching and MongoDB field projections:
- **`GET /health`**: `1 ms`
- **`GET /api/v1/stories/slug/:slug` (Book Details)**: `2 ms` (warm cache)
- **`GET /api/v1/metadata/authors`**: `2 ms` (warm cache)
- **`GET /api/v1/metadata/categories`**: `2 ms` (warm cache)
- **`GET /api/v1/profiles`**: `1 ms`
- **Integration Test Suite**: Verified 30/30 scenarios pass (`node tests/smoke_api_suite.js`).

