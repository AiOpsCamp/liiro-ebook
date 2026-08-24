#!/usr/bin/env node
/**
 * 📤 Hetzner S3 Uploader & MongoDB Database Linker
 * =================================================
 * Uploads synthesized audio MP3s & HLS segment chunks to Hetzner Object Storage
 * and updates storychapters documents in MongoDB `liiro_prod`.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true";
const BUCKET = process.env.HETZNER_S3_BUCKET || "multicamp-prod-storage";
const ENDPOINT = process.env.HETZNER_S3_ENDPOINT || "https://nbg1.your-objectstorage.com";
const S3_KEY = process.env.HETZNER_S3_KEY || "KVFSGG7GLKG95GYEJOE3";
const S3_SECRET = process.env.HETZNER_S3_SECRET || "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK";

const s3Client = new S3Client({
  region: "nbg1",
  endpoint: ENDPOINT,
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
  return `${ENDPOINT.replace(/\/$/, "")}/${BUCKET}/${s3Key}`;
}

async function linkChapterInDatabase(slug, chapterNumber, audioUrl, durationSec, timestamps = [], voice = "adam") {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const story = await db.collection("stories").findOne({ slug });
  if (!story) {
    throw new Error(`Story with slug '${slug}' not found in MongoDB`);
  }

  const voiceKey = voice.replace(/^am_/, "").replace(/^af_/, "").toLowerCase();
  const voiceName = voiceKey === "adam" ? "Adam (US Male)" : voiceKey === "heart" ? "Heart (US Female)" : voiceKey;

  const voiceObj = {
    id: `am_${voiceKey}`,
    key: voiceKey,
    name: voiceName,
    url: audioUrl,
  };

  const audioVoicesPayload = {
    defaultVoiceId: voiceKey,
    [voiceKey]: audioUrl,
    voices: [voiceObj],
  };

  const chNum = parseInt(chapterNumber, 10);
  const result = await db.collection("storychapters").updateOne(
    { storyId: story._id, $or: [{ chapterNumber: chNum }, { chapterIndex: chNum }] },
    {
      $set: {
        audioUrl: audioUrl,
        audioVoices: audioVoicesPayload,
        totalDurationSeconds: Math.round(durationSec),
        durationSeconds: Math.round(durationSec),
        timestamps: timestamps,
        updatedAt: new Date(),
      },
    }
  );

  console.log(`✅ Updated Chapter ${chNum} of '${slug}' in MongoDB liiro_prod (Modified: ${result.modifiedCount})`);
  await mongoose.disconnect();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log("Usage: node uploader.js <localAudioPath> <slug> <chapterNumber> <durationSec> [timestampsJsonPath] [voice]");
    process.exit(1);
  }

  const [localAudioPath, slug, chapterNumber, durationSecStr, timestampsPath, voice = "adam"] = args;
  const durationSec = parseFloat(durationSecStr);

  const voiceKey = voice.replace(/^am_/, "").replace(/^af_/, "").toLowerCase();
  const s3Key = `Liiro-Ebook-Prod/audio/${slug}/voices/${voiceKey}/chapter_${chapterNumber}.mp3`;

  console.log(`📤 Uploading ${path.basename(localAudioPath)} to Hetzner S3 key: ${s3Key}...`);
  const audioUrl = await uploadFileToS3(localAudioPath, s3Key, "audio/mpeg");
  console.log(`✅ Uploaded to S3: ${audioUrl}`);

  let timestamps = [];
  if (timestampsPath && fs.existsSync(timestampsPath)) {
    timestamps = JSON.parse(fs.readFileSync(timestampsPath, "utf-8"));
  }

  await linkChapterInDatabase(slug, chapterNumber, audioUrl, durationSec, timestamps, voiceKey);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Uploader error:", err);
    process.exit(1);
  });
}

module.exports = { uploadFileToS3, linkChapterInDatabase };
