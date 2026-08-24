# 📖 Liiro Ebook & Audiobooks: Development Roadmap & Task List

> **Repository**: `https://github.com/AiOpsCamp/liiro-ebook`  
> **Database**: `liiro_prod` (Hetzner K3s Cluster • 864 Stories / 26,914 Chapters)  
> **Storage**: Hetzner Object Storage (`multicamp-prod-storage` / `Liiro-Ebook-Prod/`)  

---

## ⚙️ Backend Engineering Task List (`backend/`)

### Phase 1: Security, Auth & Ingress Guards (High Priority)
- [x] **Enforce JWT Auth on Progress & Bookmarks**: Attached `authMiddleware` to all `/progress*`, `/bookmark*`, and `/highlights*` routes in `stories.routes.js`.
- [x] **Eliminate Header Impersonation**: Updated `getEffectiveUserId()` in `story.controller.js` to strictly require verified `req.user.id` from JWT.
- [x] **Configure Express Proxy Trust**: Added `app.set('trust proxy', 1)` in `server.js` for accurate client IP rate limiting behind Traefik ingress.
- [x] **Fix Metadata Schemas & Controllers**: Added virtual `books` populates and standardized `bookCount` in `EbookAuthor`, `EbookCategory`, and `EbookTag`.

### Phase 2: Database Query & Caching Optimization
- [x] **Refactor `getStoriesDashboard`**: Added field projections (`select(...)`) to `story.controller.js` to eliminate massive memory overhead.
- [x] **Add Missing Database Indexes**: Added compound indexes for `Story` (`isPublished`, `createdAt`, `isFeatured`, `difficultyLevel`) and `UserStoryProgress` (`userId`, `lastVisitedAt`, `lastReadAt`).
- [x] **Integrate Redis / Memory Caching**: Built `CacheManager` utility (`cache.utils.js`) and integrated 300s TTL caching across `/authors`, `/categories`, `/tags`, and `/stats` endpoints.

### Phase 3: Audio Generation Pipeline & Hetzner S3
- [x] **Standardize Alignment Timestamp Schema**: Updated `run_openai_whisper_alignment.py` to target `liiro_prod` and populate both `startSec`/`endSec` schema standards.
- [x] **Parameterize Kokoro TTS Script**: Updated `generate_100pct_full_book_audio_kokoro.py` with CLI flags (`--slug`, `--out_dir`, `--mongo_uri`, `--voice`) for dynamic multi-book audio synthesis.
- [x] **Hetzner S3 Cache Headers**: Enforced `Cache-Control: public, max-age=31536000, immutable` across S3 upload scripts.
- [x] **Enterprise HLS Audio Streaming & Transcoder Engine**: Built `HLSTranscoderService` (`hlsTranscoder.service.js`) and endpoints for FFmpeg 6-second MPEG-TS audio chunking and `.m3u8` playlist generation.

### Phase 4: Missing Endpoints & Microservice Cleanup
- [x] **`GET /api/v1/user/library`**: Created user library endpoint returning active reads, completed stories, and bookmarked books.
- [x] **`GET /api/v1/user/bookmarks` & `GET /api/v1/user/highlights`**: Created user aggregate bookmark and highlight listing endpoints.
- [x] **`GET /api/v1/stories/search`**: Created full-text regex search endpoint across title, author, category, synopsis, and tags.
- [x] **`POST /api/v1/stories/progress/batch`**: Created batch progress sync endpoint for offline mobile progress uploads.
- [x] **Codebase Cleanup**: Removed orphaned `src/routes/auth.routes.js` and updated `/health` endpoint to perform live MongoDB connection checks.

### Phase 5: Enterprise Feed, AI & Billing Engine
- [x] **AI Vector Search & Recommendation Engine**: Multi-dimensional TF-IDF Cosine Similarity vector search (`/api/v1/stories/slug/:slug/recommendations`).
- [x] **OPDS 2.0 Open Publication Catalog Feed**: Mounted `/opds/v2/catalog` & `/opds/v2/catalog.xml` for e-readers.
- [x] **Stripe & RevenueCat Webhook Listener**: Mounted `/api/v1/billing/webhook/stripe` & `/revenuecat` entitlement listeners.
- [x] **Background Audio Queue Worker Infrastructure**: Built `audioQueue.js` and `/api/v1/stories/queue/status` telemetry endpoint.

### Phase 6: Distributed K8s Queue & Custom Voice Engine
- [x] **BullMQ + Redis Distributed Queue**: Migrated `audioQueue.js` to BullMQ with Redis backing for multi-server cluster scale (`src/config/redisConfig.js`).
- [x] **Kubernetes Pods & HPA Autoscaling**: Deployed `redis-deployment.yaml` and `worker-deployment.yaml` with Horizontal Pod Autoscaling (HPA 2 to 10 pods).
- [x] **Clean Text Generator & Header Deduplicator**: Built `cleaner.py` stripping markdown asterisks, HTML tags, em-dashes, and duplicate title headings.
- [x] **Multi-Voice & Custom Voice Cloner**: Created `clone_voice.py` supporting 11+ AI narrator voices, ratio blending, and 10s WAV zero-shot voice cloning.

---

## 🎨 Frontend Engineering Task List (`frontend/`)

### Phase 1: High Priority & Cross-Platform Fixes
- [x] **Inject RTK Query Authorization Header**: Updated `api/mainQuery.ts` `prepareHeaders` to retrieve token via `getToken("token")` and append `Authorization: Bearer ${token}`.
- [x] **Unify Audio Engine under `AudioManager` (`expo-audio`)**: Refactored `EbookReadContent.tsx` and `details/[slug].tsx` to use `AudioManager` for 100% native iOS/Android & Web compatibility.
- [x] **Enable Background Audio Playback**: Set `shouldPlayInBackground: true` in `audioManager.ts` and configured Expo background audio capabilities.
- [x] **DRM Stream Token RTK Query Integration**: Connected `useGetStreamTokenQuery` to resolve 2-hour HMAC pre-signed S3 stream URLs.

### Phase 2: Component Architecture & Desktop Web Interactivity
- [x] **Decompose Monolithic Reader Component**: Split monolithic `EbookReadContent.tsx` into modular sub-components (`EbookReaderHeader`, `EbookReaderFooterPlayer`, `EbookReaderSettingsModal`, `EbookReaderTocModal`).
- [x] **Desktop Mouse Drag**: Attached `useWebHorizontalDrag` to horizontal carousels in `EbookDashboardContent.tsx` and `explore.tsx`.
- [x] **Sync Bookmark & Download States**: Connected book details screen bookmark state to `story.userProgress.bookmarkedChapterIds`.

### Phase 3: Offline Storage & Reader Enhancements
- [x] **Offline Audiobook Downloader**: Implemented `OfflineManager` (`offlineManager.ts`) using `expo-file-system` to download and store story text and audio files locally.
- [x] **Whispersync Reader UI Integration**: Built `WhispersyncPromptModal` glassmorphism modal auto-prompting users to resume reading/listening from cross-device positions.

### Phase 4: Advanced Reader Typography & Automotive Integration
- [x] **Custom Typography Preloader (`expo-font`)**: Preloaded Google Fonts (Lora, Playfair Display, JetBrains Mono) via `expo-font` in `_layout.tsx` and updated Reader Preferences modal.
- [x] **Contextual Selection Tooltip & Highlights**: Built `EbookTextSelectionTooltip.tsx` with free dictionary lookup, translation preview, and 4-color text highlighter.
- [x] **CarPlay & Android Auto Integration**: Exposed `MediaSession` metadata (Cover Artwork, Title, Author, Album) and registered automotive action handlers (`play`, `pause`, `seekbackward`, `seekforward`) in `audioManager.ts`.
