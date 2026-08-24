# 📊 Next-Gen Dashboard Enhancement Master Plan

> **Repository**: `https://github.com/AiOpsCamp/liiro-ebook`  
> **Target Component**: `frontend/components/ebook/EbookDashboardContent.tsx`  
> **Documentation Status**: Active Task Tracker (Updated Live)  

---

## 📋 Task Checklist & Execution Status

### 🔴 Phase 1: High-Impact UX & Audio Player Controls (Active Phase)
- [x] **Task 1.1: Daily Streak & Motivation Banner (`EbookStreakBanner.tsx`)**: Surfaced `currentStreak` (e.g. `🔥 7 Day Streak`), `xp_score` (`⚡ 450 XP`), and daily 15-minute goal progress ring directly on the main Home canvas.
- [x] **Task 1.2: Floating Bottom Mini Audio Player Bar (`EbookMiniAudioPlayer.tsx`)**: Built sticky bottom audio bar (Spotify style) displaying cover art, title, play/pause controls, 15s skip, and scrub slider for background catalog browsing.
- [x] **Task 1.3: Inline 1-Tap Quick Play on `ContinueCard.tsx`**: Added prominent 1-tap play button allowing users to resume audiobook playback directly from dashboard cards without full-screen navigation.
- [x] **Task 1.4: Modular Component Decomposition (`HomeTab.tsx`)**: Extracted monolithic home view into clean, dedicated sub-components.
- [x] **Task 1.5: 5-Tier Responsive Grid System**: Applied exact responsive grid breakpoints across mobile (<480px), mobile-large (480-767px), tablet (768-1023px), desktop web (1024-1439px), and ultra-wide (≥1440px).

---

### 🟡 Phase 2: Engagement, Personalization & Social Proof (Next Phase)
- [ ] **Task 2.1: Community Ratings & Social Badges**: Add star ratings (`⭐ 4.9`), completed reader counts (`1.2k reads`), and level pills on `StoryCard.tsx`.
- [ ] **Task 2.2: Personalized Recommendation Rails**: Wire `GET /api/v1/stories/recommendations/personalized` endpoint into dynamic home slates.
- [ ] **Task 2.3: Whispersync Cloud Sync Toast**: Alert users when cloud reading position on another device is ahead of local progress.
- [ ] **Task 2.4: Hero Banner Personalization**: Greet user dynamically ("Good morning, Alex!") with personalized quick-resume CTA.

---

### 🔵 Phase 3: Server-Side Directory Pagination & Performance (P2)
- [ ] **Task 3.1: Server-Side Directory Pagination**: Paginate `/authors`, `/categories`, `/tags` API endpoints for multi-thousand book catalog scale.
- [ ] **Task 3.2: Desktop Hover & Native Haptics**: Add `expo-haptics` touch feedback on native mobile and CSS hover transforms on Web.
