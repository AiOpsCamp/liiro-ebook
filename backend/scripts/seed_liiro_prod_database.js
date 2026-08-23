"use strict";

require("dotenv").config();
const mongoose = require("mongoose");

const TARGET_DB_NAME = "liiro_prod";

const CATEGORY_TAXONOMY = [
  { name: "Science Fiction", slug: "science-fiction", color: "#0891B2", icon: "Layers", keywords: ["sci-fi", "scifi", "science fiction", "time travel", "space", "dystopian", "futuristic"] },
  { name: "Philosophy & Thought", slug: "philosophy-and-thought", color: "#F59E0B", icon: "Sparkles", keywords: ["philosophy", "philosophical", "stoicism", "ethics", "logic", "theology", "non-fiction"] },
  { name: "Comedy & Satire", slug: "comedy-and-satire", color: "#EF4444", icon: "Flame", keywords: ["comedy", "humor", "wit", "satire", "parody"] },
  { name: "Fantasy & Magic", slug: "fantasy-and-magic", color: "#8B5CF6", icon: "Layers", keywords: ["fantasy", "fairy", "magic", "myths", "mythology", "folklore", "high fantasy"] },
  { name: "Horror & Weird Fiction", slug: "horror-and-weird-fiction", color: "#A855F7", icon: "Flame", keywords: ["horror", "weird", "vampires", "macabre", "supernatural"] },
  { name: "Mystery & Detective", slug: "mystery-and-detective", color: "#3B82F6", icon: "Search", keywords: ["mystery", "detective", "sherlock", "crime", "investigation"] },
  { name: "Gothic Classics", slug: "gothic-classics", color: "#6366F1", icon: "Sparkles", keywords: ["gothic", "dark romanticism", "dracula", "jekyll"] },
  { name: "Drama & Plays", slug: "drama-and-plays", color: "#10B981", icon: "BookOpen", keywords: ["drama", "play", "theater", "tragedy", "stage"] },
  { name: "Biographies & Memoirs", slug: "biographies-and-memoirs", color: "#EC4899", icon: "Award", keywords: ["biography", "autobiography", "memoir", "historical figure"] },
  { name: "World Literature Masterworks", slug: "world-literature-masterworks", color: "#10B981", icon: "BookOpen", keywords: ["masterwork", "classic", "world literature", "literary"] },
  { name: "Romance & Society", slug: "romance-and-society", color: "#F43F5E", icon: "Sparkles", keywords: ["romance", "love", "regency", "society", "marriage"] },
  { name: "Adventure & Exploration", slug: "adventure-and-exploration", color: "#14B8A6", icon: "Layers", keywords: ["adventure", "expedition", "sea", "pirates", "wilderness"] },
  { name: "Historical Fiction", slug: "historical-fiction", color: "#84CC16", icon: "BookOpen", keywords: ["historical", "history", "war", "revolution"] },
];

async function seedLiiroProdDatabase() {
  console.log("=========================================================================");
  console.log(`🌱 SEEDING & INITIALIZING DEDICATED DATABASE: '${TARGET_DB_NAME}'`);
  console.log("=========================================================================\n");

  const conn = await mongoose.createConnection(process.env.MONGO_URL).asPromise();
  const targetDb = conn.useDb(TARGET_DB_NAME).db;
  const sourceDb = conn.useDb("langoreads").db;

  // 1. Populate Category Taxonomy
  console.log("📂 1. Seeding Master Ebook Category Taxonomy...");
  for (const cat of CATEGORY_TAXONOMY) {
    await targetDb.collection("ebookcategories").updateOne(
      { slug: cat.slug },
      { $set: { ...cat, updatedAt: new Date() } },
      { upsert: true }
    );
  }
  console.log("   ✅ Master categories created.");

  // 2. Mirror existing stories & chapters into liiro_prod
  console.log("\n📚 2. Mirroring Stories and StoryChapters into 'liiro_prod'...");
  const stories = await sourceDb.collection("stories").find({}).toArray();
  console.log(`   Found ${stories.length} stories to import.`);

  let syncedStories = 0;
  let syncedChapters = 0;

  for (const story of stories) {
    await targetDb.collection("stories").updateOne(
      { slug: story.slug },
      { $set: story },
      { upsert: true }
    );
    syncedStories++;

    // Mirror author taxonomy
    if (story.author) {
      const authorSlug = story.author.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
      await targetDb.collection("ebookauthors").updateOne(
        { slug: authorSlug },
        { $set: { name: story.author, slug: authorSlug, updatedAt: new Date() }, $inc: { booksCount: 1 } },
        { upsert: true }
      );
    }

    // Mirror chapters
    const chapters = await sourceDb.collection("storychapters").find({ storyId: story._id }).toArray();
    for (const ch of chapters) {
      await targetDb.collection("storychapters").updateOne(
        { _id: ch._id },
        { $set: ch },
        { upsert: true }
      );
      syncedChapters++;
    }
  }

  console.log(`\n🎉 'liiro_prod' Database initialized successfully!`);
  console.log(`   • Total Stories: ${syncedStories}`);
  console.log(`   • Total Chapters: ${syncedChapters}`);

  await conn.close();
  process.exit(0);
}

seedLiiroProdDatabase().catch(console.error);
