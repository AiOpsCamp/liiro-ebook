# Liiro Ebook System Architecture

## Overview
**Liiro Ebook** is a standalone, full-stack application dedicated to digital ebook reading, multi-voice audiobooks, paragraph & word timestamp alignment, and curated classic literature taxonomies.

---

## High-Level Topology

```
┌─────────────────────────────────────────────────────────┐
│              Liiro Ebook Mobile / Web Client            │
│               (React Native / Expo Router)              │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP REST (Port 5012)
                             ▼
┌─────────────────────────────────────────────────────────┐
│             Liiro Ebook Backend Microservice            │
│                 (Express.js Node Server)                │
└────────────────────────────┬────────────────────────────┘
                             │  MongoDB Mongoose
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Dedicated Database: `liiro_prod`          │
│        (Stories, Chapters, Authors, Categories, Tags)   │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Organization

```
liiro-ebook/
├── frontend/               # Standalone React Native / Expo application
│   ├── app/                # Expo Router screens (details, reader, catalog)
│   ├── api/                # RTK Query API slice definitions
│   ├── components/         # Ebook reader engine, themes, audio player
│   └── lib/                # AudioManager & media helpers
├── backend/                # Decoupled Express.js REST API microservice
│   ├── src/models/         # Story, StoryChapter, UserStoryProgress models
│   ├── src/controllers/    # Story & metadata controllers
│   ├── src/routes/         # Endpoint definitions (/api/v1/stories)
│   └── server.js           # Server entrypoint on Port 5012
├── scripts/                # Database seeding, ingestion & audio alignment
│   ├── seed_liiro_prod_database.js
│   ├── ingest_complete_1000_standard_ebooks.js
│   ├── run_openai_whisper_alignment.py
│   └── generate_full_chapters_kokoro.py
└── docs/                   # Architectural & production documentation
    ├── ARCHITECTURE.md
    ├── API_DOCUMENTATION.md
    ├── DATABASE_GUIDE.md
    └── INGESTION_AND_AUDIO_PIPELINE.md
```
