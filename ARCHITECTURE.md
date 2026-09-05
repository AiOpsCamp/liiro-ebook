# 🏛️ Liiro Ebook & Audiobooks: Master System Architecture Specification

> **Single Source of Truth** for System Topology, Data Models, Storage, Pipelines, Security, Admin CMS, Reading Goals, Bookshelves, and Microservices  
> **Platform**: Liiro Ebook & Audiobook Platform  
> **Repository**: [`github.com/AiOpsCamp/liiro-ebook`](https://github.com/AiOpsCamp/liiro-ebook)  
> **Database**: `liiro_prod` (MongoDB on Hetzner K3s — 1,405 Stories / 39,271 Chapters)  
> **Updated**: September 2026  

---

## 🎯 1. High-Level System Topology

```mermaid
flowchart TD
    subgraph Client Layer
        Web[Expo Web / PWA - Port 8086]
        AdminWeb[Admin CMS Dashboard - /admin]
        iOS[iOS Native App]
        Android[Android Native App]
        OPDS[OPDS 2.0 E-Readers]
    end

    subgraph API Gateway & Ingress Layer
        Traefik[K3s Traefik Ingress / Nginx]
        RateLimiter[User-Aware Rate Limiter]
        PinoLogger[Pino JSON Request Logger & x-request-id]
        QuotaGuard[Quota & Billing Enforcement Guard - HTTP 402]
        AdminGuard[Admin Security Guard - x-admin-key / Role]
        AuthGuard[JWT & Google Auth / Firebase Guard]
    end

    subgraph Backend Microservice - Port 5012
        AdminService[Admin CMS Catalog & Metadata Engine]
        CatalogService[Story Catalog & Metadata Service]
        WhispersyncService[Whispersync Bi-directional Alignment]
        ReadingGoalService[Annual Reading Goal & Pace Engine]
        ShelvesService[Custom Bookshelves & Collections Engine]
        QuotesService[Curated Quotes & Social Share Engine]
        ReelsService[TikTok-Style Video Reels Engine]
        DRMSigner[DRM HMAC-SHA256 2h Stream Signer]
        HLSTranscoder[FFmpeg 6s MPEG-TS HLS Transcoder]
        VectorEngine[TF-IDF Cosine Similarity Vector Search]
        SwaggerEngine[OpenAPI 3.0 & Swagger UI - /api-docs/]
    end

    subgraph Storage & Infrastructure Layer
        HetznerMongo[(MongoDB liiro_prod - 3-Node Replica Set)]
        RedisCluster[(Redis BullMQ & CacheManager)]
        HetznerS3[(Hetzner S3 CDN - multicamp-prod-storage)]
    end

    subgraph Offline & Neural Audio Engine
        KokoroEngine[Kokoro ONNX v1.0 Neural TTS Engine]
        WhisperAligner[OpenAI Whisper Forced Aligner]
        SmartRunner[Subprocess-Isolated Multi-Voice Series Runner]
    end

    Client Layer -->|HTTPS / REST| Traefik
    Traefik --> RateLimiter --> PinoLogger --> AuthGuard --> AdminGuard --> QuotaGuard
    AdminGuard --> AdminService
    QuotaGuard --> Backend Microservice
    Backend Microservice -->|Mongoose Queries| HetznerMongo
    Backend Microservice -->|ioredis / Cache| RedisCluster
    Backend Microservice -->|Pre-signed Signed URLs| HetznerS3
    SmartRunner --> KokoroEngine --> WhisperAligner --> HetznerS3
    SmartRunner --> HetznerMongo
```

---

## 🛰️ 2. Infrastructure & Service Endpoints

| Service Component | Environment / Host | Port / Protocol | Connection / Access Details |
| :--- | :--- | :--- | :--- |
| **Backend API** | Node.js Express (Standalone) | `5012` (HTTP) | Local: `http://localhost:5012/api/v1` |
| **Swagger UI Docs** | Interactive OpenAPI 3.0 | `5012` (HTTP) | Spec: `http://localhost:5012/api-docs/` |
| **Admin CMS UI** | Web Admin Dashboard | `8086` (HTTP) | Local: `http://localhost:8086/admin` |
| **Frontend Web** | Expo React Native Web | `8086` (HTTP) | Local: `http://localhost:8086` |
| **Bookshelves Route** | Custom Shelves Feed | `8086` (HTTP) | Local: `http://localhost:8086/shelves` |
| **Quotes Route** | Social Quotes Feed | `8086` (HTTP) | Local: `http://localhost:8086/quotes` |
| **Production DB** | Hetzner K3s Master (`46.224.188.251`) | `27017` (MongoDB) | `mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin` |
| **Production S3** | Hetzner Object Storage (`nbg1`) | `443` (HTTPS) | Bucket: `multicamp-prod-storage` / Prefix: `LangoReads-Prod/` |
| **Redis Queue** | Redis 7.0 (BullMQ & Cache) | `6379` (TCP) | Multi-pod shared state with in-memory fallback |

---

## 🛡️ 3. Admin CMS Catalog & Metadata Engine

### Security & Ingress Guard (`backend/src/middlewares/adminMiddleware.js`)
* Enforces `x-admin-key: LIIRO_ADMIN_SECRET_2026` or verified JWT `role === 'admin'`.
* Rejects unauthorized callers with HTTP `403 Forbidden`.

### API Endpoints (`/api/v1/admin`)
* `GET /api/v1/admin/stats`: Real-time KPI overview (Total Catalog: 1,405 Books, 39k+ Chapters, Audio Ready Count, Featured Count).
* `GET /api/v1/admin/stories`: Multi-filter paginated catalog search with Category, Audio Status, and Featured Status filters.
* `PATCH /api/v1/admin/stories/:id/toggle-feature`: Instant toggle of `isFeatured` flag for dashboard carousel showcasing.
* `PATCH /api/v1/admin/stories/:id/metadata`: Modify book Author Name, Category, CEFR Difficulty Level, Publication status, or Synopsis.
* `GET /api/v1/admin/stories/:id/chapters`: Inspect all chapters, duration, and audio alignment URLs for quality assurance.

### Admin CMS UI Dashboard ([`frontend/app/admin/index.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/admin/index.tsx))
* 4 KPI metric cards with live counts.
* Real-time search & interactive filter pills.
* One-tap `⭐ Featured` toggle switch with instant optimistic updates.
* Modal form to update metadata, category pills, and publication status.

---

## 🎯 4. Goodreads-Style Annual Reading Challenge & Pace Engine

### Architecture & Data Model (`backend/src/models/ReadingGoal.model.js`)
* **Fields**: `userId`, `year`, `targetBooks` (default: 25), `completedMinutes`, `completedBooks: [{ storyId, slug, title, coverImageUrl, authorName, completedAt }]`.
* **API Endpoints** (`/api/v1/goals`):
  * `GET /api/v1/goals/current`: Returns goal progress, completion percentage, remaining books, pace status, and finished books.
  * `PATCH /api/v1/goals/target`: Updates target book challenge count with dynamic presets (12, 25, 52, 100 books).
  * `POST /api/v1/goals/log-completed`: Logs completed book to the active challenge.

---

## 📚 5. Custom Bookshelves & Collections Engine

### Architecture & Data Model (`backend/src/models/UserCollection.model.js`)
* **Built-in System Shelves**: `Currently Reading`, `Want to Read`, `Favorites`.
* **Custom Shelves**: Unlimited user-created shelves with custom color palettes and icons.
* **REST API Endpoints** (`/api/v1/collections`):
  * `GET /api/v1/collections`, `GET /api/v1/collections/slug/:slug`, `POST /api/v1/collections`, `POST /api/v1/collections/:id/stories`.

---

## 🔐 6. Security, Compliance & Quota Enforcement

### 1. Billing Quota Enforcement (`src/middlewares/quotaMiddleware.js`)
* 20 hours/month for Basic tier, 100 hours/month for Premium tier (HTTP 402 on excess).

### 2. GDPR Right to Erasure (`DELETE /api/v1/auth/account`)
* Cascade deletion across 10 MongoDB collections.

---

## 🎙️ 7. Neural Audiobook Engine & Multi-Voice Pipeline

```mermaid
graph TD
    A[Smart Master Runner: queue_smart_multivoice_runner.py] -->|Inspects Genre & Period| B{Select Best Voice}
    B -->|British Mystery / Period Drama| V1[Lewis - bm_lewis]
    B -->|Children Classics / Warm Tone| V2[Heart - af_heart]
    B -->|Sci-Fi / Space Opera| V3[Adam - am_adam]
    B -->|Victorian Romance / Drama| V4[Emma - bf_emma]
    B -->|Adventure / Victorian Travel| V5[George - bm_george]
    
    A -->|Spawns Subprocess per Book| C[generate_audio_single_master.py]
    C -->|6 Parallel Worker Threads| D[Kokoro ONNX v1.0 Neural TTS]
    D -->|Sentence Timestamps| E[OpenAI Whisper Aligner]
    D -->|FFmpeg 64k Standard MP3| F[Hetzner S3 CDN Upload]
    F --> G[(Hetzner MongoDB liiro_prod)]
    C -->|Subprocess Terminates| H[100% Kernel RAM Recovery]
```

---

## 🧪 8. Testing, CI/CD & Observability

### Automated Test Architecture
* **Framework**: Native Node.js Test Runner + **Supertest** (`backend/tests/api_integration_suite.test.js`).
* **Execution**: `npm test` runs in under **2.5 seconds** with **100% pass rate** across 6 critical suites.

---

## 📁 9. Architecture Documentation Sitemap

| Document | Purpose |
| :--- | :--- |
| 📖 [**`CLAUDE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/CLAUDE.md) | Primary AI agent operating handbook and quick reference guide. |
| 📊 [**`PRODUCT_AUDIT.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/PRODUCT_AUDIT.md) | Production readiness audit, scorecard (100/100), and completed feature matrix. |
| 🗺️ [**`ROADMAP.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/ROADMAP.md) | Engineering roadmap across backend phases (1–10) and frontend phases (1–8). |
| 🧪 [**`backend/docs/TEST_SUITE_GUIDE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/docs/TEST_SUITE_GUIDE.md) | Complete guide for `npm test` Supertest suite and smoke testing scripts. |
| 🎙️ [**`backend/docs/SERIES_AUDIO_GENERATION_GUIDE.md`**](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/docs/SERIES_AUDIO_GENERATION_GUIDE.md) | Audio generation scorecard and Kokoro pipeline architecture. |
| 📑 [**`backend/src/docs/swaggerSpec.js`**](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/docs/swaggerSpec.js) | Complete OpenAPI 3.0 specification for 42+ endpoints. |
