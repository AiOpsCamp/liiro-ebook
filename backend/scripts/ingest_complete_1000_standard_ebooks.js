"use strict";

const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const connectDB = require("../src/db/connect");

const catalogPath = path.join(__dirname, "complete_1000_ebooks_catalog.json");

// ── Master 25 Categories Taxonomy ──────────────────────────────────────────
const CATEGORY_TAXONOMY = [
  { name: "Science Fiction", slug: "science-fiction", color: "#0891B2", icon: "Layers", keywords: ["sci-fi", "scifi", "science fiction", "time travel", "space", "dystopian", "futuristic"] },
  { name: "Philosophy & Thought", slug: "philosophy-and-thought", color: "#F59E0B", icon: "Sparkles", keywords: ["philosophy", "philosophical", "stoicism", "ethics", "logic", "theology", "non-fiction"] },
  { name: "Comedy & Satire", slug: "comedy-and-satire", color: "#EF4444", icon: "Flame", keywords: ["comedy", "humor", "wit", "satire", "parody"] },
  { name: "Fantasy & Magic", slug: "fantasy-and-magic", color: "#8B5CF6", icon: "Layers", keywords: ["fantasy", "fairy", "magic", "myths", "mythology", "folklore", "high fantasy"] },
  { name: "Horror & Weird Fiction", slug: "horror-and-weird-fiction", color: "#A855F7", icon: "Flame", keywords: ["horror", "weird", "vampires", "macabre", "supernatural"] },
  { name: "Mystery & Detective", slug: "mystery-and-detective", color: "#3B82F6", icon: "Search", keywords: ["mystery", "detective", "sherlock", "crime", "investigation"] },
  { name: "Gothic Classics", slug: "gothic-classics", color: "#6366F1", icon: "Sparkles", keywords: ["gothic", "dark romanticism", "dracula", "jekyll"] },
  { name: "Drama & Plays", slug: "drama-and-plays", color: "#10B981", icon: "BookOpen", keywords: ["drama", "play", "theater", "tragedy", "stage"] },
  { name: "Biographies & Memoirs", slug: "biographies-and-memoirs", color: "#EC4899", icon: "Award", keywords: ["biography", "autobiography", "memoir", "historical figure"] },
  { name: "World Literature Masterworks", slug: "world-literature-masterworks", color: "#10B981", icon: "BookOpen", keywords: ["masterwork", "classic", "world literature", "literary"] },
  { name: "Romance & Society", slug: "romance-and-society", color: "#F43F5E", icon: "Sparkles", keywords: ["romance", "love", "regency", "society", "marriage"] },
  { name: "Adventure & Exploration", slug: "adventure-and-exploration", color: "#14B8A6", icon: "Layers", keywords: ["adventure", "expedition", "sea", "pirates", "wilderness"] },
  { name: "Historical Fiction", slug: "historical-fiction", color: "#84CC16", icon: "BookOpen", keywords: ["historical", "history", "war", "revolution"] },
];

function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-");
}

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

function parseStandardEbooksXHTML(xhtml, repoSlug = "", branch = "master") {
  if (!xhtml) return [];
  const bodyMatch = xhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : xhtml;
  const blocks = content.match(/<(p|h1|h2|h3|h4|blockquote|figure)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
  const cleanElements = [];

  for (const block of blocks) {
    // Extract illustration images
    const imgMatch = /src=["'](?:\.\.\/)?images\/([^"']+\.(?:jpg|jpeg|png|svg))["']/i.exec(block);
    if (imgMatch && repoSlug) {
      const imgName = imgMatch[1];
      if (!/cover|titlepage|colophon|uncopyright|halftitle/i.test(imgName)) {
        const imgUrl = `https://raw.githubusercontent.com/standardebooks/${repoSlug}/${branch}/src/epub/images/${imgName}`;
        cleanElements.push(`[IMAGE: ${imgUrl}]`);
      }
    }

    const text = decodeHTMLEntitiesAndClean(block);
    if (text && text.length > 5) {
      cleanElements.push(text);
    }
  }

  return cleanElements;
}

async function getRepoXhtmlFiles(repoSlug) {
  let tocUrl = `https://cdn.jsdelivr.net/gh/standardebooks/${repoSlug}@master/src/epub/toc.xhtml`;
  let tocXhtml = await fetchRaw(tocUrl);
  let branch = "master";

  if (!tocXhtml) {
    tocUrl = `https://cdn.jsdelivr.net/gh/standardebooks/${repoSlug}@main/src/epub/toc.xhtml`;
    tocXhtml = await fetchRaw(tocUrl);
    branch = "main";
  }

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

async function runIngestion() {
  const maxBooksToProcess = parseInt(process.argv[2] || "1000", 10);

  console.log("=========================================================================");
  console.log(`🚀 INGESTING & SYNCHRONIZING UP TO ${maxBooksToProcess} STANDARD EBOOKS`);
  console.log("=========================================================================\n");

  await connectDB();
  const db = mongoose.connection.client.db("langoreads");

  // 1. Sync Category Taxonomy
  console.log("📂 1. Synchronizing Ebook Category Taxonomy...");
  for (const cat of CATEGORY_TAXONOMY) {
    await db.collection("ebookcategories").updateOne(
      { slug: cat.slug },
      { $set: { name: cat.name, slug: cat.slug, color: cat.color, icon: cat.icon, keywords: cat.keywords, updatedAt: new Date() } },
      { upsert: true }
    );
  }
  console.log("✅ Category taxonomy updated.\n");

  // 2. Read catalog
  if (!fs.existsSync(catalogPath)) {
    console.error(`❌ Catalog file not found at ${catalogPath}`);
    process.exit(1);
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  console.log(`📚 Catalog loaded with ${catalog.length} books. Processing first ${Math.min(maxBooksToProcess, catalog.length)}...\n`);

  let count = 0;
  for (let i = 0; i < catalog.length && count < maxBooksToProcess; i++) {
    const book = catalog[i];
    try {
      const repoSlug = book.repoSlug || `standardebooks_${book.slug}`;
      const slug = slugify(book.slug || book.title);
      const title = book.title;
      const author = book.author || "Unknown";
      const difficultyLevel = book.difficultyLevel || "B2";
      const categoryName = book.category || "World Literature Masterworks";
      const tags = Array.isArray(book.tags) && book.tags.length > 0 ? book.tags : [categoryName, "Classic", "Standard Ebooks"];

      console.log(`[${count + 1}/${Math.min(maxBooksToProcess, catalog.length)}] Processing: "${title}" by ${author} (${slug})...`);

      // Ensure Author record
      const authorSlug = slugify(author);
      await db.collection("ebookauthors").updateOne(
        { slug: authorSlug },
        { $set: { name: author, slug: authorSlug, updatedAt: new Date() }, $inc: { booksCount: 1 } },
        { upsert: true }
      );

      // Ensure Tag records
      for (const tag of tags) {
        const tagSlug = slugify(tag);
        await db.collection("ebooktags").updateOne(
          { slug: tagSlug },
          { $set: { name: tag, slug: tagSlug, updatedAt: new Date() }, $inc: { booksCount: 1 } },
          { upsert: true }
        );
      }

      // Check if story already exists with chapters
      const existingStory = await db.collection("stories").findOne({ slug });
      const existingChapters = existingStory ? await db.collection("storychapters").countDocuments({ storyId: existingStory._id }) : 0;

      let storyId = existingStory ? existingStory._id : new mongoose.Types.ObjectId();

      if (existingChapters === 0) {
        // Fetch chapters from Standard Ebooks repo
        const { hrefs, branch } = await getRepoXhtmlFiles(repoSlug);
        const chapterIds = [];

        if (hrefs.length > 0) {
          for (let chIdx = 0; chIdx < hrefs.length; chIdx++) {
            const fileName = hrefs[chIdx];
            const rawUrl = `https://cdn.jsdelivr.net/gh/standardebooks/${repoSlug}@${branch}/src/epub/${fileName}`;
            const xhtml = await fetchRaw(rawUrl);

            if (xhtml) {
              const cleanParagraphs = parseStandardEbooksXHTML(xhtml, repoSlug, branch);
              if (cleanParagraphs.length > 0) {
                const chTitle = `Chapter ${chIdx + 1}`;
                const chDoc = {
                  storyId: storyId,
                  title: { en: chTitle },
                  chapterIndex: chIdx + 1,
                  content: { en: cleanParagraphs.join("\n\n") },
                  paragraphs: cleanParagraphs,
                  language: "en",
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                const insertedCh = await db.collection("storychapters").insertOne(chDoc);
                chapterIds.push(insertedCh.insertedId);
              }
            }
          }
        }

        // If no remote chapters found, create fallback main chapter stub
        if (chapterIds.length === 0) {
          const fallbackCh = {
            storyId: storyId,
            title: { en: "Chapter 1" },
            chapterIndex: 1,
            content: { en: `${title} by ${author}.\n\nFull text from ${book.githubUrl || "Standard Ebooks"}.` },
            paragraphs: [`${title} by ${author}.`, `Full text from ${book.githubUrl || "Standard Ebooks"}.`],
            language: "en",
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const insertedCh = await db.collection("storychapters").insertOne(fallbackCh);
          chapterIds.push(insertedCh.insertedId);
        }

        // Insert or Update Story Document
        const storyDoc = {
          title: { en: title },
          slug,
          author,
          difficultyLevel,
          category: categoryName,
          tags,
          languages: ["en"],
          published: true,
          isPublished: true,
          isPremium: false,
          contentType: "both",
          coverImageUrl: `https://raw.githubusercontent.com/standardebooks/${repoSlug}/master/src/epub/images/cover.jpg`,
          synopsis: { en: book.synopsis || `${title} by ${author}. A masterwork classic.` },
          source: "Standard Ebooks",
          sourceUrl: book.githubUrl || `https://github.com/standardebooks/${repoSlug}`,
          chapters: chapterIds,
          updatedAt: new Date()
        };

        await db.collection("stories").updateOne(
          { slug },
          { $set: storyDoc, $setOnInsert: { _id: storyId, createdAt: new Date() } },
          { upsert: true }
        );
        console.log(`   ✅ Synced Story "${title}" with ${chapterIds.length} chapters.`);
      } else {
        // Story & chapters exist, just update published & category flags
        await db.collection("stories").updateOne(
          { slug },
          { $set: { published: true, isPublished: true, category: categoryName, tags, difficultyLevel, updatedAt: new Date() } }
        );
        console.log(`   ℹ️ Story "${title}" already exists with ${existingChapters} chapters. Updated metadata.`);
      }
    } catch (bErr) {
      console.error(`   ⚠️ Failed processing book "${book.title}": ${bErr.message}`);
    }

    count++;
  }

  console.log(`\n🎉 Ingestion finished! Processed ${count} books in database.`);
  await mongoose.disconnect();
  process.exit(0);
}

runIngestion().catch(console.error);
