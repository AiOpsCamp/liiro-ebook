# 🚀 Liiro Ebook Backend API Test Framework Guide

## 1. Executive Summary & Architecture Overview

### Executive Summary
The **Liiro Ebook Backend API Test Framework** provides automated end-to-end smoke testing, contract verification, resilience testing, and regression detection for the **Liiro Ebook & Audiobook Reading Microservice**. 

Operating as a zero-external-dependency suite, the framework runs via Node.js (`tests/smoke_api_suite.js`) using native system HTTP calls (`curl` via `child_process`). It validates the integrity of all primary API endpoints across catalog discovery, DRM pre-signed audio streaming, Whispersync bi-directional position synchronization, gamified reader streaks, family sub-account management, OPDS 2.0 e-reader catalog generation, and subscription billing.

### Architecture Overview
The Liiro API Backend is structured as a high-performance RESTful microservice built on **Node.js / Express**, interfacing with a primary **MongoDB** database (`liiro_prod`), an **S3 Object Storage** tier (Hetzner Cloud Storage) for EPUB and ONNX-synthesized audio binaries, and a **Redis + BullMQ** queue worker engine.

```
+-----------------------------------------------------------------------------------+
|                                Client Applications                                |
|           (iOS Swift / Android Kotlin / Web App / OPDS E-Readers)                  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v (HTTP/REST - Port 5012)
+-----------------------------------------------------------------------------------+
|                           Liiro Express Microservice                              |
|                                                                                   |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  | authMiddleware      |  | getEffectiveUserId   |  | Rate Limiter / Helmet    |  |
|  | (JWT Auth & Guest)  |  | (Guest / MD5 IP-UA)  |  | (1000 req / 15 min)     |  |
|  +---------------------+  +----------------------+  +--------------------------+  |
|                                                                                   |
|  +----------------------- Core Subsystem Handlers -----------------------------+  |
|  |  • Story Catalog & Dashboard        • Whispersync Position Sync Engine     |  |
|  |  • DRM Stream Token (HMAC-SHA256)   • OPDS 2.0 Catalog Feed                |  |
|  |  • Streaks & Activity Analytics    • Stripe & RevenueCat Billing Webhooks |  |
|  +----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
       |                                |                                |
       v                                v                                v
+--------------+                +---------------+                +------------------+
| MongoDB      |                | Redis /       |                | Hetzner S3       |
| liiro_prod   |                | BullMQ Queue  |                | Cloud Storage    |
+--------------+                +---------------+                +------------------+
```

---

## 2. Environment Setup & Prerequisites

### System Requirements
- **Node.js Runtime**: v18.x or v20.x LTS
- **Database**: MongoDB v6.0+ or v7.0+ running on port `27017` with `liiro_prod` database populated.
- **Port Allocation**: TCP Port `5012` (default backend port).

### Execution Commands

```bash
cd /Users/humayunrashid/multicamp/liiro-ebook/backend

# 1. Official Supertest + Node Test Runner CI Suite (Used in GitHub Actions)
npm test

# 2. Comprehensive 30-Scenario Live Microservice Smoke Suite
node tests/smoke_api_suite.js
```

---

## 3. Supertest CI Integration Test Suite (`tests/api_integration_suite.test.js`)

Used in GitHub Actions CI/CD to gate PRs and releases:
- **Suite 1: System Health & APM Metrics Endpoint** (`GET /health`): Validates database latency, uptime, memory, and service name.
- **Suite 2: Stories Catalog & Whispersync Endpoints** (`GET /api/v1/stories`, `GET /api/v1/stories/slug/:slug`): Validates story payload, pagination, and whispersync models.
- **Suite 3: OPDS 2.0 Catalog & Publications Feed** (`GET /opds/v2/catalog`): Validates OPDS 2.0 JSON schema compatibility.
- **Suite 4: Auth Lifecycle & GDPR Account Deletion** (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `DELETE /api/v1/auth/account`): Validates registration, token issuance, and full GDPR cascade erasure across 8 MongoDB collections.
- **Suite 5: Security: Rejection of Invalid Tokens & Unauthorized Requests**: Validates 401 Unauthorized handling when bad tokens are supplied.
- **Suite 6: Billing Quota Enforcement**: Validates HTTP 402 Payment Required response when monthly 20h limit is exceeded.

The suite covers **30 distinct operational scenarios** across 10 controllers:

| # | Scenario Description | Route Path | Method | Auth Identity | Expected Output |
|---|----------------------|------------|--------|---------------|-----------------|
| 1 | Health Check | `/health` | GET | Public | 200 OK (`healthy`) |
| 2 | Published Catalog (Guest) | `/api/v1/stories` | GET | `x-guest-id` | 200 OK (`success`) |
| 3 | Published Catalog (JWT) | `/api/v1/stories` | GET | `Authorization: Bearer <jwt>` | 200 OK (`success`) |
| 4 | Dashboard Slate | `/api/v1/stories/dashboard` | GET | `x-guest-id` | 200 OK (`success`) |
| 5 | Book Details | `/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde` | GET | Public | 200 OK (`success`) |
| 6 | Non-Existent Book | `/api/v1/stories/slug/non-existent-book-slug-xyz` | GET | Public | 404 Not Found |
| 7 | Chapter 1 Content | `/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/chapters/1/content` | GET | Public | 200 OK (`success`) |
| 8 | Liiro Sparks ⚡ Summary | `/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/summary` | GET | Public | 200 OK (`success`) |
| 9 | DRM Stream Token | `/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/stream-token?chapterNumber=1` | GET | Public | 200 OK (`success`) |
| 10 | Whispersync Query | `/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/whispersync` | GET | `x-guest-id` | 200 OK (`success`) |
| 11 | Whispersync Sync | `/api/v1/stories/whispersync` | POST | `x-guest-id` | 200 OK (`success`) |
| 12 | Vector Recommendations | `/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/recommendations` | GET | Public | 200 OK (`success`) |
| 13 | User Library (Valid JWT) | `/api/v1/stories/user/library` | GET | `Authorization: Bearer <valid_jwt>` | 200 OK (`success`) |
| 14 | User Library (Invalid JWT) | `/api/v1/stories/user/library` | GET | `Authorization: Bearer invalid` | 401 Unauthorized |
| 15 | Authors Directory | `/api/v1/metadata/authors` | GET | Public | 200 OK (`success`) |
| 16 | Categories Directory | `/api/v1/metadata/categories` | GET | Public | 200 OK (`success`) |
| 17 | Genre Tags Directory | `/api/v1/metadata/tags` | GET | Public | 200 OK (`success`) |
| 18 | Book Series Sagas | `/api/v1/metadata/series` | GET | Public | 200 OK (`success`) |
| 19 | User Activity Log | `/api/v1/user/activities` | GET | `x-guest-id` | 200 OK (`success`) |
| 20 | Log Activity Session | `/api/v1/user/activities` | POST | `x-guest-id` | 200 OK (`success`) |
| 21 | Notifications List | `/api/v1/user/notifications` | GET | `x-guest-id` | 200 OK (`success`) |
| 22 | Daily Reading Streak | `/api/v1/user/streaks` | GET | `x-guest-id` | 200 OK (`success`) |
| 23 | Streak Ping Minutes | `/api/v1/user/streaks/ping` | POST | `x-guest-id` | 200 OK (`success`) |
| 24 | Achievements List | `/api/v1/user/achievements` | GET | `x-guest-id` | 200 OK (`success`) |
| 25 | Quote Card Exporter | `/api/v1/user/share-status` | POST | `x-guest-id` | 200 OK (`success`) |
| 26 | Book Reels Feed | `/api/v1/reels` | GET | Public | 200 OK (`success`) |
| 27 | Family Sub-Accounts | `/api/v1/profiles` | GET | `x-guest-id` | 200 OK (`success`) |
| 28 | Parental PIN Lock | `/api/v1/profiles/verify-pin` | POST | `x-guest-id` | 200 OK (`success`) |
| 29 | Subscription Pricing | `/api/v1/billing/plans` | GET | Public | 200 OK (`success`) |
| 30 | OPDS 2.0 Catalog | `/opds/v2/catalog` | GET | Public | 200 OK (`catalog`) |
