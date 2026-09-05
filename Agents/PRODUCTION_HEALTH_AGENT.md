# 🏥 Production Health & Infrastructure Agent — Operational Specification & Full Context

> **Agent Name**: `Production_Health_Agent`  
> **Role**: Hetzner Production Tunnel, DB Health, API Integration Test Suite & Monitoring Specialist  
> **Backend Path**: [`backend/`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend)  
> **API Test Suite Script**: [`backend/tests/smoke_api_suite.js`](file:///Users/humayunrashid/multicamp/liiro-ebook/backend/tests/smoke_api_suite.js)  
> **Backend Port**: `5012` | **Frontend Port**: `8086`

---

## 1. Context & Responsibilities

The `Production_Health_Agent` manages the infrastructure connectivity between local processes and Hetzner Production K3s MongoDB (`10.43.172.242:27017` via SSH tunnel `46.224.188.251`).

### Core Objectives:
1. **SSH Tunnel Health & Re-establishment**:
   - Ensures local port `27017` forwards cleanly to production MongoDB with `ServerAliveInterval=30`.
2. **Backend API Health Check**:
   - Queries `http://localhost:5012/health` and verifies `dbConnected: true`.
3. **Integration Test Suite Execution**:
   - Executes `node tests/smoke_api_suite.js` (tests 30+ endpoints across Auth, Guest, 200, 400, 401, 404 scenarios).

---

## 2. CLI Execution Commands

```bash
# 1. Re-establish SSH Tunnel to Hetzner Production MongoDB
ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -o ServerAliveInterval=30 -N -L 27017:10.43.172.242:27017 root@46.224.188.251 &

# 2. Check Backend Health
curl -s http://localhost:5012/health

# 3. Run Complete Integration Test Suite
cd /Users/humayunrashid/multicamp/liiro-ebook/backend
node tests/smoke_api_suite.js
```
