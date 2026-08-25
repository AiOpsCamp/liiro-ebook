const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../src/db/connect");

function fetchRaw(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", () => resolve(null));
  });
}

function cleanText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function ingestAliceInWonderland() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log("=======================================================================");
  console.log("🚀 STARTING FULL RE-INGESTION FOR ALICE IN WONDERLAND WITH ARTWORK & AUDIO");
  console.log("=======================================================================\n");

  const story = await db.collection("stories").findOne({ slug: "alice-in-wonderland" });
  if (!story) {
    console.error("❌ Story alice-in-wonderland not found in MongoDB.");
    process.exit(1);
  }

  const repo = "lewis-carroll_alices-adventures-in-wonderland_john-tenniel";
  const baseUrl = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub`;

  const chapterFiles = [];
  for (let i = 1; i <= 12; i++) {
    chapterFiles.push(`chapter-${i}.xhtml`);
  }

  // Delete existing incomplete chapters for Alice in Wonderland
  await db.collection("storychapters").deleteMany({ storyId: story._id });
  console.log("Deleted old incomplete chapter records.");

  const cdnAudioBase = "https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ebooks/alice-in-wonderland";
  const localAudioFolder = "/tmp/audio_pipeline_out/alices-adventures-in-wonderland";

  let totalImagesInBook = 0;
  let chNum = 1;

  for (const chFile of chapterFiles) {
    const rawXhtml = await fetchRaw(`${baseUrl}/text/${chFile}`);
    if (!rawXhtml) {
      console.warn(`⚠️ Could not fetch ${chFile}`);
      continue;
    }

    // Extract title
    const titleMatch = rawXhtml.match(/<h2[^>]*>(.*?)<\/h2>/i) || rawXhtml.match(/<title>(.*?)<\/title>/i);
    let titleText = titleMatch ? cleanText(titleMatch[1]) : `Chapter ${chNum}`;
    if (titleText.toLowerCase().startsWith("chapter ")) {
      titleText = titleText.replace(/^chapter\s+\w+:?\s*/i, "");
    }

    // Process image tags to point to raw GitHub images
    const processedXhtml = rawXhtml.replace(/src=["']\.\.\/images\/([^"']+)["']/g, (m, imgName) => {
      totalImagesInBook++;
      const fullImgUrl = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub/images/${imgName}`;
      return `src="${fullImgUrl}" style="max-width:100%; height:auto; border-radius:12px; margin: 16px auto; display:block;"`;
    });

    const plainText = cleanText(processedXhtml);
    const audioUrl = `${cdnAudioBase}/chapter_${chNum}.mp3`;

    // Load timestamps if available locally
    let timestamps = [];
    const tsFile = path.join(localAudioFolder, `chapter_${chNum}_timestamps.json`);
    if (fs.existsSync(tsFile)) {
      try {
        timestamps = JSON.parse(fs.readFileSync(tsFile, "utf-8"));
      } catch (_) {}
    }

    const chapterDoc = {
      storyId: story._id,
      chapterNumber: chNum,
      chapterIndex: chNum,
      title: { en: titleText },
      content: processedXhtml,
      textPayload: plainText,
      language: "en",
      audioUrl: audioUrl,
      audioVoices: {
        defaultVoiceId: "adam",
        adam: audioUrl,
        voices: [{ id: "am_adam", key: "adam", name: "Adam (English)", url: audioUrl }]
      },
      timestamps: timestamps,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("storychapters").insertOne(chapterDoc);
    console.log(`   ✅ Ingested Ch ${chNum}: "${titleText}" (${timestamps.length} sentence timestamps)`);
    chNum++;
  }

  // Update Story model
  await db.collection("stories").updateOne(
    { _id: story._id },
    {
      $set: {
        coverImageUrl: `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub/images/cover.jpg`,
        hasAudio: true,
        contentType: "both",
        isIllustrated: true,
        illustrationsCount: totalImagesInBook,
        sourceUrl: `https://github.com/standardebooks/${repo}`
      }
    }
  );

  console.log("\n=======================================================================");
  console.log(`🎉 RE-INGESTION COMPLETE!`);
  console.log(`   Chapters Ingested: ${chNum - 1}/12`);
  console.log(`   Artwork / Illustrations Embedded: ${totalImagesInBook}`);
  console.log("=======================================================================");

  mongoose.connection.close();
}

ingestAliceInWonderland();
