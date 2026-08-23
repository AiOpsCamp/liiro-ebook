# Liiro Ebook REST API Specification

**Base URL**: `http://localhost:5012/api/v1`

---

## Health & System

### `GET /health`
Returns microservice status and target database name.

**Response**:
```json
{
  "status": "healthy",
  "service": "liiro-ebook-backend",
  "version": "1.0.0",
  "database": "liiro_prod"
}
```

---

## Stories & Chapters (`/api/v1/stories`)

### `GET /api/v1/stories`
Browse and search published ebooks.

**Query Parameters**:
* `page`: Page number (default: 1)
* `limit`: Items per page (default: 20)
* `difficulty`: Filter by level (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`)
* `category`: Filter by category name
* `search`: Search query against title, author, or synopsis
* `featured`: Set `true` to prioritize featured books

---

### `GET /api/v1/stories/:idOrSlug`
Fetch detailed information for a single story by ID or slug.

---

### `GET /api/v1/stories/:slug/chapters/:chapterIndex`
Fetch chapter content, cleaned XHTML paragraphs, multi-voice audio links, and word-level forced alignment timestamps.

---

### `POST /api/v1/stories/:slug/progress`
Sync user reading or listening progress.

---

### `POST /api/v1/stories/:slug/bookmark`
Toggle bookmark state for an ebook story.

---

## Ebook Metadata (`/api/v1/ebook-metadata`)

### `GET /api/v1/ebook-metadata/categories`
Fetch all 25 master ebook category taxonomies.

---

### `GET /api/v1/ebook-metadata/authors`
Fetch author directory list sorted by book count.

---

### `GET /api/v1/ebook-metadata/stats`
Fetch global library statistics.
