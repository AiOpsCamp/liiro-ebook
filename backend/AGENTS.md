# 🤖 AGENTS & DEVELOPER GUIDE: Liiro Ebook Backend & Infrastructure

> **Purpose**: This authoritative instruction guide is for AI Agents (Antigravity, AGY, Claude, Cursor, Copilot) and human developers working on the **Liiro Ebook** product ecosystem inside the Multicamp cluster architecture.

---

## 🏗️ 1. Architecture Overview

- **Product Name**: Liiro Ebook (`liiro`)
- **Landing Domain**: `https://liiro.io` (Next.js container, port `3012`)
- **Web App Domain**: `https://app.liiro.io` (Expo Web production export served via Nginx, port `8094`)
- **API Endpoint**: `https://app.liiro.io/aiopscamp-liiro-api/` (Express API, port `5018`)
- **Cluster IP**: `46.224.188.251` (Hetzner K3s Master Node `multicamp-prod-k8s-master`)

---

## 🗄️ 2. Database Architecture (MongoDB)

Production database runs inside Kubernetes on master node `multicamp-prod-k8s-master` (`mongodb-0.multicamp.svc.cluster.local:27017`).

- **Database Name**: `liiro_prod`
- **Source Database (Reference/Clone)**: `langoread_prod`
- **Total Catalog**: 864 stories, 26,914 chapters, categories, tags, and audio links.

### 🔑 Credentials:
```env
# Production In-Cluster Connection
MONGODB_URI="mongodb://admin:PROD_PASSWORD_2026@mongodb-svc.multicamp.svc.cluster.local:27017/liiro_prod?authSource=admin"

# Local Machine Tunnel Connection (via SSH Tunnel)
MONGODB_URI="mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin"
```

---

## 💻 3. Local Development with Hetzner MongoDB

To run local backend services (`npm run dev`) connected directly to the production Hetzner MongoDB database (`liiro_prod`):

1. **Start the SSH Tunnel** (run in a separate terminal window):
   ```bash
   /Users/humayunrashid/multicamp/scripts/tunnel-hetzner-mongo.sh
   ```
   *(Or manually: `ssh -N -L 27017:127.0.0.1:27017 root@46.224.188.251`)*

2. **Run Local Server**:
   ```bash
   cd /Users/humayunrashid/multicamp/liiro-ebook/backend
   npm run dev
   ```

---

## 🚀 4. Build & Deployment Commands

The unified deployment tool is located at `/Users/humayunrashid/multicamp/deploy.sh`.

```bash
# Deploy Liiro Suite (Backend + Frontend + Landing)
/Users/humayunrashid/multicamp/deploy.sh liiro

# Deploy Liiro Backend only
/Users/humayunrashid/multicamp/deploy.sh backend-liiro

# Deploy Liiro Frontend Web App only
/Users/humayunrashid/multicamp/deploy.sh frontend-liiro

# Deploy All Multicamp Services (LangoWords + LangoReads + Liiro)
/Users/humayunrashid/multicamp/deploy.sh all
```

---

## ☁️ 5. Hetzner S3 Object Storage Credentials

```env
HETZNER_S3_KEY=KVFSGG7GLKG95GYEJOE3
HETZNER_S3_SECRET=DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK
HETZNER_S3_ENDPOINT=https://nbg1.your-objectstorage.com
HETZNER_S3_BUCKET=multicamp-prod-k8s-assets
```

---

## 🌐 6. DNS Records (Cloudflare & Namecheap)

| Type | Host | Target / Value | Purpose |
| :---: | :---: | :--- | :--- |
| **A** | `@` | `46.224.188.251` | `liiro.io` Landing Page |
| **A** | `app` | `46.224.188.251` | `app.liiro.io` Web App |
| **CNAME** | `www` | `liiro.io.` | Alias |

---

## ⚠️ 7. Strict Rules for AI Agents

1. **MongoDB URI Resolution**: `src/db/connect.js` MUST check `process.env.MONGODB_URI` first before falling back to local instances.
2. **CORS Allowlist**: Always verify domain origins in `src/config/cors-origins.js` include `https://liiro.io`, `https://app.liiro.io`, and `https://dev.app.liiro.io`.
3. **K8s Container Image Policy**: Set `imagePullPolicy: IfNotPresent` for locally built images imported into K3s containerd (`k3s ctr images import`).
