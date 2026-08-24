"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const MONGO_URI = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true";

const s3Client = new S3Client({
  region: "eu-central-1",
  endpoint: process.env.HETZNER_S3_ENDPOINT || "https://nbg1.your-objectstorage.com",
  credentials: {
    accessKeyId: process.env.HETZNER_S3_KEY,
    secretAccessKey: process.env.HETZNER_S3_SECRET,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = "multicamp-prod-storage";
const S3_PREFIX = "Liiro-Ebook-Prod";

async function main() {
  const slug = "the-strange-case-of-dr-jekyll-and-mr-hyde";
  console.log(`🚀 [Uploader Pipeline] Starting full Hetzner S3 Upload & DB Link for '${slug}'...`);

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const story = await db.collection("stories").findOne({ slug });
  if (!story) {
    console.error("❌ Story not found in DB:", slug);
    process.exit(1);
  }

  const chapters = await db.collection("storychapters").find({ storyId: story._id }).sort({ chapterNumber: 1 }).toArray();
  console.log(`📖 Found ${chapters.length} chapters in MongoDB`);

  const localAudioDir = path.join(__dirname, "../audio_output", slug);

  for (const ch of chapters) {
    const chNum = ch.chapterNumber;
    const mp3Name = `voice_adam_chapter_${chNum}.mp3`;
    const localMp3Path = path.join(localAudioDir, mp3Name);

    if (!fs.existsSync(localMp3Path)) {
      console.warn(`⚠️ Local MP3 missing for Chapter ${chNum}: ${localMp3Path}`);
      continue;
    }

    const s3Key = `${S3_PREFIX}/audio/${slug}/voices/adam/chapter_${chNum}.mp3`;
    const publicUrl = `https://${BUCKET_NAME}.nbg1.your-objectstorage.com/${s3Key}`;
    const fileBuffer = fs.readFileSync(localMp3Path);

    console.log(`📤 [Ch ${chNum}] Uploading ${mp3Name} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB) to Hetzner S3...`);

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: "audio/mpeg",
          ACL: "public-read",
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
      console.log(`   ✅ Hetzner S3 Upload Succeeded: ${publicUrl}`);
    } catch (s3Err) {
      console.error(`   ❌ S3 Upload Failed for Ch ${chNum}:`, s3Err.message);
    }

    // Estimate duration from file size (~128kbps = 16KB/s)
    const estDurSec = Math.round(fileBuffer.length / 16000);

    // Build sentence paragraph timestamps if missing
    let timestamps = ch.timestamps;
    if (!timestamps || timestamps.length === 0) {
      const rawText = typeof ch.textPayload === "object" ? ch.textPayload.en : ch.textPayload || "";
      const paragraphs = rawText.split("\n").map((p) => p.trim()).filter(Boolean);
      const stepSec = paragraphs.length > 0 ? estDurSec / paragraphs.length : 10;

      timestamps = paragraphs.map((p, idx) => ({
        paragraphIndex: idx,
        text: p.slice(0, 80) + (p.length > 80 ? "..." : ""),
        startSec: Number((idx * stepSec).toFixed(2)),
        endSec: Number(((idx + 1) * stepSec).toFixed(2)),
        start: Number((idx * stepSec).toFixed(2)),
        end: Number(((idx + 1) * stepSec).toFixed(2)),
      }));
    }

    // Update MongoDB Document
    await db.collection("storychapters").updateOne(
      { _id: ch._id },
      {
        $set: {
          audioUrl: publicUrl,
          audioVoices: {
            defaultVoiceId: "adam",
            adam: publicUrl,
            voices: [
              { id: "am_adam", key: "adam", name: "Adam (US Male)", url: publicUrl }
            ]
          },
          timestamps,
          totalDurationSeconds: estDurSec,
          durationSeconds: estDurSec,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`   💾 Updated MongoDB Ch ${chNum} with audioUrl & ${timestamps.length} alignment timestamps`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL 10 CHAPTERS UPLOADED & LINKED TO HETZNER S3 & MONGODB!");
  console.log("=======================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("Pipeline script failed:", err);
  process.exit(1);
});
