# 🚀 Liiro Ebook — Production Readiness TODO

> **Analysis Date**: August 26, 2026  
> **Based on**: Full audit of all 14 architecture & feature docs  
> **Priority Scale**: 🔴 P0 Blocker · 🟠 P1 Critical · 🟡 P2 Important · 🔵 P3 Nice-to-Have

---

## 🔴 P0 — BLOCKERS (ALL COMPLETED 🎉)

### SEC-01 · Hardcoded Secrets in Source Code [COMPLETED]
- [x] **Remove** `HETZNER_S3_KEY`, `HETZNER_S3_SECRET`, MongoDB password from `INFRA_AGENT_HANDOFF_SPEC.md` and any source files immediately
- [x] Rotate exposed credentials and migrate to Kubernetes Sealed Secrets / Environment Variables
- [x] Add `.env` and any secret file patterns to `.gitignore`

### SEC-02 · S3 CORS Wildcard Origin [COMPLETED]
- [x] Current CORS policy allows `AllowedOrigins: ["*"]` — restricts audio streams to authorized origins
- [x] Locked `AllowedOrigins` to production domain(s) (`https://app.liiro.io`, `https://liiro.app`, `http://localhost:8086`) via `configure_s3_cors.js`

### SEC-03 · ReDoS Risk on Regex Search [COMPLETED]
- [x] `GET /api/v1/stories/search` uses full-text **regex** against MongoDB — catastrophically slow on 800+ records with adversarial input
- [x] Replace with MongoDB **`$text` index** search or Atlas Search, and add a MongoDB text index on `title`, `author`, `synopsis`

### SEC-04 · No HTTPS Enforcement [COMPLETED]
- [x] Traefik ingress TLS termination and forced HTTP→HTTPS 301 redirect middleware configured in `backend/k8s/traefik-ingress.yaml`
- [x] Configured Traefik `IngressRoute` with `Let's Encrypt` cert-manager and HTTP→HTTPS 301 redirect middleware

### SEC-05 · In-Memory Cache Migrated to Redis Cluster [COMPLETED]
- [x] `CacheManager` (`src/utils/cache.utils.js`) is a **Node.js in-memory store** — each K8s API pod has its own stale copy
- [x] Migrate cache to the **existing Redis instance** (`redisConfig.js` via `ioredis`) to share TTL state across all K8s API pods with automatic in-memory fallback

### INF-01 · Redis Persistence & PVC [COMPLETED]
- [x] K8s Redis deployment configured with `--appendonly yes` persistence and 5GB PersistentVolumeClaim in `backend/k8s/redis-deployment.yaml`
- [x] Added `appendonly yes` + `appendfsync everysec` in Redis ConfigMap, and mounted a PersistentVolumeClaim

### INF-02 · MongoDB High Availability & Replica Set [COMPLETED]
- [x] Configured 3-Node MongoDB Replica Set (`rs0`) failover architecture and connection string documented in `docs/DATABASE_GUIDE.md`
- [x] Set up MongoDB **Replica Set** (3 nodes: 1 primary + 2 secondaries) failover connection handling

### DATA-01 · Core Database Collections [COMPLETED]
- [x] `DATABASE_GUIDE.md` documents 12+ collections for full feature set
- [x] Create Mongoose schemas + indexes for: `users`, `familyprofiles`, `notifications`, `activities`, `reels`, `summaries`, `billingsubscriptions`, `listensessions`

---

## 🟠 P1 — CRITICAL (Must be done for stable production)

### OBS-01 · Structured Logging with Pino [COMPLETED]
- [x] Integrate **Pino** (fast, JSON-structured) with automatic `x-request-id` header injection and sensitive header redaction in `src/utils/logger.js` and `server.js`

### OBS-02 · No Error Tracking / Crash Reporting
- Unhandled errors in Express, BullMQ workers, and audio pipeline are silent in production
- Integrate **Sentry** (backend Node.js SDK + React Native SDK on frontend) with source maps
- Wire Sentry DSN into K8s secrets

### OBS-03 · No Uptime / Alerting
- `GET /health` endpoint exists reporting live MongoDB ping latency, heap, RSS memory, and uptime

### OBS-04 · No APM / Distributed Tracing
- Cannot diagnose slow requests across API → MongoDB → Redis → S3
- Add **OpenTelemetry** traces with a Jaeger or Tempo backend on the K8s cluster

### TEST-01 · Multi-Scenario Test Coverage [COMPLETED]
- [x] Backend API integration: `tests/api_integration_suite.test.js` & `tests/smoke_api_suite.js` covering multi-scenario endpoints with auth, guest, 200, 400, 401, 404 & DRM cases
- [x] Whispersync, S3 pre-signing, vector recommendations, billing webhook, OPDS 2.0 integration tests

### TEST-02 · GitHub Actions CI/CD Pipeline [COMPLETED]
- [x] Created `.github/workflows/ci.yml` running linting, MongoDB service container integration tests, and Docker image build gates

### FEAT-01 · User Schema & Auth Profile [COMPLETED]
- [x] Define and seed: `_id`, `email`, `passwordHash`, `googleId`, `appleId`, `role`, `subscriptionTier`, `listeningQuotaUsed`, `monthlyQuotaReset`, `xpScore`, `readingStreak`, `lastActiveAt`, `createdAt`

### FEAT-02 · Billing Quota Enforcement Middleware [COMPLETED]
- [x] Added `quotaMiddleware.js` enforcing 20h monthly streaming quota and returning HTTP `402 Payment Required` with upgrade prompt payload

### FEAT-03 · Notification System Backend [COMPLETED]
- [x] `GET /api/v1/user/notifications` implemented in backend controller
- [x] Build: `notifications` collection, notification creation service, `GET` + `POST /mark-read` endpoints

### FEAT-04 · Activity Timeline Backend [COMPLETED]
- [x] `POST/GET /api/v1/user/activities` controller and schema implemented
- [x] Define `activities` schema: `userId`, `type` (read_start/pause/complete/listen_pause), `storyId`, `chapterIndex`, `positionSec`, `device`, `language`, `createdAt`

### FEAT-05 · Reels Feed Backend [COMPLETED]
- [x] `GET /api/v1/reels` and `POST /api/v1/reels/:id/like` implemented in `reels.controller.js` and mounted in Express `server.js`

### FEAT-06 · Family Profiles Backend [COMPLETED]
- [x] `familyprofiles` collection, PIN hash verification (`/api/v1/profiles/verify-pin`), and profile CRUD endpoints implemented

### FEAT-07 · Social Quote Card Generator & Discovery Feed [COMPLETED]
- [x] Created `QuoteCardShareModal.tsx`, `/quotes` route (`app/quotes/index.tsx`), and `/api/v1/quotes` API with 12 seeded world classics

### DOC-01 · OpenAPI 3.0 Specification & Swagger UI [COMPLETED]
- [x] Created `swaggerSpec.js` and mounted interactive documentation at `/api-docs/` and spec at `/api/v1/docs/spec.json`

### FEAT-07 · Summaries Backend [COMPLETED]
- [x] `GET /api/v1/stories/slug/:slug/summary` (Liiro Sparks ⚡) implemented with MongoDB `BookSummary.model.js`

### FEAT-08 · Admin CMS / Content Management
- No way to publish, unpublish, edit, or feature books without direct MongoDB access
- Build a minimal admin API (protected by `role: 'admin'`): CRUD for stories, feature/unfeature toggle, bulk queue trigger for audio generation

### INFRA-03 · No Staging Environment
- Only production infrastructure documented — no isolated staging
- Provision a separate K8s namespace (`liiro-staging`) with separate S3 prefix and MongoDB database (`liiro_staging`) — all PRs deploy here automatically

---

## 🟡 P2 — IMPORTANT (Production quality & scale)

### PERF-01 · No CDN for HLS Segments & Assets
- HLS `.ts` segment requests currently go directly to Hetzner S3 via the API proxy
- Put **Cloudflare** (or Hetzner's CDN) in front of S3 for edge-cached segment delivery — eliminates backend proxy latency

### PERF-02 · Vector Search O(n) Scan
- `vectorSearch.service.js` evaluates all 1,405+ stories on every recommendation call (even with 600s cache)
- Pre-compute embeddings offline and store as MongoDB vectors, then use **MongoDB Atlas Vector Search** or switch to a proper ANN index (FAISS/pgvector) for sub-1ms lookups at 10k+ books

### PERF-03 · Image Optimization Pipeline Missing
- Book cover images from Standard Ebooks ingestion are served at original resolution
- Add an image resizing step in the ingestion script (Sharp.js) generating `cover_thumbnail.webp` (200px) and `cover_medium.webp` (400px) and uploading to S3

### PERF-04 · Rate Limiting Per User (Not Just Per IP)
- Current rate limit is 1,000 req/15min per IP — shared with all users behind a NAT or office network
- Add per-authenticated-user rate limits via `express-rate-limit` with a Redis store keyed on `userId`

### SEC-06 · Missing Security Headers [COMPLETED]
- [x] No mention of `helmet.js` for HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- [x] Add `helmet()` as the first middleware in `server.js` (Enforced & verified with HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

### SEC-07 · Stripe Webhook Signature Not Verified
- `billing.controller.js` handles Stripe webhooks — must verify `stripe-signature` header using `stripe.webhooks.constructEvent()` to prevent spoofed events
- Confirm this is implemented; add a test that sends a forged webhook and expects `HTTP 400`

### SEC-08 · OPDS Feed Has No Auth
- `GET /opds/v2/catalog` is fully public — exposes full book catalog metadata to scrapers
- Add optional JWT bearer auth or API key gate for the OPDS feed (check if public access is intentional)

### DX-01 · API Documentation Incomplete
- `API_DOCUMENTATION.md` only covers ~8 endpoints; 30+ endpoints exist across billing, whispersync, HLS, queue, reels, activities, notifications, etc.
- Generate a full **OpenAPI 3.0 spec** (`openapi.yaml`) and serve it via Swagger UI at `/api/docs`

### DX-02 · No Local Development Quickstart
- No `docker-compose.yml` for spinning up MongoDB + Redis locally
- Create `docker-compose.dev.yml` with: `mongo:7`, `redis:7-alpine`, and a `.env.example` with all required variables

### AUDIO-01 · No Synthesis Quality Validation
- After Kokoro ONNX synthesis, no check for silence, clipping, or misaligned Whisper timestamps
- Add a post-synthesis validation step: check audio duration matches expected character count ratio (±20%), fail and re-queue if not

### AUDIO-02 · Failed Job Recovery UI Missing
- BullMQ `attempts: 3` retries silently on failure — no admin UI or user-facing status for failed audio generation
- Add a `/api/v1/admin/queue/failed` endpoint listing failed jobs with error reasons, and a retry trigger endpoint
- Consider BullBoard for a visual queue dashboard

### GDPR-01 · No User Data Deletion Workflow
- No documented `DELETE /api/v1/user` endpoint or data erasure flow
- Required for GDPR/CCPA compliance: endpoint that deletes all user data (`userstoryprogresses`, `activities`, `notifications`, `familyprofiles`) and anonymizes billing records

### GDPR-02 · No Privacy Policy / Terms Enforcement
- No `termsAcceptedAt` field on user schema or registration gate
- Add `termsAcceptedAt` timestamp to user model and require terms acceptance on registration

---

## 🔵 P3 — NICE-TO-HAVE (Next-tier features)

### FEAT-09 · EPUB/PDF Exporter
- `GET /api/v1/stories/slug/:slug/export?format=epub` — packages chapters + cover + TOC into `.epub`
- Use `epub-gen` npm package; store generated files in S3 with 24h signed URL

### FEAT-10 · WebSockets Whispersync (Real-Time)
- Replace 10-second polling HTTP sync with `socket.io` persistent connection
- Enables instant cross-device position sync (tab A → tab B in <100ms)

### FEAT-11 · 3D Page Curl Animation (Paginated Reader Mode)
- Add `react-native-page-flipper` for iOS/Android paginated mode
- Web: CSS ViewTransitions API for page-flip effect

### FEAT-12 · Native CarPlay / Android Auto Full Integration
- Current implementation uses `navigator.mediaSession` Web API (works on web only)
- For true native CarPlay: requires `MPNowPlayingInfoCenter` via a native Expo module or `react-native-carplay`

### FEAT-13 · Offline Sync Conflict Resolution
- `offlineManager.ts` downloads chapters locally but no documented strategy for resolving conflicts when offline edits (highlights, progress) sync back to server
- Implement last-write-wins or timestamp-based merge for `userstoryprogresses`

### FEAT-14 · Accessibility (a11y)
- No mention of WCAG compliance, screen reader support, or keyboard navigation in any doc
- Add: `accessibilityLabel` props on all interactive elements, focus management in modals, color contrast audit

### FEAT-15 · Deep Link Handling
- No documented deep link scheme (e.g. `liiro://read/slug`, `liiro://details/slug`)
- Required for push notification tap-to-open and social share links
- Configure Expo Router universal links + Android App Links

### INFRA-04 · Helm Charts
- Current K8s manifests are raw YAML — hard to manage across environments
- Migrate to a **Helm chart** with `values.yaml` overrides for staging vs. production

### INFRA-05 · Blue/Green Deployment Strategy
- No rollback strategy if a bad deploy reaches production
- Implement Argo Rollouts or K8s blue/green with traffic shifting via Traefik

### PERF-05 · Book Cover Lazy Loading & Progressive Images
- No documented image loading strategy — full resolution covers block FCP
- Use Expo `Image` with `placeholder` blur hash (generated during ingestion) for progressive reveal

---

## 📋 Summary Scorecard

| Category | Status | Blockers |
| :--- | :--- | :--- |
| **Security** | ❌ Not production-safe | Exposed secrets, wildcard CORS, ReDoS regex, no HTTPS docs |
| **Data Layer** | ⚠️ Partial | Redis no persistence, no MongoDB HA, 6/~14 needed schemas |
| **Testing** | ❌ Zero coverage | No unit, integration, or E2E tests exist |
| **CI/CD** | ❌ None | No pipeline, no staging env |
| **Observability** | ❌ None | No logs, no errors tracking, no APM, no alerts |
| **Core Features** | ⚠️ ~60% complete | Users, billing enforcement, notifications, activities, reels, family profiles backend missing |
| **Performance** | ⚠️ Acceptable for MVP | Cache not shared across pods, no CDN, regex search |
| **API Docs** | ⚠️ Incomplete | ~8 of 30+ endpoints documented |
| **Audio Pipeline** | ✅ Strong | Synthesis, Whisper alignment, HLS, multi-voice all implemented |
| **Frontend UX** | ✅ Strong | Reader, audio player, themes, offline, CarPlay (web) all done |

**Estimated work before public launch**: 8–12 engineer-weeks depending on team size.  
**Recommended launch sequence**: P0 (2 weeks) → P1 (4–6 weeks) → Soft launch → P2 (ongoing)
