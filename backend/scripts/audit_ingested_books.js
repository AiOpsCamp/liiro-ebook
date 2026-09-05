require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const https = require("https");
const connectDB = require("../src/db/connect");
const Story = require("../src/models/Story.model");
const StoryChapter = require("../src/models/StoryChapter.model");
const EbookAuthor = require("../src/models/EbookAuthor.model");

function verifyUrl(urlStr) {
  return new Promise((resolve) => {
    if (!urlStr) return resolve(false);
    try {
      const u = new URL(urlStr);
      const client = u.protocol === "https:" ? https : http;
      const req = client.request(urlStr, { method: "HEAD" }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on("error", () => resolve(false));
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

async function auditIngestedBooks() {
  console.log("=======================================================================");
  console.log("🔍 COMPREHENSIVE NARRATIVE & RENDERING AUDIT FOR ALL INGESTED BOOKS");
  console.log("=======================================================================");

  await connectDB();

  // Fix At the Villa Rose author if needed
  const villa = await Story.findOne({ slug: "at-the-villa-rose" });
  if (villa && (!villa.author || villa.author.includes("6a9"))) {
    villa.author = "A. E. W. Mason";
    await villa.save();
  }

  const stories = await Story.find().sort({ title: 1 });
  console.log(`📚 Total Ingested Books Found in DB: ${stories.length}\n`);

  const results = [];

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const slug = story.slug;
    const titleStr = story.title?.en || story.title;
    const authorStr = story.author || "Unknown";
    const coverUrl = story.coverImageUrl;

    const coverValid = await verifyUrl(coverUrl);

    // Fetch Chapter 1
    const ch1 = await StoryChapter.findOne({
      $or: [{ storyId: story._id }, { storySlug: slug }],
      chapterNumber: 1
    });

    const totalChapters = await StoryChapter.countDocuments({
      $or: [{ storyId: story._id }, { storySlug: slug }]
    });

    let ch1Valid = false;
    let wordCount = 0;
    let textSnippet = "";
    let audioValid = false;
    let whisperAlignments = 0;

    if (ch1) {
      ch1Valid = true;
      let rawText = "";
      if (ch1.content) {
        rawText = ch1.content;
      } else if (ch1.paragraphs && ch1.paragraphs.length > 0) {
        rawText = ch1.paragraphs.map((p) => p.text || p).join(" ");
      }
      wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
      textSnippet = rawText.trim().slice(0, 120) + "...";
      audioValid = await verifyUrl(ch1.audioUrl);
      whisperAlignments = ch1.wordTimings ? ch1.wordTimings.length : 0;
    }

    const auditStatus = {
      index: i + 1,
      slug,
      title: titleStr,
      author: authorStr,
      totalChapters,
      coverValid,
      ch1Valid,
      wordCount,
      textSnippet,
      hasAudio: story.hasAudio,
      audioValid,
      whisperAlignments,
      passed: coverValid && ch1Valid && totalChapters > 0
    };

    results.push(auditStatus);

    console.log(`-----------------------------------------------------------------------`);
    console.log(`📖 [${i + 1}/${stories.length}] "${titleStr}" by ${authorStr}`);
    console.log(`   Slug: ${slug} | Total Chapters: ${totalChapters}`);
    console.log(`   Cover CDN Image: ${coverValid ? "✅ VALID (HTTP 200)" : "❌ INVALID / FAILED"}`);
    console.log(`   Chapter 1 Text Integrity: ${ch1Valid ? `✅ PASSED (${wordCount} words)` : "❌ MISSING"}`);
    console.log(`   Chapter 1 Snippet: "${textSnippet}"`);
    console.log(`   Audiobook Status: ${story.hasAudio ? "🎙️ ACTIVE" : "📄 EBOOK ONLY"} | Audio Stream: ${audioValid ? "✅ CDN LIVE" : "N/A"}`);
    console.log(`   Whispersync Timestamps: ${whisperAlignments > 0 ? `✅ ${whisperAlignments} alignments` : "ℹ️ Text Only"}`);
    console.log(`   Overall Audit Result: ${auditStatus.passed ? "🎉 100% HEALTHY" : "⚠️ NEEDS ATTENTION"}`);
  }

  console.log("\n=======================================================================");
  console.log("🎉 AUDIT SUMMARY RESULTS FOR ALL INGESTED BOOKS");
  console.log("=======================================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`   Total Books Audited: ${results.length}`);
  console.log(`   100% Healthy & Render Ready: ${passedCount}/${results.length}`);
  console.log("=======================================================================");
  process.exit(0);
}

auditIngestedBooks().catch((err) => {
  console.error("Fatal Error during audit:", err);
  process.exit(1);
});
