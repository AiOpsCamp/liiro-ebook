# 📖 Liiro Ebook & Audiobooks: Development Roadmap & Task List

> **Repository**: `https://github.com/AiOpsCamp/liiro-ebook`  
> **Database**: `liiro_prod` (Hetzner K3s Cluster • 864 Stories / 26,914 Chapters)  
> **Storage**: Hetzner Object Storage (`multicamp-prod-storage` / `Liiro-Ebook-Prod/`)  

---

## ⚙️ Backend Engineering Task List (`backend/`)

### Phase 1: Security, Auth & Ingress Guards (High Priority)
- [ ] **Enforce JWT Auth on Progress & Bookmarks**: Attach `authMiddleware` to all `/progress*`, `/bookmark*`, and `/highlights*` routes in `stories.routes.js`.
- [ ] **Eliminate Header Impersonation**: Require verified `req.user.id` from JWT in `getEffectiveUserId()`.
- [ ] **Configure Express Proxy Trust**: Add `app.set('trust proxy', 1)` in `server.js` for accurate client IP rate limiting behind Traefik ingress.
- [ ] **Fix Metadata Schemas & Controllers**: Add virtual `books` populates and standardize field names to `bookCount` in `EbookAuthor`, `EbookCategory`, and `EbookTag`.

### Phase 2: Database Query & Caching Optimization
- [ ] **Refactor `getStoriesDashboard`**: Replace full 864-book in-memory filtering in `story.controller.js` with targeted MongoDB `$facet` aggregation pipelines.
- [ ] **Add Missing Database Indexes**:
  - `Story`: `{ isPublished: 1, createdAt: -1 }`, `{ isPublished: 1, isFeatured: 1, featuredRank: 1 }`, `{ author: 1 }`, `{ category: 1 }`, `{ tags: 1 }`.
  - `UserStoryProgress`: `{ userId: 1, lastVisitedAt: -1 }`, `{ userId: 1, lastReadAt: -1 }`.
- [ ] **Integrate Redis Caching**: Implement Redis caching for static/semi-static catalog endpoints (`/dashboard`, `/categories`, `/authors`, `/tags`).

### Phase 3: Audio Generation Pipeline & Hetzner S3
- [ ] **Standardize Alignment Timestamp Schema**: Update Python Whisper forced-alignment scripts to output `startSec`, `endSec`, and `words` matching `StoryChapter.model.js`.
- [ ] **Parameterize Kokoro TTS Script**: Update `generate_100pct_full_book_audio_kokoro.py` to accept CLI arguments (`--slug`, `--voice`, `--db_uri`) for automated multi-book synthesis.
- [ ] **Hetzner S3 Cache Headers**: Enforce `Cache-Control: public, max-age=31536000, immutable` on all S3 uploads.

### Phase 4: Missing Endpoints & Microservice Cleanup
- [ ] **`GET /api/v1/user/library`**: Retrieve user's active reads, completed books, and saved library.
- [ ] **`GET /api/v1/user/bookmarks` & `GET /api/v1/user/highlights`**: Fetch aggregated user bookmarks and notes.
- [ ] **`GET /api/v1/stories/search`**: Full-text search endpoint for title, author, and synopsis.
- [ ] **`POST /api/v1/stories/progress/batch`**: Batch progress sync payload for offline reading.
- [ ] **Codebase Cleanup**: Delete `src/routes/auth.routes.js`, merge `src/middleware/` into `src/middlewares/`, and update `/health` endpoint to perform live MongoDB ping.

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
