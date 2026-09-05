require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const connectDB = require("../src/db/connect");
const Story = require("../src/models/Story.model");
const BookSeries = require("../src/models/BookSeries.model");

const SERIES_CATALOG_PATH = path.join(__dirname, "../data/series_catalog.json");
const GENERATOR_SCRIPT_PATH = path.join(__dirname, "generate_series_catalog.js");

function loadSeriesCatalog() {
  if (!fs.existsSync(SERIES_CATALOG_PATH)) {
    console.log("⚠️ Series catalog JSON missing. Running automated OPF series parser...");
    execSync(`node "${GENERATOR_SCRIPT_PATH}"`, { stdio: "inherit" });
  }

  try {
    const raw = fs.readFileSync(SERIES_CATALOG_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to parse series_catalog.json:", err.message);
    process.exit(1);
  }
}

async function main() {
  console.log("=======================================================================");
  console.log("🚀 DYNAMIC AUTOMATED BOOK SERIES INGESTION & INTERCONNECTION ENGINE");
  console.log("=======================================================================");

  await connectDB();

  const catalogData = loadSeriesCatalog();
  const seriesList = catalogData.series || [];

  console.log(`📚 Total Multi-Book Series to Process: ${seriesList.length}`);

  for (let sIdx = 0; sIdx < seriesList.length; sIdx++) {
    const seriesMeta = seriesList[sIdx];
    console.log(`\n-----------------------------------------------------------------------`);
    console.log(`📚 [${sIdx + 1}/${seriesList.length}] Processing Series: "${seriesMeta.name}" (${seriesMeta.books.length} Books)`);
    console.log(`-----------------------------------------------------------------------`);

    const storyIds = [];
    const storySlugs = [];

    for (let bIdx = 0; bIdx < seriesMeta.books.length; bIdx++) {
      const bookInfo = seriesMeta.books[bIdx];
      const repoName = bookInfo.repo;
      const slug = repoName.split("_").pop().replace(/_[^_]+$/, "");

      let story = await Story.findOne({
        $or: [{ slug: slug }, { title: new RegExp(bookInfo.title, "i") }]
      });

      if (!story) {
        console.log(`  📖 Ingesting missing book: "${bookInfo.title}" (${repoName})...`);
        try {
          execSync(`node scripts/ingest_standard_ebook.js ${repoName}`, { stdio: "inherit" });
          story = await Story.findOne({ slug: slug });
        } catch (e) {
          console.error(`  ❌ Failed to ingest ${repoName}:`, e.message);
        }
      }

      if (story) {
        storyIds.push(story._id);
        storySlugs.push(story.slug);
      }
    }

    if (storyIds.length > 0) {
      const firstStory = await Story.findById(storyIds[0]);
      const seriesCover = firstStory ? firstStory.coverImageUrl : "";

      // Upsert BookSeries Document in MongoDB
      const seriesDoc = await BookSeries.findOneAndUpdate(
        { slug: seriesMeta.slug },
        {
          title: { en: seriesMeta.name },
          name: seriesMeta.name,
          slug: seriesMeta.slug,
          author: seriesMeta.author,
          description: seriesMeta.description,
          coverImageUrl: seriesCover,
          bookCount: storyIds.length,
          totalBooks: storyIds.length,
          books: storyIds,
          bookSlugs: storySlugs,
          isPublished: true
        },
        { upsert: true, new: true }
      );

      // Link each Story back to Series
      for (let order = 0; order < storyIds.length; order++) {
        const sId = storyIds[order];
        const related = storyIds.filter((id) => !id.equals(sId));
        await Story.findByIdAndUpdate(sId, {
          seriesId: seriesDoc._id,
          seriesName: seriesMeta.name,
          seriesOrder: order + 1,
          relatedBooks: related
        });
      }

      console.log(`  ✅ Linked ${storyIds.length} books for series "${seriesMeta.name}"`);
    }
  }

  console.log("\n=======================================================================");
  console.log("🎉 ALL BOOK SERIES PROCESSED AND INTERCONNECTED IN MONGO DB!");
  console.log("=======================================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal Error in Book Series Pipeline:", err);
  process.exit(1);
});
