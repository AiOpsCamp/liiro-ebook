# 🤖 Liiro Ebook — AI Agent Instructions

> **Production URL**: `https://app.liiro.io/aiopscamp-liiro-api`  
> **Health Check**: `https://app.liiro.io/aiopscamp-liiro-api/health`  
> **Repository**: `github.com/AiOpsCamp/liiro-ebook`  
> **DB**: `liiro_prod` — MongoDB on Hetzner K3s (`46.224.188.251:27017`) — 2,022+ stories / 52,434+ chapters  
> **Production TODO**: Read `docs/PRODUCTION_TODO.md` before starting any task

---

## 1. Project Structure

```
liiro-ebook/
├── backend/              ← Node.js Express API (Port 5012)
│   ├── server.js         ← App entry point, middleware setup
│   ├── src/
│   │   ├── config/       ← redisConfig.js, db config
│   │   ├── controllers/  ← story, billing, user, reels controllers
│   │   ├── middlewares/  ← authMiddleware.js (JWT + optionalAuth)
│   │   ├── models/       ← Mongoose schemas (Story, StoryChapter, UserStoryProgress…)
│   │   ├── queues/       ← audioQueue.js (BullMQ producer)
│   │   ├── routes/       ← route definitions (mount in server.js)
│   │   ├── services/     ← whispersync, s3Signer, hlsTranscoder, vectorSearch, opds
│   │   ├── utils/        ← cache.utils.js (CacheManager 300s TTL)
│   │   └── workers/      ← audioWorker.js (BullMQ consumer — runs as K8s pod)
│   ├── audio_pipeline/   ← Python TTS pipeline (Kokoro ONNX + Whisper + HLS)
│   │   ├── run_full_pipeline.py
│   │   ├── synthesizer.py
│   │   ├── clone_voice.py
│   │   └── batch_catalog.py
│   ├── scripts/          ← ingest, seed, transcode, tunnel scripts
│   ├── k8s/              ← redis-deployment.yaml, worker-deployment.yaml
│   └── AGENTS.md         ← infrastructure integration details (read this too)
├── frontend/             ← Expo React Native / Web (Port 8086)
│   ├── app/              ← Expo Router file-based routes
│   │   ├── _layout.tsx   ← Root nav guard + font preload
│   │   ├── index.tsx     ← Dashboard
│   │   ├── (auth)/       ← login.tsx, register.tsx
│   │   ├── read/[slug].tsx
│   │   ├── details/[slug].tsx
│   │   ├── reels/        ← TikTok-style book reels
│   │   ├── profiles/     ← Family profile switcher
│   │   ├── car-mode/     ← Driving UI
│   │   └── summary/      ← Blinkist-style key takeaways
│   ├── components/ebook/ ← All UI components
│   ├── lib/utils/        ← audioManager.ts, offlineManager.ts
│   ├── api/              ← RTK Query API slices (storiesQuery.ts…)
│   └── store/            ← Redux Toolkit store
├── docs/
│   ├── PRODUCTION_TODO.md   ← ALWAYS read this first
│   ├── ARCHITECTURE.md
│   ├── BACKEND_ARCHITECTURE.md
│   ├── FRONTEND_ARCHITECTURE.md
│   └── …                    ← other spec docs
└── scripts/              ← root-level deploy/tunnel scripts
```

---

## 2. What's Already Built (Production Live)

The following are **complete, tested, and live in production**:

- **Billing Quota Enforcement**: `src/middlewares/quotaMiddleware.js` — HTTP `402 Payment Required` when 20h monthly streaming quota is exceeded.
- **GDPR Right to Erasure**: `DELETE /api/v1/auth/account` — Permanent cascade deletion of user records across 8 collections.
- **Automated Test Suite**: `backend/tests/api_integration_suite.test.js` — Supertest + Node native runner (100% pass rate via `npm test`).
- **CI/CD Pipeline**: `.github/workflows/ci.yml` — Lint, MongoDB service integration test, Docker image build gate.
- **Interactive Swagger UI / OpenAPI 3.0**: `/api-docs` & `/api/v1/docs/spec.json` documenting 30+ endpoints.
- **Structured JSON Logging**: `src/utils/logger.js` — High-speed Pino logger with automatic `x-request-id` tracking.
- **System APM & Latency Health**: `GET /health` reporting live MongoDB latency (43ms), heap & RSS memory, and uptime.
- **Social Quote Card Generator & Discovery Feed**: `QuoteCardShareModal.tsx`, `/quotes` route (`app/quotes/index.tsx`), and `/api/v1/quotes` API.
- **Smart Multi-Voice Audio Pipeline**: `scripts/queue_smart_multivoice_runner.py` — Genre-tailored voice selection (`Lewis`, `Heart`, `Adam`, `George`, `Emma`) with 6-worker parallel Kokoro ONNX synthesis.
- **JWT & Google Auth**: `src/modules/auth/` — `fbEmailRegister`, `fbEmailLogin`, `googleAuth`, `firebaseExchange`.
- **DRM Stream Tokens**: `src/services/s3Signer.service.js` — HMAC-SHA256, 2h TTL.
- **Whispersync**: `src/services/whispersync.service.js` — paragraph↔timestamp bi-directional alignment.
- **HLS Transcoder**: `src/services/hlsTranscoder.service.js` — FFmpeg 6s segments.
- **Vector Recommendations**: `src/services/vectorSearch.service.js` — TF-IDF cosine similarity.
- **OPDS 2.0 Feed**: `src/services/opds.service.js` — JSON & Atom XML feeds.
- **Billing Webhooks**: `src/controllers/billing.controller.js` — Stripe + RevenueCat.
- **Frontend Reader**: Themes, karaoke highlight, fonts, selection tooltip, offline download — all complete.

---

## 3. What's Next on the Roadmap (P1 & Post-Launch)

Before implementing anything new, check `docs/PRODUCTION_TODO.md` and `PRODUCT_AUDIT.md`. Key remaining items:

| Area | Status / Next Tasks |
| :--- | :--- |
| **Admin CMS API** | Add dedicated admin routes (`/api/v1/admin/stories`) to publish/feature books without direct DB access. |
| **Analytics Overview** | Add aggregate metrics endpoint (`/api/v1/analytics/overview`) for total listening/reading hours & active users. |
| **Email Service** | Transactional & campaign email notifications (weekly reading digest). |
| **Reading Challenges** | Goodreads-style annual reading goal tracking and streak milestone rewards. |
| **Redis Cache Cluster** | Migrate in-memory `CacheManager` to Redis cluster for multi-pod cache invalidation. |

---

## 4. Infrastructure & Credentials

### Local Development
```bash
# Backend (Port 5012)
cd backend && npm start

# Frontend (Port 8086)
cd frontend && npx expo start --web --port 8086

# Redis (required for BullMQ)
brew services start redis
# or: docker run -p 6379:6379 -d redis:7-alpine

# Worker (separate terminal)
cd backend && node src/workers/audioWorker.js

# MongoDB tunnel to production
./scripts/tunnel-hetzner-mongo.sh
# Then use: MONGODB_URI="mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin"
```

### Environment Variables (backend `.env`)
```
PORT=5012
MONGODB_URI=mongodb://admin:<password>@127.0.0.1:27017/liiro_prod?authSource=admin
JWT_SECRET=<secret>
HETZNER_S3_KEY=<key>
HETZNER_S3_SECRET=<secret>
HETZNER_S3_BUCKET=multicamp-prod-storage
HETZNER_S3_ENDPOINT=https://nbg1.your-objectstorage.com
REDIS_HOST=localhost
REDIS_PORT=6379
STRIPE_SECRET_KEY=<key>
STRIPE_WEBHOOK_SECRET=<secret>
REVENUECAT_WEBHOOK_SECRET=<secret>
```

**NEVER hardcode secrets in source files or docs. Always use `.env` or K8s secrets.**

### Production K8s Deploy
```bash
./deploy.sh liiro
```

### Hetzner Server SSH
```bash
ssh root@46.224.188.251
```

---

## 5. Key Conventions

### Backend
- **Framework**: Express.js, CommonJS (`require`, not `import`)
- **DB**: Mongoose. All models live in `src/models/`. Always use `.select()` on queries to avoid over-fetching.
- **Auth**: Protected routes use `authMiddleware.authenticate`. Public routes that optionally attach user use `authMiddleware.optionalAuth`.
- **Caching**: Use `CacheManager` from `src/utils/cache.utils.js` for expensive queries. Key format: `"entity:params"`. TTL: 300s default.
- **Queue jobs**: Always enqueue via `src/queues/audioQueue.js`, never call the Python pipeline directly from a controller.
- **Errors**: Return `{ error: "message" }` with appropriate HTTP status. Never expose stack traces in responses.
- **API prefix**: All routes mount at `/api/v1/`. OPDS at `/opds/`.

### Frontend
- **Framework**: Expo SDK 57, React Native Web + Mobile, Expo Router (file-based)
- **Language**: TypeScript (`.tsx`). No plain `.js` in `frontend/`.
- **State**: Redux Toolkit + RTK Query. API calls go through `api/` slices only — no raw `fetch` in components.
- **Auth guard**: `app/_layout.tsx` handles all redirects. Do not add auth checks inside screens.
- **Styling**: Inline `StyleSheet.create()`. No external CSS frameworks. No `styled-components`.
- **Audio**: All audio operations go through `lib/utils/audioManager.ts`. Never instantiate `Audio` or `HTMLAudioElement` directly in components.
- **Offline**: Downloads managed via `services/offlineManager.ts` only.

### Audio Pipeline (Python)
- Entry point: `audio_pipeline/run_full_pipeline.py`
- Voice keys: `am_adam`, `af_heart`, `am_michael`, `af_bella`, `bf_emma`, `bm_george`, `am_echo` (+ blended/cloned custom voices)
- Always use `--upload --hls` flags for production to push to S3 and transcode
- Custom voices stored in `audio_pipeline/custom_voices/` as `.json` + `.bin` pairs

---

## 6. Database Collections

### Documented & Implemented
| Collection | Model File | Purpose |
| :--- | :--- | :--- |
| `stories` | `Story.model.js` | Main catalog — title, author, slug, cover, difficulty, tags |
| `storychapters` | `StoryChapter.model.js` | Chapter text paragraphs, audio URLs, Whisper timestamps |
| `userstoryprogresses` | `UserStoryProgress.model.js` | Reading progress, bookmarks, highlights |
| `ebookcategories` | `EbookCategory.model.js` | 25 master categories |
| `ebookauthors` | `EbookAuthor.model.js` | Author directory |
| `ebooktags` | `EbookTag.model.js` | Tag taxonomy |

### Missing — Need to Create
`users`, `familyprofiles`, `notifications`, `activities`, `reels`, `summaries`, `billingsubscriptions`, `listensessions`

When creating a new model:
1. Create `src/models/ModelName.model.js` with Mongoose schema
2. Add compound indexes relevant to common query patterns
3. Export from model file and import in controller
4. Document the collection in `docs/DATABASE_GUIDE.md`

---

## 7. Adding a New Feature — Standard Workflow

1. **Check `docs/PRODUCTION_TODO.md`** — is this already listed? If P0/P1, prioritize it.
2. **Backend first**: Model → Controller → Route → Mount in `server.js`
3. **Protect routes**: Use `authMiddleware.authenticate` for user-specific endpoints
4. **Cache if read-heavy**: Wrap DB queries in `CacheManager.get/set`
5. **Frontend**: Add RTK Query endpoint in `api/` slice → consume in component
6. **Test**: Write at minimum one Supertest integration test for the new endpoint
7. **Update docs**: Add endpoint to `docs/API_DOCUMENTATION.md`

---

## 8. Things To Never Do

- **Never hardcode credentials** — no secrets in source files, docs, or commit history
- **Never call Python pipeline directly from an Express controller** — always enqueue via BullMQ
- **Never use `req.headers['x-user-id']`** for auth — this was a legacy vulnerability. Always decode JWT from `Authorization: Bearer <token>`
- **Never skip `.select()`** on large collection queries — `stories` documents are large; always project only needed fields
- **Never run destructive scripts** (`DROP`, `deleteMany` without filter) on `liiro_prod` without explicit user confirmation
- **Never commit `node_modules/`, `venv/`, `audio_output/`, `*.onnx`, `*.bin`** — these are in `.gitignore`
- **Never bypass the root nav guard** in `app/_layout.tsx` — don't add redirect logic inside individual screens
- **Never expose raw S3 bucket keys to the client** — all S3 access goes through the DRM stream token proxy

---

## 9. Running the Audio Pipeline

```bash
# Single book (all chapters)
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug <book-slug> \
  --voice am_adam \
  --upload \
  --hls

# Batch (multiple books)
python3 backend/audio_pipeline/batch_catalog.py \
  --voice am_adam \
  --limit 10

# Custom voice blend
python3 backend/audio_pipeline/clone_voice.py \
  --mode blend --name my_voice \
  --voice-a am_adam --voice-b bm_george --weight 0.6

# HLS transcode only (if audio already generated)
node backend/scripts/transcode_ebook_to_hls.js <slug> <voice>
```

Pipeline speed: ~26× real-time (1 min processing = 26 min audio).

---

## 10. Testing

Tests live in `backend/tests/`. Run with:
```bash
cd backend && npm test
```

When writing tests:
- Use **Jest** + **Supertest** for API integration tests
- Always seed a test document before the test and clean up after (`beforeAll` / `afterAll`)
- Use a separate test database (`liiro_test`) — never run tests against `liiro_prod`
- Set `NODE_ENV=test` to skip Redis/BullMQ connections in tests

---

## 11. Deployment

```bash
# Full deploy (backend + frontend) to Hetzner K8s
./deploy.sh liiro

# Apply K8s manifests only
kubectl apply -f backend/k8s/redis-deployment.yaml
kubectl apply -f backend/k8s/worker-deployment.yaml

# Check worker pod health
kubectl get pods -l app=liiro-backend-worker
kubectl get hpa liiro-backend-worker-hpa
kubectl logs -l app=liiro-backend-worker --tail=50
```

There is no staging environment yet (see `PRODUCTION_TODO.md` INFRA-03). All deploys go directly to production — be cautious.

---

## 12. Key Docs Reference

| Doc | When to Read |
| :--- | :--- |
| `docs/PRODUCTION_TODO.md` | **Always read first** — what needs building |
| `docs/BACKEND_ARCHITECTURE.md` | Understanding existing backend services |
| `docs/FRONTEND_ARCHITECTURE.md` | Understanding existing frontend screens |
| `docs/API_DOCUMENTATION.md` | Endpoint reference (incomplete — 8 of 30+ documented) |
| `docs/DATABASE_GUIDE.md` | Collection schemas and seeding |
| `docs/BULLMQ_REDIS_K8S_GUIDE.md` | Queue architecture and K8s deployment |
| `docs/MULTI_VOICE_GUIDE.md` | Voice keys and S3 storage layout |
| `docs/PERFORMANCE_BENCHMARKS.md` | TTS pipeline speed and batch estimates |
| `backend/docs/AUDIO_ENGINE_ARCHITECTURE.md` | Master audio engine specifications and script registry |
| `backend/AGENTS.md` | Infrastructure integration code examples |

---

## 13. Active Production Scripts & Command Reference

| Script Name | Absolute Path | Execution Command | Core Features |
| :--- | :--- | :--- | :--- |
| **`ingest_standard_ebook.js`** | `/Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js` | `node scripts/ingest_standard_ebook.js <repo> [--audio]` | **Book Ingestion Engine**: Parses Standard Ebooks XHTML, uploads images to S3, seeds Goodreads reviews, sets initial `hasAudio: false`, and validates text diffs. Pass `--audio` to auto-trigger Python audio generation. |
| **`generate_audio_parallel_master.py`** | `/Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_parallel_master.py` | `/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_audio_parallel_master.py <slug> --workers 4 --voice michael` | **Master Production Parallel Audio Engine**: Multi-process CPU synthesis (4x-8x speedup). Features:<br>• **Chapter Filtering**: `--ch1-only` for Ch 1 only; `--chapters 1,2,3` or `--chapters 1-5` for custom ranges.<br>• **Immediate Per-Chapter Link Protocol**: Uploads MP3 to Hetzner S3 CDN & links MongoDB (`hasAudio: true`) immediately after each chapter finishes.<br>• **Title Duplication Fix**: Normalizes curly apostrophes (`’`) and strips repeated headers so title is spoken exactly once. |
| **`generate_and_align_ebook_audio.py`** | `/Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_and_align_ebook_audio.py` | `/Users/humayunrashid/multicamp/.venv/bin/python scripts/generate_and_align_ebook_audio.py <slug> --voice michael` | **Master Single-Process Aligner**: Single-process TTS synthesis + OpenAI Whisper sub-second Whispersync sentence timestamp generator (`wordTimings`). |

