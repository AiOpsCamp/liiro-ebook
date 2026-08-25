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

// List of official Standard Ebooks illustrated classics
const ILLUSTRATED_CATALOG = [
  { repo: "lewis-carroll_alices-adventures-in-wonderland_john-tenniel", slug: "alice-in-wonderland" },
  { repo: "l-frank-baum_the-wonderful-wizard-of-oz", slug: "the-wonderful-wizard-of-oz" },
  { repo: "l-frank-baum_the-marvelous-land-of-oz", slug: "the-marvelous-land-of-oz" },
  { repo: "l-frank-baum_ozma-of-oz", slug: "ozma-of-oz" },
  { repo: "l-frank-baum_dorothy-and-the-wizard-in-oz", slug: "dorothy-and-the-wizard-in-oz" },
  { repo: "l-frank-baum_the-road-to-oz", slug: "the-road-to-oz" },
  { repo: "carlo-collodi_the-adventures-of-pinocchio", slug: "the-adventures-of-pinocchio" },
  { repo: "kenneth-grahame_the-wind-in-the-willows", slug: "the-wind-in-the-willows" },
  { repo: "j-m-barrie_peter-and-wendy", slug: "peter-and-wendy" },
  { repo: "frances-hodgson-burnett_the-secret-garden", slug: "the-secret-garden" },
  { repo: "beatrix-potter_the-tale-of-peter-rabbit", slug: "the-tale-of-peter-rabbit" },
];

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

async function uploadImageToHetzner(slug, imgFileName, buffer) {
  const s3Key = `LangoReads-Prod/ebooks/${slug}/images/${imgFileName}`;
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

async function processSingleIllustratedEbook(bookConfig, db) {
  const { repo, slug } = bookConfig;
  console.log(`\n=======================================================================`);
  console.log(`🚀 PROCESSING AUTOMATED INGESTION FOR: ${slug}`);
  console.log(`   Standard Ebooks Repo: ${repo}`);
  console.log(`=======================================================================\n`);

  const story = await db.collection("stories").findOne({ slug });
  if (!story) {
    console.warn(`⚠️ Story with slug "${slug}" not found in MongoDB. Skipping.`);
    return false;
  }

  const rawBase = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub`;
  const opfContent = await fetchText(`${rawBase}/content.opf`);

  if (!opfContent) {
    console.warn(`⚠️ Could not fetch content.opf for ${repo}. Skipping.`);
    return false;
  }

  // 1. Locate all XHTML chapter files
  const itemMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/(chapter-[^"']+\.xhtml)["']/gi)];
  let chapterFiles = [...new Set(itemMatches.map((m) => m[1]))];

  if (chapterFiles.length === 0) {
    const genericMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/([^"']+\.xhtml)["']/gi)];
    chapterFiles = genericMatches
      .map((m) => m[1])
      .filter((f) => !/colophon|uncopyright|titlepage|imprint|halftitle|epigraph|loi/i.test(f));
  }

  console.log(`Found ${chapterFiles.length} chapter XHTML files.`);

  // 2. Locate and upload all images to Hetzner S3 CDN
  const imageRegex = /<item\s+[^>]*href=["']images\/([^"']+)["']/gi;
  const imageFilesSet = new Set();
  let imgMatch;
  while ((imgMatch = imageRegex.exec(opfContent)) !== null) {
    imageFilesSet.add(imgMatch[1]);
  }
  imageFilesSet.add("cover.jpg");

  const imageFiles = Array.from(imageFilesSet);
  console.log(`Found ${imageFiles.length} artwork images. Uploading to Hetzner S3...`);

  const uploadedImageUrls = {};
  for (const imgName of imageFiles) {
    const imgUrl = `${rawBase}/images/${imgName}`;
    const buffer = await fetchBuffer(imgUrl);
    if (buffer) {
      const cdnUrl = await uploadImageToHetzner(slug, imgName, buffer);
      uploadedImageUrls[imgName] = cdnUrl;
      console.log(`   ✅ S3 CDN: ${imgName} -> ${cdnUrl}`);
    } else {
      console.warn(`   ⚠️ Could not fetch image from GitHub: ${imgName}`);
    }
  }

  // 3. Clear existing chapters for a pristine fresh state
  await db.collection("storychapters").deleteMany({ storyId: story._id });

  const cdnAudioBase = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/${slug}`;
  const cdnImageBase = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/${slug}/images`;
  const localAudioFolder = `/tmp/audio_pipeline_out/${slug}`;

  let totalEmbeddedIllustrations = 0;
  let chNum = 1;

  for (const chFile of chapterFiles) {
    const rawXhtml = await fetchText(`${rawBase}/text/${chFile}`);
    if (!rawXhtml) continue;

    // Extract chapter title cleanly
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
    titleText = titleText.replace(/^[IVXLCDM]+\s*[:.-]\s*/i, "").trim();

    // Extract section content
    const sectionMatch = rawXhtml.match(/<section[^>]*>([\s\S]*?)<\/section>/i);
    let sectionHtml = sectionMatch ? sectionMatch[1] : rawXhtml;

    // Strip header metadata duplicates
    sectionHtml = sectionHtml.replace(/<hgroup>[\s\S]*?<\/hgroup>/gi, "");
    sectionHtml = sectionHtml.replace(/<header>[\s\S]*?<\/header>/gi, "");

    // Replace image sources with Hetzner S3 URLs
    sectionHtml = sectionHtml.replace(/<figure([^>]*)>([\s\S]*?)<\/figure>/gi, (fullMatch, figAttrs, figInner) => {
      totalEmbeddedIllustrations++;
      const srcMatch = figInner.match(/src=["']\.\.\/images\/([^"']+)["']/i) || figInner.match(/src=["']([^"']+)["']/i);
      const altMatch = figInner.match(/alt=["']([^"']+)["']/i);

      const imgName = srcMatch ? srcMatch[1] : `illustration-${chNum}.svg`;
      const altText = altMatch ? altMatch[1] : "Illustration";
      const cdnUrl = uploadedImageUrls[imgName] || `${cdnImageBase}/${imgName}`;

      return `
        <figure class="illustrated-figure" style="text-align: center; margin: 32px 0; display: block;">
          <img src="${cdnUrl}" alt="${altText}" style="max-width: 90%; height: auto; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.14); margin: 0 auto; display: block;" />
          <figcaption style="font-size: 12px; color: #71717a; margin-top: 10px; font-style: italic; text-align: center;">${altText}</figcaption>
        </figure>
      `;
    });

    const plainText = cleanText(sectionHtml);
    const audioUrl = `${cdnAudioBase}/chapter_${chNum}.mp3`;

    // Load timestamps if present
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
    console.log(`   ✅ Ingested Ch ${chNum}: "${titleText}" (${timestamps.length} timestamps)`);
    chNum++;
  }

  // Update Story metadata
  const coverCdnUrl = uploadedImageUrls["cover.jpg"] || `${cdnImageBase}/cover.jpg`;
  await db.collection("stories").updateOne(
    { _id: story._id },
    {
      $set: {
        coverImageUrl: coverCdnUrl,
        hasAudio: true,
        contentType: "both",
        isIllustrated: true,
        illustrationsCount: totalEmbeddedIllustrations,
        sourceUrl: `https://github.com/standardebooks/${repo}`,
        updatedAt: new Date(),
      },
    }
  );

  console.log(`\n🎉 SUCCESS: INGESTED ${slug.toUpperCase()} (${chNum - 1} chapters, ${totalEmbeddedIllustrations} artwork figures)`);
  return true;
}

async function main() {
  await connectDB();
  const db = mongoose.connection.db;

  const targetSlug = process.argv[2];

  if (targetSlug) {
    const targetBook = ILLUSTRATED_CATALOG.find((b) => b.slug === targetSlug || b.repo === targetSlug);
    if (targetBook) {
      await processSingleIllustratedEbook(targetBook, db);
    } else {
      console.error(`❌ Unknown book target: ${targetSlug}`);
      console.log(`Available catalog slugs:`, ILLUSTRATED_CATALOG.map((b) => b.slug));
    }
  } else {
    console.log(`🚀 RUNNING PIPELINE FOR ALL ${ILLUSTRATED_CATALOG.length} ILLUSTRATED CLASSICS IN CATALOG...`);
    for (const book of ILLUSTRATED_CATALOG) {
      await processSingleIllustratedEbook(book, db);
    }
  }

  mongoose.connection.close();
}

main();
