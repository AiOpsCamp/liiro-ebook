# ⚡ BullMQ + Redis Distributed Queue & K8s Architecture Guide

> **Single Source of Truth** for BullMQ Queue Migration, Worker Deployment, and Multicamp Kubernetes (K8s) Integration  
> **Paths**: `backend/src/queues/audioQueue.js`, `backend/src/workers/audioWorker.js`, `backend/k8s/`  
> **Updated**: August 24, 2026  

---

## 🎯 1. Overview & Architecture

To support scaling audio generation, text cleaning, Kokoro ONNX synthesis, and HLS transcoding across multi-server Kubernetes clusters, the backend queue was migrated from an in-memory queue to **BullMQ with Redis backing**:

```mermaid
flowchart TD
    subgraph K8s Cluster (multicamp)
        API1[Express API Pod 1]
        API2[Express API Pod 2]
        
        REDIS[(Redis ClusterIP Service redis-service:6379)]
        
        W1[BullMQ Worker Pod 1 - 4 Workers]
        W2[BullMQ Worker Pod 2 - 4 Workers]
        W3[BullMQ Worker Pod N - HPA Auto-scaled]
    end

    subgraph Storage & Cloud Output
        S3[(Hetzner S3 multicamp-prod-storage)]
        DB[(MongoDB liiro_prod)]
    end

    API1 -- Enqueue Job --> REDIS
    API2 -- Enqueue Job --> REDIS
    
    REDIS -- Pull Jobs --> W1
    REDIS -- Pull Jobs --> W2
    REDIS -- Pull Jobs --> W3

    W1 -- Upload MP3 & HLS --> S3
    W2 -- Upload MP3 & HLS --> S3
    W3 -- Update Chapter --> DB
```

---

## 🛠️ 2. Key Components Created

| Component | Path | Description |
| :--- | :--- | :--- |
| **Redis Config** | [`src/config/redisConfig.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/config/redisConfig.js) | Connects to `REDIS_HOST` or `REDIS_URL` with exponential reconnect strategy. |
| **BullMQ Queue** | [`src/queues/audioQueue.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/queues/audioQueue.js) | Enqueues jobs to Redis with exponential backoff retries (`attempts: 3`). Falls back to memory queue if Redis is unreachable. |
| **Standalone Worker** | [`src/workers/audioWorker.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/src/workers/audioWorker.js) | Multi-threaded worker process running inside K8s worker pods. Executes speech synthesis & HLS transcoding. |
| **K8s Redis** | [`k8s/redis-deployment.yaml`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/k8s/redis-deployment.yaml) | Deployment and ClusterIP service (`redis-service`) exposing port 6379 in the cluster. |
| **K8s Worker Pods**| [`k8s/worker-deployment.yaml`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/k8s/worker-deployment.yaml) | Worker pod deployment with Horizontal Pod Autoscaler (HPA) auto-scaling from 2 to 10 pods based on CPU utilization. |

---

## 🚀 3. Local & K8s Deployment Commands

### 3.1 Local Development (Redis via Docker or brew)
```bash
# 1. Start local Redis
brew services start redis  # or docker run -p 6379:6379 -d redis:7-alpine

# 2. Run API backend (Port 5012)
npm start

# 3. Run standalone worker process in a separate terminal
node src/workers/audioWorker.js
```

### 3.2 Multicamp Kubernetes (K8s) Deployment
```bash
# 1. Deploy Redis service to K8s cluster
kubectl apply -f backend/k8s/redis-deployment.yaml

# 2. Deploy BullMQ Audio Worker pods and HPA
kubectl apply -f backend/k8s/worker-deployment.yaml

# 3. Check worker pod status & autoscaling
kubectl get pods -l app=liiro-backend-worker
kubectl get hpa liiro-backend-worker-hpa
```
