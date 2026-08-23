"use strict";

const mongoose = require("mongoose");

const LOCAL_URI = "mongodb://127.0.0.1:27017/liiro_prod";
const CLOUD_URI = "mongodb+srv://raahatrashid09_db_user:TNYegxNgSWRhV5Xn@cluster0.xips3wo.mongodb.net/langoreads?retryWrites=true&w=majority&appName=Cluster0";

async function syncToCloud() {
  console.log("🔌 Connecting to local MongoDB...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✔️ Local DB connected.");

  console.log("🔌 Connecting to Cloud MongoDB Atlas...");
  const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
  console.log("✔️ Cloud DB connected.");

  const collections = ["stories", "storychapters", "ebookcategories", "ebookauthors", "ebooktags", "bookseries"];

  for (const collName of collections) {
    console.log(`\n📦 Syncing collection: ${collName}...`);
    const localDocs = await localConn.db.collection(collName).find({}).toArray();
    console.log(`Found ${localDocs.length} documents in local ${collName}.`);

    if (localDocs.length > 0) {
      const cloudColl = cloudConn.db.collection(collName);
      
      // Upsert each doc by _id
      const ops = localDocs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true,
        },
      }));

      // Chunk operations by 500
      for (let i = 0; i < ops.length; i += 500) {
        const chunk = ops.slice(i, i + 500);
        await cloudColl.bulkWrite(chunk);
        console.log(`  Pushed chunk ${Math.floor(i / 500) + 1}/${Math.ceil(ops.length / 500)} to Cloud Atlas.`);
      }
    }
  }

  console.log("\n🎉 SYNC TO CLOUD MONGO ATLAS COMPLETED SUCCESSFULLY!");
  await localConn.close();
  await cloudConn.close();
  process.exit(0);
}

syncToCloud().catch((err) => {
  console.error("❌ Cloud sync failed:", err);
  process.exit(1);
});
