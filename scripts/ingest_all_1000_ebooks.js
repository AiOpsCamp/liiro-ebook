const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../projects/langoreads/.env") });

const PROD_MONGO_URI = "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";
const LOCAL_MONGO_URI = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

const catalogPath = path.join(__dirname, "complete_1000_ebooks_catalog.json");

const Story = require("../projects/langoreads/models/Story.model.js");
const StoryChapter = require("../projects/langoreads/models/StoryChapter.model.js");

function fetchRaw(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      res.setEncoding("utf8");
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", () => resolve(null));
  });
}

function decodeHTMLEntitiesAndClean(text) {
  if (!text) return "";
  return text
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\uFFFD+/g, "’")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStandardEbooksXHTML(xhtml) {
  if (!xhtml) return [];
  const bodyMatch = xhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : xhtml;

  const blocks = content.match(/<(p|h1|h2|h3|h4|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
  const cleanElements = [];

  for (const block of blocks) {
    const text = decodeHTMLEntitiesAndClean(block);
    if (text && text.length > 5) {
      cleanElements.push(text);
    }
  }

  return cleanElements;
}

async function getRepoXhtmlFiles(repoSlug) {
  // Use jsDelivr CDN to bypass raw GitHub rate limits (HTTP 429)
  let tocUrl = `https://cdn.jsdelivr.net/gh/standardebooks/${repoSlug}@master/src/epub/toc.xhtml`;
  let tocXhtml = await fetchRaw(tocUrl);
  let branch = "master";

  if (!tocXhtml) {
    tocUrl = `https://cdn.jsdelivr.net/gh/standardebooks/${repoSlug}@main/src/epub/toc.xhtml`;
    tocXhtml = await fetchRaw(tocUrl);
    branch = "main";
  }

  // Fallback to raw github if jsDelivr fails
  if (!tocXhtml) {
    tocUrl = `https://raw.githubusercontent.com/standardebooks/${repoSlug}/master/src/epub/toc.xhtml`;
    tocXhtml = await fetchRaw(tocUrl);
    branch = "master";
  }

  const hrefs = [];
  if (tocXhtml) {
    const regex = /href="([^"#]+\.xhtml)/gi;
    let match;
    const ignore = ["titlepage.xhtml", "colophon.xhtml", "uncopyright.xhtml", "imprint.xhtml", "halftitlepage.xhtml", "toc.xhtml", "epigraph.xhtml"];
    while ((match = regex.exec(tocXhtml)) !== null) {
      let fileName = match[1];
      if (fileName.includes("/")) fileName = fileName.split("/").pop();
      if (!hrefs.includes(fileName) && !ignore.includes(fileName)) {
        hrefs.push(fileName);
      }
    }
  }

  return { hrefs, branch };
}

async function ingestBook(book, index, total) {
  try {
    const repoSlug = book.repoSlug || book.slug;
    if (!repoSlug) return false;

    const slug = repoSlug.replace(/^[^_]+_/, "").replace(/_[^_]+$/, "");
    const coverImageUrl = `https://cdn.jsdelivr.net/gh/standardebooks/${repoSlug}@master/src/epub/images/cover.svg`;

    // Check if story already exists with chapters > 0
    let story = await Story.findOne({ $or: [{ sourceRepo: repoSlug }, { slug }] });
    if (story && story.chapters && story.chapters.length > 0) {
      story.category = book.category || story.category || "World Literature Masterworks";
      story.tags = book.tags || story.tags || ["Classic"];
      story.difficultyLevel = book.difficultyLevel || story.difficultyLevel || "B2";
      if (book.synopsis && !story.synopsis) {
        story.synopsis = new Map([["en", book.synopsis]]);
      }
      await story.save();
      console.log(`[${index}/${total}] ⏩ SKIPPED (Already Ingested): '${book.title}' (${story.chapters.length} chapters)`);
      return { status: "SKIPPED", title: book.title, chapters: story.chapters.length };
    }

    const { hrefs, branch } = await getRepoXhtmlFiles(repoSlug);
    if (!hrefs || hrefs.length === 0) {
      console.log(`[${index}/${total}] ❌ FAILED (No XHTML chapters found): '${book.title}' (${repoSlug})`);
      return { status: "FAILED", title: book.title, reason: "No chapter XHTML files found" };
    }

    const downloadedContents = await Promise.all(
      hrefs.map(async (fileName) => {
        let url = `https://cdn.jsdelivr.net/gh/standardebooks/${repoSlug}@${branch}/src/epub/text/${fileName}`;
        let raw = await fetchRaw(url);
        if (!raw) {
          url = `https://raw.githubusercontent.com/standardebooks/${repoSlug}/${branch}/src/epub/text/${fileName}`;
          raw = await fetchRaw(url);
        }
        return { fileName, raw };
      })
    );

    const chaptersData = [];
    let chapterIdx = 1;

    for (const item of downloadedContents) {
      if (!item.raw) continue;

      const headTitleMatch = item.raw.match(/<head>[\s\S]*?<title>([^<]+)<\/title>/i);
      let chapterTitle = headTitleMatch ? headTitleMatch[1].trim() : `Chapter ${chapterIdx}`;
      chapterTitle = decodeHTMLEntitiesAndClean(chapterTitle.replace(/— Standard Ebooks.*/i, ""));

      const elements = parseStandardEbooksXHTML(item.raw);
      if (elements.length > 0) {
        chaptersData.push({
          chapterNumber: chapterIdx++,
          title: chapterTitle || `Chapter ${chapterIdx}`,
          textPayload: elements.join("\n\n"),
        });
      }
    }

    if (chaptersData.length === 0) {
      console.log(`[${index}/${total}] ❌ FAILED (Empty chapter content): '${book.title}'`);
      return { status: "FAILED", title: book.title, reason: "Parsed 0 content blocks" };
    }

    if (!story) {
      story = new Story({
        title: book.title,
        slug,
        synopsis: new Map([["en", book.synopsis || `${book.title} by ${book.author}, classic masterwork ebook.`]]),
        coverImageUrl,
        difficultyLevel: book.difficultyLevel || "B2",
        author: book.author,
        contentType: "both",
        source: "Standard Ebooks",
        sourceRepo: repoSlug,
        sourceUrl: `https://github.com/standardebooks/${repoSlug}`,
        category: book.category || "World Literature Masterworks",
        tags: book.tags || ["Classic"],
        importedAt: new Date(),
        languages: ["en"],
        isPremium: false,
        isPublished: true,
        chapters: [],
      });
      await story.save();
    }

    await StoryChapter.deleteMany({ storyId: story._id });

    const createdChapterIds = [];
    let num = 1;
    for (const ch of chaptersData) {
      const chapter = new StoryChapter({
        storyId: story._id,
        chapterNumber: num++,
        title: new Map([["en", ch.title]]),
        textPayload: new Map([["en", ch.textPayload]]),
      });
      await chapter.save();
      createdChapterIds.push(chapter._id);
    }

    story.chapters = createdChapterIds;
    story.category = book.category || story.category;
    story.tags = book.tags || story.tags;
    await story.save();

    console.log(`[${index}/${total}] ✅ PROD INGESTED: '${book.title}' by ${book.author} (${chaptersData.length} chapters)`);
    return { status: "SUCCESS", title: book.title, chapters: chaptersData.length };
  } catch (err) {
    console.error(`[${index}/${total}] ❌ ERROR Ingesting '${book.title}':`, err.message);
    return { status: "FAILED", title: book.title, reason: err.message };
  }
}

async function main() {
  let targetUri = PROD_MONGO_URI;
  console.log(`🔌 Connecting to HETZNER PRODUCTION MongoDB via SSH Tunnel...`);
  
  try {
    await mongoose.connect(PROD_MONGO_URI);
    console.log(`🚀 Connected directly to HETZNER PRODUCTION MongoDB (langoread_prod)!`);
  } catch (err) {
    console.log(`⚠️ Tunnel connection failed, falling back to local MongoDB (${LOCAL_MONGO_URI})...`);
    await mongoose.connect(LOCAL_MONGO_URI);
    targetUri = LOCAL_MONGO_URI;
  }

  const rawCatalog = fs.readFileSync(catalogPath, "utf8");
  const catalog = JSON.parse(rawCatalog);
  console.log(`📚 Loaded catalog with ${catalog.length} books for PRODUCTION batch ingestion via jsDelivr CDN.`);

  const CONCURRENCY = 5;
  const results = [];

  for (let i = 0; i < catalog.length; i += CONCURRENCY) {
    const batch = catalog.slice(i, i + CONCURRENCY);
    const batchPromises = batch.map((book, idx) => ingestBook(book, i + idx + 1, catalog.length));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const success = results.filter((r) => r && r.status === "SUCCESS").length;
  const skipped = results.filter((r) => r && r.status === "SKIPPED").length;
  const failed = results.filter((r) => r && r.status === "FAILED").length;

  console.log(`\n==================================================`);
  console.log(`🎉 HETZNER PRODUCTION BATCH INGESTION COMPLETE!`);
  console.log(`✅ Newly Ingested: ${success}`);
  console.log(`⏩ Skipped (Already Ingested): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`==================================================`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal Ingestion Error:", err);
  process.exit(1);
});
