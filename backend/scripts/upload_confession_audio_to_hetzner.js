const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Hetzner S3 Client
const hetznerClient = new S3Client({
  region: 'nbg1',
  endpoint: 'https://nbg1.your-objectstorage.com',
  credentials: {
    accessKeyId: process.env.HETZNER_S3_KEY || 'KVFSGG7GLKG95GYEJOE3',
    secretAccessKey: process.env.HETZNER_S3_SECRET || 'DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK',
  },
});
const HETZNER_BUCKET = process.env.HETZNER_S3_BUCKET || 'multicamp-prod-storage';
const HETZNER_CDN_BASE = `https://${HETZNER_BUCKET}.nbg1.your-objectstorage.com`;

const SLUG = 'a-confession_aylmer-maude';
const localAudioDir = `/Users/humayunrashid/multicamp/liiro-ebook/frontend/public/audio/${SLUG}`;

const MONGO_URI = 'mongodb+srv://raahatrashid09_db_user:TNYegxNgSWRhV5Xn@cluster0.xips3wo.mongodb.net/langoreads';

async function uploadFileToHetznerS3(filePath, s3Key, contentType = 'audio/wav') {
  console.log(`  📤 Uploading ${path.basename(filePath)} (${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB) to s3://${HETZNER_BUCKET}/${s3Key}...`);
  const fileBuffer = fs.readFileSync(filePath);
  const putCmd = new PutObjectCommand({
    Bucket: HETZNER_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: 'public-read',
  });
  await hetznerClient.send(putCmd);
  const publicUrl = `${HETZNER_CDN_BASE}/${s3Key}`;
  console.log(`  ✅ Uploaded: ${publicUrl}`);
  return publicUrl;
}

async function run() {
  console.log(`🔌 Connecting to Cloud MongoDB Atlas (${MONGO_URI.replace(/:[^:@]+@/, ':****@')})...`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const storiesCol = db.collection('stories');
  const chaptersCol = db.collection('storychapters');

  const story = await storiesCol.findOne({ slug: SLUG });
  if (!story) {
    console.error('❌ Story not found:', SLUG);
    process.exit(1);
  }

  console.log(`📖 Found Story: ${story._id} (${SLUG})`);

  const chapter1 = await chaptersCol.findOne({ storyId: story._id, chapterNumber: 1 });
  if (!chapter1) {
    console.error('❌ Chapter 1 not found!');
    process.exit(1);
  }

  const voiceKeys = ['adam', 'heart', 'emma', 'george'];
  const hetznerAudioUrls = {};

  for (const vKey of voiceKeys) {
    const fileName = `voice_${vKey}_chapter_1.wav`;
    const localFilePath = path.join(localAudioDir, fileName);

    if (fs.existsSync(localFilePath)) {
      const s3Key = `ebooks/audio/${SLUG}/${fileName}`;
      const cdnUrl = await uploadFileToHetznerS3(localFilePath, s3Key, 'audio/wav');
      hetznerAudioUrls[vKey] = cdnUrl;
    } else {
      console.warn(`  ⚠️ Local file not found: ${localFilePath}`);
    }
  }

  const defaultUrl = hetznerAudioUrls.adam || Object.values(hetznerAudioUrls)[0];

  console.log('\n💾 Updating Cloud MongoDB Atlas Database...');
  await chaptersCol.updateOne(
    { _id: chapter1._id },
    {
      $set: {
        audioUrl: defaultUrl,
        audioStreamUrls: hetznerAudioUrls,
        isAudioAvailable: true,
      },
    }
  );

  await storiesCol.updateOne(
    { _id: story._id },
    {
      $set: {
        contentType: 'both',
        isAudioAvailable: true,
      },
    }
  );

  console.log('\n🎉 SUCCESS! Uploaded Chapter 1 Kokoro audio files to Hetzner S3 Storage and updated MongoDB Atlas!');
  console.log('🔗 Public Hetzner S3 Audio URL:', defaultUrl);

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Upload error:', err);
  process.exit(1);
});
