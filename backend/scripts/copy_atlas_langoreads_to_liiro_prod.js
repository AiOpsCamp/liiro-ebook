/**
 * Copy all stories, chapters, categories, authors, and tags from Atlas langoreads DB
 * directly into Hetzner MongoDB liiro_prod.
 */

"use strict";

const mongoose = require("mongoose");

const ATLAS_URI = "mongodb+srv://langowords-db-admin:langowords-prod-2025@langowords-prod.c0qicsf.mongodb.net/langoreads?retryWrites=true&w=majority";
const LOCAL_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/liiro_prod";

async function main() {
  console.log("Connecting to Atlas langoreads DB...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  const atlasDb = atlasConn.db;

  console.log("Connecting to Hetzner liiro_prod DB...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const localDb = localConn.db;

  const collectionsToSync = ["stories", "storychapters", "ebookcategories", "ebookauthors", "ebooktags"];

  for (const colName of collectionsToSync) {
    console.log(`Syncing ${colName}...`);
    const docs = await atlasDb.collection(colName).find({}).toArray();
    console.log(`  Read ${docs.length} documents from Atlas ${colName}`);
    if (docs.length > 0) {
      await localDb.collection(colName).deleteMany({});
      await localDb.collection(colName).insertMany(docs);
      console.log(`  ✔ Inserted ${docs.length} documents into liiro_prod.${colName}`);
    }
  }

  console.log("🎉 Complete! All ebook stories & chapters are live in liiro_prod.");
  await atlasConn.close();
  await localConn.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
