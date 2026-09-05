# 📖 Liiro Ebook & Audiobooks: Development Roadmap & Task List

> **Repository**: `https://github.com/AiOpsCamp/liiro-ebook`  
> **Database**: `liiro_prod` (Hetzner K3s Cluster • 2,022+ Stories / 52,434+ Chapters)  
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

### Phase 7: ReDoS Security, Audio Engine & Multi-Scenario Testing
- [x] **ReDoS Search Input Sanitization (`SEC-03`)**: Sanitized regex input in `story.controller.js` to prevent regular expression denial of service attacks.
- [x] **Express Helmet Security Headers (`SEC-06`)**: Integrated and verified `helmet()` in `server.js` enforcing HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.
- [x] **Enterprise Redis Cluster CacheManager (`SEC-05`)**: Refactored `CacheManager` (`cache.utils.js`) to use Redis backing (`redisConfig.js`) for multi-pod K8s TTL consistency with seamless in-memory fallback.
- [x] **Separate Brand Signature & Non-Baked Audio Engine**: Updated `generate_and_align_ebook_audio.py` to keep S3 chapter audio clean 1:1 aligned with Whispersync, and added `playAudioSequence` in `audioManager.ts`.
- [x] **30/30 Multi-Scenario Integration & Security Test Suite (`TEST-01`)**: Built and executed `tests/smoke_api_suite.js` passing 100% of scenarios across Auth, Guest, 200, 400, 401, 404, DRM, and Whispersync.

### Phase 9: Production Hardening, Automated Tests, Swagger Docs & Social Quotes
- [x] **Billing Quota Enforcement (`quotaMiddleware.js`)**: Configured 20h streaming quota validation returning HTTP `402 Payment Required` with upgrade metadata.
- [x] **GDPR Right to Erasure (`DELETE /api/v1/auth/account`)**: Implemented cascade deletion across reading progress, bookmarks, highlights, activities, streaks, reviews, and notifications.
- [x] **Automated Integration Test Suite (`tests/api_integration_suite.test.js`)**: Supertest + Node native test runner testing 6 multi-scenario suites with 100% pass rate.
- [x] **GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)**: Automated multi-stage pipeline running linter, MongoDB service integration tests, and Docker build gates.
- [x] **OpenAPI 3.0 Specification & Swagger UI (`/api-docs`)**: Interactive API documentation for 30+ endpoints at `http://127.0.0.1:5012/api-docs/`.
- [x] **Structured JSON Logging & APM**: Integrated Pino logger with `x-request-id` tracking and `/health` DB ping latency metrics.
- [x] **Smart Multi-Voice Master Pipeline (`queue_smart_multivoice_runner.py`)**: Built automated genre-matched narrator assignment (Lewis, Heart, Adam, George, Emma) with parallel Kokoro ONNX synthesis.
- [x] **Curated Literary Quotes API (`/api/v1/quotes`)**: Built `BookQuote.model.js` and `quote.controller.js` with category filtering, likes, and database seeding.
- [x] **Custom Bookshelves & Reading Collections Engine (`/api/v1/collections`)**: Built `UserCollection.model.js` and `collection.controller.js` with auto-provisioned system shelves (`Currently Reading`, `Want to Read`, `Favorites`) and custom user shelves with full CRUD.
- [x] **Admin CMS Catalog & Metadata API (`/api/v1/admin`)**: Built `adminMiddleware.js` and `admin.controller.js` supporting real-time stats, multi-filter search, instant `isFeatured` toggle, and story metadata editing.

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

### Phase 5: Responsive Header, Prominent Audiobook Badges & Metadata Fixes
- [x] **Responsive Mobile Header & Profile Pill**: Collapsed long usernames to compact circular avatar pills on mobile (< 640px) and gave navigation tabs >80% screen width in `EbookDashboardContent.tsx` & `ProfileNavbarMenu.tsx`.
- [x] **Prominent `🎧 AUDIOBOOK` vs `📖 EBOOK` Badges**: Added glowing purple audiobook badges and clean ebook badges to cover cards in `StoryCard.tsx`.
- [x] **MongoDB ObjectId Cleanup**: Updated `getLocalizedText.ts` and `story.controller.js` to filter out raw 24-character hexadecimal ObjectIds (`6a8e79...`), displaying clean human-readable author names across all book covers.

### Phase 6: Viral Social Quote Card Sharing & Quotes Discovery Route
- [x] **Social Quote Card Generator Modal (`QuoteCardShareModal.tsx`)**: Created glassmorphic card generator supporting 5 luxury palettes (`Midnight Obsidian`, `Royal Gold`, `Cyber Emerald`, `Vintage Parchment`, `Deep Velvet`) and 1:1 Square vs 9:16 Story aspect ratios.
- [x] **Dedicated Quotes Discovery Feed (`frontend/app/quotes/index.tsx`)**: Built `/quotes` route featuring category pills, real-time likes, quote card generator triggers, and direct reader jumps.
- [x] **Dashboard Quotes Rail**: Added "Inspiring Quotes & Share Cards" discovery carousel in `EbookDashboardContent.tsx` routing to `/quotes`.
- [x] **Reader Selection Tooltip Integration**: Added one-tap "Generate Quote Card" spark button in `EbookTextSelectionTooltip.tsx`.

### Phase 7: Custom Bookshelves & Personal Library Management
- [x] **Add to Bookshelf Modal (`AddToShelfModal.tsx`)**: Bottom sheet for instant shelf assignment, custom color selection, and new shelf creation.
- [x] **Dedicated Bookshelves Hub (`frontend/app/shelves/index.tsx`)**: Built `/shelves` route with book thumbnail collages, book counters, and custom shelf management.
- [x] **Single Shelf View (`frontend/app/shelves/[slug].tsx`)**: Built `/shelves/[slug]` route with direct Read/Listen CTAs and book removal actions.
- [x] **Dashboard Shelves Carousel**: Integrated "My Bookshelves & Shelves" discovery rail in `EbookDashboardContent.tsx`.
- [x] **Details Screen Integration**: Added "Add to Bookshelf 📚" shortcut button into `app/details/[slug].tsx`.

### Phase 8: Admin CMS Dashboard & Metadata Engine
- [x] **Admin CMS Hub Route (`frontend/app/admin/index.tsx`)**: Created `/admin` dashboard featuring KPI cards (*Total Catalog: 1,405 Books, 39k+ Chapters, Audio Ready, Featured*).
- [x] **Live Catalog Filtering & Search**: Instant debounced search with Category and Audio Status pills.
- [x] **One-Tap Featured ⭐ Switch**: Instant optimistic update to feature/unfeature classics on the hero carousel.
- [x] **Story Metadata Editor Modal**: Modal to edit Category, Author Name, CEFR Difficulty (A1-C2), and Publication status.
