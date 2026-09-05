# 🤖 Liiro Ebook — Autonomous Multi-Agent Swarm Registry & Operational Guide

Welcome to the **Liiro Ebook Autonomous Agent Framework**. This directory contains the complete domain context, system prompts, operational rules, executable CLI commands, and automated error-recovery protocols for all specialized AI agents operating on the Liiro platform.

Whenever you request a task (e.g. *"ingest Oz series"*, *"deploy children category"*, *"generate audio for Y"*, or *"audit dashboard UI"*), the parent orchestrator activates the matching agent with 100% full context.

---

## 🏛️ Master Agent Directory

| Agent Name & File Path | Role & Specialization | Trigger Command Examples |
| :--- | :--- | :--- |
| **`Series_Full_Ingestion_Agent`**<br>[`Agents/SERIES_FULL_INGESTION_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/SERIES_FULL_INGESTION_AGENT.md) | **Book Series Full Ingestion Specialist**: Ingests, uploads covers to Hetzner S3, generates audiobooks, and links ALL volumes of a specific book series (`oz`, `sherlock`, `dolittle`, `alice`, `tarzan`, `voyages`, `arsene-lupin`). | • *"Ingest all books in Oz series"*<br>• *"Deploy Sherlock Holmes series with audio"*<br>• *"Ingest Doctor Dolittle series"* |
| **`Category_Batch_Deployment_Agent`**<br>[`Agents/CATEGORY_BATCH_DEPLOYMENT_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/CATEGORY_BATCH_DEPLOYMENT_AGENT.md) | **Category-Wide Full Batch Deployment Specialist**: Automatically ingests, uploads covers/artworks to Hetzner S3, synthesizes audiobooks, and deploys ALL books in an entire category (`children`, `gothic`, `victorian`, `philosophy`, `scifi`, `mystery`). | • *"Deploy all books in Children's category"*<br>• *"Deploy Gothic category with audio"*<br>• *"Deploy Victorian literature category"* |
| **`Ebook_Import_Agent`**<br>[`Agents/EBOOK_IMPORT_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/EBOOK_IMPORT_AGENT.md) | Standard Ebooks GitHub repo discovery, XHTML parsing, Hetzner S3 artwork/cover upload, Goodreads reviews auto-seeding, narrative diff validation. | • *"Import repo bram-stoker_dracula"*<br>• *"Ingest top 10 books batch"* |
| **`Parallel_Audio_Agent`**<br>[`Agents/PARALLEL_AUDIO_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/PARALLEL_AUDIO_AGENT.md) | Kokoro TTS ONNX neural speech synthesis, multi-process CPU worker execution (`--workers 4`), `--ch1-only` and `--chapters` filtering, title duplication prevention, immediate per-chapter S3 upload & Mongo linking, OpenAI Whisper Whispersync alignment generation. | • *"Generate Ch 1 audio for dracula"*<br>• *"Generate parallel audio for the-war-of-the-worlds with 4 workers"* |
| **`Book_Series_Agent`**<br>[`Agents/BOOK_SERIES_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/BOOK_SERIES_AGENT.md) | Literary sagas interconnection, Oz/Dolittle/Alice series sequencing, `series` collection database management, and related books recommendation logic. | • *"Ingest and link the Oz series"*<br>• *"Check related books for Doctor Dolittle"* |
| **`Frontend_UI_Agent`**<br>[`Agents/FRONTEND_UI_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/FRONTEND_UI_AGENT.md) | Expo React Native cross-platform responsive design (iOS, Android, Tablet, Web), zero Tailwind class reference enforcement (`style={{ ... }}` only), glassmorphism card elevation, Apple/Audible UI standards. | • *"Redesign details screen"*<br>• *"Fix cover image visibility"* |
| **`Production_Health_Agent`**<br>[`Agents/PRODUCTION_HEALTH_AGENT.md`](file:///Users/humayunrashid/multicamp/liiro-ebook/Agents/PRODUCTION_HEALTH_AGENT.md) | SSH tunnel management (`127.0.0.1:27017` -> Hetzner K3s MongoDB), backend Express API health checks, 30/30 integration test suite execution, performance indexing. | • *"Check production database connection"*<br>• *"Run backend API test suite"* |

---

## ⚡ How to Deploy Any Agent

You can deploy any agent at any time by giving a simple instruction in Bengali or English, for example:
- **`"Deploy Series Full Ingestion Agent for Oz series"`**
- **`"Deploy Category Batch Agent for Children's Classics"`**
- **`"Deploy Ebook Import Agent for lewis-carroll_alices-adventures-in-wonderland"`**
- **`"Deploy Parallel Audio Agent for dracula with --ch1-only"`**
- **`"Deploy Frontend UI Agent to audit the details screen"`**

The orchestrator will load the full specification from the corresponding file in `Agents/` and execute the pipeline with 100% accuracy.
