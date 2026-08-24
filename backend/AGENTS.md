# 🤖 LIIRO PRODUCT & BACKEND AGENT HANDOVER GUIDE

> **Target Service**: Liiro Ebook Web & API Service (`app.liiro.io` & `liiro.io`)  
> **Production API Health**: `https://app.liiro.io/aiopscamp-liiro-api/health`  
> **Target Database**: `liiro_prod` (56,585 documents / 864 stories / 26,914 chapters)  
> **Infrastructure Repo**: [`https://github.com/AiOpsCamp/langoprep-infra`](https://github.com/AiOpsCamp/langoprep-infra)

---

## ⚡ 1. Infrastructure Status & Integration Matrix

`INFRA_STATUS: READY`

- **In-Cluster Redis**: `redis-service.default.svc.cluster.local:6379` (BullMQ backing)
- **Distributed Worker Pods**: `liiro-backend-worker` (HPA Autoscaling **2 to 10 replicas**, concurrency **4**)
- **Target Queue**: `"liiro-audio-generation-queue"`
- **Hetzner S3 Assets**: `https://multicamp-prod-k8s-assets.nbg1.your-objectstorage.com` (CORS enabled for byte-range HLS `.m3u8` / `.ts` playback)

---

## 🎧 2. How Liiro Agent Integrates Audio Generation Queue

### A. Enqueuing Jobs from API Controllers (`src/controllers/story.controller.js`)

```javascript
const { Queue } = require("bullmq");
const { connectionOptions } = require("../config/redisConfig");

const audioQueue = new Queue("liiro-audio-generation-queue", { connection: connectionOptions });

// Example: Trigger audio generation for a chapter
async function triggerChapterAudio(storyId, chapterSlug, voiceId = "custom_mystic_narrator") {
  const job = await audioQueue.add("generate-chapter-audio", {
    storyId,
    chapterSlug,
    voiceId,
    requestedAt: new Date().toISOString()
  });

  return job.id;
}
```

### B. Worker Audio Pipeline Execution (`src/workers/audioWorker.js`)

K8s worker pods run `src/workers/audioWorker.js` continuously:
1. Picks up jobs from `"liiro-audio-generation-queue"`.
2. Runs Kokoro TTS voice synthesis & OpenAI Whisper sentence-level alignment.
3. Transcodes output into HLS `.m3u8` and byte-range `.ts` chunks.
4. Uploads assets to Hetzner S3 (`multicamp-prod-k8s-assets`).
5. Updates `liiro_prod.storychapters` document with stream URLs and sentence timestamp alignment array.

---

## 🛠️ 3. Local Machine Single-Command MongoDB Tunnel

To connect your local machine or local backend server to production `liiro_prod` MongoDB:

```bash
# Run single-command tunnel (Exposes NodePort 32017 to localhost:27017)
./scripts/tunnel-hetzner-mongo.sh

# Local .env setting:
MONGODB_URI="mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin"
```

---

## 🚢 4. Deployment Command

```bash
# Rebuild and redeploy Liiro backend & frontend to Hetzner K8s cluster
./deploy.sh liiro
```
