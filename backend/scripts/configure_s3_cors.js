"use strict";

require("dotenv").config();
const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.HETZNER_S3_ENDPOINT || "https://nbg1.your-objectstorage.com",
  credentials: {
    accessKeyId: process.env.HETZNER_S3_KEY,
    secretAccessKey: process.env.HETZNER_S3_SECRET,
  },
  forcePathStyle: true,
});

async function configureCors() {
  console.log("🔒 Configuring S3 CORS policy for Liiro Ebook Production...");
  const bucketName = process.env.HETZNER_S3_BUCKET || "multicamp-prod-storage";

  const corsParams = {
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedOrigins: [
            "https://app.liiro.io",
            "https://liiro.app",
            "https://liiro-ebook.web.app",
            "http://localhost:8086",
            "http://localhost:5012",
          ],
          ExposeHeaders: ["ETag", "Content-Length", "Content-Type", "Accept-Ranges"],
          MaxAgeSeconds: 86400,
        },
      ],
    },
  };

  try {
    const command = new PutBucketCorsCommand(corsParams);
    await s3Client.send(command);
    console.log(`✅ S3 CORS Policy updated successfully for bucket '${bucketName}'!`);
  } catch (err) {
    console.error("❌ Error setting S3 CORS policy:", err.message);
  }
}

configureCors();
