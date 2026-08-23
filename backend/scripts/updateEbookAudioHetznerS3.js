const mongoose = require('mongoose');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const gTTS = require('gtts');
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

const tmpDir = '/tmp/tmp_audio_hetzner';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

function generateGttsAudioPure(text, langCode, outputPath) {
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, langCode);
    gtts.save(outputPath, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function uploadToHetznerS3(buffer, key, contentType = 'audio/mpeg') {
  const putCmd = new PutObjectCommand({
    Bucket: HETZNER_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });
  await hetznerClient.send(putCmd);
  return `${HETZNER_CDN_BASE}/${key}`;
}

async function existsInHetznerS3(key) {
  try {
    const headCmd = new HeadObjectCommand({ Bucket: HETZNER_BUCKET, Key: key });
    await hetznerClient.send(headCmd);
    return true;
  } catch (err) {
    return false;
  }
}

async function run() {
  const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://admin:PROD_PASSWORD_2026@mongodb:27017/langoread_prod?authSource=admin';
  console.log(`🔌 Connecting to MongoDB (${mongoUri.replace(/:[^:@]+@/, ':****@')})...`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db;
  const storiesCol = db.collection('stories');
  const chaptersCol = db.collection('storychapters');

  // 1. First, update existing DigitalOcean & localhost audio URLs to Hetzner Object Storage S3
  console.log('\n🔄 Stage 1: Updating existing audio URLs to Hetzner Object Storage S3...');
  const cursor = chaptersCol.find({ audioUrl: { $ne: null } });
  let updatedCount = 0;

  while (await cursor.hasNext()) {
    const ch = await cursor.next();
    let oldUrl = typeof ch.audioUrl === 'string' ? ch.audioUrl : ch.audioUrl?.en || '';
    if (!oldUrl) continue;

    let newUrl = oldUrl;
    if (oldUrl.includes('digitaloceanspaces.com/')) {
      newUrl = oldUrl.replace(/https:\/\/[^/]+\.digitaloceanspaces\.com\//i, `${HETZNER_CDN_BASE}/`);
    } else if (oldUrl.includes('localhost:8085/audio/')) {
      const parts = oldUrl.split('localhost:8085/audio/')[1].split('?')[0];
      newUrl = `${HETZNER_CDN_BASE}/LangoReads-Prod/ebooks/${parts}`;
    }

    if (newUrl !== oldUrl) {
      const updateDoc = typeof ch.audioUrl === 'string' ? { audioUrl: newUrl } : { 'audioUrl.en': newUrl };
      await chaptersCol.updateOne({ _id: ch._id }, { $set: updateDoc });
      updatedCount++;
    }
  }
  console.log(`✅ Stage 1 Complete: Updated ${updatedCount} audio URLs to Hetzner Object Storage S3.`);

  // 2. Second, find stories that still lack chapter audio, generate pure gTTS MP3s, upload to Hetzner S3, and link
  console.log('\n🎙️ Stage 2: Auditing stories for missing chapter audio...');
  const stories = await storiesCol.find({}).toArray();

  for (const story of stories) {
    const chapters = await chaptersCol.find({ storyId: story._id }).sort({ chapterNumber: 1 }).toArray();
    let missingAudioCount = 0;

    for (const ch of chapters) {
      const hasAudio = ch.audioUrl && (typeof ch.audioUrl === 'string' ? ch.audioUrl.length > 0 : Boolean(ch.audioUrl.en));
      if (!hasAudio) missingAudioCount++;
    }

    if (missingAudioCount > 0) {
      console.log(`\n📖 Story "${story.title?.en || story.title}" (${story.slug}): ${missingAudioCount}/${chapters.length} chapters need audio generation.`);

      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const chNum = ch.chapterNumber || i + 1;
        const hasAudio = ch.audioUrl && (typeof ch.audioUrl === 'string' ? ch.audioUrl.length > 0 : Boolean(ch.audioUrl.en));
        if (hasAudio) continue;

        let payload = typeof ch.textPayload === 'string' ? ch.textPayload : ch.textPayload?.en || '';
        if (!payload || payload.trim().length === 0) continue;

        // Clean images and markdown for audio narration
        const cleanText = payload.replace(/\[IMAGE:[^\]]+\]/g, '').replace(/\s+/g, ' ').trim().substring(0, 5000);
        if (cleanText.length < 20) continue;

        const cdnKey = `LangoReads-Prod/ebooks/${story.slug}/en/chapter_${chNum}.mp3`;
        const cdnUrl = `${HETZNER_CDN_BASE}/${cdnKey}`;

        // Check if already in Hetzner S3
        const existsInS3 = await existsInHetznerS3(cdnKey);

        if (existsInS3) {
          console.log(`⚡ Audio already exists on Hetzner S3 for Ch ${chNum}: Linking -> ${cdnUrl}`);
          await chaptersCol.updateOne({ _id: ch._id }, { $set: { audioUrl: cdnUrl } });
        } else {
          console.log(`🎙️ Generating pure gTTS MP3 for Ch ${chNum} (${cleanText.length} chars)...`);
          const tmpPath = path.join(tmpDir, `${story.slug}_ch_${chNum}.mp3`);
          try {
            await generateGttsAudioPure(cleanText, 'en', tmpPath);
            const buffer = fs.readFileSync(tmpPath);
            const uploadedUrl = await uploadToHetznerS3(buffer, cdnKey);
            await chaptersCol.updateOne({ _id: ch._id }, { $set: { audioUrl: uploadedUrl } });
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
            console.log(`✅ Uploaded & Linked Ch ${chNum} -> ${uploadedUrl}`);
          } catch (err) {
            console.error(`❌ Failed Ch ${chNum} audio:`, err.message);
          }
        }
      }
    }
  }

  console.log('\n==================================================');
  console.log('🎉 EBOOK AUDIO HETZNER S3 LINKING COMPLETE!');
  console.log('==================================================\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal Audio Linking Error:', err);
  process.exit(1);
});
