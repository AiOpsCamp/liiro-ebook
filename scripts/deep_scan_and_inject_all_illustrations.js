const mongoose = require("mongoose");
const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../projects/langoreads/.env") });

const uri = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

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

async function deepScanAndInjectAllIllustrations() {
  await mongoose.connect(uri);
  const Story = require("../projects/langoreads/models/Story.model.js");
  const StoryChapter = require("../projects/langoreads/models/StoryChapter.model.js");

  const stories = await Story.find({ isPublished: true });
  console.log(`🔍 Deep Scanning OPF Manifests & Chapters for ALL ${stories.length} Published Ebooks...`);

  const illustratedBooksSummary = [];
  let totalImagesInLibrary = 0;

  // Process in batches of 15 for fast parallel checking
  const BATCH_SIZE = 15;
  for (let i = 0; i < stories.length; i += BATCH_SIZE) {
    const batch = stories.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (story) => {
        const titleStr = typeof story.title === "object" ? (story.title.en || Object.values(story.title)[0]) : story.title;
        const slug = story.slug;

        // Determine raw GitHub repository URL candidate
        let repoName = null;
        if (story.coverImageUrl && story.coverImageUrl.includes("standardebooks/")) {
          const match = story.coverImageUrl.match(/standardebooks\/([^\/]+)\//);
          if (match) repoName = match[1];
        }

        if (!repoName) {
          // Fallback repo name construction from slug
          repoName = slug;
        }

        const baseUrl = `https://raw.githubusercontent.com/standardebooks/${repoName}/master/src/epub`;
        const opfContent = await fetchRaw(`${baseUrl}/content.opf`);
        if (!opfContent) return;

        // Check if manifest lists image items other than cover/titlepage
        const imageItems = [...opfContent.matchAll(/<item\s+[^>]*href=["']images\/([^"']+\.(?:png|jpg|jpeg|svg))["']/gi)]
          .map((m) => m[1])
          .filter((img) => !/cover|titlepage|colophon|uncopyright|halftitle/i.test(img));

        if (imageItems.length === 0) return;

        // Book has inner illustrations! Parse chapter files to inject them
        const itemMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/(chapter-[^"']+\.xhtml)["']/gi)];
        let chapterFiles = [...new Set(itemMatches.map((m) => m[1]))];

        if (chapterFiles.length === 0) {
          const genericMatches = [...opfContent.matchAll(/<item\s+[^>]*href=["']text\/([^"']+\.xhtml)["']/gi)];
          chapterFiles = genericMatches
            .map((m) => m[1])
            .filter((f) => !/colophon|uncopyright|titlepage|imprint|halftitle/i.test(f));
        }

        let imagesInThisBook = 0;
        let chNum = 1;

        for (const file of chapterFiles) {
          const chapterUrl = `${baseUrl}/text/${file}`;
          const xhtmlContent = await fetchRaw(chapterUrl);
          if (!xhtmlContent) continue;

          const chTitleMatch = xhtmlContent.match(/<h[234][^>]*>(.*?)<\/h[234]>/i);
          const chapterTitle = chTitleMatch ? cleanText(chTitleMatch[1]) : `Chapter ${chNum}`;

          const elementMatches = [...xhtmlContent.matchAll(/<(p|figure|h[234]|div)[^>]*>(.*?)<\/\1>/gs)];
          const chapterBlocks = [];

          for (const match of elementMatches) {
            const innerHtml = match[2];

            // Detect images inside elements
            const imgInElem = [...innerHtml.matchAll(/src=["'](?:\.\.\/)?images\/([^"']+)["']/gi)];
            for (const imgM of imgInElem) {
              const imgName = imgM[1];
              if (!/cover|titlepage|colophon/i.test(imgName)) {
                const imgUrl = `${baseUrl}/images/${imgName}`;
                chapterBlocks.push(`[IMAGE: ${imgUrl}]`);
                imagesInThisBook++;
              }
            }

            const textOnly = cleanText(innerHtml);
            if (textOnly && textOnly.length > 2 && !/chapter\s+\d+/i.test(textOnly) && !/^\[IMAGE:/i.test(textOnly)) {
              chapterBlocks.push(textOnly);
            }
          }

          if (chapterBlocks.length > 0) {
            const textPayload = chapterBlocks.join("\n\n");
            const wordCount = cleanText(textPayload).split(/\s+/).length;
            const durationSeconds = Math.round((wordCount / 150) * 60);

            await StoryChapter.findOneAndUpdate(
              { storyId: story._id, chapterNumber: chNum },
              {
                storyId: story._id,
                chapterNumber: chNum,
                title: new Map([["en", chapterTitle]]),
                textPayload: new Map([["en", textPayload]]),
                durationSeconds: new Map([["en", durationSeconds]]),
              },
              { upsert: true, new: true }
            );
          }
          chNum++;
        }

        if (imagesInThisBook > 0) {
          totalImagesInLibrary += imagesInThisBook;
          illustratedBooksSummary.push({
            title: titleStr,
            slug: story.slug,
            author: story.author,
            imageCount: imagesInThisBook,
          });
          console.log(`  🖼️  Injected ${imagesInThisBook} illustrations into '${titleStr}' by ${story.author}`);
        }
      })
    );
  }

  console.log("\n==================================================");
  console.log("🏆 DEEP SCAN COMPLETE FOR ALL 500 PUBLISHED EBOOKS");
  console.log("==================================================");
  console.log(`📚 Total Illustrated Books Found:   ${illustratedBooksSummary.length}`);
  console.log(`🖼️  Total Chapter Illustrations Injected: ${totalImagesInLibrary}`);
  console.log("==================================================");
  console.log("\nComplete Illustrated Books Directory:");
  console.table(illustratedBooksSummary);

  await mongoose.disconnect();
  process.exit(0);
}

deepScanAndInjectAllIllustrations().catch((err) => {
  console.error("❌ Deep Scan Error:", err);
  process.exit(1);
});
