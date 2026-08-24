# 🎙️ Liiro Ebook Audio Generation Pipeline

> **Standalone Enterprise Audio Generation, Text Sanitization, Whispersync Alignment, HLS Transcoding & S3 Sync Engine**  
> **Directory**: `backend/audio_pipeline/`  
> **Updated**: August 24, 2026  

---

## 🎯 1. Overview & Architecture

The **Liiro Ebook Audio Generation Pipeline** is a modular Python & Node.js engine designed to generate high-fidelity AI audiobook speech from ebook chapter payloads while ensuring:

1. **Header Deduplication**: Eliminates duplicate title pronunciations (e.g. preventing *"Story of the Door, Story of the Door..."*).
2. **Text & Symbol Sanitization**: Strips raw markdown syntax (`*bold*`, `**strong**`, `# headers`, `_italics_`), HTML tags, footnotes, and noise-inducing symbols (`*`, `~`, `^`, `#`, `@`).
3. **Punctuation & Pause Normalization**: Converts em-dashes (`—`) into natural speech commas (`, `) and normalizes smart quotes.
4. **High-Fidelity Kokoro ONNX Speech**: Synthesizes 24kHz neural audio using native ONNX models with customizable AI narrators (`am_adam`, `af_heart`, `am_michael`, etc.).
5. **Whispersync Forced Alignment**: Produces sentence-level timestamp mappings (`startSec` & `endSec`) for real-time karaoke text highlighting in the client app.
6. **HLS VOD Transcoding**: Converts WAV/MP3 files into HTTP Live Streaming master playlists (`playlist.m3u8`) and 6-second MPEG-TS segments (`segment_*.ts`).
7. **Hetzner S3 & MongoDB Link**: Uploads assets to Hetzner Object Storage (`multicamp-prod-storage`) and updates MongoDB `liiro_prod` `storychapters` documents.

---

## 📁 2. Pipeline Directory Structure

```
backend/audio_pipeline/
├── cleaner.py             # Text normalization, markdown/HTML stripper & header deduplicator
├── synthesizer.py         # Kokoro ONNX neural speech synthesizer with auto-model download
├── aligner.py             # Whispersync sentence & word forced-alignment timestamp generator
├── transcoder.py          # FFmpeg HLS VOD segmenter (.m3u8 playlist + 6s .ts chunks)
├── uploader.js            # Hetzner S3 uploader & MongoDB database linker
├── run_full_pipeline.py   # Master single CLI orchestration entrypoint
└── README.md              # Documentation & usage guide
```

---

## 🚀 3. Usage & CLI Commands

### 3.1 Run Full Pipeline for a Book (All Chapters)
```bash
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug the-strange-case-of-dr-jekyll-and-mr-hyde \
  --voice am_adam \
  --speed 1.0 \
  --upload \
  --hls
```

### 3.2 Test Single Chapter Synthesis (No S3 Upload)
```bash
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug the-strange-case-of-dr-jekyll-and-mr-hyde \
  --voice am_adam \
  --limit 1 \
  --no-upload
```

### 3.3 Test Text Cleaning & Deduplication Standalone
```bash
python3 backend/audio_pipeline/cleaner.py
```

---

## 🧹 4. Text Sanitization Rules

| Input Pattern | Action / Transformation | Reason |
| :--- | :--- | :--- |
| `Title \n\n Title` | Deduplicated to single `Chapter X. Title.` | Eliminates duplicate chapter title narration |
| `*text*` or `**text**` | Stripped to `text` | Prevents TTS from pronouncing "asterisk" or making click sounds |
| `_text_` or `__text__` | Stripped to `text` | Removes markdown emphasis formatting |
| `Header # Title` | Stripped to `Title` | Removes markdown header symbols |
| `Word1—Word2` (Em-dash) | Replaced with `Word1, Word2` | Creates natural speech pauses |
| `“Smart Quotes”` | Replaced with `"Standard Quotes"` | Standardizes quote parsing |
| `&` / `@` | Replaced with `and` / `at` | Pronounces symbols cleanly |
| `\u2060` (Zero-width space) | Removed | Eliminates invisible unicode artifacts |

---

## 🗄️ 5. Hetzner S3 & Database Output Scheme

- **S3 Bucket**: `multicamp-prod-storage`
- **S3 Audio Prefix**: `Liiro-Ebook-Prod/audio/:slug/voices/:voice/chapter_:number.mp3`
- **S3 HLS Prefix**: `Liiro-Ebook-Prod/hls/:slug/voices/:voice/chapter_:number/playlist.m3u8`
- **MongoDB Collection**: `liiro_prod.storychapters`

```json
{
  "audioUrl": "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/the-strange-case-of-dr-jekyll-and-mr-hyde/voices/adam/chapter_1.mp3",
  "audioVoices": {
    "defaultVoiceId": "adam",
    "adam": "https://multicamp-prod-storage.nbg1.your-objectstorage.com/...",
    "voices": [
      { "id": "am_adam", "key": "adam", "name": "Adam (US Male)", "url": "https://..." }
    ]
  },
  "totalDurationSeconds": 605,
  "timestamps": [
    { "sentenceIndex": 0, "text": "Chapter 1. Story of the Door.", "startSec": 0.0, "endSec": 2.4 }
  ]
}
```
