# 🌩️ Generating Audio Directly on Hetzner Cloud Server & K8s Cluster

> **Single Source of Truth** for Running Audio Generation directly on Hetzner Compute Nodes & Kubernetes Pods  
> **Server IP**: `46.224.188.251`  
> **Updated**: August 24, 2026  

---

## 🎯 1. Overview

Yes! Audio generation can run directly on your **Hetzner Dedicated/Cloud Server** (`46.224.188.251`) or inside your **Multicamp Hetzner K8s Cluster Pods**.

Running audio generation on Hetzner offers:
- 🚀 **10Gbps Internal Network**: Blazing fast upload speed to Hetzner Object Storage (`multicamp-prod-k8s-assets`).
- ⚡ **Multi-Core High-Performance CPU**: Faster ONNX neural speech synthesis across 16+ CPU cores.
- 0️⃣ **Zero Local CPU Usage**: Offloads synthesis entirely from your laptop.

---

## 🛠️ 2. Method 1: Running via Hetzner K8s Worker Pods (Automated)

Our BullMQ Worker Pods (`liiro-backend-worker`) run continuously on Hetzner Kubernetes:

```bash
# 1. Check active worker pods running on Hetzner K8s
kubectl get pods -l app=liiro-backend-worker

# 2. Trigger audio generation by enqueuing a job to Redis (From API or script)
# The Hetzner worker pods pick up the job and synthesize audio automatically!
```

---

## 💻 3. Method 2: Running via SSH on Hetzner Server (`46.224.188.251`)

You can SSH into your Hetzner server and execute `run_full_pipeline.py`:

```bash
# 1. SSH into Hetzner Server
ssh root@46.224.188.251

# 2. Navigate to codebase
cd /root/multicamp/liiro-ebook  # or /var/www/liiro-ebook

# 3. Execute audio pipeline for any book slug
python3 backend/audio_pipeline/run_full_pipeline.py \
  --slug the-strange-case-of-dr-jekyll-and-mr-hyde \
  --voice am_adam \
  --upload \
  --hls
```

---

## 🐳 4. Method 3: Running via `kubectl exec` inside Hetzner Pod

To execute a manual single-book pipeline directly inside an active Hetzner K8s pod:

```bash
# Run audio pipeline inside an active Hetzner worker container
kubectl exec -it deployment/liiro-backend-worker -- \
  python3 audio_pipeline/run_full_pipeline.py \
    --slug the-strange-case-of-dr-jekyll-and-mr-hyde \
    --voice am_adam \
    --upload \
    --hls
```
