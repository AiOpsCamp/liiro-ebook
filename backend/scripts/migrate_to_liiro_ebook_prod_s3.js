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
  let match = sourceKey.match(/^ebooks\/audio\/([^/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)$/);
  if (match) {
    const [, slug, voice, num, ext] = match;
    return `Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${num}.${ext}`;
  }

  // Pattern 2: LangoReads-Prod/ebooks/<slug>/voice_<voice>_chapter_<num>.<ext>
  match = sourceKey.match(/^LangoReads-Prod\/ebooks\/([^/]+)\/voice_([^_]+)_chapter_(\d+)\.(mp3|wav)$/);
  if (match) {
    const [, slug, voice, num, ext] = match;
    return `Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${num}.${ext}`;
  }

  // Pattern 3: LangoReads-Prod/ebooks/<slug>/<lang>/chapter_<num>.<ext>
  match = sourceKey.match(/^LangoReads-Prod\/ebooks\/([^/]+)\/([a-z]{2})\/chapter_(\d+)\.(mp3|wav)$/);
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

  console.log("Updating stories with legacy audioUrl / coverImageUrl patterns...");
  const sRes1 = await storiesCol.updateMany(
    { audioUrl: { $regex: /LangoReads-Prod\/ebooks/ } },
    [{ $set: { audioUrl: { $replaceOne: { input: "$audioUrl", find: "LangoReads-Prod/ebooks/", replacement: "Liiro-Ebook-Prod/audio/" } } } }]
  );
  const sRes2 = await storiesCol.updateMany(
    { audioUrl: { $regex: /ebooks\/audio/ } },
    [{ $set: { audioUrl: { $replaceOne: { input: "$audioUrl", find: "ebooks/audio/", replacement: "Liiro-Ebook-Prod/audio/" } } } }]
  );

  console.log("Updating storychapters with legacy audioUrl patterns...");
  const cRes1 = await chaptersCol.updateMany(
    { audioUrl: { $regex: /LangoReads-Prod\/ebooks/ } },
    [{ $set: { audioUrl: { $replaceOne: { input: "$audioUrl", find: "LangoReads-Prod/ebooks/", replacement: "Liiro-Ebook-Prod/audio/" } } } }]
  );
  const cRes2 = await chaptersCol.updateMany(
    { audioUrl: { $regex: /ebooks\/audio/ } },
    [{ $set: { audioUrl: { $replaceOne: { input: "$audioUrl", find: "ebooks/audio/", replacement: "Liiro-Ebook-Prod/audio/" } } } }]
  );

  console.log(`✅ MongoDB Update Complete! Stories updated: ${sRes1.modifiedCount + sRes2.modifiedCount}, Chapters updated: ${cRes1.modifiedCount + cRes2.modifiedCount}.`);
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
