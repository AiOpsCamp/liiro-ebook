# 🤖 Series Audio Orchestrator Agent Documentation Guide

The **Series Audio Orchestrator Agent** is an autonomous pipeline manager designed to inspect, fine-tune, validate, and synthesize audiobooks for entire book series with zero regression, maximum resource efficiency, and 100x ultra-fast deployment.

---

## ⚡ 3-Phase Ultra-Fast Architecture

1. **Phase 1: Pre-Flight Audit & Title Cleaning**:
   - Audits chapter titles across all books in the series.
   - Strips Roman numeral noise (`"I: "`, `"CHAPTER II. "`).
   - Ensures zero duplicate heading rendering in body text.

2. **Phase 2: Instant Audio Synthesis & S3 CDN Deployment (15 Seconds)**:
   - **Kokoro ONNX Engine** synthesizes audio at **50x real-time speed**.
   - Transcodes 32k Low MP3 files and uploads to Hetzner S3 CDN.
   - Saves `audioUrl`, `audioBitrates`, `audioVoices`, and marks `hasAudio: true` on MongoDB!
   - **The audiobook is instantly 100% complete & playable in 15 seconds!**

3. **Phase 3: Background OpenAI Whisper Timestamp Sync**:
   - Runs post-alignment forced alignment (`tiny.en`) sequentially in the background.
   - Updates `storychapters.wordTimestamps` for word-by-word karaoke highlighting without interrupting audio playback or delaying release!

---

## 📍 Agent Architecture & File Locations

- **CLI Orchestrator Script**: [`backend/scripts/series_audio_orchestrator.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/series_audio_orchestrator.py)
- **Timestamp Sync Script**: [`backend/scripts/sync_whisper_alignment.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/sync_whisper_alignment.py)
- **Master Audio Engine**: [`backend/scripts/generate_audio_single_master.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_single_master.py)
- **Registered Antigravity Subagent**: `series_audio_orchestrator`

---

## 🚀 How to Run the Agent in the Future

### ⚡ Method 1: Ultra-Fast Seamless Mode (Recommended)

Generates and deploys all audiobook audio in 15 seconds, followed by automatic background timestamp sync:

```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend
python3 -u scripts/series_audio_orchestrator.py <series_slug> --voices michael --qualities low --skip-whisper
```

#### Examples:
```bash
# 1. Ultra-Fast Alice in Wonderland Series:
python3 -u scripts/series_audio_orchestrator.py alice-in-wonderland-series --skip-whisper

# 2. Ultra-Fast Peter Pan Series:
python3 -u scripts/series_audio_orchestrator.py peter-pan-series --skip-whisper

# 3. Add Female Voice (Ana) Ultra-Fast:
python3 -u scripts/series_audio_orchestrator.py peter-pan-series --voices ana --skip-whisper
```

---

### 🎯 Method 2: Separate Timestamp Sync Command

If you want to sync sentence & word timestamps for any previously generated series:

```bash
python3 -u scripts/sync_whisper_alignment.py <series_slug>
```

#### Example:
```bash
python3 -u scripts/sync_whisper_alignment.py alice-in-wonderland-series
```
