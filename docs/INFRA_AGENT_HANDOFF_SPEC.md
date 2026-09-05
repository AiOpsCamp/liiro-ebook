# 🚀 Infrastructure Agent Handoff Specification

> **Instructions for DevOps / Infrastructure Agent**  
> **System**: Liiro Ebook Microservices Architecture  
> **Repository**: [`github.com/AiOpsCamp/liiro-ebook`](https://github.com/AiOpsCamp/liiro-ebook)  
> **Updated**: August 24, 2026  

---

## 📋 Summary of Required Infrastructure Provisioning

Dear Infra Agent, please execute the following deployment steps on our **Multicamp Kubernetes (K8s)** cluster and Hetzner Object Storage environment:

---

## 1. Kubernetes Redis Deployment (`redis-service`)

Deploy the ClusterIP Redis service required by BullMQ distributed audio queue:

```bash
# 1. Apply Redis Deployment and Service
kubectl apply -f backend/k8s/redis-deployment.yaml

# 2. Verify Redis Service status
kubectl get pods -l app=redis
kubectl get svc redis-service
```

---

## 2. Kubernetes Audio Worker Deployment & HPA (`liiro-backend-worker`)

Deploy the BullMQ background worker pods with Horizontal Pod Autoscaler (HPA):

```bash
# 1. Apply BullMQ Worker Deployment & HPA
kubectl apply -f backend/k8s/worker-deployment.yaml

# 2. Verify Worker Pods and HPA status
kubectl get pods -l app=liiro-backend-worker
kubectl get hpa liiro-backend-worker-hpa
```

---

## 3. Environment Secrets & ConfigMap Setup

Ensure the following environment variables are mounted in the K8s secrets/configmap:

```bash
kubectl create secret generic liiro-backend-secrets \
  --from-literal=MONGO_URI="mongodb://admin:<PROD_PASSWORD>@10.43.172.242:27017/liiro_prod?authSource=admin&directConnection=true" \
  --from-literal=REDIS_HOST="redis-service.default.svc.cluster.local" \
  --from-literal=REDIS_PORT="6379" \
  --from-literal=HETZNER_S3_KEY="<HETZNER_S3_KEY>" \
  --from-literal=HETZNER_S3_SECRET="<HETZNER_S3_SECRET>" \
  --from-literal=HETZNER_S3_BUCKET="multicamp-prod-storage" \
  --from-literal=HETZNER_S3_ENDPOINT="https://nbg1.your-objectstorage.com" \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## 4. Hetzner Object Storage S3 CORS & CORP Configuration

Ensure the Hetzner Object Storage bucket `multicamp-prod-storage` has the following CORS policy enabled for web audio streaming:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Range", "Content-Length", "Accept-Ranges", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 📢 Infra Agent Status Confirmation

Once deployed, please notify the Application AI Agent with this status message:

> **"INFRA_STATUS: READY. Redis deployed at redis-service:6379, Worker pods running (HPA 2-10 replicas active), Hetzner S3 CORS configured."**
