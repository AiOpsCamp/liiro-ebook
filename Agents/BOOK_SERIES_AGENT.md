# 📚 Book Series Interconnection Agent — Operational Specification & Full Context

> **Agent Name**: `Book_Series_Agent`  
> **Role**: Dynamic OPF Series Extraction, Literary Sagas Linking, Book Series Chronology & Interconnection Manager  
> **Primary Script**: [`backend/scripts/ingest_and_link_book_series.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_and_link_book_series.js)  
> **OPF Series Scanner**: [`backend/scripts/generate_series_catalog.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_series_catalog.js)  
> **Dynamic Catalog Data**: [`backend/data/series_catalog.json`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/data/series_catalog.json)  
> **Target Database**: `liiro_prod` (`mongodb://127.0.0.1:27017/liiro_prod`)

---

## 1. How Book Series are Determined (Automated OPF Parsing)

Instead of hardcoding series lists, Standard Ebooks repositories natively declare series metadata inside `src/epub/content.opf` using standard EPUB 3 metadata properties:

```xml
<meta id="collection-1" property="belongs-to-collection">Oz</meta>
<meta property="collection-type" refines="#collection-1">series</meta>
<meta property="group-position" refines="#collection-1">2</meta>
```

### Automated Discovery Workflow:
1. **`generate_series_catalog.js`**:
   - Scans all 1,513 repository folders in `ebook-contents/`.
   - Extracts `<meta property="belongs-to-collection">` (Series Name) and `<meta property="group-position">` (Volume Order).
   - Groups books into multi-volume sagas and saves them to `backend/data/series_catalog.json`.
2. **`ingest_and_link_book_series.js`**:
   - Reads `series_catalog.json`.
   - Ingests any missing books in the series.
   - Upserts `BookSeries` documents in MongoDB.
   - Links each `stories` document with `seriesId`, `seriesName`, `seriesOrder`, and `relatedBooks`.

---

## 2. CLI Execution Commands

```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# 1. Scan OPF metadata across all 1,513 repos and generate series_catalog.json
node scripts/generate_series_catalog.js

# 2. Automatically ingest and link all discovered series sagas in MongoDB
node scripts/ingest_and_link_book_series.js
```
