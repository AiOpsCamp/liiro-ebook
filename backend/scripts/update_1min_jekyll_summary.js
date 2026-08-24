"use strict";

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../src/db/connect");
const BookSummary = require("../src/models/BookSummary.model");
const S3SignerService = require("../src/services/s3Signer.service");

async function updateJekyllSummaryAudio() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for 1-minute summary update...");

    const localMp3Path = path.join(__dirname, "../public/dr_jekyll_1min_summary.mp3");
    if (!fs.existsSync(localMp3Path)) {
      console.error("Local MP3 file missing at:", localMp3Path);
      process.exit(1);
    }

    const s3Key = "Liiro-Ebook-Prod/audio/summaries/dr_jekyll_1min_summary.mp3";
    let summaryUrl = "http://localhost:5012/dr_jekyll_1min_summary.mp3";

    try {
      console.log("Uploading 1-minute audio summary to Hetzner Ceph S3...");
      const fileBuffer = fs.readFileSync(localMp3Path);
      await S3SignerService.uploadObject(s3Key, fileBuffer, "audio/mpeg");
      summaryUrl = `https://multicamp-prod-storage.nbg1.your-objectstorage.com/${s3Key}`;
      console.log("🎉 Successfully uploaded 1-min summary to Hetzner S3:", summaryUrl);
    } catch (e) {
      console.warn("S3 Upload fallback (serving via backend public endpoint):", e.message);
    }

    const res = await BookSummary.updateOne(
      { slug: "the-strange-case-of-dr-jekyll-and-mr-hyde" },
      {
        $set: {
          summaryAudioUrl: summaryUrl,
          estimatedAudioMinutes: 1,
          estimatedReadMinutes: 1,
        },
      }
    );

    console.log("✅ Successfully updated MongoDB BookSummary record!", res);
    process.exit(0);
  } catch (error) {
    console.error("Error updating Jekyll summary:", error);
    process.exit(1);
  }
}

updateJekyllSummaryAudio();
