# Ingestion & Audio Pipeline Documentation

## 1. Standard Ebooks Ingestion Pipeline
The ingestion engine streams cleaned XHTML files directly from Standard Ebooks GitHub repositories:

```bash
cd backend
node scripts/ingest_complete_1000_standard_ebooks.js [maxBooks]
```

### Features:
* **HTML Entity Cleaning**: Decodes `&rsquo;`, `&mdash;`, `&hellip;`, etc.
* **Illustration Extraction**: Converts embedded chapter `<figure>` and `<img>` tags into `[IMAGE: url]` markdown elements.
* **Taxonomy Alignment**: Automatically categorizes books into one of 25 master genres and populates author directory records.

---

## 2. Multi-Voice Kokoro TTS Audio Generation
Synthesizes neural audiobooks using `kokoro-onnx` ONNX models:

```bash
python scripts/generate_full_chapters_kokoro.py
```

* **Voice Mapping**: Synthesizes distinct character voices (`am_adam`, `af_heart`, `bf_emma`, `bm_george`).

---

## 3. OpenAI Whisper Forced Alignment Pipeline
Aligns spoken audio tracks against chapter text:

```bash
python scripts/run_openai_whisper_alignment.py
```

Generates word-level timestamps (`startSec`, `endSec`, `words`) for real-time sentence auto-scrolling during playback.
