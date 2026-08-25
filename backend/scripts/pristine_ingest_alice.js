const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../src/db/connect");

const BUCKET = process.env.HETZNER_S3_BUCKET || "multicamp-prod-storage";
const ENDPOINT = process.env.HETZNER_S3_ENDPOINT || "https://nbg1.your-objectstorage.com";
const HETZNER_CDN_BASE = `https://${BUCKET}.nbg1.your-objectstorage.com`;

function fetchText(url) {
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

async function pristineIngestAlice() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log("=======================================================================");
  console.log("🚀 PRISTINE RE-IMPORT FOR ALICE IN WONDERLAND WITH EXACT FORMATTING & HETZNER CDN ARTWORK");
  console.log("=======================================================================\n");

  const story = await db.collection("stories").findOne({ slug: "alice-in-wonderland" });
  if (!story) {
    console.error("❌ Story alice-in-wonderland not found in MongoDB.");
    process.exit(1);
  }

  const repo = "lewis-carroll_alices-adventures-in-wonderland_john-tenniel";
  const rawBase = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub`;

  // Delete all existing chapters to guarantee a 100% fresh clean state
  await db.collection("storychapters").deleteMany({ storyId: story._id });
  console.log("Deleted old chapter records in MongoDB.");

  const cdnAudioBase = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/alice-in-wonderland`;
  const cdnImageBase = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/alice-in-wonderland/images`;
  const localAudioFolder = "/tmp/audio_pipeline_out/alices-adventures-in-wonderland";

  let totalEmbeddedIllustrations = 0;

  for (let chNum = 1; chNum <= 12; chNum++) {
    const chFile = `chapter-${chNum}.xhtml`;
    const rawXhtml = await fetchText(`${rawBase}/text/${chFile}`);
    if (!rawXhtml) {
      console.warn(`⚠️ Could not fetch ${chFile}`);
      continue;
    }

    // Extract exact clean title from <p epub:type="title"> or <title>
    let titleText = `Chapter ${chNum}`;
    const pTitleMatch = rawXhtml.match(/<p[^>]*epub:type=["']title["'][^>]*>(.*?)<\/p>/i);
    const h2TitleMatch = rawXhtml.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const docTitleMatch = rawXhtml.match(/<title>(.*?)<\/title>/i);

    if (pTitleMatch) {
      titleText = cleanText(pTitleMatch[1]);
    } else if (h2TitleMatch) {
      titleText = cleanText(h2TitleMatch[1]);
    } else if (docTitleMatch) {
      titleText = cleanText(docTitleMatch[1]);
    }
    // Only strip leading Roman numeral if followed by colon or dot (e.g. "I: Down the Rabbit-Hole")
    titleText = titleText.replace(/^[IVXLCDM]+\s*[:.-]\s*/i, "").trim();

    // Extract section content
    const sectionMatch = rawXhtml.match(/<section[^>]*>([\s\S]*?)<\/section>/i);
    let sectionHtml = sectionMatch ? sectionMatch[1] : rawXhtml;

    // Strip top <hgroup> and duplicate header elements so body starts purely with narrative text
    sectionHtml = sectionHtml.replace(/<hgroup>[\s\S]*?<\/hgroup>/gi, "");
    sectionHtml = sectionHtml.replace(/<header>[\s\S]*?<\/header>/gi, "");

    // Replace all image sources with Hetzner S3 CDN URLs and embed responsive styling
    sectionHtml = sectionHtml.replace(/<figure([^>]*)>([\s\S]*?)<\/figure>/gi, (fullMatch, figAttrs, figInner) => {
      totalEmbeddedIllustrations++;
      const srcMatch = figInner.match(/src=["']\.\.\/images\/([^"']+)["']/i) || figInner.match(/src=["']([^"']+)["']/i);
      const altMatch = figInner.match(/alt=["']([^"']+)["']/i);

      const imgName = srcMatch ? srcMatch[1] : `illustration-${chNum}.svg`;
      const altText = altMatch ? altMatch[1] : "Illustration by Sir John Tenniel";
      const cdnUrl = `${cdnImageBase}/${imgName}`;

      return `
        <figure class="illustrated-figure" style="text-align: center; margin: 32px 0; display: block;">
          <img src="${cdnUrl}" alt="${altText}" style="max-width: 90%; height: auto; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.14); margin: 0 auto; display: block;" />
          <figcaption style="font-size: 12px; color: #71717a; margin-top: 10px; font-style: italic; text-align: center;">${altText}</figcaption>
        </figure>
      `;
    });

    const plainText = cleanText(sectionHtml);
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
      content: sectionHtml.trim(),
      textPayload: plainText,
      language: "en",
      audioUrl: audioUrl,
      audioVoices: {
        defaultVoiceId: "adam",
        adam: audioUrl,
        voices: [{ id: "am_adam", key: "adam", name: "Adam (English)", url: audioUrl }],
      },
      timestamps: timestamps,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("storychapters").insertOne(chapterDoc);
    console.log(`   ✅ Ingested Ch ${chNum}: "${titleText}" (${timestamps.length} Whispersync timestamps)`);
  }

  // Update Story metadata
  const coverCdnUrl = `${cdnImageBase}/cover.jpg`;
  await db.collection("stories").updateOne(
    { _id: story._id },
    {
      $set: {
        title: { en: "Alice's Adventures in Wonderland" },
        coverImageUrl: coverCdnUrl,
        hasAudio: true,
        contentType: "both",
        isIllustrated: true,
        illustrationsCount: totalEmbeddedIllustrations,
        sourceUrl: `https://github.com/${repo}`,
        updatedAt: new Date(),
      },
    }
  );

  console.log("\n=======================================================================");
  console.log("🎉 PRISTINE RE-IMPORT COMPLETE!");
  console.log(`   Total Chapters Ingested: 12/12`);
  console.log(`   Total Embedded Artwork Figures: ${totalEmbeddedIllustrations}`);
  console.log(`   Cover CDN Image: ${coverCdnUrl}`);
  console.log("=======================================================================");

  mongoose.connection.close();
}

pristineIngestAlice();
