"use strict";

const https = require("https");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/liiro_prod";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function run() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const dash = await fetchJson("https://app.langoread.io/aiopscamp-langoreads-api/api/v1/stories/dashboard");
    const stories = dash.data.allPublished || [];
    console.log("Total curated stories on API:", stories.length);

    for (const s of stories) {
      try {
        const details = await fetchJson(`https://app.langoread.io/aiopscamp-langoreads-api/api/v1/stories/slug/${s.slug}?lang=en`);
        if (!details.success || !details.data) continue;
        const storyData = details.data;

        const storyDoc = await mongoose.connection.db.collection("stories").findOneAndUpdate(
          { slug: storyData.slug },
          {
            $set: {
              title: typeof storyData.title === "string" ? { en: storyData.title } : storyData.title,
              slug: storyData.slug,
              author: storyData.author || "Unknown",
              synopsis: typeof storyData.synopsis === "string" ? { en: storyData.synopsis } : storyData.synopsis,
              coverImageUrl: storyData.coverImageUrl,
              difficultyLevel: storyData.difficultyLevel || "B1",
              totalDurationSeconds: storyData.totalDurationSeconds || 0,
              isPublished: true,
              published: true,
              isFeatured: storyData.isFeatured || true,
              contentType: storyData.contentType || "both",
              tags: storyData.tags || ["classic", "world-literature"],
              category: storyData.category || "World Literature Masterworks",
              languages: storyData.languages || ["en"],
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        const storyId = storyDoc._id || storyDoc.value._id;
        const chapters = storyData.chapters || [];

        for (const ch of chapters) {
          const chDetails = await fetchJson(`https://app.langoread.io/aiopscamp-langoreads-api/api/v1/stories/slug/${s.slug}/chapters/${ch._id}?lang=en`);
          if (!chDetails.success || !chDetails.data) continue;
          const chData = chDetails.data;

          await mongoose.connection.db.collection("storychapters").findOneAndUpdate(
            { storyId, chapterNumber: chData.chapterNumber || 1 },
            {
              $set: {
                storyId,
                chapterNumber: chData.chapterNumber || 1,
                chapterIndex: chData.chapterNumber || 1,
                title: typeof chData.title === "string" ? { en: chData.title } : chData.title,
                textPayload: typeof chData.textPayload === "string" ? { en: chData.textPayload } : chData.textPayload,
                content: typeof chData.textPayload === "string" ? { en: chData.textPayload } : chData.textPayload,
                paragraphs: typeof chData.textPayload === "string" ? chData.textPayload.split("\n\n") : [],
                audioUrl: chData.audioUrl ? { en: chData.audioUrl } : null,
                durationSeconds: chData.durationSeconds || 0,
                wordTimestamps: chData.wordTimestamps || [],
              },
            },
            { upsert: true }
          );
        }
        console.log(`✅ Synced story: ${s.slug} (${chapters.length} chapters)`);
      } catch (err) {
        console.error(`Error syncing ${s.slug}:`, err.message);
      }
    }
    console.log("SYNC COMPLETE!");
  } catch (err) {
    console.error("Fatal sync error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
