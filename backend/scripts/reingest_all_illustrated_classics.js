const mongoose = require("mongoose");
const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../projects/langoreads/.env") });

const uri = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

const ILLUSTRATED_BOOKS = [
  { repo: "l-frank-baum_the-wonderful-wizard-of-oz", slug: "the-wonderful-wizard-of-oz" },
  { repo: "l-frank-baum_the-marvelous-land-of-oz", slug: "the-marvelous-land-of-oz" },
  { repo: "l-frank-baum_ozma-of-oz", slug: "ozma-of-oz" },
  { repo: "l-frank-baum_dorothy-and-the-wizard-in-oz", slug: "dorothy-and-the-wizard-in-oz" },
  { repo: "l-frank-baum_the-road-to-oz", slug: "the-road-to-oz" },
  { repo: "carlo-collodi_the-adventures-of-pinocchio", slug: "the-adventures-of-pinocchio" },
  { repo: "kenneth-grahame_the-wind-in-the-willows", slug: "the-wind-in-the-willows" },
  { repo: "j-m-barrie_peter-and-wendy", slug: "peter-and-wendy" },
  { repo: "frances-hodgson-burnett_the-secret-garden", slug: "the-secret-garden" },
  { repo: "edith-nesbit_the-railway-children", slug: "the-railway-children" },
  { repo: "beatrix-potter_the-tale-of-peter-rabbit", slug: "the-tale-of-peter-rabbit" }
];

function fetchRaw(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", () => resolve(null));
  });
}

function cleanText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function reingestIllustratedClassic(book) {
  const Story = require("../projects/langoreads/models/Story.model.js");
  const StoryChapter = require("../projects/langoreads/models/StoryChapter.model.js");

  const baseUrl = `https://raw.githubusercontent.com/standardebooks/${book.repo}/master/src/epub`;
  const opfContent = await fetchRaw(`${baseUrl}/content.opf`);
  if (!opfContent) return false;

  const storyObj = await Story.findOne({ slug: book.slug });
  if (!storyObj) return false;

  const itemMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/(chapter-[^"']+\.xhtml)["']/gi)];
  let chapterFiles = [...new Set(itemMatches.map((m) => m[1]))];

  if (chapterFiles.length === 0) {
    const genericMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/([^"']+\.xhtml)["']/gi)];
    chapterFiles = genericMatches
      .map((m) => m[1])
      .filter((f) => !/colophon|uncopyright|titlepage|imprint|halftitle/i.test(f));
  }

  let totalImagesInBook = 0;
  let chNum = 1;

  for (const file of chapterFiles) {
    const chapterUrl = `${baseUrl}/text/${file}`;
    const xhtmlContent = await fetchRaw(chapterUrl);
    if (!xhtmlContent) continue;

    const chTitleMatch = xhtmlContent.match(/<h[234][^>]*>(.*?)<\/h[234]>/i);
    const chapterTitle = chTitleMatch ? cleanText(chTitleMatch[1]) : `Chapter ${chNum}`;

    // Extract all elements including <figure>, <img ...>, etc.
    const imgInFile = [...xhtmlContent.matchAll(/src=["'](?:\.\.\/)?images\/([^"']+)["']/gi)];
    const chapterBlocks = [];

    for (const imgM of imgInFile) {
      const imgName = imgM[1];
      if (!/cover|titlepage|colophon/i.test(imgName)) {
        const imgUrl = `${baseUrl}/images/${imgName}`;
        chapterBlocks.push(`[IMAGE: ${imgUrl}]`);
        totalImagesInBook++;
      }
    }

    const paragraphMatches = [...xhtmlContent.matchAll(/<p[^>]*>(.*?)<\/p>/gs)];
    for (const pMatch of paragraphMatches) {
      const textOnly = cleanText(pMatch[1]);
      if (textOnly && textOnly.length > 2 && !/chapter\s+\d+/i.test(textOnly)) {
        chapterBlocks.push(textOnly);
      }
    }

    if (chapterBlocks.length === 0) {
      chapterBlocks.push(cleanText(xhtmlContent));
    }

    const textPayload = chapterBlocks.join("\n\n");
    const wordCount = cleanText(textPayload).split(/\s+/).length;
    const durationSeconds = Math.round((wordCount / 150) * 60);

    await StoryChapter.findOneAndUpdate(
      { storyId: storyObj._id, chapterNumber: chNum },
      {
        storyId: storyObj._id,
        chapterNumber: chNum,
        title: new Map([["en", chapterTitle]]),
        textPayload: new Map([["en", textPayload]]),
        durationSeconds: new Map([["en", durationSeconds]]),
      },
      { upsert: true, new: true }
    );

    chNum++;
  }

  const titleStr = typeof storyObj.title === "object" ? (storyObj.title.en || Object.values(storyObj.title)[0]) : storyObj.title;
  if (totalImagesInBook > 0) {
    console.log(`  ✅ Enhanced '${titleStr}' (${book.slug}) with ${totalImagesInBook} embedded chapter illustrations!`);
    return true;
  }

  return false;
}

async function runReingestAll() {
  await mongoose.connect(uri);
  console.log(`🚀 Checking and enhancing ${ILLUSTRATED_BOOKS.length} candidate classic illustrated books...`);

  let enhancedCount = 0;
  for (const book of ILLUSTRATED_BOOKS) {
    const ok = await reingestIllustratedClassic(book);
    if (ok) enhancedCount++;
  }

  console.log(`\n🎉 ENHANCEMENT COMPLETE! ${enhancedCount} masterwork books updated with embedded chapter illustrations.`);
  await mongoose.disconnect();
  process.exit(0);
}

runReingestAll().catch((err) => {
  console.error("❌ Reingest Error:", err);
  process.exit(1);
});
