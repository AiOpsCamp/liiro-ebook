require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/db/connect");
const Story = require("../src/models/Story.model");
const EbookCategory = require("../src/models/EbookCategory.model");

const CATEGORY_MAPPINGS = [
  {
    slug: "childrens-classics",
    name: "Children’s Classics",
    icon: "Baby",
    color: "#F59E0B",
    matchRegex: /pooh|winnie|alice|wonderland|looking-glass|oz|ozma|dolittle|peter|wendy|pinocchio|folktales|fairy/i
  },
  {
    slug: "gothic-and-dark-fantasy",
    name: "Gothic & Dark Fantasy",
    icon: "Flame",
    color: "#E11D48",
    matchRegex: /dracula|frankenstein|jekyll|dorian|poe|gothic|vampire/i
  },
  {
    slug: "science-fiction-and-space",
    name: "Science Fiction & Space",
    icon: "Sparkles",
    color: "#0EA5E9",
    matchRegex: /war of the worlds|time machine|invisible man|plague ship|key out of time|verne|zamyatin|sci-fi|space/i
  },
  {
    slug: "high-adventure-and-survival",
    name: "High Adventure & Survival",
    icon: "Compass",
    color: "#10B981",
    matchRegex: /treasure island|robinson crusoe|journals|adventure|sea|shipwreck/i
  },
  {
    slug: "mystery-and-detective",
    name: "Mystery & Detective",
    icon: "Search",
    color: "#8B5CF6",
    matchRegex: /sherlock|holmes|red house mystery|villa rose|baskervilles|detective|mystery|crime/i
  },
  {
    slug: "philosophy-and-ethics",
    name: "Philosophy & Ethics",
    icon: "Brain",
    color: "#6366F1",
    matchRegex: /pursuit of god|siddhartha|meditations|republic|ethics|philosophy/i
  }
];

async function relinkAndCleanCategories() {
  console.log("=======================================================================");
  console.log("🛠️ RELINKING STORIES TO CATEGORIES & CLEANING DEAD CATEGORIES IN MONGO DB");
  console.log("=======================================================================");

  await connectDB();
  const db = mongoose.connection.db;

  // Clear categories collection first
  await db.collection("categories").deleteMany({});

  const stories = await Story.find();
  console.log(`📚 Processing ${stories.length} stories...`);

  // Ensure target active categories exist
  const activeCategoryDocs = {};
  for (const catMeta of CATEGORY_MAPPINGS) {
    const catDoc = await EbookCategory.create({
      name: catMeta.name,
      slug: catMeta.slug,
      iconName: catMeta.icon,
      icon: catMeta.icon,
      color: catMeta.color,
      description: `Curated ${catMeta.name} collection`,
      bookCount: 0
    });
    activeCategoryDocs[catMeta.slug] = catDoc;
  }

  // Link Stories to corresponding categories
  for (const story of stories) {
    const titleStr = (story.title?.en || story.title || "") + " " + (story.slug || "");
    let matchedCat = null;

    for (const catMeta of CATEGORY_MAPPINGS) {
      if (catMeta.matchRegex.test(titleStr)) {
        matchedCat = activeCategoryDocs[catMeta.slug];
        break;
      }
    }

    if (!matchedCat) {
      matchedCat = activeCategoryDocs["childrens-classics"];
    }

    story.categoryId = matchedCat._id;
    story.categories = [matchedCat._id];
    story.category = matchedCat.name;
    await story.save();

    await db.collection("stories").updateOne(
      { _id: story._id },
      { $set: { categoryId: matchedCat._id, categories: [matchedCat._id], category: matchedCat.name } }
    );

    console.log(`  ✅ Linked "${story.title?.en || story.title}" -> Category: "${matchedCat.name}" (${matchedCat.slug})`);
  }

  // Recalculate real bookCount for all categories
  const allCategories = await EbookCategory.find();
  let deletedCount = 0;

  for (const cat of allCategories) {
    const count = await Story.countDocuments({ categoryId: cat._id });

    if (count === 0) {
      console.log(`  🗑️ Removing DEAD Category with 0 books: "${cat.name}" (${cat.slug})`);
      await EbookCategory.findByIdAndDelete(cat._id);
      deletedCount++;
    } else {
      cat.bookCount = count;
      await cat.save();
      console.log(`  ⭐ Updated Active Category "${cat.name}" (${cat.slug}) -> ${count} books`);
    }
  }

  console.log("\n=======================================================================");
  console.log(`🎉 CATEGORY CLEANUP & RELINKING COMPLETE!`);
  console.log(`   Removed Dead Categories: ${deletedCount}`);
  console.log(`   Remaining Active Categories: ${await EbookCategory.countDocuments()}`);
  console.log("=======================================================================");
  process.exit(0);
}

relinkAndCleanCategories().catch((err) => {
  console.error("Fatal Error in Category Relinking:", err);
  process.exit(1);
});
