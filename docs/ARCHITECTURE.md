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

- ⚙️ [**`docs/BACKEND_ARCHITECTURE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/BACKEND_ARCHITECTURE.md): Complete backend models, controllers, DRM stream token engine, Whispersync position engine, HLS audio transcoder, caching, and pending backend roadmap.
- 🎨 [**`docs/FRONTEND_ARCHITECTURE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/docs/FRONTEND_ARCHITECTURE.md): Complete frontend UI screens, Expo Router structure, reader engines, cross-platform audio handling, state management, and pending frontend roadmap.

---

## 📊 4. Master Feature Status Matrix

| System Module | Feature | Implementation Status | Primary Files |
| :--- | :--- | :--- | :--- |
| **Backend Auth** | JWT Authentication & Optional Auth | ✅ **Implemented** | `src/middlewares/authMiddleware.js` |
| **Backend Security**| DRM HMAC 2-Hour Stream Tokens | ✅ **Implemented** | `src/services/s3Signer.service.js` |
| **Backend Sync** | Whispersync Bi-Directional Position Engine | ✅ **Implemented** | `src/services/whispersync.service.js` |
| **Backend Streaming**| HLS Transcoding (.m3u8 + 6s .ts chunks) | ✅ **Implemented** | `src/services/hlsTranscoder.service.js` |
| **Backend DB** | Field Projections & Indexes | ✅ **Implemented** | `src/models/Story.model.js` |
| **Backend Caching** | CacheManager (300s TTL) | ✅ **Implemented** | `src/utils/cache.utils.js` |
| **Backend Worker** | BullMQ + Redis Background Queue | ⏳ **Planned** | `src/queues/` |
| **Backend AI** | Vector Search Recommendations | ⏳ **Planned** | `src/services/vectorSearch.service.js` |
| **Frontend Auth** | Rebranded Liiro EBOOK Login/Register | ✅ **Implemented** | `app/(auth)/login.tsx`, `register.tsx` |
| **Frontend Guard** | Root Navigation Guard & Protection | ✅ **Implemented** | `app/_layout.tsx` |
| **Frontend Nav** | Single-Row Navbar & Pinned Profile | ✅ **Implemented** | `components/ebook/EbookDashboardContent.tsx` |
| **Frontend Audio** | Native `expo-audio` Cross-Platform | ⏳ **Pending Integration** | `components/ebook/read/EbookReadContent.tsx` |
| **Frontend DRM** | Connect to Stream Token Endpoint | ⏳ **Pending Integration** | `api/storiesQuery.ts` |
| **Frontend Offline**| Local Chapter & Audio Downloader | ⏳ **Planned** | `services/offlineManager.ts` |
