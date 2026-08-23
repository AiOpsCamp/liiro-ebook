const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../projects/langoreads/.env") });

const uri = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
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

// ── Master 25 Ebook Categories Taxonomy ──────────────────────────────────
const CATEGORY_TAXONOMY = [
  {
    name: "Science Fiction",
    slug: "science-fiction",
    color: "#0891B2",
    icon: "Layers",
    description: "Futuristic technology, time travel, space exploration, and dystopian worlds.",
    keywords: ["sci-fi", "scifi", "science fiction", "time travel", "space", "dystopian", "futuristic"],
  },
  {
    name: "Philosophy & Thought",
    slug: "philosophy-and-thought",
    color: "#F59E0B",
    icon: "Sparkles",
    description: "Stoicism, ethics, theology, logic, and profound human inquiry.",
    keywords: ["philosophy", "philosophical", "stoicism", "ethics", "logic", "theology", "non-fiction"],
  },
  {
    name: "Comedy & Satire",
    slug: "comedy-and-satire",
    color: "#EF4444",
    icon: "Flame",
    description: "Witty humor, social satire, parodies, and comedic masterpieces.",
    keywords: ["comedy", "humor", "wit", "satire", "parody"],
  },
  {
    name: "Fantasy & Magic",
    slug: "fantasy-and-magic",
    color: "#8B5CF6",
    icon: "Layers",
    description: "Fairy tales, high fantasy, magical realms, and legendary folklore.",
    keywords: ["fantasy", "fairy", "magic", "myths", "mythology", "folklore", "high fantasy"],
  },
  {
    name: "Horror & Weird Fiction",
    slug: "horror-and-weird-fiction",
    color: "#A855F7",
    icon: "Flame",
    description: "Tales of terror, supernatural horrors, macabre, and weird fiction.",
    keywords: ["horror", "weird", "vampires", "macabre", "supernatural"],
  },
  {
    name: "Mystery & Detective",
    slug: "mystery-and-detective",
    color: "#3B82F6",
    icon: "Search",
    description: "Classic detective investigations, murder mysteries, and crime puzzles.",
    keywords: ["mystery", "detective", "sherlock", "crime", "investigation"],
  },
  {
    name: "Gothic Classics",
    slug: "gothic-classics",
    color: "#6366F1",
    icon: "Sparkles",
    description: "Haunted castles, dark romanticism, suspense, and eerie atmosphere.",
    keywords: ["gothic", "dark romanticism", "dracula", "jekyll"],
  },
  {
    name: "Drama & Plays",
    slug: "drama-and-plays",
    color: "#10B981",
    icon: "BookOpen",
    description: "Theatrical plays, dramatic literature, tragedies, and stage classics.",
    keywords: ["drama", "play", "theater", "tragedy", "stage"],
  },
  {
    name: "Biographies & Memoirs",
    slug: "biographies-and-memoirs",
    color: "#EC4899",
    icon: "Award",
    description: "Real life stories, autobiographies, historical figures, and memoirs.",
    keywords: ["biography", "memoir", "autobiography", "historical", "history"],
  },
  {
    name: "Science & Nature",
    slug: "science-and-nature",
    color: "#84CC16",
    icon: "Compass",
    description: "Natural philosophy, evolution, biology, astronomy, and wilderness.",
    keywords: ["science", "nature", "natural", "evolution", "biology", "astronomy"],
  },
  {
    name: "Victorian Masterpieces",
    slug: "victorian-masterpieces",
    color: "#EAB308",
    icon: "Award",
    description: "19th century British literature, Dickensian society, and classic novels.",
    keywords: ["victorian", "british literature", "19th century", "dickens", "austen", "hardy"],
  },
  {
    name: "Russian Literature",
    slug: "russian-literature",
    color: "#DC2626",
    icon: "Globe",
    description: "Epic novels and psychological fiction by Tolstoy, Dostoevsky, Chekhov.",
    keywords: ["russian literature", "russian", "slavic", "tolstoy", "dostoevsky", "chekhov"],
  },
  {
    name: "French Literature",
    slug: "french-literature",
    color: "#2563EB",
    icon: "Globe",
    description: "Masterworks by Victor Hugo, Alexandre Dumas, Gustave Flaubert, Balzac.",
    keywords: ["french literature", "french", "hugo", "dumas", "flaubert", "balzac", "lupin"],
  },
  {
    name: "High Adventure & Sea",
    slug: "high-adventure-and-sea",
    color: "#059669",
    icon: "Compass",
    description: "Seafaring voyages, pirate treasure hunts, expeditions, and survival.",
    keywords: ["adventure", "sea", "pirates", "survival", "expedition", "voyage", "merchant marine"],
  },
  {
    name: "Romance & Courtship",
    slug: "romance-and-courtship",
    color: "#F43F5E",
    icon: "Sparkles",
    description: "Love stories, courtship, passion, and romantic fiction.",
    keywords: ["romance", "love", "courtship", "marriage", "romantic"],
  },
  {
    name: "Spy Thrillers & Crime",
    slug: "spy-thrillers-and-crime",
    color: "#3B82F6",
    icon: "Search",
    description: "Espionage, political suspense, crime thrillers, and secret agents.",
    keywords: ["thriller", "spy", "espionage", "suspense", "crime"],
  },
  {
    name: "Historical Fiction",
    slug: "historical-fiction",
    color: "#D97706",
    icon: "BookOpen",
    description: "Engaging fiction set in past historical eras, empires, and wars.",
    keywords: ["historical fiction", "historical", "war", "history"],
  },
  {
    name: "Psychological Fiction",
    slug: "psychological-fiction",
    color: "#6D28D9",
    icon: "Sparkles",
    description: "Deep exploration of the human mind, internal conflict, and emotion.",
    keywords: ["psychological", "psychological fiction", "mind"],
  },
  {
    name: "Children & Family",
    slug: "children-and-family",
    color: "#10B981",
    icon: "BookOpen",
    description: "Wholesome literature for young readers, family tales, and fables.",
    keywords: ["children", "family", "juvenile", "holiday", "fables"],
  },
  {
    name: "Poetry & Epics",
    slug: "poetry-and-epics",
    color: "#9333EA",
    icon: "Award",
    description: "Timeless poetic verse, grand epics, sonnets, and heroic ballads.",
    keywords: ["poetry", "epic", "verse", "sonnet", "ballad"],
  },
  {
    name: "Frontier & Wilderness",
    slug: "frontier-and-wilderness",
    color: "#15803D",
    icon: "Compass",
    description: "Wilderness survival, frontier life, wildlife, and natural exploration.",
    keywords: ["wilderness", "frontier", "wild", "outdoors"],
  },
  {
    name: "Ancient & Classical",
    slug: "ancient-and-classical",
    color: "#B45309",
    icon: "Award",
    description: "Greek, Roman, and ancient world epics, mythology, and philosophy.",
    keywords: ["ancient", "greek", "latin", "roman", "mythology"],
  },
  {
    name: "Social & Political Satire",
    slug: "social-and-political-satire",
    color: "#4338CA",
    icon: "Sparkles",
    description: "Critiques of society, political satire, gender roles, and ethics.",
    keywords: ["political", "social", "feminist", "puritans", "society"],
  },
  {
    name: "Short Stories & Novellas",
    slug: "short-stories-and-novellas",
    color: "#0284C7",
    icon: "BookOpen",
    description: "Bite-sized literary works, short story collections, and novellas.",
    keywords: ["short stories", "novella", "essay", "short fiction"],
  },
  {
    name: "World Classics",
    slug: "world-classics",
    color: "#EAB308",
    icon: "Award",
    description: "Enduring literary masterpieces celebrated across generations.",
    keywords: ["classic", "literature", "masterpiece", "fiction"],
  },
];

async function syncEbookMetadata() {
  await mongoose.connect(uri);
  const Story = require("../projects/langoreads/models/Story.model.js");
  const EbookAuthor = require("../projects/langoreads/models/EbookAuthor.model.js");
  const EbookCategory = require("../projects/langoreads/models/EbookCategory.model.js");
  const EbookTag = require("../projects/langoreads/models/EbookTag.model.js");

  console.log("🚀 Starting Enriched Ebook Metadata Sync (25 Categories, Authors, Tags)...");

  const stories = await Story.find({ isPublished: true });
  console.log(`Found ${stories.length} published stories.`);

  const authorMap = new Map();
  const categoryMap = new Map(); // slug -> { name, slug, color, icon, description, books: Set<ObjectId> }
  const tagMap = new Map();

  // Initialize category map from taxonomy
  CATEGORY_TAXONOMY.forEach((cat) => {
    categoryMap.set(cat.slug, { ...cat, books: new Set() });
  });

  for (const story of stories) {
    // 1. Authors
    if (story.author && story.author.trim()) {
      const authorName = story.author.trim();
      const authorSlug = slugify(authorName);
      if (!authorMap.has(authorSlug)) {
        authorMap.set(authorSlug, { name: authorName, slug: authorSlug, books: new Set() });
      }
      authorMap.get(authorSlug).books.add(story._id);
    }

    // 2. Tags & Category Matching
    const tags = Array.isArray(story.tags) ? story.tags : [];
    const storyText = (getLocalizedText(story.title) + " " + getLocalizedText(story.synopsis) + " " + (story.author || "")).toLowerCase();
    const tagTexts = tags.map((t) => getLocalizedText(t).toLowerCase());

    for (const tagText of tagTexts) {
      if (!tagText) continue;
      const tagSlug = slugify(tagText);
      if (!tagMap.has(tagSlug)) {
        tagMap.set(tagSlug, { name: tagText, slug: tagSlug, books: new Set() });
      }
      tagMap.get(tagSlug).books.add(story._id);
    }

    // Match story into taxonomy categories
    categoryMap.forEach((catData) => {
      const matchesKeyword = catData.keywords.some(
        (kw) => tagTexts.some((t) => t.includes(kw)) || storyText.includes(kw)
      );
      if (matchesKeyword) {
        catData.books.add(story._id);
      }
    });
  }

  // ── Sync Authors into MongoDB ─────────────────────────────────────────
  console.log(`\nWriting ${authorMap.size} Ebook Authors to MongoDB...`);
  for (const [slug, item] of authorMap.entries()) {
    const booksArr = Array.from(item.books);
    await EbookAuthor.findOneAndUpdate(
      { slug },
      { name: item.name, slug, books: booksArr, bookCount: booksArr.length },
      { upsert: true, new: true }
    );
  }

  // ── Sync Categories into MongoDB ──────────────────────────────────────
  console.log(`Writing ${categoryMap.size} Ebook Categories to MongoDB...`);
  for (const [slug, item] of categoryMap.entries()) {
    const booksArr = Array.from(item.books);
    if (booksArr.length > 0) {
      await EbookCategory.findOneAndUpdate(
        { slug },
        {
          name: item.name,
          slug,
          description: item.description,
          color: item.color,
          icon: item.icon,
          books: booksArr,
          bookCount: booksArr.length,
        },
        { upsert: true, new: true }
      );
    }
  }

  // ── Sync Tags into MongoDB ────────────────────────────────────────────
  console.log(`Writing ${tagMap.size} Ebook Tags to MongoDB...`);
  for (const [slug, item] of tagMap.entries()) {
    const booksArr = Array.from(item.books);
    await EbookTag.findOneAndUpdate(
      { slug },
      { name: item.name, slug, books: booksArr, bookCount: booksArr.length },
      { upsert: true, new: true }
    );
  }

  const activeCategoriesCount = await EbookCategory.countDocuments({});

  console.log("\n==================================================");
  console.log("🎉 ENRICHED EBOOK METADATA SYNC COMPLETED!");
  console.log("==================================================");
  console.log(`✍️  Authors Synced:    ${authorMap.size}`);
  console.log(`📂 Categories Synced: ${activeCategoriesCount}`);
  console.log(`🏷️  Tags Synced:       ${tagMap.size}`);
  console.log("==================================================");

  await mongoose.disconnect();
}

syncEbookMetadata().catch((err) => {
  console.error("❌ Sync Error:", err);
  process.exit(1);
});
