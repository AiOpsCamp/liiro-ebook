# 🏛️ Liiro Ebook & Audiobooks: System Architecture Master Specification

> **Single Source of Truth** for System Topology, Data Models, Storage, and Microservices  
> **Repository**: [`github.com/AiOpsCamp/liiro-ebook`](https://github.com/AiOpsCamp/liiro-ebook)  
> **Updated**: August 24, 2026  

---

## 🎯 1. System Overview & Core Philosophy

**Liiro Ebook** is a modern, standalone microservice platform for digital ebook reading and audiobook streaming. It is designed with a strict decoupled microservices architecture:

```mermaid
flowchart TD
    subgraph Frontend Client App
        A[Expo React Native / Web App - Port 8086]
        A1[Root Navigation Guard]
        A2[Reader & Audio Player UX]
    end

    subgraph Backend Microservice
        B[Node.js / Express API - Port 5012]
        B1[Auth & Security Middleware]
        B2[DRM Stream Token Engine]
        B3[Whispersync Engine]
        B4[HLS Audio Transcoder Engine]
        B5[CacheManager Layer]
    end

    subgraph Storage & Infrastructure Layer
        DB[(MongoDB liiro_prod - Hetzner K3s Master)]
        S3[(Hetzner S3 - multicamp-prod-storage)]
    end

    A -->|REST API & JWT| B
    B -->|Mongoose Queries| DB
    B -->|AWS S3 SDK| S3
```

---

## 🛰️ 2. Infrastructure & Environment Topology

| Service Component | Environment / Host | Port / Protocol | Connection Details |
| :--- | :--- | :--- | :--- |
| **Backend API** | Standalone Node.js Express | `5012` (HTTP) | Local: `http://localhost:5012/api/v1` |
| **Frontend Web** | Expo Metro Web Server | `8086` (HTTP) | Local: `http://localhost:8086` |
| **Production DB** | Hetzner K3s Master (`46.224.188.251`) | `27017` (MongoDB Wire) | `mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin` |
| **Production S3** | Hetzner Object Storage (`nbg1`) | `443` (HTTPS) | Bucket: `multicamp-prod-storage` / Prefix: `Liiro-Ebook-Prod/` |

---

## 📚 3. Architecture Documentation Sitemap

Detailed, deep-dive architectural specifications for individual sub-systems are maintained in dedicated documents:

- ⚙️ [**`docs/BACKEND_ARCHITECTURE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/BACKEND_ARCHITECTURE.md): Complete backend models, controllers, DRM stream token engine, Whispersync position engine, HLS audio transcoder, caching, and infrastructure topology.
- 🎨 [**`docs/FRONTEND_ARCHITECTURE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/FRONTEND_ARCHITECTURE.md): Complete frontend UI screens, Expo Router structure, reader engines, cross-platform audio handling, state management, and offline storage.
- 🎙️ [**`backend/audio_pipeline/README.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/audio_pipeline/README.md): Standalone audio generation pipeline, text cleaner, header deduplicator, Kokoro ONNX speech engine, Whispersync timestamp aligner, HLS transcoder, and S3 uploader.
- 🎭 [**`docs/MULTI_VOICE_GUIDE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/MULTI_VOICE_GUIDE.md): 11+ AI narrator voice profiles, Hetzner S3 voice storage layout, `audioVoices` MongoDB schema, and UI voice switcher modal.
- 🧬 [**`docs/CUSTOM_VOICE_CLONING_GUIDE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/CUSTOM_VOICE_CLONING_GUIDE.md): Custom voice creation, voice embedding ratio blending, and zero-shot voice cloning from 10–30s WAV audio recordings.
- 🔭 [**`docs/FUTURE_ENHANCEMENTS.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/FUTURE_ENHANCEMENTS.md): Gap analysis and recommended next-tier power extensions (BullMQ queues, EPUB exporter, WebSockets Whispersync, CarPlay, custom fonts).

- ⚡ [**`docs/BULLMQ_REDIS_K8S_GUIDE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/BULLMQ_REDIS_K8S_GUIDE.md): BullMQ Redis distributed queue migration, standalone worker pod architecture, and Kubernetes (k8s) manifests.
- 🌩️ [**`docs/HETZNER_AUDIO_GENERATION_GUIDE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/HETZNER_AUDIO_GENERATION_GUIDE.md): Guide for running audio generation directly on Hetzner Cloud Servers (`46.224.188.251`) and K8s Worker Pods.

---

## 📊 4. Master Feature Status Matrix

| System Module | Feature | Implementation Status | Primary Files |
| :--- | :--- | :--- | :--- |
| **Backend Auth** | JWT Authentication & Optional Auth | ✅ **100% Implemented** | `src/middlewares/authMiddleware.js` |
| **Backend Security**| DRM HMAC 2-Hour Stream Tokens | ✅ **100% Implemented** | `src/services/s3Signer.service.js` |
| **Backend Sync** | Whispersync Bi-Directional Position Engine | ✅ **100% Implemented** | `src/services/whispersync.service.js` |
| **Backend Queue** | BullMQ + Redis Distributed Worker Queue | ✅ **100% Implemented** | `src/queues/audioQueue.js`, `src/workers/audioWorker.js` |
| **Backend K8s** | Kubernetes Redis & Worker Manifests + HPA | ✅ **100% Implemented** | `k8s/redis-deployment.yaml`, `k8s/worker-deployment.yaml` |
| **Backend Streaming**| HLS Transcoding (.m3u8 + 6s .ts chunks) | ✅ **100% Implemented** | `src/services/hlsTranscoder.service.js` |
| **Backend AI** | Vector Search & Recommendation Engine | ✅ **100% Implemented** | `src/services/vectorSearch.service.js` |
| **Backend Feed** | OPDS 2.0 Open Publication Catalog Feed | ✅ **100% Implemented** | `src/services/opds.service.js` |
| **Backend Billing** | Stripe & RevenueCat Webhook Listener | ✅ **100% Implemented** | `src/controllers/billing.controller.js` |
| **Backend Queue** | Background Audio Queue Worker Manager | ✅ **100% Implemented** | `src/queues/audioQueue.js` |
| **Backend Pipeline**| Text Cleaner & Header Deduplicator | ✅ **100% Implemented** | `audio_pipeline/cleaner.py` |
| **Backend TTS** | Kokoro ONNX Speech Synthesizer | ✅ **100% Implemented** | `audio_pipeline/synthesizer.py` |
| **Backend Cloner**| Custom Voice Blender & Zero-Shot Cloner | ✅ **100% Implemented** | `audio_pipeline/clone_voice.py` |
| **Backend Caching** | CacheManager (300s TTL) & Compound Indexes | ✅ **100% Implemented** | `src/utils/cache.utils.js` |
| **Frontend Auth** | Rebranded Liiro EBOOK Login/Register | ✅ **100% Implemented** | `app/(auth)/login.tsx`, `register.tsx` |
| **Frontend Guard** | Root Navigation Guard & Protection | ✅ **100% Implemented** | `app/_layout.tsx` |
| **Frontend Nav** | Single-Row Navbar & Pinned Profile | ✅ **100% Implemented** | `components/ebook/EbookDashboardContent.tsx` |
| **Frontend Audio** | Native `expo-audio` Cross-Platform Engine | ✅ **100% Implemented** | `lib/utils/audioManager.ts` |
| **Frontend DRM** | DRM Stream Token RTK Query Integration | ✅ **100% Implemented** | `api/storiesQuery.ts` |
| **Frontend Sync** | Whispersync Auto-Resume Modal & 10s Sync | ✅ **100% Implemented** | `components/ebook/WhispersyncPromptModal.tsx` |
| **Frontend Offline**| Local Chapter & Audio Downloader | ✅ **100% Implemented** | `services/offlineManager.ts` |
| **Frontend Refactor**| Decomposed Reader Sub-Components | ✅ **100% Implemented** | `components/ebook/read/` |
