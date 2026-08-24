# 📚 Liiro Ebook & Audiobooks: Master Feature & Capability Index

> **Platform**: Liiro Ebook & Audiobooks (React Native / Expo SDK 57 Web & Mobile + Node.js Express API)  
> **Benchmark Standards**: Audible, Storytel, BookBeat, Scribd, Blinkist, Kindle  

---

## 🎧 1. Audiobook & Audio Processing Engine

* 🎵 **HLS Adaptive Bitrate Audio Streaming**: Serves audio via `.m3u8` playlists and 6-second `.ts` MPEG-TS segments using FFmpeg, enabling instantaneous `<100ms` seeking without downloading full MP3 files.
* 🔒 **2-Hour HMAC SHA-256 DRM Stream Protection**: Enforces cryptographic stream token validation (`verifyStreamToken`) on HLS playlists and audio segments, blocking unauthorized hotlinking (returns `HTTP 403 Forbidden`).
* 🎙️ **Kokoro ONNX Neural Text-to-Speech Engine**: Multi-voice AI speech synthesis supporting custom narrator voice profiles (`am_adam`, `am_michael`, `af_bella`, `af_heart`).
* 🎛️ **Dual-Engine Audio Architecture**: Seamlessly handles Web Audio (`HTMLAudioElement`) and Native Mobile Audio (`expo-audio`).
* 🌙 **Sleep Timer with Dynamic Volume Fade-Out**: Interactive sleep timer modal (`EbookSleepTimerModal.tsx`) with 5m, 15m, 30m, 45m, 60m, and *"End of Chapter"* presets, smooth 5-second exponential volume fade-out, and +15 Min extension trigger.
* 📱 **MediaSession CarPlay & Lockscreen Sync**: Synchronizes cover art, title, author, and live scrubber position with iOS/Android lockscreen controls and CarPlay via `navigator.mediaSession.setPositionState`.
* ⚡ **Spotify-Style Sticky Bottom Mini Player (`EbookMiniAudioPlayer.tsx`)**: Floating bottom player bar featuring live cover art, title, play/pause, 15s skip forward, and sleep timer trigger.
* ⏩ **Variable Speed Control & Seeking**: Supports playback rates from `0.5x` to `3.5x` with 15-second skip forward/backward shortcuts.

---

## 🚗 1.6. Audible-Style Driving Car Mode UI

* 🚗 **Ultra-High Contrast Driving Layout (`/app/car-mode/[slug]`)**: Deep `#020617` dark canvas with high-contrast gold `#F59E0B` and white typography for maximum legibility while driving or exercising.
* 🔘 **Extra-Large 96px Touch Targets**: Giant center Play/Pause button and 76px Rewind/Forward 15s skip buttons designed for safe 1-tap operation without looking at the screen.
* 📌 **1-Tap Driving Bookmark & Speed Selector**: Instant 1-tap bookmark pin dropping and 1.0x to 2.0x playback speed toggling.

---

## ⚡ 1.5. Blinkist-Style "Key Takeaways" & 15-Minute Audio Summaries

* ⚡ **5-7 Key Takeaway "Blinks" (`/app/summary/[slug]`)**: Instant wisdom breakdown summarizing masterworks into 5 to 7 bullet point insights with key quotes and progress card stack navigation.
* 🎧 **15-Minute Audio Summary Player**: Dedicated fast-learning audio summary player (`GET /api/v1/stories/slug/:slug/summary`) allowing commuters to master any book in under 15 minutes.
* 🏷️ **1-Tap Details Action Badge**: Interactive *"Key Takeaways ⚡"* badge on every book details page (`details/[slug].tsx`).

---

## 📖 2. Reader & Typography Experience

* 🎤 **Whispersync Sentence & Word-Level Karaoke**: Highlights active sentences and words in real-time synchronized with audio timestamps generated via OpenAI Whisper forced alignment.
* 🎨 **8 Aesthetic Reading Themes**: Light, Sepia, Dark, OLED Pitch Black, Victorian Gothic, Forest, Cozy, and Cyber.
* 🌲 **5 Immersive Vibe Presets**: Pair color palettes with ambient soundscapes (`Cozy Fireside`, `Victorian Gothic`, `Mystic Forest`, `Midnight Classic`, `Quiet Study`).
* 🔤 **Custom Typography Engine**: Premium Google Fonts (`Lora` Serif, `Playfair Display`, `JetBrains Mono`, `SF Pro / Roboto`).
* 📐 **Slider Font Control & Responsive Container Widths**: Font size scaling (12px to 32px) and desktop container width switcher (540px, 680px, 880px, 1100px, 1400px, 96%).
* 🛠️ **Interactive Selection Tooltip (`EbookTextSelectionTooltip.tsx`)**: Text selection menu offering instant Dictionary API definitions, 4-color highlight tags (Yellow, Blue, Pink, Green), and Instant Translation preview.

---

## 👨‍👩‍👧 3. Family Profiles & Kids Mode (BookBeat Parity)

* 👥 **Multi-Profile Family Sub-Accounts**: Support up to **5 family sub-accounts per subscription** with isolated reading progress, bookmarks, and last-read positions.
* 🔐 **4-Digit Parental PIN Lock (`ParentalPinModal.tsx`)**: Cryptographic 4-digit PIN lock required to switch away from Kids Mode or access account settings.
* 🧒 **Age-Tier Content Gating**: Content filtering by age brackets (`0-3`, `3-6`, `6-9`, `9-12` years) for safe children's reading environments.
* 🖼️ **Interactive Profile Switcher Screen (`/app/profiles/index.tsx`)**: Visual profile avatar grid showing active profile status, Kids Mode badges (`KIDS`), age tier tags, and lock icons.

---

## 📊 4. Gamification, Reading Streaks & Analytics

* 🔥 **Daily Reading Streak Banner (`EbookStreakBanner.tsx`)**: Displays real-time reading streak (`🔥 7 Day Streak`), user XP (`⚡ 450 XP`), 15-minute daily reading progress ring, and interactive 7-day habit checkmark pills.
* 📈 **User Reading Analytics API**: Endpoints for overall reading summary (`getUserAnalyticsSummary`) and 365-day heatmaps (`getUserAnalyticsHeatmap`).
* 🎨 **Social Quote Card Generator**: Server-side SVG quote card generator (`generateQuoteCard`) and open-graph metadata for sharing quotes to social media.

---

## ⚡ 5. Dashboard, Discovery & Infrastructure

* 🚀 **90ms Cached Dashboard Engine**: High-performance dashboard endpoint (`getStoriesDashboard`) utilizing `CacheManager` 300s TTL slate caching.
* ✨ **"Recommended For You" AI Rail**: Content-based recommendation engine (`vectorSearch.service.js`) computing cosine similarity across genre, tags, difficulty level, and user reading history.
* ⚡ **"Quick Listens (< 3 Hours)" Slate**: Curated dashboard rail filtering short audiobooks under 3 hours duration.
* ⭐ **"Editor's Top 100 Picks" Slate**: Showcases featured literary masterworks ranked by editorial score.
* 📄 **Server-Side Directory Pagination**: Scales multi-thousand book catalogs via `?page=1&limit=24` and search filtering on `/authors`, `/categories`, `/tags`.
* 🔄 **Decoupled Non-Blocking Scraping**: Asynchronous background scraping for Standard Ebooks delivering instant **161ms** HTTP responses.
* 📚 **OPDS v2 Catalog Feeds**: Open Publication Distribution System (OPDS v2 JSON & Atom XML) endpoints (`/opds/v2/catalog`) for e-readers like KOReader, BookFusion, and Thorium.

---

## 💳 6. Monetization & Metered Hourly Subscription Engine

* ⏱️ **Metered Listening Quota Engine**: Tracks monthly audio listening hours (`20h` Basic / `100h` Premium) via 30s heartbeat API (`POST /api/v1/billing/listening-session`).
* 💳 **Stripe & RevenueCat Webhooks**: Real-time lifecycle webhooks (`handleStripeWebhook`, `handleRevenueCatWebhook`) for Web credit cards, iOS App Store, and Google Play Store subscriptions.
* 🛍️ **User Billing & Checkout API**: Endpoints to check subscription status (`GET /billing/subscription`), generate Stripe Checkout sessions (`POST /billing/create-checkout-session`), and open Stripe Customer Portals (`POST /billing/portal-session`).
