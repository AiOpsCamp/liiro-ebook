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

// Derive slug from GitHub repo name
function deriveSlugAndAuthor(repoInput) {
  let repo = repoInput.replace(/^https?:\/\/github\.com\//i, "").replace(/^standardebooks\//i, "").replace(/\/$/i, "");

  const parts = repo.split("_");
  let authorRaw = parts[0] || "classic";
  let titleRaw = parts[1] || parts[0];

  const authorName = authorRaw.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const slug = titleRaw.toLowerCase();

  return { repo, slug, authorName, authorSlug: authorRaw };
}

async function ingestStandardEbook(repoInput) {
  await connectDB();
  const db = mongoose.connection.db;

  const { repo, slug, authorName, authorSlug } = deriveSlugAndAuthor(repoInput);

  console.log(`\n=======================================================================`);
  console.log(`🚀 UNIVERSAL AUTOMATED STANDARD EBOOKS INGESTION PIPELINE`);
  console.log(`   Repository: ${repo}`);
  console.log(`   Slug: ${slug}`);
  console.log(`=======================================================================\n`);

  const rawBase = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub`;
  const opfContent = await fetchText(`${rawBase}/content.opf`);

  if (!opfContent) {
    console.error(`❌ Could not fetch content.opf from GitHub repo: ${repo}`);
    console.error(`   URL: ${rawBase}/content.opf`);
    process.exit(1);
  }

  // 1. Extract Book Title from content.opf
  const titleMatch = opfContent.match(/<dc:title[^>]*>(.*?)<\/dc:title>/i);
  const bookTitle = titleMatch ? cleanText(titleMatch[1]) : slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // 2. Locate all Chapter XHTML files
  const itemMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/(chapter-[^"']+\.xhtml)["']/gi)];
  let chapterFiles = [...new Set(itemMatches.map((m) => m[1]))];

  if (chapterFiles.length === 0) {
    const genericMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/([^"']+\.xhtml)["']/gi)];
    chapterFiles = genericMatches
      .map((m) => m[1])
      .filter((f) => !/colophon|uncopyright|titlepage|imprint|halftitle|epigraph|loi|dedication/i.test(f));
  }

  console.log(`📖 Book Title: "${bookTitle}"`);
  console.log(`📑 Chapter XHTML Files Found: ${chapterFiles.length}`);

  // 3. Auto-Detect Artwork & Illustrations
  const imageRegex = /<item\s+[^>]*href=["']images\/([^"']+)["']/gi;
  const imageFilesSet = new Set();
  let imgMatch;
  while ((imgMatch = imageRegex.exec(opfContent)) !== null) {
    imageFilesSet.add(imgMatch[1]);
  }
  imageFilesSet.add("cover.jpg");

  const imageFiles = Array.from(imageFilesSet);
  const hasIllustrations = imageFiles.some((f) => f.includes("illustration") || f.includes("plate") || f.includes("figure"));
  console.log(`🖼️ Auto-Detected Images Count: ${imageFiles.length} (isIllustrated: ${hasIllustrations})`);

  // Upload images to Hetzner S3 CDN
  const uploadedImageUrls = {};
  for (const imgName of imageFiles) {
    const imgUrl = `${rawBase}/images/${imgName}`;
    const buffer = await fetchBuffer(imgUrl);
    if (buffer) {
      const cdnUrl = await uploadImageToHetzner(slug, imgName, buffer);
      uploadedImageUrls[imgName] = cdnUrl;
      console.log(`   ✅ Hetzner S3 CDN Uploaded: ${imgName} -> ${cdnUrl}`);
    }
  }

  // 4. Ensure Author document exists or fetch ID
  let authorObj = await db.collection("authors").findOne({ name: authorName });
  if (!authorObj) {
    const authorRes = await db.collection("authors").insertOne({
      name: authorName,
      slug: authorSlug || authorName.toLowerCase().replace(/\s+/g, "-"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    authorObj = { _id: authorRes.insertedId, name: authorName };
  }

  // 5. Ensure Story document exists or create
  let story = await db.collection("stories").findOne({ slug });
  if (!story) {
    const storyRes = await db.collection("stories").insertOne({
      slug,
      title: { en: bookTitle },
      author: authorObj._id,
      language: "en",
      createdAt: new Date(),
    });
    story = { _id: storyRes.insertedId, slug, title: { en: bookTitle } };
  }

  // 6. Delete old chapter records for pristine fresh import
  await db.collection("storychapters").deleteMany({ storyId: story._id });
  console.log("Cleared old chapter records in MongoDB.");

  const cdnAudioBase = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/${slug}`;
  const cdnImageBase = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/${slug}/images`;
  const localAudioFolder = `/tmp/audio_pipeline_out/${slug}`;

  let totalEmbeddedIllustrations = 0;
  let chNum = 1;

  for (const chFile of chapterFiles) {
    const rawXhtml = await fetchText(`${rawBase}/text/${chFile}`);
    if (!rawXhtml) continue;

    // Extract header metadata cleanly
    const headerMatch = rawXhtml.match(/<header[^>]*>([\s\S]*?)<\/header>/i) || rawXhtml.match(/<hgroup[^>]*>([\s\S]*?)<\/hgroup>/i);
    let ordinalText = `Chapter ${chNum}`;
    let mainTitleText = "";
    let subTitleText = "";
    let headerHtmlBlock = "";

    if (headerMatch) {
      const headerInner = headerMatch[1];
      const h2Match = headerInner.match(/<h2[^>]*>(.*?)<\/h2>/i);
      const titleMatches = [...headerInner.matchAll(/<(?:p|h3|h4)[^>]*>(.*?)<\/(?:p|h3|h4)>/gi)].map(m => m[1]);

      if (h2Match) ordinalText = cleanText(h2Match[1]);
      mainTitleText = titleMatches[0] ? cleanText(titleMatches[0]) : "";
      subTitleText = titleMatches[1] ? cleanText(titleMatches[1]) : "";

      headerHtmlBlock = `
        <header class="chapter-header-styled" style="text-align: center; margin-bottom: 28px; display: block;">
          ${ordinalText ? `<h2 style="font-family: Georgia, serif; font-size: 1.8rem; font-weight: 700; text-align: center; margin-bottom: 8px;">${ordinalText}</h2>` : ""}
          ${mainTitleText ? `<h3 style="font-family: Georgia, serif; font-size: 1.15rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; margin-bottom: 4px; color: #374151;">${mainTitleText}</h3>` : ""}
          ${subTitleText ? `<p style="font-size: 0.95rem; font-style: italic; opacity: 0.75; text-align: center; margin-bottom: 0;">${subTitleText}</p>` : ""}
        </header>
      `;
    }

    let titleText = mainTitleText ? `${ordinalText}: ${mainTitleText}` : ordinalText;

    // Extract section content
    const sectionMatch = rawXhtml.match(/<section[^>]*>([\s\S]*?)<\/section>/i);
    let sectionHtml = sectionMatch ? sectionMatch[1] : rawXhtml;

    // Replace header or hgroup with headerHtmlBlock
    if (sectionHtml.match(/<header[^>]*>[\s\S]*?<\/header>/i)) {
      sectionHtml = sectionHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/i, headerHtmlBlock);
    } else if (sectionHtml.match(/<hgroup[^>]*>[\s\S]*?<\/hgroup>/i)) {
      sectionHtml = sectionHtml.replace(/<hgroup[^>]*>[\s\S]*?<\/hgroup>/i, headerHtmlBlock);
    } else if (headerHtmlBlock) {
      sectionHtml = headerHtmlBlock + sectionHtml;
    }

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

    // Load Whispersync timestamps if present locally
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
    chNum++;
  }

  // Update Story metadata
  const coverCdnUrl = uploadedImageUrls["cover.jpg"] || uploadedImageUrls["cover.svg"] || `${cdnImageBase}/cover.jpg`;
  await db.collection("stories").updateOne(
    { _id: story._id },
    {
      $set: {
        title: { en: bookTitle },
        coverImageUrl: coverCdnUrl,
        hasAudio: true,
        isPublished: true,
        published: true,
        contentType: "both",
        isIllustrated: hasIllustrations || totalEmbeddedIllustrations > 0,
        illustrationsCount: totalEmbeddedIllustrations,
        sourceUrl: `https://github.com/standardebooks/${repo}`,
        updatedAt: new Date(),
      },
    }
  );

  // 7. Post-Import Automated Validation Engine
  const { execSync } = require("child_process");
  console.log("\n=======================================================================");
  console.log(`🔍 RUNNING AUTOMATED POST-IMPORT VALIDATION FOR "${bookTitle.toUpperCase()}"...`);
  console.log("=======================================================================");

  const validatedStory = await db.collection("stories").findOne({ slug, isPublished: true });
  if (validatedStory) {
    console.log(`   ✅ API Story Query Check: PASSED (id: ${validatedStory._id})`);
  } else {
    console.error(`   ❌ API Story Query Check: FAILED (Story not queryable)`);
  }

  const dbChapters = await db.collection("storychapters").find({ storyId: story._id }).toArray();
  if (dbChapters.length === chapterFiles.length) {
    console.log(`   ✅ Chapters Integrity Check: PASSED (${dbChapters.length}/${chapterFiles.length} chapters)`);
  } else {
    console.warn(`   ⚠️ Chapters Integrity Warning: ${dbChapters.length} in DB vs ${chapterFiles.length} files`);
  }

  // S3 Cover Image HTTP Check
  try {
    const coverRes = execSync(`curl -s -I "${coverCdnUrl}"`).toString();
    const statusLine = coverRes.split("\n")[0].trim();
    if (statusLine.includes("200")) {
      console.log(`   ✅ S3 Cover CDN Check: PASSED (${statusLine})`);
    } else {
      console.warn(`   ⚠️ S3 Cover CDN Warning: ${statusLine}`);
    }
  } catch (e) {
    console.warn(`   ⚠️ S3 Cover CDN Check Error: ${e.message}`);
  }

  console.log("\n=======================================================================");
  console.log(`🎉 UNIVERSAL INGESTION & VALIDATION COMPLETE FOR "${bookTitle.toUpperCase()}"!`);
  console.log(`   Total Chapters Ingested: ${chNum - 1}/${chapterFiles.length}`);
  console.log(`   Total S3 Images Uploaded: ${Object.keys(uploadedImageUrls).length}`);
  console.log(`   Total Embedded Artwork Figures: ${totalEmbeddedIllustrations}`);
  console.log(`   Cover CDN Image: ${coverCdnUrl}`);
  console.log("=======================================================================");

  mongoose.connection.close();
}

const repoInput = process.argv[2] || "lewis-carroll_alices-adventures-in-wonderland_john-tenniel";
ingestStandardEbook(repoInput);
