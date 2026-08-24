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

const localAudioDir = fs.existsSync('/tmp/jekyll_audio') ? '/tmp/jekyll_audio' : '/Users/humayunrashid/multicamp/multicamp-frontend/public/audio/the-strange-case-of-dr-jekyll-and-mr-hyde';

const MULTI_VOICES_CONFIG = [
  {
    id: 'am_adam',
    key: 'adam',
    name: 'Adam (US Male)',
    gender: 'Male',
    accent: 'US',
    description: 'Deep, clear Kokoro American male voice with natural cadence',
  },
  {
    id: 'af_heart',
    key: 'heart',
    name: 'Heart (US Female)',
    gender: 'Female',
    accent: 'US',
    description: 'Warm, expressive Kokoro American female voice with rich emotion',
  },
  {
    id: 'bf_emma',
    key: 'emma',
    name: 'Emma (UK Female)',
    gender: 'Female',
    accent: 'UK',
    description: 'Crisp, classic Kokoro British female voice ideal for Victorian literature',
  },
  {
    id: 'bm_george',
    key: 'george',
    name: 'George (UK Male)',
    gender: 'Male',
    accent: 'UK',
    description: 'Resonant Kokoro British male voice with dramatic storytelling pitch',
  },
];

async function uploadToHetznerS3(filePath, s3Key) {
  const fileBuffer = fs.readFileSync(filePath);
  const putCmd = new PutObjectCommand({
    Bucket: HETZNER_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: 'audio/mpeg',
    ACL: 'public-read',
  });
  await hetznerClient.send(putCmd);
  return `${HETZNER_CDN_BASE}/${s3Key}`;
}

const connectDB = require('../src/db/connect');

async function run() {
  await connectDB();
  console.log('✅ Database Connected.');

  const db = mongoose.connection.db;
  const storiesCol = db.collection('stories');
  const chaptersCol = db.collection('storychapters');

  const slug = 'the-strange-case-of-dr-jekyll-and-mr-hyde';
  const story = await storiesCol.findOne({ slug });

  if (!story) {
    console.error('❌ Story not found:', slug);
    process.exit(1);
  }

  console.log(`\n🎧 Uploading 40 Kokoro Studio Voice Audio Files to Hetzner Object Storage S3...`);
  await storiesCol.updateOne({ _id: story._id }, { $set: { contentType: 'both' } });

  const chapters = await chaptersCol.find({ storyId: story._id }).sort({ chapterNumber: 1 }).toArray();

  for (const ch of chapters) {
    const chNum = ch.chapterNumber;
    console.log(`\n[Chapter ${chNum}/${chapters.length}] Uploading & Linking Kokoro Voices...`);

    const voicesList = [];
    let defaultAdamUrl = '';

    for (const v of MULTI_VOICES_CONFIG) {
      const fileName = `voice_${v.key}_chapter_${chNum}.mp3`;
      const localFilePath = path.join(localAudioDir, fileName);

      if (!fs.existsSync(localFilePath)) {
        console.warn(`  ⚠️ Missing local file: ${fileName}`);
        continue;
      }

      const s3Key = `LangoReads-Prod/ebooks/${slug}/voice_${v.key}_chapter_${chNum}.mp3`;
      console.log(`  ☁️ Uploading ${fileName} -> ${HETZNER_CDN_BASE}/${s3Key}...`);
      const s3Url = await uploadToHetznerS3(localFilePath, s3Key);

      if (v.key === 'adam') {
        defaultAdamUrl = s3Url;
      }

      voicesList.push({
        id: v.id,
        key: v.key,
        name: v.name,
        gender: v.gender,
        accent: v.accent,
        description: v.description,
        url: s3Url,
      });
    }

    const voicesObj = {
      defaultVoiceId: 'am_adam',
      voices: voicesList,
    };

    // Update StoryChapter in MongoDB langoread_prod
    await chaptersCol.updateOne(
      { _id: ch._id },
      {
        $set: {
          'audioUrl.en': defaultAdamUrl,
          'audioVoices.en': voicesObj,
          durationSeconds: 210,
        },
      }
    );

    console.log(`✅ [Ch ${chNum}] Updated 4 Kokoro Voices in MongoDB with Hetzner S3 URLs!`);
  }

  console.log('\n==================================================');
  console.log('🎉 40 KOKORO STUDIO VOICES UPLOADED & LINKED TO HETZNER S3!');
  console.log('==================================================\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal Script Error:', err);
  process.exit(1);
});
