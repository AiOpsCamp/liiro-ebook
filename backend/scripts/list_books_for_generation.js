"use strict";

const mongoose = require("mongoose");
const mongoUri = "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true";

async function inspectStories() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const stories = await db.collection("stories").find({ isPublished: true }).limit(10).toArray();
  
  console.log("=== PUBLISHED BOOKS READY FOR AUDIO GENERATION ===");
  for (const s of stories) {
    if (s.slug === "the-strange-case-of-dr-jekyll-and-mr-hyde") continue;
    const titleStr = typeof s.title === "object" ? s.title.en : s.title;
    const chCount = await db.collection("storychapters").countDocuments({ storyId: s._id });
    console.log(`- "${titleStr}" (Slug: '${s.slug}') -> ${chCount} Chapters`);
  }
  await mongoose.disconnect();
}

inspectStories().catch(console.error);
