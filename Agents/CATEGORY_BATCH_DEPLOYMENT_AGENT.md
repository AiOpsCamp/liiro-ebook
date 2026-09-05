# 🏷️ Category Batch Deployment Agent — Operational Specification & Full Context

> **Agent Name**: `Category_Batch_Deployment_Agent`  
> **Role**: Category-Wide End-to-End Book Ingestion, Image CDN Upload, Audio Synthesis & Production Batch Deployment Specialist  
> **Primary Script**: [`backend/scripts/deploy_category_batch.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/deploy_category_batch.js)  
> **Ingestion Engine**: [`backend/scripts/ingest_standard_ebook.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/ingest_standard_ebook.js)  
> **Audio Production Engine**: [`backend/scripts/generate_audio_parallel_master.py`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/scripts/generate_audio_parallel_master.py)  
> **Target Database**: `liiro_prod` (`mongodb://127.0.0.1:27017/liiro_prod`)

---

## 1. Context & Responsibilities

The `Category_Batch_Deployment_Agent` is designed to take an entire literary category (e.g., `Children's Classics`, `Gothic & Dark Fantasy`, `Victorian Literature`, `Philosophy`, `Sci-Fi`, `Mystery & Detective`) and deploy EVERY book in that category end-to-end properly.

### Core Automated Pipeline:
1. **Category Book Discovery**:
   - Inspects the full catalog for all books matching the specified category slug or genre tags.
2. **XHTML Ingestion & Hetzner S3 Artwork CDN Upload**:
   - Ingests text, chapter structures, difficulty levels, and subjects.
   - Uploads cover images and embedded illustrations to Hetzner S3 CDN (`LangoReads-Prod/ebooks/<slug>/images/...`).
   - Auto-seeds Goodreads reviews and Sparks executive key takeaways.
3. **Parallel Neural Audio Production (`--audio` / `--ch1-only`)**:
   - Synthesizes audiobooks for all books in the category using Kokoro TTS ONNX with `--workers 4` parallel CPU execution.
   - Uploads MP3 files to Hetzner S3 CDN and immediately links MongoDB (`hasAudio: true`).
4. **Series Interconnection & Related Books**:
   - Automatically links any multi-book sagas within the category (e.g. *Oz Series*, *Doctor Dolittle Series*, *Alice Series*).
5. **Quality Audit & Verification**:
   - Verifies 100% word-match diffs and HTTP 200 OK responses for all books in the category.

---

## 2. CLI Execution Commands

```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# 1. Ingest ALL books in Children's Classics category (text & covers)
node scripts/deploy_category_batch.js children

# 2. Ingest ALL books in Gothic & Dark Fantasy category with Chapter 1 Audio
node scripts/deploy_category_batch.js gothic --audio --ch1-only

# 3. Ingest ALL books in Victorian Literature category with Full Parallel Audio
node scripts/deploy_category_batch.js victorian --audio

# 4. Ingest ALL books in Philosophy category
node scripts/deploy_category_batch.js philosophy --audio --ch1-only

# 5. Ingest ALL books in Sci-Fi & Dystopian category
node scripts/deploy_category_batch.js scifi --audio --ch1-only

# 6. Ingest ALL books in Mystery & Detective category
node scripts/deploy_category_batch.js mystery --audio --ch1-only
```

---

## 3. Supported Categories & Repositories

| Category Key | Category Name | Books Count | Example Titles / Repositories |
| :--- | :--- | :---: | :--- |
| **`children`** | Children's Classics | 14 Books | *The Wonderful Wizard of Oz*, *Ozma of Oz*, *Alice's Adventures in Wonderland*, *Through the Looking-Glass*, *Peter and Wendy*, *Doctor Dolittle*, *Winnie-the-Pooh*, *Pinocchio*, *Wind in the Willows* |
| **`gothic`** | Gothic & Dark Fantasy | 5 Books | *Dracula*, *Frankenstein*, *Dr. Jekyll & Mr. Hyde*, *The Picture of Dorian Gray*, *Poe's Short Fiction* |
| **`victorian`** | Victorian Literature | 6 Books | *A Christmas Carol*, *Great Expectations*, *A Tale of Two Cities*, *Pride and Prejudice*, *Jane Eyre*, *Wuthering Heights* |
| **`philosophy`** | Philosophy & Ethics | 5 Books | *Marcus Aurelius Meditations*, *Plato's Republic*, *Sun Tzu Art of War*, *Thus Spake Zarathustra*, *Tao Te Ching* |
| **`scifi`** | Sci-Fi & Dystopian | 5 Books | *The War of the Worlds*, *The Time Machine*, *The Invisible Man*, *20,000 Leagues Under the Seas*, *We* |
| **`mystery`** | Mystery & Detective | 4 Books | *Sherlock Holmes*, *The Hound of the Baskervilles*, *A Study in Scarlet*, *The Woman in White* |
