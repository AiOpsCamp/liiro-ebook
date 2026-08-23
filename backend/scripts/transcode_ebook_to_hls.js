"use strict";

const mongoose = require("mongoose");
const HLSTranscoderService = require("../src/services/hlsTranscoder.service");
const Story = require("../src/models/Story.model");
const StoryChapter = require("../src/models/StoryChapter.model");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true";

async function transcodeBook(slug = "the-strange-case-of-dr-jekyll-and-mr-hyde", voice = "adam") {
  console.log(`🔌 Connecting to MongoDB (${MONGO_URI})...`);
  await mongoose.connect(MONGO_URI);

  const story = await Story.findOne({ slug, isPublished: true }).select("_id slug title").lean();
  if (!story) {
    console.error(`❌ Story '${slug}' not found!`);
    process.exit(1);
  }

  const chapters = await StoryChapter.find({ storyId: story._id }).sort({ chapterNumber: 1 }).lean();
  console.log(`📖 Transcoding ${chapters.length} chapters for '${story.slug}' into HLS VOD format (voice: ${voice})...`);

  for (const ch of chapters) {
    const chNum = ch.chapterNumber || 1;
    let sourceAudioUrl = ch.audioVoices?.[voice] || ch.audioUrl?.en || ch.audioUrl;
    if (!sourceAudioUrl) {
      sourceAudioUrl = `https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${chNum}.mp3`;
    }

    console.log(`\n🎧 [Chapter ${chNum}] Transcoding from ${sourceAudioUrl}...`);
    const result = await HLSTranscoderService.transcodeAndUploadHLS(sourceAudioUrl, slug, chNum, voice);
    console.log(`   ✅ HLS Master Playlist: ${result.masterUrl} (${result.segmentCount} segments)`);
  }

  console.log("\n=======================================================");
  console.log(`🎉 HLS TRANSCODING COMPLETE FOR '${story.slug}'!`);
  console.log("=======================================================");
  process.exit(0);
}

const slugArg = process.argv[2] || "the-strange-case-of-dr-jekyll-and-mr-hyde";
const voiceArg = process.argv[3] || "adam";
transcodeBook(slugArg, voiceArg);
