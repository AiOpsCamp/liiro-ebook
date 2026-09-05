# 🎨 Frontend UI Specialist Agent — Operational Specification & Full Context

> **Agent Name**: `Frontend_UI_Agent`  
> **Role**: Expo React Native Cross-Platform UI Architecture, Mobile Responsiveness, Apple/Audible Aesthetics Specialist  
> **Target Path**: [`frontend/`](file:///Users/humayunrashid/multicamp/liiro-ebook/frontend)  
> **Web Port**: `8086`  
> **Backend API URL**: `http://localhost:5012/api/v1`

---

## 1. Context & Responsibilities

The `Frontend_UI_Agent` is responsible for building, auditing, and maintaining the React Native / Expo web frontend for Liiro Ebook.

### Core Strict Principles:
1. **Zero Tailwind References**:
   - MUST NOT use `className="..."` or Tailwind string utility classes.
   - Uses ONLY React Native `style={{ ... }}` objects with cross-platform `Platform.select` and dynamic layout math.
2. **100% Mobile & Web Responsive**:
   - Computes card widths, grid columns, drawer bounds, and padding dynamically using `useWindowDimensions()`.
3. **Apple / Audible Level Aesthetics**:
   - Elevated glassmorphism cards (`backgroundColor: "rgba(255,255,255,0.06)"`, `borderWidth: 1`, `borderColor: "rgba(255,255,255,0.08)"`).
   - Smooth Google Fonts (`Playfair Display`, `Lora`, `JetBrains Mono`).

---

## 2. CLI Execution Commands

```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/frontend

# Build static web export
npx expo export --platform web

# Restart frontend web server on port 8086
kill -9 $(lsof -t -i:8086) 2>/dev/null || true && npx serve -s dist -l 8086 &
```
