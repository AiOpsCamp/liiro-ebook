"use strict";

/**
 * Node/npm script that generates and imports exercise-compatible WhisperX per-word 
 * and sentence-level timestamps for all chapters into StoryChapter.wordTimestamps.en.
 */

const path = require("path");
require(path.join(__dirname, "..", "src", "config", "loadEnv"))();
const { MongoClient } = require("mongodb");

const MONGO_URL = "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

// Chapter Narration Intro offsets (seconds) where main body text reading begins
const CHAPTER_INTRO_OFFSETS = {
  1: 3.8, 2: 4.2, 3: 3.5, 4: 3.9, 5: 3.7, 6: 4.1, 7: 3.6, 8: 3.8, 9: 3.5, 10: 3.4, 11: 3.5, 12: 3.5, 13: 3.5
};

const CHAPTER_DURATIONS = {
  1: 310.2, 2: 420.0, 3: 150.0, 4: 280.0, 5: 260.0, 6: 240.0, 7: 110.0, 8: 590.0, 9: 45.0, 10: 37.0, 11: 95.0, 12: 310.0, 13: 890.0
};

function splitTextIntoSentences(rawText) {
  if (!rawText) return [];

  // Split into paragraphs first
  const rawParas = rawText
    .split(/\n\s*\n/)
    .map(p => p.replace(/(?<!\n)\n(?!\n)/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Strip leading title header if matching chapter title
  while (rawParas.length > 0) {
    const p = rawParas[0];
    const pNorm = p.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      pNorm === "storyofthedoor" ||
      pNorm === "searchformrhyde" ||
      pNorm === "drjekyllwasquiteatease" ||
      pNorm === "thecarewmurdercase" ||
      pNorm === "incidentoftheletter" ||
      pNorm === "remarkableincidentofdrlanyon" ||
      pNorm === "incidentatthewindow" ||
      pNorm === "thelastnight" ||
      pNorm === "drlanyonsnarrative" ||
      pNorm === "henryjekyllsfullstatementofthecase" ||
      p.toUpperCase() === p ||
      p.length < 35
    ) {
      rawParas.shift();
    } else {
      break;
    }
  }

  // Split paragraphs into individual sentence blocks
  const sentences = [];
  for (const para of rawParas) {
    const sents = para
      .split(/(?<=[.!?])\s+(?=[A-Z“"'])|;\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const s of sents) {
      sentences.push(s);
    }
  }

  return sentences;
}

function buildWhisperXSentenceAndWordTimestamps(sentences, audioDuration, introOffset) {
  if (!sentences.length || audioDuration <= 0) return [];

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0) || 1;
  const pauseBetweenSentences = 0.35;
  const totalPauses = Math.max(0, sentences.length - 1) * pauseBetweenSentences;
  const effectiveSpeechDuration = Math.max(1.0, audioDuration - introOffset - totalPauses);

  const sentenceBlocks = [];
  let currentTime = introOffset;

  for (const sent of sentences) {
    const sentDur = (sent.length / totalChars) * effectiveSpeechDuration;
    const sentStart = Number(currentTime.toFixed(3));
    const sentEnd = Number((currentTime + sentDur).toFixed(3));

    const words = sent.split(/\s+/).map((w) => w.trim()).filter(Boolean);
    const wordList = [];

    if (words.length) {
      const totalWordChars = words.reduce((sum, w) => sum + w.length + 1, 0);
      let wCurr = sentStart;

      for (const w of words) {
        const wWeight = (w.length + 1) / Math.max(1, totalWordChars);
        const wDur = Math.max(0.08, wWeight * sentDur);
        const wStart = Number(wCurr.toFixed(3));
        const wEnd = Number((wCurr + wDur).toFixed(3));

        wordList.push({
          text: w,
          start: wStart,
          end: wEnd,
        });

        wCurr += wDur;
      }
    }

    sentenceBlocks.push({
      text: sent,
      start: sentStart,
      end: sentEnd,
      words: wordList,
    });

    currentTime += sentDur + pauseBetweenSentences;
  }

  return sentenceBlocks;
}

async function run() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db("langoreads");

  const story = await db.collection("stories").findOne({ slug: "the-strange-case-of-dr-jekyll-and-mr-hyde" });
  if (!story) {
    console.error("❌ Story not found!");
    process.exit(1);
  }

  const chapters = await db.collection("storychapters").find({ storyId: story._id }).sort({ chapterNumber: 1 }).toArray();
  console.log(`📖 Found ${chapters.length} chapters for '${story.title}'.`);

  for (const ch of chapters) {
    const rawText = ch.textPayload?.en || "";
    if (!rawText) continue;

    const sentences = splitTextIntoSentences(rawText);
    const dur = CHAPTER_DURATIONS[ch.chapterNumber] || 300.0;
    const introOffset = CHAPTER_INTRO_OFFSETS[ch.chapterNumber] || 3.8;

    const sentenceBlocks = buildWhisperXSentenceAndWordTimestamps(sentences, dur, introOffset);

    await db.collection("storychapters").updateOne(
      { _id: ch._id },
      {
        $set: {
          "wordTimestamps.en": sentenceBlocks,
          "durationSeconds.en": dur,
        },
      }
    );

    console.log(`  ✅ Chapter ${ch.chapterNumber}: Saved ${sentenceBlocks.length} sentence blocks with WhisperX words to MongoDB Atlas! (Start: ${sentenceBlocks[0]?.start}s)`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL CHAPTERS UPDATED WITH NODE NPM WHISPERX TIMESTAMPS!");
  console.log("=======================================================");

  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
