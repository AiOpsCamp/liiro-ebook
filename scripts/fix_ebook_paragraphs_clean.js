"use strict";

const { MongoClient } = require("mongodb");

const MONGO_URL = "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

// Chapter Narration Intro offsets (seconds) where main body text reading begins
const CHAPTER_INTRO_OFFSETS = {
  1: 3.8, 2: 4.2, 3: 3.5, 4: 3.9, 5: 3.7, 6: 4.1, 7: 3.6, 8: 3.8, 9: 3.5, 10: 3.4, 11: 3.5, 12: 3.5, 13: 3.5
};

const CHAPTER_DURATIONS = {
  1: 310.2, 2: 420.0, 3: 150.0, 4: 280.0, 5: 260.0, 6: 240.0, 7: 110.0, 8: 590.0, 9: 45.0, 10: 37.0, 11: 95.0, 12: 310.0, 13: 890.0
};

function splitIntoRealProseParagraphs(rawText) {
  if (!rawText) return [];

  // Split ONLY by double newlines (\n\n) to preserve full prose paragraphs!
  let rawParas = rawText
    .split(/\n\s*\n/)
    .map(p => p.replace(/(?<!\n)\n(?!\n)/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Strip leading header paragraph if it matches title/heading
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
      console.log(`   ✂️ Stripped title header: "${p}"`);
      rawParas.shift();
    } else {
      break;
    }
  }

  return rawParas;
}

function buildParagraphTimestamps(paragraphs, audioDuration, introOffset) {
  if (!paragraphs.length || audioDuration <= 0) return [];

  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0) || 1;
  const pauseBetweenParas = 0.6;
  const totalPauses = Math.max(0, paragraphs.length - 1) * pauseBetweenParas;
  const effectiveSpeechDuration = Math.max(1.0, audioDuration - introOffset - totalPauses);

  const paragraphBlocks = [];
  let currentTime = introOffset;

  for (const para of paragraphs) {
    const paraDur = (para.length / totalChars) * effectiveSpeechDuration;
    const paraStart = Number(currentTime.toFixed(3));
    const paraEnd = Number((currentTime + paraDur).toFixed(3));

    // Also include nested words list for exercise compatibility
    const words = para.split(/\s+/).map((w) => w.trim()).filter(Boolean);
    const wordList = [];
    if (words.length) {
      const totalWordChars = words.reduce((sum, w) => sum + w.length + 1, 0);
      let wCurr = paraStart;
      for (const w of words) {
        const wWeight = (w.length + 1) / Math.max(1, totalWordChars);
        const wDur = Math.max(0.08, wWeight * paraDur);
        wordList.push({ text: w, start: Number(wCurr.toFixed(3)), end: Number((wCurr + wDur).toFixed(3)) });
        wCurr += wDur;
      }
    }

    paragraphBlocks.push({
      text: para,
      start: paraStart,
      end: paraEnd,
      words: wordList,
    });

    currentTime += paraDur + pauseBetweenParas;
  }

  return paragraphBlocks;
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
  console.log(`📖 Rebuilding ${chapters.length} chapters into real continuous prose paragraphs...`);

  for (const ch of chapters) {
    const rawText = ch.textPayload?.en || "";
    if (!rawText) continue;

    const paragraphs = splitIntoRealProseParagraphs(rawText);
    const cleanFullText = paragraphs.join("\n\n");
    const dur = CHAPTER_DURATIONS[ch.chapterNumber] || 300.0;
    const introOffset = CHAPTER_INTRO_OFFSETS[ch.chapterNumber] || 3.8;

    const paragraphBlocks = buildParagraphTimestamps(paragraphs, dur, introOffset);

    await db.collection("storychapters").updateOne(
      { _id: ch._id },
      {
        $set: {
          "textPayload.en": cleanFullText,
          "wordTimestamps.en": paragraphBlocks,
          "durationSeconds.en": dur,
        },
      }
    );

    console.log(`  ✅ Chapter ${ch.chapterNumber}: Saved ${paragraphBlocks.length} real continuous prose paragraphs (First word: '${paragraphBlocks[0]?.words?.[0]?.text}', start: ${paragraphBlocks[0]?.start}s)`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL CHAPTERS REBUILT INTO BEAUTIFUL REAL EBOOK PARAGRAPHS!");
  console.log("=======================================================");

  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
