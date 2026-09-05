# 📚 Book Series Full Ingestion Agent — Operational Specification & Full Context

> **Agent Name**: `Series_Full_Ingestion_Agent`  
> **Role**: Multi-Volume Literary Saga Ingestion, Cover S3 Upload, Neural Audio Synthesis & Series Interconnection Manager  
> **Primary Script**: [`backend/scripts/deploy_series_batch.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/deploy_series_batch.js)  
> **OPF Series Catalog**: [`backend/data/series_catalog.json`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/data/series_catalog.json)  
> **Ingestion Engine**: [`backend/scripts/ingest_standard_ebook.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js)  
> **Audio Production Engine**: [`backend/scripts/generate_audio_parallel_master.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_parallel_master.py)  
> **Target Database**: `liiro_prod` (`mongodb://127.0.0.1:27017/liiro_prod`)

---

## 1. Context & Responsibilities

The `Series_Full_Ingestion_Agent` takes a specific Book Series name or query (e.g., `oz`, `sherlock-holmes`, `doctor-dolittle`, `alice`, `tarzan`, `voyages-extraordinaires`, `arsene-lupin`) and automatically ingests, uploads artwork to S3, synthesizes audiobooks, and links all volumes in MongoDB in chronological order (Volume 1, 2, 3...).

### Core Automated Pipeline:
1. **Series Metadata Matching**:
   - Queries `series_catalog.json` for the requested series slug or title keyword.
2. **Volume-by-Volume Ingestion**:
   - Iterates through all volumes in chronological order (Volume 1 $\rightarrow$ Volume N).
   - Ingests text, chapter structure, subjects, Goodreads reviews, and uploads covers/artwork to Hetzner S3 CDN.
3. **Optional Neural Audio Production (`--audio` / `--ch1-only`)**:
   - Synthesizes neural audiobooks for each volume using Kokoro TTS ONNX with `--workers 4` parallel execution.
4. **MongoDB Series & Related Books Interconnection**:
   - Links every book in the series together in `BookSeries` MongoDB collection and populates `relatedBooks` array on each `stories` document.

---

## 2. CLI Execution Commands

```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# 1. Ingest ALL books in The Wizard of Oz Series
node scripts/deploy_series_batch.js oz

# 2. Ingest ALL books in Sherlock Holmes Series with Chapter 1 Audio
node scripts/deploy_series_batch.js sherlock --audio --ch1-only

# 3. Ingest ALL books in Doctor Dolittle Series with Full Parallel Audio
node scripts/deploy_series_batch.js dolittle --audio

# 4. Ingest ALL books in Jules Verne's Extraordinary Voyages Series
node scripts/deploy_series_batch.js voyages --audio --ch1-only

# 5. Ingest ALL books in Tarzan Series
node scripts/deploy_series_batch.js tarzan --audio --ch1-only
```
