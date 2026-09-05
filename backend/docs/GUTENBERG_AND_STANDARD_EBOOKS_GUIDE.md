# 📚 Standard Ebooks & Project Gutenberg Ingestion Architecture Guide

> **Document Version**: 2.0 (Production Multi-Source Ingestion & Audio Pipeline)  
> **Last Updated**: August 30, 2026  
> **Repository Root**: `/Users/humayunrashid/multicamp/liiro-ebook`

---

## 📁 Repository Directory Structure

All book sources share the exact same clean, semantic Standard Ebooks XHTML5 & OPF specification and live side-by-side in the repository:

```text
liiro-ebook/
├── ebook-contents/                              <-- 📖 Standard Ebooks Catalog (1,515 Repositories)
│   ├── lewis-carroll_alices-adventures-in-wonderland/
│   │   ├── src/epub/
│   │   │   ├── content.opf
│   │   │   ├── toc.xhtml
│   │   │   ├── css/ (core.css, local.css)
│   │   │   ├── images/
│   │   │   └── text/ (chapter-1.xhtml, ...)
│   ├── j-m-barrie_peter-and-wendy/
│   └── ...
│
└── gutenberg/                                   <-- 🏛️ Project Gutenberg Catalog (Standard Ebooks Format)
    ├── import_gutenberg_to_standard_ebook.py   <-- ⚡ 1-Click Gutenberg-to-StandardEbooks Importer
    ├── arthur-conan-doyle_the-adventures-of-sherlock-holmes/
    │   ├── src/epub/
    │   │   ├── content.opf
    │   │   ├── toc.xhtml
    │   │   ├── css/ (core.css, local.css)
    │   │   ├── images/
    │   │   └── text/ (chapter-1.xhtml, ...)
    ├── h-g-wells_the-time-machine/
    └── ...
```

---

## 🚀 Gutenberg Import Workflow (Step-by-Step)

### 1. Download & Generate Standard Ebooks Repository from Gutenberg
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/gutenberg

# Import by Project Gutenberg Ebook ID:
python3 import_gutenberg_to_standard_ebook.py 1661    # The Adventures of Sherlock Holmes
python3 import_gutenberg_to_standard_ebook.py 35      # The Time Machine
python3 import_gutenberg_to_standard_ebook.py 2701    # Moby Dick
```

### 2. Ingest into Liiro Production Database & S3 CDN
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# Ingest Gutenberg or Standard Ebooks repo:
node scripts/ingest_standard_ebook.js arthur-conan-doyle_the-adventures-of-sherlock-holmes
```

### 3. Generate Studio Audiobooks (Kokoro TTS + Whisper Forced Alignment)
```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# Generate Audio for specific book or chapter:
PYTHONUNBUFFERED=1 python3 -u scripts/generate_audio_single_master.py \
  the-adventures-of-sherlock-holmes \
  --voices ana,michael \
  --qualities standard \
  --parallel 2
```

---

## 💎 Features & Standards
- **Semantic XHTML5**: Preserves `<section epub:type="chapter">`, `<hgroup>`, `<h2 epub:type="ordinal">`, `<h3 epub:type="title">`, and clean `<p>...</p>`.
- **Smart Typography**: Auto-converts ASCII quotes to curly smart quotes (`“ ”`, `‘ ’`), converts double hyphens to em-dashes (`—`), and ellipses (`…`).
- **Goodreads Auto-Seeding**: Auto-generates 3 authentic scholar reviews per book upon ingestion.
- **Whispersync Timestamps**: Generates sample-accurate start/end timestamps per sentence and per paragraph for synchronized reading highlights.
