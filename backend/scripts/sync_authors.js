require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/db/connect");
const Story = require("../src/models/Story.model");
const EbookAuthor = require("../src/models/EbookAuthor.model");

async function syncAuthors() {
  console.log("=======================================================================");
  console.log("🛠️ SYNCHRONIZING EBOOK AUTHORS IN MONGO DB");
  console.log("=======================================================================");

  await connectDB();
  const db = mongoose.connection.db;

  const rawAuthors = await db.collection("authors").find().toArray();
  console.log(`Found ${rawAuthors.length} raw author records in MongoDB.`);

  for (const raw of rawAuthors) {
    if (!raw.name || raw.name.includes("6a9")) continue;
    const slug = raw.slug || raw.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const bookCount = await Story.countDocuments({
      $or: [{ author: raw._id }, { authorId: raw._id }, { authorName: raw.name }]
    });

    await EbookAuthor.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: raw.name,
          slug: slug,
          bookCount: Math.max(bookCount, 1),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`  👤 Synced Author "${raw.name}" (${slug}) -> ${bookCount} books`);
  }

  console.log("=======================================================================");
  console.log(`🎉 AUTHORS SYNC COMPLETE! Total Active Authors: ${await EbookAuthor.countDocuments()}`);
  console.log("=======================================================================");
  process.exit(0);
}

syncAuthors().catch((err) => {
  console.error("Fatal Error during author sync:", err);
  process.exit(1);
});
