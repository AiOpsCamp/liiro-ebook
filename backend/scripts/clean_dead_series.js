require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/db/connect");
const Story = require("../src/models/Story.model");
const BookSeries = require("../src/models/BookSeries.model");

async function cleanDeadSeries() {
  console.log("=======================================================================");
  console.log("🛠️ AUDITING & PURGING DEAD BOOK SERIES FROM MONGO DB");
  console.log("=======================================================================");

  await connectDB();

  const allSeries = await BookSeries.find();
  console.log(`📚 Total Series Documents in DB: ${allSeries.length}`);

  let deletedCount = 0;
  let updatedCount = 0;

  for (const series of allSeries) {
    // Find all valid story documents explicitly linked by seriesId or seriesName or matching slug
    const activeStories = await Story.find({
      $or: [
        { _id: { $in: series.books || [] } },
        { seriesId: series._id },
        { seriesName: series.name }
      ]
    });

    // Check if the stories actually exist in MongoDB
    const realBooks = activeStories.filter((s) => !!s._id);

    if (realBooks.length === 0) {
      console.log(`  🗑️ Removing DEAD Series with 0 active books: "${series.name || series.title || series.slug}"`);
      await BookSeries.findByIdAndDelete(series._id);
      deletedCount++;
    } else {
      series.title = series.title || series.name || "Book Series";
      series.name = series.name || series.title || "Book Series";
      series.books = realBooks.map((s) => s._id);
      series.bookSlugs = realBooks.map((s) => s.slug);
      series.totalBooks = realBooks.length;
      series.bookCount = realBooks.length;
      await series.save();
      updatedCount++;
      console.log(`  ⭐ Updated Active Series "${series.name}" (${series.slug}) -> ${realBooks.length} active books`);
    }
  }

  const remainingSeries = await BookSeries.find();

  console.log("\n=======================================================================");
  console.log(`🎉 BOOK SERIES CLEANUP COMPLETE!`);
  console.log(`   Purged Dead Series: ${deletedCount}`);
  console.log(`   Updated Active Series: ${updatedCount}`);
  console.log(`   Remaining Active Series in DB: ${remainingSeries.length}`);
  console.log("=======================================================================");
  process.exit(0);
}

cleanDeadSeries().catch((err) => {
  console.error("Fatal Error in Series Cleanup:", err);
  process.exit(1);
});
