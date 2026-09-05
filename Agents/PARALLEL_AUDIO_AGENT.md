# 🎙️ Parallel Audio Generation Agent — Operational Specification & Full Context

> **Agent Name**: `Parallel_Audio_Agent`  
> **Role**: Neural TTS Audio Synthesis, Multi-Process Parallel Execution, Chapter Filtering, S3 Upload, MongoDB Linking & Whispersync Aligner  
> **Primary Script**: [`backend/scripts/generate_audio_parallel_master.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_parallel_master.py)  
> **Single Aligner Script**: [`backend/scripts/generate_and_align_ebook_audio.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_and_align_ebook_audio.py)  
> **Python Environment**: `/Users/humayunrashid/multicamp/.venv/bin/python`  
> **Target Database**: `liiro_prod` (`mongodb://127.0.0.1:27017/liiro_prod`)

---

## 1. Context & Responsibilities

The `Parallel_Audio_Agent` handles multi-process neural speech synthesis using the **Kokoro ONNX TTS engine** and generates Whispersync sentence-level timestamp alignments using **OpenAI Whisper**.

### Core Objectives:
1. **Multi-Process CPU Workers (`--workers N`)**:
   - Runs `ProcessPoolExecutor` with multiple worker processes for 4x to 8x real-time speedup.
2. **Chapter Filtering Options**:
   - `--ch1-only`: Generates audio ONLY for Chapter 1.
   - `--chapters 1,2,3` or `--chapters 1-5`: Generates audio ONLY for specified chapters or ranges.
   - `--all` (default): Generates audio for all chapters.
3. **Immediate Per-Chapter Process-Upload-Link Protocol**:
   - As soon as ANY individual chapter completes:
     a) Uploads synthesized MP3 directly to Hetzner S3 CDN (`LangoReads-Prod/ebooks/<slug>/voices/<voice>/low/chapter_<N>.mp3`).
     b) Updates `storychapters` document in MongoDB with `audioUrl`, `audioBitrates`, and `durationSeconds`.
     c) Updates `stories` document in MongoDB with `hasAudio: true`, `isAudiobook: true`, `availableVoices: ["michael"]`, `contentType: "both"`.
     d) The story becomes active and playable on the UI without waiting for remaining chapters!
4. **Title Duplication Prevention**:
   - Normalizes curly apostrophes (`’` $\rightarrow$ `'`) and quotes (`“` / `”` $\rightarrow$ `"`) prior to regex title matching.
   - Strips repeated chapter headers from text bodies so Kokoro TTS speaks the title **EXACTLY ONCE** in the introductory header.

---

## 2. CLI Execution Commands

```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# 1. Generate audio ONLY for Chapter 1
/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --ch1-only --voice michael

# 2. Generate audio for specific chapters (e.g., Chapters 1, 2, and 3)
/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --chapters 1,2,3 --voice michael

# 3. Generate audio for a range of chapters (e.g., Chapters 1 to 5)
/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --chapters 1-5 --voice michael

# 4. Full parallel synthesis for all chapters (using 4 CPU workers)
/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --workers 4 --voice michael

# 5. Force re-generation (bypass S3 HEAD idempotency check)
/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --ch1-only --voice michael --force
```

---

## 3. Error Handling & Recovery Protocols

- **Idempotency Resumption**:
  - The agent automatically checks Hetzner S3 and MongoDB before synthesizing. Existing chapters are skipped instantly.
- **FFmpeg Transcoding Failure**:
  - Ensure `ffmpeg` is available on system PATH (`/opt/homebrew/bin/ffmpeg` or `/usr/local/bin/ffmpeg`).
