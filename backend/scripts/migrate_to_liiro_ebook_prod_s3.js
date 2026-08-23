require("dotenv").config();
const { S3Client, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");

const BUCKET = "multicamp-prod-storage";
const ENDPOINT = "https://nbg1.your-objectstorage.com";

const s3Client = new S3Client({
  region: "nbg1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.HETZNER_S3_KEY || "KVFSGG7GLKG95GYEJOE3",
    secretAccessKey: process.env.HETZNER_S3_SECRET || "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK",
  },
});

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@mongodb-svc.multicamp.svc.cluster.local:27017/liiro_prod?authSource=admin";

// Helper to determine destination key in Liiro-Ebook-Prod/
function mapToLiiroEbookProdKey(sourceKey) {
  // Pattern 1: ebooks/audio/<slug>/voice_<voice>_chapter_<num>.<ext>
  let match = sourceKey.match(/^ebooks\/audio\/([^\/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)$/);
  if (match) {
    const [, slug, voice, num, ext] = match;
    return `Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${num}.${ext}`;
  }

  // Pattern 2: LangoReads-Prod/ebooks/<slug>/voice_<voice>_chapter_<num>.<ext>
  match = sourceKey.match(/^LangoReads-Prod\/ebooks\/([^\/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)$/);
  if (match) {
    const [, slug, voice, num, ext] = match;
    return `Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${num}.${ext}`;
  }

  // Pattern 3: LangoReads-Prod/ebooks/<slug>/<lang>/chapter_<num>.<ext>
  match = sourceKey.match(/^LangoReads-Prod\/ebooks\/([^\/]+)\/([a-z]{2})\/chapter_(\d+)\.(mp3|wav)$/);
  if (match) {
    const [, slug, lang, num, ext] = match;
    return `Liiro-Ebook-Prod/audio/${slug}/${lang}/chapter_${num}.${ext}`;
  }

  // Pattern 4: Generic asset fallback
  if (sourceKey.startsWith("LangoReads-Prod/ebooks/")) {
    return sourceKey.replace(/^LangoReads-Prod\/ebooks\//, "Liiro-Ebook-Prod/assets/");
  }

  return null;
}

async function getAllKeys(prefix) {
  let isTruncated = true;
  let token = undefined;
  const items = [];
  while (isTruncated) {
    const res = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
    if (res.Contents) items.push(...res.Contents);
    isTruncated = res.IsTruncated;
    token = res.NextContinuationToken;
  }
  return items;
}

async function migrateS3Files() {
  console.log("🚀 Step 1: Scanning legacy S3 prefixes ('LangoReads-Prod/', 'ebooks/audio/')...");
  const langoReadsKeys = await getAllKeys("LangoReads-Prod/");
  const ebooksAudioKeys = await getAllKeys("ebooks/audio/");

  const allSourceKeys = [...langoReadsKeys, ...ebooksAudioKeys];
  console.log(`📋 Found ${allSourceKeys.length} total source files on Hetzner S3.`);

  let copied = 0;
  let skipped = 0;
  let errors = 0;

  const urlMap = new Map(); // Old URL pattern -> New URL

  for (const item of allSourceKeys) {
    const srcKey = item.Key;
    const destKey = mapToLiiroEbookProdKey(srcKey);

    if (!destKey) {
      console.log(`⚠️ Skipping unmapped key: ${srcKey}`);
      continue;
    }

    const srcUrl = `${ENDPOINT}/${srcKey}`;
    const destUrl = `${ENDPOINT}/${destKey}`;
    urlMap.set(srcUrl, destUrl);

    // Check if already copied
    try {
      const headRes = await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: destKey }));
      if (headRes.ContentLength === item.Size) {
        skipped++;
        continue;
      }
    } catch (e) {
      // Needs copy
    }

    try {
      const mimeType = destKey.endsWith(".wav") ? "audio/wav" : destKey.endsWith(".mp3") ? "audio/mpeg" : "application/octet-stream";
      await s3Client.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${srcKey}`,
        Key: destKey,
        ACL: "public-read",
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      }));
      copied++;
      console.log(`✅ [COPIED] ${srcKey}\n       ➡️ ${destKey}`);
    } catch (err) {
      errors++;
      console.error(`❌ [ERROR] Copying ${srcKey}:`, err.message);
    }
  }

  console.log(`\n🎉 S3 Copy Summary: ${copied} copied, ${skipped} skipped (already up to date), ${errors} errors.`);
  return urlMap;
}

async function updateMongoDbUrls() {
  console.log("\n🚀 Step 2: Connecting to MongoDB Atlas database...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB Connected!");

  const db = mongoose.connection.db;
  const storiesCol = db.collection("stories");
  const chaptersCol = db.collection("storychapters");

  let updatedStories = 0;
  let updatedChapters = 0;

  // Update stories audioUrl & coverImageUrl
  const stories = await storiesCol.find({}).toArray();
  for (const story of stories) {
    let changed = false;
    let newAudioUrl = story.audioUrl;
    let newCoverUrl = story.coverImageUrl;

    if (typeof story.audioUrl === "string" && (story.audioUrl.includes("LangoReads-Prod") || story.audioUrl.includes("ebooks/audio"))) {
      newAudioUrl = story.audioUrl
        .replace(/LangoReads-Prod\/ebooks\/([^\/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)/, "Liiro-Ebook-Prod/audio/$1/voices/$2/chapter_$3.$4")
        .replace(/ebooks\/audio\/([^\/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)/, "Liiro-Ebook-Prod/audio/$1/voices/$2/chapter_$3.$4")
        .replace(/LangoReads-Prod\/ebooks\/([^\/]+)\/([a-z]{2})\/chapter_(\d+)\.(mp3|wav)/, "Liiro-Ebook-Prod/audio/$1/$2/chapter_$3.$4");
      changed = true;
    }

    if (typeof story.coverImageUrl === "string" && story.coverImageUrl.includes("LangoReads-Prod")) {
      newCoverUrl = story.coverImageUrl.replace(/LangoReads-Prod\/ebooks\//, "Liiro-Ebook-Prod/covers/");
      changed = true;
    }

    if (changed) {
      await storiesCol.updateOne({ _id: story._id }, { $set: { audioUrl: newAudioUrl, coverImageUrl: newCoverUrl } });
      updatedStories++;
    }
  }

  // Update chapters audioUrl
  const chapters = await chaptersCol.find({}).toArray();
  for (const ch of chapters) {
    let changed = false;
    let newAudioUrl = ch.audioUrl;

    if (typeof ch.audioUrl === "string" && (ch.audioUrl.includes("LangoReads-Prod") || ch.audioUrl.includes("ebooks/audio"))) {
      newAudioUrl = ch.audioUrl
        .replace(/LangoReads-Prod\/ebooks\/([^\/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)/, "Liiro-Ebook-Prod/audio/$1/voices/$2/chapter_$3.$4")
        .replace(/ebooks\/audio\/([^\/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)/, "Liiro-Ebook-Prod/audio/$1/voices/$2/chapter_$3.$4")
        .replace(/LangoReads-Prod\/ebooks\/([^\/]+)\/([a-z]{2})\/chapter_(\d+)\.(mp3|wav)/, "Liiro-Ebook-Prod/audio/$1/$2/chapter_$3.$4");
      changed = true;
    }

    if (changed) {
      await chaptersCol.updateOne({ _id: ch._id }, { $set: { audioUrl: newAudioUrl } });
      updatedChapters++;
    }
  }

  console.log(`✅ MongoDB Update Complete: ${updatedStories} stories updated, ${updatedChapters} chapters updated.`);
  await mongoose.disconnect();
}

async function main() {
  try {
    await migrateS3Files();
    await updateMongoDbUrls();
    console.log("\n✨ ALL MIGRATIONS FINISHED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Migration Error:", err);
    process.exit(1);
  }
}

main();
