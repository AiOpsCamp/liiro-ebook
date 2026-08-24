# 🎨 Liiro Ebook Frontend Architecture Specification

> **Single Source of Truth** for Frontend UI/UX Screens, Reader Engines, Audio Players, Router Structure, and Mobile/Web Compatibility  
> **Frontend Path**: `frontend/`  
> **Port**: `8086`  
> **Framework**: Expo (React Native / React Native Web) + Expo Router  
> **State Management**: Redux Toolkit + RTK Query  

---

## 🟢 1. Implemented Frontend Capabilities (Completed & Live)

### 🎨 1.1 Brand Identity & Auth Redesign
- **Liiro EBOOK Logo Emblem**:
  - Gradient icon badge (`#0EA5E9` ➔ `#6366F1`) with `BookOpen` icon.
  - Bold `Liiro` typography + styled `EBOOK` pill.
- **Redesigned Auth Screens** ([`app/(auth)/login.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/(auth)/login.tsx), [`register.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/(auth)/register.tsx)):
  - Tactile input fields with `#0EA5E9` focus rings.
  - Dual OAuth: Google Sign-In (`GoogleAuthService` & `firebaseExchange`) + Apple Sign-In (`expo-apple-authentication`).
  - Safe SSR window reference handling (`typeof window !== 'undefined'`).

---

### 🛡️ 1.2 Strict Route Protection & Root Navigation Guard
- **Root Navigation Guard** ([`app/_layout.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/_layout.tsx)):
  - Protects private routes (`/`, `/explore`, `/details/[slug]`, `/read/[slug]`, `/author/[slug]`, `/category/[slug]`).
  - Automatically redirects unauthenticated users visiting protected screens to `/login`.
  - Automatically redirects authenticated users visiting `/login` or `/register` back to `/`.

---

### 📌 1.3 Single-Row Navbar & Profile Avatar Menu
- **Single-Row Layout** ([`components/ebook/EbookDashboardContent.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/components/ebook/EbookDashboardContent.tsx)):
  - Single-row flex container without line wrapping.
  - Left branding: Liiro EBOOK badge logo.
  - Pinned far-right profile avatar (`ProfileNavbarMenu.tsx` with `flexShrink: 0`) outside horizontal tab scroll container.
- **Profile Navbar Menu** ([`components/ebook/ProfileNavbarMenu.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/components/ebook/ProfileNavbarMenu.tsx)):
  - Guest mode: "Sign In" / "Get Started" buttons.
  - Logged-in mode: User avatar modal, user name/email, streak stats, theme toggle, and Log Out modal.

---

### 📖 1.4 Ebook Reader & Audio Player UI Screens
- **Dashboard Screen** ([`app/index.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/index.tsx)): Hero carousel, continue reading cards, featured books, genres, and authors.
- **Book Details Screen** ([`app/details/[slug].tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/details/[slug].tsx)): Book header, chapter list, author bio, sample audio player, and download button.
- **Reader Screen** ([`app/read/[slug].tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/read/[slug].tsx)): Monolithic reader display, karaoke text highlighter, themes (Sepia, OLED, Dark, Gothic, Forest, Cyber), font controls, and sleep timer.
- **Explore Screen** ([`app/explore.tsx`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend/app/explore.tsx)): Catalog search, CEFR levels (A1–C2), 17 tags, and grid/list view toggles.

---

## 🎉 2. Frontend Infrastructure Summary

All planned frontend tasks (RTK Query Authorization Headers, DRM Stream Tokens, Whispersync Reader UI, `expo-audio` Cross-Platform Engine, Offline Storage Manager, and Monolithic Reader Component Decomposition) are **100% completed, verified live, and running on port 8086**.
