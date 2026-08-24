# 🎙️ Custom Voice Creation & Voice Cloning Guide

> **Single Source of Truth** for Creating Custom AI Voices, Voice Blending, and Zero-Shot Voice Cloning  
> **Path**: `backend/audio_pipeline/clone_voice.py`  
> **Updated**: August 24, 2026  

---

## 🎯 1. Overview of Custom Voice Options

Liiro Ebook supports two methods for adding custom narrator voices to your platform:

1. **Voice Blending (Instant Hybrid Voices)**:
   * Combine two existing high-fidelity voices with custom ratio weights (e.g. 60% Adam + 40% Michael = Custom Mystic Narrator).
   * **Setup Time**: Instant (0 seconds).

2. **Zero-Shot Voice Cloning (From 10–30s Audio Recording)**:
   * Record a clean 10–30 second `.wav` audio sample of your own voice or any speaker's voice.
   * Extract the vocal timbre embedding vector and use it to narrate full ebooks.
   * **Setup Time**: ~5 seconds.

---

## 🚀 2. Method 1: Creating a Custom Voice Blend

To create a new hybrid narrator voice by blending existing voice embeddings:

```bash
python3 backend/audio_pipeline/clone_voice.py \
  --mode blend \
  --name custom_mystic_narrator \
  --voice-a am_adam \
  --voice-b am_michael \
  --weight 0.6
```

---

## 🎙️ 3. Method 2: Zero-Shot Voice Cloning from Audio (.wav)

To clone a custom voice from a clean 10–30s audio recording of your voice:

```bash
# 1. Place your 10-30s clean WAV recording in /tmp/my_voice.wav
# 2. Run the voice cloner CLI:
python3 backend/audio_pipeline/clone_voice.py \
  --mode clone \
  --name my_custom_voice \
  --wav-sample /tmp/my_voice.wav
```

---

## 📚 4. Synthesizing Ebooks with Your Custom Voice

Once your custom voice is created, generate audiobooks with it using `run_full_pipeline.py`:

```bash
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug the-strange-case-of-dr-jekyll-and-mr-hyde \
  --voice custom_mystic_narrator \
  --upload \
  --hls
```

---

## 🗄️ 5. Custom Voice File Structure

Custom voice embeddings and metadata are stored in `backend/audio_pipeline/custom_voices/`:

```
backend/audio_pipeline/custom_voices/
├── custom_mystic_narrator.json   # Blended voice configuration
├── my_custom_voice.json          # Cloned voice metadata
└── my_custom_voice.bin           # 512-dim voice style embedding vector
```
