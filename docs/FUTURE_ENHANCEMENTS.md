# 🔭 Liiro Ebook: Gap Analysis & Future Enhancements Roadmap

> **Comprehensive System Audit for Next-Tier Enterprise Features**  
> **Repository**: [`github.com/AiOpsCamp/liiro-ebook`](https://github.com/AiOpsCamp/liiro-ebook)  
> **Updated**: August 24, 2026  

---

## 📊 1. System Implementation Status Summary

| Infrastructure Layer | Core Requirements Status | Implemented Components |
| :--- | :--- | :--- |
| **Backend Core** | ✅ **100% Complete** | JWT Auth, DRM HMAC Stream Tokens, Whispersync Engine, HLS Transcoder, Caching, Projections, Indexes |
| **Backend Feed & Billing**| ✅ **100% Complete** | OPDS 2.0 Catalog Feed, Stripe & RevenueCat Webhooks, Vector Recommendations |
| **Audio Pipeline** | ✅ **100% Complete** | Cleaner (Header Deduplication & Markdown/HTML Stripper), Kokoro ONNX Synthesizer, Whispersync Aligner, HLS Transcoder, S3 Uploader, Custom Voice Blender & Zero-Shot Cloner |
| **Frontend Core** | ✅ **100% Complete** | Single-Row Navbar, Root Guard, `expo-audio` Cross-Platform Engine, CORP CORS Fix, Whispersync Resume Modal, Decomposed Reader Sub-Components |
| **Frontend Offline** | ✅ **100% Complete** | `OfflineManager` local story payload and audio downloader using `expo-file-system` |

---

## ⚙️ 2. Recommended Backend Next-Tier Enhancements

While all core backend services are production-ready, the following advanced extensions can be added for massive multi-node scale:

### 🔮 2.1 Distributed Worker Queue (BullMQ + Redis)
- **Current State**: Audio generation and HLS transcoding run via local background scripts (`run_full_pipeline.py`).
- **Next Tier**: Migrate `audioQueue.js` to BullMQ with Redis backing to support multi-server worker clusters processing thousands of books concurrently with automatic retries and webhook notifications.

### 🔮 2.2 EPUB & PDF Book Exporter
- **Endpoint**: `GET /api/v1/stories/slug/:slug/export?format=epub`
- **Functionality**: Packages MongoDB chapter text, cover images, and TOC metadata into valid `.epub` files for external e-readers (Kindle, Kobo, Apple Books).

### 🔮 2.3 Real-Time WebSockets Whispersync (`socket.io`)
- **Current State**: Whispersync position sync runs via 10-second periodic REST HTTP POST requests.
- **Next Tier**: Establish a 0ms latency WebSocket connection (`socket.io`) so reading position seamlessly jumps across open browser tabs and mobile devices in real time.

---

## 🎨 3. Recommended Frontend Next-Tier Enhancements

### 🔮 3.1 Custom Typography Font Loader (`expo-font`)
- **Current State**: System fonts and standard serif/sans fonts are used.
- **Next Tier**: Preload premium serif fonts (`Lora`, `PlayfairDisplay`) and monospace fonts (`JetBrainsMono`) via `expo-font` in `_layout.tsx` for iOS/Android native reader typography pickers.

### 🔮 3.2 Contextual Text Selection Tooltip (Dictionary & Highlights)
- **Functionality**: Long-press text selection in the reader displays a floating toolbar:
  - 📖 **Dictionary Lookup**: Instant definition modal for complex vocabulary words.
  - 🎨 **Multi-Color Highlighting**: Highlight text in Yellow, Green, Blue, or Pink.
  - 📝 **Note Taking**: Attach custom notes to selected quotes.

### 🔮 3.3 3D Page Curl Animations (Paginated Mode)
- **Functionality**: Add 3D page flip curl transitions (`react-native-page-flipper` / Web ViewTransitions) when reading in paginated mode.

### 🔮 3.4 Native CarPlay & Android Auto Dashboard Integration
- **Functionality**: Extend `AudioManager` background media controls to display native CarPlay and Android Auto book covers and chapter skip controls when driving.
