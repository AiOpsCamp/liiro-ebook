# 📱 Master User Flow & End-to-End Experience Guide: Liiro Ebook & Audiobooks

## 1. Overview

The **Liiro Ebook & Audiobooks Platform** provides a world-class, cross-platform digital reading and listening experience across iOS, Android, and Desktop Web. This guide maps out every possible user action, navigation flow, reader customization, audiobook control, and background sync process currently implemented across the platform.

---

## 2. Comprehensive User Journey Map

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             1. ONBOARDING & AUTH                                 │
│  - Guest ID Assignment (x-guest-id) OR JWT Email/Password Login & Registration   │
│  - Onboarding Preference Setup (Daily Reading Goal, Preferred Genres)            │
└────────────────────────┬─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           2. DASHBOARD & DISCOVERY                               │
│  - Hero Featured Masterwork Banner                                               │
│  - Continue Reading / Listening Widget (Whispersync Resume Prompt)               │
│  - Daily Streak & Reading Analytics Banner (Minutes Read, Streak Counter)        │
│  - Curated Slates (Top 100 Launch Masterworks, Illustrated Classics, Short Audio)│
│  - Full-Text Live Search (Title, Author, Category, Synopsis, Tags)               │
└────────────────────────┬─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         3. BOOK DETAILS & PREVIEWS                               │
│  - High-Res Cover & Metadata (Author, Category, Difficulty, Estimated Durations) │
│  - Voice Narrator Picker (11+ Studio Voices: Michael, Ana, Adam, George, Emma)   │
│  - 3+ Authentic Goodreads Reviews (Virginia Woolf, G.K. Chesterton, Oscar Wilde) │
│  - Audio Sample Player & One-Tap "Start Reading" / "Start Listening"             │
└────────────────────────┬─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   4. EBOOK READER & AUDIOBOOK ENGINE                              │
│  - 8 Reading Themes (Sepia, Midnight, Victorian Gothic, Cozy Fireside, Cyberpunk)│
│  - 5 Ambient Audio Soundscapes (Rain, Fireplace, Soft Piano, Victorian Strings)  │
│  - Real-Time Whispersync Sentence Highlighting synced to Kokoro ONNX Audio       │
│  - Text Selection Tooltip (4 Highlight Colors, Dictionary Lookup, Notes)        │
│  - CarPlay & MediaSession Background Audio Controls (Speed 0.5x-3.5x, Sleep Timer)│
└────────────────────────┬─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       5. COMMUNITY, REELS & OFFLINE                              │
│  - BookReels Vertical Video Feed (Literary Quotes & Audio Snippets)              │
│  - Offline Download Manager (Offline Text & MP3 Caching)                         │
│  - Automatic Offline Batch Progress Sync (POST /api/v1/stories/progress/batch)   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step User Actions & Feature Breakdowns

### Step 1: Onboarding & Authentication Flow
- **Guest Access**: New users can immediately explore the catalog, read chapters, and listen to audio samples as a guest. The system automatically assigns a persistent `x-guest-id` header to track transient reading progress.
- **Registered Account**: Users sign up or log in via JWT Auth. All bookmarks, progress, streak records, and custom highlights are permanently tied to their user account.
- **Reading Goal Setup**: Users set their daily reading goal (e.g., 15 mins, 30 mins, 60 mins/day).

### Step 2: Home Dashboard & Catalog Discovery
- **Hero Spotlight**: Displays hand-picked featured masterworks with one-tap play/read CTA buttons.
- **Whispersync "Continue Reading / Listening" Widget**: If a user previously left a book on another device, a glassmorphism prompt appears asking to jump directly to their exact page/audio timestamp.
- **Daily Streak & Analytics**: Real-time streak counter (fire icon), total minutes read/listened today, and weekly progress charts.
- **Curated Slates & Genre Browsing**:
  - *Top 100 Launch Masterworks*
  - *Illustrated Classics* (featuring original Tenniel, Wyeth, and Paget artwork)
  - *Short Audiobooks under 3 Hours*
  - *Gothic & Victorian Mysteries*
- **Live Search**: Full-text search across story titles, author names, categories, synopses, and tags with debounced real-time suggestions.

### Step 3: Book Details & Goodreads Community Reviews
- **Rich Book Metadata**: S3 CDN cover art, synopsis, difficulty level rating, word count, estimated reading time, and total audio narration length.
- **Voice Narrator Picker**: Switch between 11+ studio AI voices (e.g., `michael` US Male, `ana` US Female, `george` UK Male, `emma` UK Female).
- **Goodreads Literary Reviews**: Every book presents 3+ authentic reviews written by renowned critics and scholars (e.g., Virginia Woolf, G.K. Chesterton, Oscar Wilde) with critic avatar portraits.
- **Actions**:
  - `Bookmark / Favorite`: One-tap bookmarking synced to user profile.
  - `Download Offline`: Downloads text payload and multi-bitrate MP3 audio files to local device storage via `OfflineManager`.
  - `Start Reading` / `Start Listening`: Launches Reader/Audiobook screen.

### Step 4: Interactive Ebook Reader & Customization
- **8 Distinct Reading Themes**:
  - ☀️ **Pure Light** (`#FFFFFF` background, `#0F172A` text)
  - 📜 **Warm Sepia** (`#FBF7EE` background, `#433422` text)
  - 🌙 **Midnight Dark** (`#0F172A` background, `#F8FAFC` text)
  - 🖤 **Pitch OLED** (`#000000` background, `#E2E8F0` text)
  - 🏰 **Victorian Gothic** (`#121016` background, `#F1EDF7` text)
  - 🌲 **Mystic Forest** (`#0D1813` background, `#ECFDF5` text)
  - ☕ **Cozy Fireside** (`#1C1410` background, `#FEF3C7` text)
  - ⚡ **Neon Cyberpunk** (`#09090E` background, `#F4F4F5` text)
- **Typography & Font Controls**:
  - 3 Font Size Presets: Small (16px/28px), Medium (19px/34px), Large (23px/40px).
  - Custom Font Families: Lora (Classic Serif), Playfair Display (Editorial), JetBrains Mono (Technical/Clean).
- **4 Reading Modes**:
  - `Scroll`: Vertical smooth scrolling.
  - `Paginate`: Swipeable page-by-page reading.
  - `Audiobook Focus`: Dedicated audio-centric player interface.
  - `Slideshow`: Auto-advancing hands-free presentation mode.
- **5 Ambient Audio Soundscapes**:
  - Background audio ambience (Rain on Window, Fireplace Crackle, Soft Piano, Victorian Strings, Rain & Fireplace) with independent volume sliders.
- **Text Selection & Contextual Tooltip**:
  - Highlighting text opens a floating selection tooltip offering:
    - 4 Color Highlighters (Yellow, Green, Blue, Purple) with optional notes.
    - Quick Dictionary Definition lookup.
    - Text Translation preview.

### Step 5: Audiobook Engine & Whispersync Alignment
- **Sub-Second Sentence Highlighting**: As audio plays, the active sentence lights up with a soft accent glow and auto-scrolls to keep the sentence centered.
- **Separate Brand Signature & Audio Sequence**:
  - When starting Chapter 1, `AudioManager` plays the 1.5-second `liiro_signature_chime.mp3` and dynamic spoken intro header, then seamlessly transitions to Chapter 1 narration without altering the clean S3 MP3 audio file.
- **Audiobook Player Controls**:
  - Speed Multiplier: 0.5x to 3.5x.
  - Jump Skip: 5s, 10s, 15s, 30s, 45s, 60s skip backward/forward.
  - Sleep Timer: 15m, 30m, 45m, 1h, or End of Chapter with dynamic audio fade-out.
  - Background & Automotive Support: Integrates with iOS Control Center, Android Notifications, CarPlay, and Android Auto (`MediaSession`).

### Step 6: BookReels & Offline Progress Sync
- **BookReels Feed**: Vertical video feed (TikTok style) featuring quotes, audio teasers, and book recommendation clips.
- **Automatic Offline Sync**: When returning online, mobile clients send queued reading sessions via `POST /api/v1/stories/progress/batch` to update Hetzner MongoDB without losing data.
