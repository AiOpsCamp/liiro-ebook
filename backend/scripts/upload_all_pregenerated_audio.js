#!/usr/bin/env node
/**
 * 🚀 BULK UPLOADER & MONGO DB LINKER FOR ALL PRE-GENERATED AUDIO
 * =============================================================
 * Scans /tmp/audio_pipeline_out for pre-generated audio MP3s & timestamp maps,
 * uploads them to Hetzner S3 Cloud Storage, and links them to MongoDB `liiro_prod`.
 */

"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
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

async function uploadFileToS3(localPath, s3Key, contentType = "audio/mpeg") {
  const fileBuffer = fs.readFileSync(localPath);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  await s3Client.send(command);
  return `${HETZNER_CDN_BASE}/${s3Key}`;
}

// Mapping aliases if directory slug differs slightly from DB slug
const SLUG_ALIASES = {
  "alices-adventures-in-wonderland": "alice-in-wonderland",
  "the-adventures-of-sherlock-holmes": "the-adventures-of-sherlock-holmes",
};

async function processPregeneratedAudio() {
  await connectDB();
  const db = mongoose.connection.db;

  const baseDir = "/tmp/audio_pipeline_out";
  if (!fs.existsSync(baseDir)) {
    console.error(`❌ Base directory ${baseDir} does not exist.`);
    process.exit(1);
  }

  const bookFolders = fs.readdirSync(baseDir);
  console.log("=======================================================================");
  console.log(`🚀 STARTING BULK UPLOAD & DB LINKING FOR PRE-GENERATED AUDIOBOOKS`);
  console.log(`   Found ${bookFolders.length} pre-generated book folders in ${baseDir}`);
  console.log("=======================================================================\n");

  let totalUploadedChapters = 0;
  let totalLinkedBooks = 0;

  for (const folder of bookFolders) {
    const bookPath = path.join(baseDir, folder);
    if (!fs.statSync(bookPath).isDirectory()) continue;

    const targetSlug = SLUG_ALIASES[folder] || folder;

    // Find story in MongoDB
    let story = await db.collection("stories").findOne({ slug: targetSlug });
    if (!story) {
      // Try regex search if exact slug not matched
      const slugRegex = new RegExp(targetSlug.replace(/-/g, ".*"), "i");
      story = await db.collection("stories").findOne({ slug: slugRegex });
    }

    if (!story) {
      console.warn(`⚠️ Story with slug '${targetSlug}' (folder: ${folder}) not found in MongoDB. Skipping.`);
      continue;
    }

    const storyTitle = typeof story.title === "object" ? story.title.en : story.title;
    console.log(`\n📚 Processing Book: '${storyTitle}' (Slug: '${story.slug}')`);
    console.log(`   Directory: ${bookPath}`);

    const files = fs.readdirSync(bookPath);
    const mp3Files = files.filter((f) => f.endsWith(".mp3"));

    if (mp3Files.length === 0) {
      console.warn(`   ⚠️ No MP3 files found in ${bookPath}. Skipping.`);
      continue;
    }

    let bookLinkedChapters = 0;

    for (const mp3File of mp3Files) {
      // Match pattern like chapter_1.mp3 or voice_adam_chapter_1.mp3
      const match = mp3File.match(/chapter_(\d+)\.mp3$/i);
      if (!match) continue;

      const chapterNumber = parseInt(match[1], 10);
      const localMp3Path = path.join(bookPath, mp3File);
      const s3Key = `LangoReads-Prod/ebooks/${story.slug}/${mp3File}`;

      console.log(`   ☁️ Uploading Chapter ${chapterNumber}: ${mp3File} -> S3...`);
      const s3Url = await uploadFileToS3(localMp3Path, s3Key, "audio/mpeg");

      // Read timestamps if available
      let timestamps = [];
      const timestampFileName = mp3File.replace(/\.mp3$/, "_timestamps.json");
      const timestampPath = path.join(bookPath, timestampFileName);
      if (fs.existsSync(timestampPath)) {
        try {
          timestamps = JSON.parse(fs.readFileSync(timestampPath, "utf-8"));
        } catch (_) {
          // Ignore invalid or missing timestamp JSON
        }
      }

      // Estimate duration (default 300s if not derived)
      const durationSeconds = timestamps.length > 0
        ? Math.round(timestamps[timestamps.length - 1].end || 300)
        : 300;

      // Construct audioVoices object
      const voiceObj = {
        id: "am_adam",
        key: "adam",
        name: "Adam (US Male)",
        url: s3Url,
      };
      const audioVoicesPayload = {
        defaultVoiceId: "adam",
        adam: s3Url,
        voices: [voiceObj],
      };

      // Update storychapter in MongoDB
      await db.collection("storychapters").updateOne(
        { storyId: story._id, $or: [{ chapterNumber }, { chapterIndex: chapterNumber }] },
        {
          $set: {
            audioUrl: s3Url,
            audioVoices: audioVoicesPayload,
            durationSeconds: durationSeconds,
            totalDurationSeconds: durationSeconds,
            timestamps: timestamps,
            updatedAt: new Date(),
          },
        }
      );

      bookLinkedChapters++;
      totalUploadedChapters++;
      console.log(`   ✅ Linked Chapter ${chapterNumber} in MongoDB! (${timestamps.length} sentence timestamps)`);
    }

    if (bookLinkedChapters > 0) {
      await db.collection("stories").updateOne(
        { _id: story._id },
        {
          $set: {
            hasAudio: true,
            contentType: "both",
            updatedAt: new Date(),
          },
        }
      );
      totalLinkedBooks++;
      console.log(`   🎉 Successfully updated Story '${storyTitle}' -> hasAudio: true, contentType: 'both'!`);
    }
  }

  console.log("\n=======================================================================");
  console.log(`🎉 BULK AUDIO UPLOAD & LINKING COMPLETE!`);
  console.log(`   Total Books Updated: ${totalLinkedBooks}`);
  console.log(`   Total Chapters Uploaded & Linked: ${totalUploadedChapters}`);
  console.log("=======================================================================\n");

  mongoose.connection.close();
}

processPregeneratedAudio().catch((err) => {
  console.error("Fatal Error in Bulk Audio Processing:", err);
  process.exit(1);
});
