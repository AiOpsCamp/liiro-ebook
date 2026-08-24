const mongoose = require("mongoose");
const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../projects/langoreads/.env") });

const uri = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

const AUTHOR_REPOS = [
  // Agatha Christie
  "agatha-christie_the-mysterious-affair-at-styles",
  "agatha-christie_the-secret-adversary",
  "agatha-christie_the-murder-on-the-links",
  "agatha-christie_the-man-in-the-brown-suit",
  "agatha-christie_poirot-investigates",

  // Arthur Conan Doyle
  "arthur-conan-doyle_the-adventures-of-sherlock-holmes",
  "arthur-conan-doyle_the-memoirs-of-sherlock-holmes",
  "arthur-conan-doyle_the-return-of-sherlock-holmes",
  "arthur-conan-doyle_his-last-bow",
  "arthur-conan-doyle_the-case-book-of-sherlock-holmes",
  "arthur-conan-doyle_the-hound-of-the-baskervilles",
  "arthur-conan-doyle_a-study-in-scarlet",
  "arthur-conan-doyle_the-sign-of-the-four",
  "arthur-conan-doyle_the-valley-of-fear",
  "arthur-conan-doyle_the-lost-world",
  "arthur-conan-doyle_the-poison-belt",
  "arthur-conan-doyle_tales-of-terror-and-mystery",

  // Jack London
  "jack-london_the-call-of-the-wild",
  "jack-london_white-fang",
  "jack-london_the-sea-wolf",
  "jack-london_martin-eden",
  "jack-london_the-iron-heel",
  "jack-london_before-adam",
  "jack-london_adventure",
  "jack-london_the-valley-of-the-moon",
  "jack-london_burning-daylight",
  "jack-london_the-star-rover",
  "jack-london_the-scarlet-plague",
  "jack-london_jerry-of-the-islands",

  // H. G. Wells
  "h-g-wells_the-time-machine",
  "h-g-wells_the-war-of-the-worlds",
  "h-g-wells_the-invisible-man",
  "h-g-wells_the-island-of-doctor-moreau",
  "h-g-wells_the-first-men-in-the-moon",
  "h-g-wells_in-the-days-of-the-comet",
  "h-g-wells_mr-britling-sees-it-through",
  "h-g-wells_the-food-of-the-gods-and-how-it-came-to-earth",
  "h-g-wells_the-sleeper-awakes",
  "h-g-wells_the-world-set-free",
  "h-g-wells_love-and-mr-lewisham",
  "h-g-wells_kipps",
  "h-g-wells_ann-veronica",
  "h-g-wells_the-history-of-mr-polly",

  // Robert Louis Stevenson
  "robert-louis-stevenson_treasure-island",
  "robert-louis-stevenson_kidnapped",
  "robert-louis-stevenson_catriona",
  "robert-louis-stevenson_the-black-arrow",
  "robert-louis-stevenson_the-master-of-ballantrae",
  "robert-louis-stevenson_the-strange-case-of-dr-jekyll-and-mr-hyde",
  "robert-louis-stevenson_the-wrong-box",
  "robert-louis-stevenson_prince-otto",
  "robert-louis-stevenson_island-nights-entertainments",

  // H. Rider Haggard
  "h-rider-haggard_she",
  "h-rider-haggard_king-solomons-mines",
  "h-rider-haggard_allan-quatermain",
  "h-rider-haggard_ayesha",
  "h-rider-haggard_the-people-of-the-mist",
  "h-rider-haggard_nada-the-lily",
  "h-rider-haggard_cleopatra",
  "h-rider-haggard_eric-brighteyes",
  "h-rider-haggard_elissa",
  "h-rider-haggard_child-of-storm",
  "h-rider-haggard_the-ivory-child"
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

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

function getLocalizedText(fieldObj) {
  if (!fieldObj) return "";
  if (typeof fieldObj === "string") return fieldObj;
  if (typeof fieldObj.get === "function") {
    return fieldObj.get("en") || fieldObj.get("fi") || Object.values(fieldObj)[0] || "";
  }
  if (typeof fieldObj === "object") {
    return fieldObj.en || fieldObj.fi || Object.values(fieldObj)[0] || "";
  }
  return String(fieldObj);
}

// ── Automated Metadata Pipeline Sync Function ───────────────────────────
async function runMetadataPipelineSync() {
  const Story = require("../projects/langoreads/models/Story.model.js");
  const EbookAuthor = require("../projects/langoreads/models/EbookAuthor.model.js");
  const EbookCategory = require("../projects/langoreads/models/EbookCategory.model.js");
  const EbookTag = require("../projects/langoreads/models/EbookTag.model.js");

  console.log("\n🔄 Executing Automated Metadata Ingestion Pipeline (Authors, Categories, Tags)...");

  const stories = await Story.find({ isPublished: true });
  const authorMap = new Map();
  const tagMap = new Map();

  for (const story of stories) {
    if (story.author && story.author.trim()) {
      const authorName = story.author.trim();
      const authorSlug = slugify(authorName);
      if (!authorMap.has(authorSlug)) {
        authorMap.set(authorSlug, { name: authorName, slug: authorSlug, books: new Set() });
      }
      authorMap.get(authorSlug).books.add(story._id);
    }

    const tags = Array.isArray(story.tags) ? story.tags : [];
    for (const rawTag of tags) {
      const tagText = getLocalizedText(rawTag).trim();
      if (!tagText) continue;

      const tagSlug = slugify(tagText);
      if (!tagMap.has(tagSlug)) {
        tagMap.set(tagSlug, { name: tagText, slug: tagSlug, books: new Set() });
      }
      tagMap.get(tagSlug).books.add(story._id);
    }
  }

  for (const [slug, item] of authorMap.entries()) {
    const booksArr = Array.from(item.books);
    await EbookAuthor.findOneAndUpdate(
      { slug },
      { name: item.name, slug, books: booksArr, bookCount: booksArr.length },
      { upsert: true, new: true }
    );
  }

  for (const [slug, item] of tagMap.entries()) {
    const booksArr = Array.from(item.books);
    await EbookTag.findOneAndUpdate(
      { slug },
      { name: item.name, slug, books: booksArr, bookCount: booksArr.length },
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Pipeline Synced: ${authorMap.size} Authors, ${tagMap.size} Tags.`);
}

async function ingestRepo(repo) {
  const Story = require("../projects/langoreads/models/Story.model.js");
  const StoryChapter = require("../projects/langoreads/models/StoryChapter.model.js");

  const repoTitleSlug = repo.split("_")[1] || repo;
  const slug = slugify(repoTitleSlug);

  const exists = await Story.findOne({ slug });
  if (exists) return false;

  const baseUrl = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub`;
  const opfContent = await fetchRaw(`${baseUrl}/content.opf`);
  if (!opfContent) return false;

  const titleMatch = opfContent.match(/<dc:title[^>]*>(.*?)<\/dc:title>/i);
  const authorMatch = opfContent.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/i);
  const descMatch = opfContent.match(/<dc:description[^>]*>(.*?)<\/dc:description>/s);
  const subjectMatches = [...opfContent.matchAll(/<dc:subject[^>]*>(.*?)<\/dc:subject>/gi)].map((m) => m[1].trim());

  const title = titleMatch ? cleanText(titleMatch[1]) : repo;
  const author = authorMatch ? cleanText(authorMatch[1]) : "Classic Author";
  const synopsis = descMatch ? cleanText(descMatch[1]) : `A public domain masterwork by ${author}.`;

  const coverImageUrl = `https://raw.githubusercontent.com/standardebooks/${repo}/master/src/epub/images/cover.jpg`;

  const itemMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/(chapter-[^"']+\.xhtml)["']/gi)];
  let chapterFiles = itemMatches.map((m) => m[1]);

  if (chapterFiles.length === 0) {
    const genericMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/([^"']+\.xhtml)["']/gi)];
    chapterFiles = genericMatches
      .map((m) => m[1])
      .filter((f) => !/colophon|uncopyright|titlepage|imprint|halftitle/i.test(f));
  }

  chapterFiles = [...new Set(chapterFiles)];
  if (chapterFiles.length === 0) return false;

  let difficultyLevel = "B2";
  const textLower = (title + " " + synopsis).toLowerCase();
  if (/fairy|children|easy|simple/i.test(textLower)) difficultyLevel = "A2";
  else if (/complex|philosophy|critique|ethics|theology/i.test(textLower)) difficultyLevel = "C1";

  const tags = [...new Set(["classic", ...subjectMatches.map((s) => s.toLowerCase())])];

  const storyObj = await Story.findOneAndUpdate(
    { slug },
    {
      slug,
      title: new Map([["en", title]]),
      synopsis: new Map([["en", synopsis]]),
      coverImageUrl,
      difficultyLevel,
      author,
      isPremium: false,
      contentType: "ebook",
      isPublished: true,
      languages: ["en"],
      tags,
    },
    { upsert: true, new: true }
  );

  let totalDuration = 0;
  let chNum = 1;

  for (const file of chapterFiles) {
    const chapterUrl = `${baseUrl}/text/${file}`;
    const xhtmlContent = await fetchRaw(chapterUrl);
    if (!xhtmlContent) continue;

    const chTitleMatch = xhtmlContent.match(/<h[234][^>]*>(.*?)<\/h[234]>/i);
    const chapterTitle = chTitleMatch ? cleanText(chTitleMatch[1]) : `Chapter ${chNum}`;

    const paragraphMatches = [...xhtmlContent.matchAll(/<p[^>]*>(.*?)<\/p>/gs)];
    let paragraphs = paragraphMatches.map((m) => cleanText(m[1])).filter((p) => p.length > 5);

    if (paragraphs.length === 0) {
      paragraphs = [cleanText(xhtmlContent)];
    }

    const textPayload = paragraphs.join("\n\n");
    const wordCount = textPayload.split(/\s+/).length;
    const durationSeconds = Math.round((wordCount / 150) * 60);
    totalDuration += durationSeconds;

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

  storyObj.totalDurationSeconds = totalDuration;
  await storyObj.save();

  console.log(`✅ Ingested '${title}' by ${author} (${chNum - 1} chapters).`);
  return true;
}

async function runAuthorCollectionsPush() {
  await mongoose.connect(uri);
  const Story = require("../projects/langoreads/models/Story.model.js");

  let currentCount = await Story.countDocuments();
  console.log(`🚀 Starting Full Author Collections Ingestion Push (Haggard, Stevenson, Wells, London, Doyle, Christie). Current DB Count: ${currentCount}`);

  let added = 0;
  for (const repo of AUTHOR_REPOS) {
    const ok = await ingestRepo(repo);
    if (ok) {
      added++;
      currentCount++;
      console.log(`📈 Progress: ${currentCount} Total Ebooks (+${added} in this run)`);
    }
  }

  console.log(`\n🎉 Ingestion Complete! Added ${added} new books. Total DB Stories: ${currentCount}`);

  await runMetadataPipelineSync();
  await mongoose.disconnect();
  process.exit(0);
}

runAuthorCollectionsPush().catch((err) => {
  console.error("❌ Pipeline Error:", err);
  process.exit(1);
});
