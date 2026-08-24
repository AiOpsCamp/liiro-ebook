# 🎙️ Liiro Ebook Multi-Voice Synthesis & Narrator Guide

> **Single Source of Truth** for Multi-Voice Audio Generation, Voice Key Mappings, and Frontend Narrator Switcher  
> **Updated**: August 24, 2026  

---

## 🎭 1. Supported Kokoro ONNX Narrator Voices

Liiro Ebook supports **11+ high-fidelity AI narrator voices** across American English (US) and British English (UK):

| Voice Key | Spoken Name | Accent & Gender | Recommended Genre / Character Tone |
| :--- | :--- | :--- | :--- |
| `am_adam` | **Adam** | US Male | Classic, authoritative, deep thriller & mystery (Default) |
| `af_heart` | **Heart** | US Female | Warm, expressive, clear storytelling & romance |
| `am_michael` | **Michael** | US Male | Conversational, modern, non-fiction & adventure |
| `af_bella` | **Bella** | US Female | Soft, articulate, intimate reading & poetry |
| `af_nicole` | **Nicole** | US Female | Crisp, professional, drama & fiction |
| `af_sarah` | **Sarah** | US Female | Energetic, engaging, young adult & fable |
| `bf_emma` | **Emma** | UK Female | British English, sophisticated, classic literature |
| `bf_isabella` | **Isabella** | UK Female | British English, elegant & historical fiction |
| `bm_george` | **George** | UK Male | British English, theatrical & classic gothic |
| `bm_lewis` | **Lewis** | UK Male | British English, scholarly & historical non-fiction |
| `am_echo` | **Echo** | US Male | Dramatic, cinematic tone |

---

## 🚀 2. Generating a Book with a New Voice

To generate an audiobook using a new voice, invoke `run_full_pipeline.py` with the `--voice` flag:

```bash
# 1. Generate full book with 'af_heart' (US Female)
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug the-strange-case-of-dr-jekyll-and-mr-hyde \
  --voice af_heart \
  --upload \
  --hls

# 2. Generate full book with 'bm_george' (UK Male)
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug the-strange-case-of-dr-jekyll-and-mr-hyde \
  --voice bm_george \
  --upload \
  --hls
```

---

## 🗄️ 3. Multi-Voice Database & S3 Storage Layout

### Hetzner S3 Bucket Layout
When multiple voices are generated for a story, assets are organized under dedicated voice sub-folders:

```
multicamp-prod-storage/
└── Liiro-Ebook-Prod/
    └── audio/
        └── :slug/
            └── voices/
                ├── adam/
                │   ├── chapter_1.mp3
                │   └── chapter_2.mp3
                ├── heart/
                │   ├── chapter_1.mp3
                │   └── chapter_2.mp3
                └── george/
                    ├── chapter_1.mp3
                    └── chapter_2.mp3
```

### MongoDB Chapter Document Scheme (`audioVoices`)
```json
{
  "audioVoices": {
    "defaultVoiceId": "adam",
    "adam": "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/the-strange-case-of-dr-jekyll-and-mr-hyde/voices/adam/chapter_1.mp3",
    "heart": "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/the-strange-case-of-dr-jekyll-and-mr-hyde/voices/heart/chapter_1.mp3",
    "voices": [
      { "id": "am_adam", "key": "adam", "name": "Adam (US Male)", "url": "https://..." },
      { "id": "af_heart", "key": "heart", "name": "Heart (US Female)", "url": "https://..." }
    ]
  }
}
```

---

## 🎨 4. Switching Voices in the Web & Mobile UI

1. Open any book in the Reader: `http://localhost:8086/read/:slug?audio=true&lang=en`.
2. Click the **Voice Badge / Audio Settings** button on the bottom audio player bar.
3. Select any available voice from the **Voice Selector Modal**.
4. Playback seamlessly switches to the DRM-signed stream URL of your chosen narrator!
