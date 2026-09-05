require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/db/connect");
const Story = require("../src/models/Story.model");
const StoryChapter = require("../src/models/StoryChapter.model");
const EbookTag = require("../src/models/EbookTag.model");
const EbookCategory = require("../src/models/EbookCategory.model");
const BookSeries = require("../src/models/BookSeries.model");

async function replaceBranding() {
  console.log("=======================================================================");
  console.log("🛠️ REPLACING THIRD-PARTY BRANDING WITH LIIRO EBOOK PLATFORM BRANDING");
  console.log("=======================================================================");

  await connectDB();

  // 1. Update EbookTag branding
  const oldTag = await EbookTag.findOne({ slug: "standard-ebooks-classic" });
  if (oldTag) {
    oldTag.name = "Liiro Masterwork Classic";
    oldTag.slug = "liiro-masterwork-classic";
    oldTag.description = "Curated masterwork classic in the Liiro Ebook library";
    await oldTag.save();
    console.log(`✅ Updated Tag branding: "Standard Ebooks Classic" -> "Liiro Masterwork Classic" (${oldTag.slug})`);
  }

  let tagDoc = await EbookTag.findOne({ slug: "liiro-masterwork-classic" });
  if (!tagDoc) {
    tagDoc = await EbookTag.create({
      name: "Liiro Masterwork Classic",
      slug: "liiro-masterwork-classic",
      description: "Curated masterwork classic in the Liiro Ebook library",
      color: "#8B5CF6"
    });
    console.log(`✅ Created Liiro Masterwork Tag (${tagDoc.slug})`);
  }

  // 2. Sanitize Story documents
  const stories = await Story.find();
  let storyUpdatedCount = 0;

  for (const s of stories) {
    let modified = false;

    if (s.source && String(s.source).includes("Standard Ebooks")) {
      s.source = "Liiro Public Domain Edition";
      modified = true;
    }

    const synopsisText = typeof s.synopsis === "object" ? s.synopsis?.en : s.synopsis;
    if (synopsisText && String(synopsisText).includes("Standard Ebooks")) {
      const cleaned = String(synopsisText).replace(/standard\s*ebooks/gi, "Liiro Ebook");
      if (typeof s.synopsis === "object") {
        s.synopsis.en = cleaned;
      } else {
        s.synopsis = cleaned;
      }
      modified = true;
    }

    // Ensure Liiro Masterwork tag is present
    if (!s.tags) s.tags = [];
    if (!s.tags.some((t) => t.toString() === tagDoc._id.toString())) {
      s.tags.push(tagDoc._id);
      modified = true;
    }

    if (modified) {
      await s.save();
      storyUpdatedCount++;
    }
  }

  console.log(`✅ Sanitized ${storyUpdatedCount} Story documents with Liiro Ebook branding.`);

  // 3. Sanitize StoryChapter content & titles
  const chapters = await StoryChapter.find({
    $or: [
      { content: { $regex: /standard\s*ebooks/i } },
      { textPayload: { $regex: /standard\s*ebooks/i } },
      { "title.en": { $regex: /standard\s*ebooks/i } }
    ]
  });

  for (const ch of chapters) {
    if (ch.content) {
      ch.content = ch.content
        .replace(/produced by standard ebooks/gi, "curated & published for Liiro Ebook")
        .replace(/standard ebooks/gi, "Liiro Ebook")
        .replace(/standardebooks\.org/gi, "liiro.app");
    }
    if (ch.textPayload) {
      ch.textPayload = ch.textPayload
        .replace(/produced by standard ebooks/gi, "curated & published for Liiro Ebook")
        .replace(/standard ebooks/gi, "Liiro Ebook")
        .replace(/standardebooks\.org/gi, "liiro.app");
    }
    if (ch.title && ch.title.en) {
      ch.title.en = ch.title.en.replace(/standard ebooks/gi, "Liiro Ebook");
    }
    await ch.save();
  }

  console.log(`✅ Sanitized ${chapters.length} StoryChapter documents.`);

  // 4. Sanitize BookSeries documents
  const seriesList = await BookSeries.find();
  for (const ser of seriesList) {
    if (ser.description && String(ser.description).includes("Standard Ebooks")) {
      ser.description = String(ser.description).replace(/standard\s*ebooks/gi, "Liiro Ebook");
      await ser.save();
    }
  }

  console.log("\n=======================================================================");
  console.log("🎉 BRANDING REPLACEMENT & SANITIZATION COMPLETE!");
  console.log("   Liiro Ebook Branding Applied Successfully!");
  console.log("=======================================================================");
  process.exit(0);
}

replaceBranding().catch((err) => {
  console.error("Fatal Error during branding replacement:", err);
  process.exit(1);
});
