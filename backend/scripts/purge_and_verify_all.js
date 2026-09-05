require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/db/connect");

async function purgeAndVerifyAll() {
  console.log("=======================================================================");
  console.log("🔥 FULL DATABASE PURGE & CLEANUP INITIATED (liiro_prod)");
  console.log("=======================================================================");

  await connectDB();
  const db = mongoose.connection.db;

  const collectionsToClear = [
    "stories",
    "storychapters",
    "categories",
    "ebookcategories",
    "tags",
    "ebooktags",
    "authors",
    "ebookauthors",
    "bookseries",
    "bookreviews",
    "bookreels",
    "booksummaries",
    "userprogresses",
    "bookmarks"
  ];

  for (const colName of collectionsToClear) {
    try {
      const col = db.collection(colName);
      const countBefore = await col.countDocuments();
      if (countBefore > 0) {
        await col.deleteMany({});
        console.log(`  🗑️ Cleared collection "${colName}": ${countBefore} documents removed.`);
      } else {
        console.log(`  ℹ️ Collection "${colName}" was already empty.`);
      }
    } catch (e) {
      console.log(`  ⚠️ Notice for "${colName}": ${e.message}`);
    }
  }

  console.log("\n=======================================================================");
  console.log("🔍 VERIFYING CLEANUP RESULTS IN MONGO DB...");
  console.log("=======================================================================");

  let allClean = true;
  for (const colName of collectionsToClear) {
    const col = db.collection(colName);
    const count = await col.countDocuments();
    console.log(`  • Collection "${colName}": ${count} documents remaining`);
    if (count > 0) allClean = false;
  }

  if (allClean) {
    console.log("\n=======================================================================");
    console.log("🎉 DATABASE CLEANUP VERIFIED: 100% CLEAN (0 RECORDS)");
    console.log("=======================================================================");
  } else {
    console.error("❌ ERROR: Some collections still contain documents!");
    process.exit(1);
  }

  process.exit(0);
}

purgeAndVerifyAll().catch((err) => {
  console.error("Fatal Error during DB purge:", err);
  process.exit(1);
});
