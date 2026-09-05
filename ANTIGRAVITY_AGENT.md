# 🤖 Antigravity AI Agent — Master Knowledge Base & Context Revival Guide

> **Project Name**: Liiro Ebook & Audiobooks (`liiro-ebook`)  
> **Repository**: [`https://github.com/AiOpsCamp/liiro-ebook`](file:///Users/humayunrashid/multicamp/liiro-ebook)  
> **Primary Purpose**: Production-ready, cross-platform digital ebook reading and AI-narrated audiobook listening platform with Whispersync real-time sentence highlighting.  
> **Last Knowledge Sync**: August 26, 2026  

---

## 1. Quick Start & Context Revival Protocol

Whenever a new agent session starts or context is reset, **read this file immediately**. It contains the complete state of the codebase, credentials, running background tasks, database connections, and operational directives.

### Active Ports & Local Infrastructure
- **Backend API**: `http://localhost:5012` (`node server.js`)
- **Backend Health Check**: [`http://localhost:5012/health`](http://localhost:5012/health) (`{"status":"healthy","dbConnected":true}`)
- **Frontend Expo Web**: `http://localhost:8086` (`npx expo start --web --port 8086`)
- **MongoDB Production Tunnel**: `127.0.0.1:27017` → Hetzner K3s (`46.224.188.251:27017`) database `liiro_prod`
- **Hetzner Object Storage (S3)**: `https://nbg1.your-objectstorage.com` (Bucket: `multicamp-prod-storage`)

---

## 2. Clickable Codebase Sitemap & Key Files

### Backend Architecture ([`backend/`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend))
- [`backend/server.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/server.js): Entry point, Express middleware setup, trust proxy, routes mount.
- [`backend/.env`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/.env): Environment variables, MongoDB URI, Hetzner S3 keys, JWT secret.
- [`backend/src/models/Story.model.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/models/Story.model.js): Master story model with compound indexes, `$text` search index, and feature availability flags (`hasGoodreadsReviews`, `hasSparks`, `hasQuotes`, `hasReels`, `hasAudio`).
- [`backend/src/models/StoryChapter.model.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/models/StoryChapter.model.js): Chapter paragraphs, audio URLs, Whisper alignment timestamps.
- [`backend/src/controllers/story.controller.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/controllers/story.controller.js): Dashboard slates, catalog queries, search, DRM pre-signed stream tokens, vector recommendations, and dynamic feature flag mapping.
- [`backend/src/controllers/audio.controller.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/controllers/audio.controller.js): Whispersync position sync, audio stream signing.
- [`backend/src/middlewares/authMiddleware.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/middlewares/authMiddleware.js): `authenticate` (JWT decoding) and `optionalAuth` (JWT + `x-guest-id` fallback).
- [`backend/scripts/ingest_standard_ebook.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js): Zero-loss ingestion engine parsing `sparks.json`, `reviews.json`, `quotes.json`, `reels.json` directly from local repo source folders.
- [`backend/scripts/generate_and_align_ebook_audio.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_and_align_ebook_audio.py): Kokoro TTS + OpenAI Whisper sentence aligner pipeline (non-baked clean narration).
- [`backend/tests/smoke_api_suite.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/tests/smoke_api_suite.js): 30/30 multi-scenario integration and security test suite (Passes 100%).

### Frontend Architecture ([`frontend/`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend))
- [`frontend/app/_layout.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/_layout.tsx): Root Expo Router layout, font preloading, theme provider.
- [`frontend/app/index.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/index.tsx): Main entry routing to `EbookDashboardContent`.
- [`frontend/components/ebook/EbookDashboardContent.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/components/ebook/EbookDashboardContent.tsx): Home dashboard, hero banner, responsive header, carousels.
- [`frontend/components/ebook/ProfileNavbarMenu.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/components/ebook/ProfileNavbarMenu.tsx): Responsive profile trigger menu (collapses to circular avatar on mobile `< 640px`).
- [`frontend/components/ebook/StoryCard.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/components/ebook/StoryCard.tsx): Cover card with prominent **`🎧 AUDIOBOOK`** / **`📖 EBOOK`** badges & clean author names.
- [`frontend/components/ebook/read/EbookReadContent.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/components/ebook/read/EbookReadContent.tsx): Decomposed ebook reader view with 8 themes, 5 ambient soundscapes, font controls, and karaoke highlights.
- [`frontend/lib/utils/audioManager.ts`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/lib/utils/audioManager.ts): Cross-platform audio engine (`playAudio`, `playAudioSequence`, MediaSession CarPlay integration).
- [`frontend/utils/getLocalizedText.ts`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/utils/getLocalizedText.ts): Multilingual text resolver with 24-character hex ObjectId filtering.

### Key Documentation Files ([`docs/`](file:///Users/humayunrashid/multicamp/liiro-ebook/docs))
- [`ROADMAP.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/ROADMAP.md): Master development checklist (Phases 1 to 7 backend & frontend).
- [`docs/PRODUCTION_TODO.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/PRODUCTION_TODO.md): Prioritized P0/P1/P2 production readiness audit.
- [`backend/docs/USER_FLOW_AND_EXPERIENCE_GUIDE.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/docs/USER_FLOW_AND_EXPERIENCE_GUIDE.md): End-to-end user journey & feature breakdown guide.
- [`backend/docs/AUDIO_ENGINE_ARCHITECTURE.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/docs/AUDIO_ENGINE_ARCHITECTURE.md): Kokoro TTS, Whisper alignment, HLS transcode, signature chime guide.
- [`backend/docs/TEST_SUITE_GUIDE.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/docs/TEST_SUITE_GUIDE.md): 30-scenario test suite documentation.

---

## 3. Strict Operating Directives & Guidelines

1. **User Persona & Communication**:
   - Address the user as **"ব্রো" (Bro)** at all times.
   - Assistant identity is **"Li" (লি)**, dedicated coding agent.
   - All chat responses MUST be written in natural **Bengali script (বাংলা লিপি)**.
2. **Documentation Language**:
   - All markdown documentation files (`.md`) MUST be written in **English**.
3. **Database Connection Rule (STRICT)**:
   - Connect strictly to Hetzner Production MongoDB (`liiro_prod`) via persistent SSH tunnel (`127.0.0.1:27017`).
4. **Separate Audio Architecture Rule**:
   - Never bake intro billboards into S3 MP3 chapter files. Keep MP3s pure for 100% 1:1 Whispersync timestamp alignment.
   - Frontend `audioManager.ts` handles initial chime (`liiro_signature_chime.mp3`) and spoken intro sequence dynamically via `playAudioSequence()`.
5. **No Guessing / Inspect Logs First**:
   - Never hypothesize error causes without inspecting exact un-truncated log files.
   - Always run verification tests (`node tests/smoke_api_suite.js`) before declaring success.

---

## 4. How to Execute Common Commands

### Run Integration Test Suite (100% Target)
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend
node tests/smoke_api_suite.js
```

### Check Backend Health & DB Tunnel
```bash
curl -s http://localhost:5012/health
```

### Restart Backend Server
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend
node server.js
```

### Download / Resume Catalog Ingestion (1,513 Repos)
```bash
PYTHONUNBUFFERED=1 python3 scripts/download_all_1500_sources.py
```

---

## 5. Next Immediate Roadmap Tasks

Check [`docs/PRODUCTION_TODO.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/PRODUCTION_TODO.md) for current priority work:
1. **`SEC-01`**: Secrets rotation and K8s Sealed Secrets configuration.
2. **`SEC-05`**: Migrate `CacheManager` (`src/utils/cache.utils.js`) from Node in-memory store to shared Redis cluster backend.
3. **`FEAT-02`**: Listening Quota Enforcement Middleware (`billingGuard`) enforcing 20h/100h tier limits with 402 Payment Required response.
