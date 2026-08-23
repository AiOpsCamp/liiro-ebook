# Liiro Database Setup & Management Guide (`liiro_prod`)

## Overview
Liiro Ebook uses a dedicated MongoDB database named **`liiro_prod`**.

---

## Mongoose Schemas & Collections

1. **`stories`**: Main catalog document storing title, author, slug, cover artwork URL, difficulty level (`A1`-`C2`), category, and tag arrays.
2. **`storychapters`**: Individual chapter payloads storing title, chapter number, cleaned paragraphs, inline image references (`[IMAGE: url]`), audio URLs, and forced alignment timestamps.
3. **`userstoryprogresses`**: User reading progress, current paragraph index, audio offset, bookmarks, and text highlights.
4. **`ebookcategories`**: 25 master ebook categories with colors, icons, and keyword arrays.
5. **`ebookauthors`**: Author directory records with book counts.
6. **`ebooktags`**: Tag taxonomy index.

---

## Seeding Script
To seed or initialize `liiro_prod` database:
```bash
cd backend
node scripts/seed_liiro_prod_database.js
```
