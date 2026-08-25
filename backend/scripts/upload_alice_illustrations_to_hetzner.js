const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const connectDB = require("../src/db/connect");

const BUCKET = process.env.HETZNER_S3_BUCKET || "multicamp-prod-storage";
const ENDPOINT = process.env.HETZNER_S3_ENDPOINT || "https://nbg1.your-objectstorage.com";
const S3_KEY = process.env.HETZNER_S3_KEY || "KVFSGG7GLKG95GYEJOE3";
const S3_SECRET = process.env.HETZNER_S3_SECRET || "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK";
const HETZNER_CDN_BASE = `https://${BUCKET}.nbg1.your-objectstorage.com`;

const s3Client = new S3Client({
  region: "nbg1",
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: S3_KEY,
    secretAccessKey: S3_SECRET,
  },
});

function fetchBuffer(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", () => resolve(null));
  });
}

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

function getMimeType(fileName) {
  if (fileName.endsWith(".svg")) return "image/svg+xml";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function uploadImageToHetzner(imgFileName, buffer) {
  const s3Key = `LangoReads-Prod/ebooks/alice-in-wonderland/images/${imgFileName}`;
  const contentType = getMimeType(imgFileName);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  });

  await s3Client.send(command);
  return `${HETZNER_CDN_BASE}/${s3Key}`;
}

async function processAliceIllustrations() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log("=======================================================================");
  console.log("🚀 STARTING ALICE IN WONDERLAND ILLUSTATION UPLOAD TO HETZNER S3 CDN");
  console.log("=======================================================================\n");

  const story = await db.collection("stories").findOne({ slug: "alice-in-wonderland" });
  if (!story) {
    console.error("❌ Story alice-in-wonderland not found in MongoDB.");
    process.exit(1);
  }

  const repo = "lewis-carroll_alices-adventures-in-wonderland_john-tenniel";
  const rawBase = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub`;

  // 1. Fetch content.opf to locate all images
  const opfContent = await fetchText(`${rawBase}/content.opf`);
  if (!opfContent) {
    console.error("❌ Failed to fetch content.opf.");
    process.exit(1);
  }

  const imageRegex = /<item\s+[^>]*href=["']images\/([^"']+)["']/gi;
  const imageFilesSet = new Set();
  let match;
  while ((match = imageRegex.exec(opfContent)) !== null) {
    imageFilesSet.add(match[1]);
  }
  imageFilesSet.add("cover.jpg");

  const imageFiles = Array.from(imageFilesSet);
  console.log(`Found ${imageFiles.length} illustration images in manifest. Uploading to Hetzner S3...`);

  const uploadedImageUrls = {};

  for (const imgName of imageFiles) {
    const imgUrl = `${rawBase}/images/${imgName}`;
    const buffer = await fetchBuffer(imgUrl);
    if (buffer) {
      const cdnUrl = await uploadImageToHetzner(imgName, buffer);
      uploadedImageUrls[imgName] = cdnUrl;
      console.log(`   ✅ Uploaded: ${imgName} -> ${cdnUrl}`);
    } else {
      console.warn(`   ⚠️ Could not fetch image from GitHub: ${imgName}`);
    }
  }

  // 2. Process all 12 chapters, fix duplicated headers, and replace image sources with Hetzner S3 URLs
  const cdnAudioBase = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/alice-in-wonderland`;
  const localAudioFolder = "/tmp/audio_pipeline_out/alices-adventures-in-wonderland";

  let totalEmbeddedIllustrations = 0;

  for (let chNum = 1; chNum <= 12; chNum++) {
    const chFile = `chapter-${chNum}.xhtml`;
    const rawXhtml = await fetchText(`${rawBase}/text/${chFile}`);
    if (!rawXhtml) {
      console.warn(`⚠️ Could not fetch ${chFile}`);
      continue;
    }

    // Extract chapter title cleanly
    const h2Match = rawXhtml.match(/<h2[^>]*>(.*?)<\/h2>/i);
    let titleText = h2Match ? cleanText(h2Match[1]) : `Chapter ${chNum}`;
    titleText = titleText.replace(/^chapter\s+\w+:?\s*/i, "").trim();

    // Clean duplicate headers in XHTML body
    let cleanedXhtml = rawXhtml;

    // Remove top duplicate title elements if repeated
    cleanedXhtml = cleanedXhtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
    cleanedXhtml = cleanedXhtml.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "");

    // Replace all image tags with Hetzner S3 CDN URLs and clean responsive figure layout
    cleanedXhtml = cleanedXhtml.replace(/<figure[^>]*>[\s\S]*?<img\s+[^>]*src=["']\.\.\/images\/([^"']+)["'][^>]*>[\s\S]*?<\/figure>/gi, (fullMatch, imgName) => {
      totalEmbeddedIllustrations++;
      const cdnUrl = uploadedImageUrls[imgName] || `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/alice-in-wonderland/images/${imgName}`;
      return `
        <figure class="illustrated-figure" style="text-align: center; margin: 28px 0; display: block;">
          <img src="${cdnUrl}" alt="Illustration by John Tenniel" style="max-width: 90%; height: auto; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); margin: 0 auto; display: block;" />
        </figure>
      `;
    });

    // Also handle standalone <img> tags
    cleanedXhtml = cleanedXhtml.replace(/<img\s+[^>]*src=["']\.\.\/images\/([^"']+)["'][^>]*>/gi, (fullMatch, imgName) => {
      totalEmbeddedIllustrations++;
      const cdnUrl = uploadedImageUrls[imgName] || `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/alice-in-wonderland/images/${imgName}`;
      return `
        <figure class="illustrated-figure" style="text-align: center; margin: 28px 0; display: block;">
          <img src="${cdnUrl}" alt="Illustration by John Tenniel" style="max-width: 90%; height: auto; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); margin: 0 auto; display: block;" />
        </figure>
      `;
    });

    const plainText = cleanText(cleanedXhtml);
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
      content: cleanedXhtml,
      textPayload: plainText,
      language: "en",
      audioUrl: audioUrl,
      audioVoices: {
        defaultVoiceId: "adam",
        adam: audioUrl,
        voices: [{ id: "am_adam", key: "adam", name: "Adam (English)", url: audioUrl }],
      },
      timestamps: timestamps,
      updatedAt: new Date(),
    };

    await db.collection("storychapters").updateOne(
      { storyId: story._id, chapterNumber: chNum },
      { $set: chapterDoc },
      { upsert: true }
    );

    console.log(`   ✅ Processed Ch ${chNum}: "${titleText}" with Hetzner CDN Artwork`);
  }

  // 3. Update Story metadata in MongoDB
  const coverCdnUrl = uploadedImageUrls["cover.jpg"] || `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/alice-in-wonderland/images/cover.jpg`;

  await db.collection("stories").updateOne(
    { _id: story._id },
    {
      $set: {
        coverImageUrl: coverCdnUrl,
        hasAudio: true,
        contentType: "both",
        isIllustrated: true,
        illustrationsCount: totalEmbeddedIllustrations,
        sourceUrl: `https://github.com/${repo}`,
      },
    }
  );

  console.log("\n=======================================================================");
  console.log("🎉 SUCCESS! ALL ALICE IN WONDERLAND ARTWORK UPLOADED TO HETZNER CDN!");
  console.log(`   Total Images Uploaded to S3: ${Object.keys(uploadedImageUrls).length}`);
  console.log(`   Total Embedded Illustrations in HTML: ${totalEmbeddedIllustrations}`);
  console.log(`   Cover CDN Image: ${coverCdnUrl}`);
  console.log("=======================================================================");

  mongoose.connection.close();
}

processAliceIllustrations();
