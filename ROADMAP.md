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

### Phase 4: Missing Endpoints & Microservice Cleanup
- [x] **`GET /api/v1/user/library`**: Created user library endpoint returning active reads, completed stories, and bookmarked books.
- [x] **`GET /api/v1/user/bookmarks` & `GET /api/v1/user/highlights`**: Created user aggregate bookmark and highlight listing endpoints.
- [x] **`GET /api/v1/stories/search`**: Created full-text regex search endpoint across title, author, category, synopsis, and tags.
- [x] **`POST /api/v1/stories/progress/batch`**: Created batch progress sync endpoint for offline mobile progress uploads.
- [x] **Codebase Cleanup**: Removed orphaned `src/routes/auth.routes.js` and updated `/health` endpoint to perform live MongoDB connection checks.

---

## 🎨 Frontend Engineering Task List (`frontend/`)

### Phase 1: High Priority & Cross-Platform Fixes
- [ ] **Inject RTK Query Authorization Header**: Update `api/mainQuery.ts` `prepareHeaders` to retrieve token via `getToken("token")` and append `Authorization: Bearer ${token}`.
- [ ] **Unify Audio Engine under `AudioManager` (`expo-audio`)**: Refactor `EbookReadContent.tsx` and `details/[slug].tsx` to replace `new Audio()` and `(window as any).Audio` with `AudioManager` for 100% native iOS/Android & Web compatibility.
- [ ] **Enable Background Audio Playback**: Set `shouldPlayInBackground: true` in `AudioManager.ts` and configure Expo background audio capabilities.
- [ ] **Load Native Custom Fonts**: Load serif (`PlayfairDisplay`/`Lora`) and mono (`JetBrainsMono`) fonts using `expo-font` in `_layout.tsx` for iOS/Android reader themes.

### Phase 2: Component Architecture & Desktop Web Interactivity
- [ ] **Decompose Monolithic Files**: Split `EbookReadContent.tsx` (3,900 lines) and `EbookDashboardContent.tsx` (2,000 lines) into modular subcomponents (`ReaderHeader`, `ReaderTextDisplay`, `ReaderControlBar`, `AudioPlayerBar`).
- [ ] **Desktop Mouse Drag**: Attach `useWebHorizontalDrag` to horizontal carousels in `EbookDashboardContent.tsx` and `explore.tsx`.
- [ ] **Sync Bookmark & Download States**: Connect book details screen bookmark state to `story.userProgress.bookmarkedChapterIds`.

### Phase 3: Offline Storage & Reader Enhancements
- [ ] **Offline Audiobook Downloader**: Implement an offline file manager using `expo-file-system` to download and store story text and audio files locally.
- [ ] **High-FPS Native Karaoke Sync**: Optimize `AudioManager` status update frequency on mobile to provide smooth 60fps sentence highlighting.
- [ ] **Web Body Scroll Lock**: Add body scroll lock when modal sheets (`ResponsiveSheet`) are open on Web.
- [ ] **Range Text Selection Tooltip**: Implement range text selection tooltip for precise sentence/word highlighting and dictionary lookup.
