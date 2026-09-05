# Liiro Database Setup & Management Guide (`liiro_prod`)

## 1. Overview
Liiro Ebook uses a dedicated MongoDB database named **`liiro_prod`** hosted on Hetzner infrastructure and accessible via internal K3s cluster networking or secure SSH tunnel.

---

## 2. Mongoose Schemas & Collections

1. **`stories`**: Main catalog document storing title, author, slug, cover artwork URL, difficulty level (`A1`-`C2`), category, and tag arrays.
2. **`storychapters`**: Individual chapter payloads storing title, chapter number, cleaned paragraphs, inline image references (`[IMAGE: url]`), audio URLs, and forced alignment timestamps.
3. **`userstoryprogresses`**: User reading progress, current paragraph index, audio offset, bookmarks, and text highlights.
4. **`users`**: Authenticated reader accounts, credentials, XP scores, daily reading streaks, and subscription tier entitlements.
5. **`useractivities`**: User timeline activity logs (`started_reading`, `finished_chapter`, `listened_audio`).
6. **`usernotifications`**: User in-app notifications and push alerts.
7. **`bookreels`**: TikTok-style vertical video and book highlight reels.
8. **`familyprofiles`**: Parental PIN-protected family sub-accounts.
9. **`booksummaries`**: Liiro Sparks ⚡ key takeaways and chapter summaries.
10. **`ebookcategories`**: 25 master ebook categories with colors, icons, and keyword arrays.
11. **`ebookauthors`**: Author directory records with book counts.
12. **`ebooktags`**: Tag taxonomy index.

---

## 3. High Availability Replica Set Configuration (INF-02)

To ensure zero single-point-of-failure data resilience across production nodes, `liiro_prod` is deployed as a 3-Node MongoDB Replica Set (`rs0`):

```bash
# Initiate 3-Node MongoDB Replica Set
mongosh --host 10.43.172.242:27017 -u admin -p <PROD_PASSWORD> --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo-node-1.internal:27017", priority: 2 },
    { _id: 1, host: "mongo-node-2.internal:27017", priority: 1 },
    { _id: 2, host: "mongo-node-3.internal:27017", priority: 1 }
  ]
})
'
```

### Connection String with Failover Support
```env
MONGODB_URI="mongodb://admin:<PROD_PASSWORD>@mongo-node-1.internal:27017,mongo-node-2.internal:27017,mongo-node-3.internal:27017/liiro_prod?authSource=admin&replicaSet=rs0&readPreference=primaryPreferred&retryWrites=true&w=majority"
```

---

## 4. Database Operations & Seeding

To seed or re-verify database indexes:
```bash
cd backend
node scripts/seed_liiro_prod_database.js
```
