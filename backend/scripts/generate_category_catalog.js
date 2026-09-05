const fs = require("fs");
const path = require("path");

const EBOOK_CONTENTS_DIR = path.join(__dirname, "../../ebook-contents");
const OUTPUT_JSON_PATH = path.join(__dirname, "../data/category_repositories.json");

// Rule-based category keyword matching for subject tags, title, & author
const CATEGORY_RULES = [
  { key: "children", name: "Children's Classics", keywords: ["children", "fairy tale", "juvenile", "nursery", "oz", "alice", "pinocchio", "pooh", "dolittle", "peter pan", "wonderland", "looking-glass", "wind in the willows"] },
  { key: "gothic", name: "Gothic & Dark Fantasy", keywords: ["gothic", "vampire", "dracula", "frankenstein", "jekyll", "dorian gray", "poe", "horror", "ghost", "supernatural", "weird"] },
  { key: "scifi", name: "Sci-Fi & Dystopian", keywords: ["science fiction", "sci-fi", "dystopian", "time machine", "war of the worlds", "invisible man", "verne", "zamyatin", "h. g. wells", "space", "future"] },
  { key: "mystery", name: "Mystery & Detective", keywords: ["detective", "mystery", "sherlock", "holmes", "baskervilles", "scarlet", "crime", "sleuth", "whodunit", "collins", "doyle"] },
  { key: "victorian", name: "Victorian Literature", keywords: ["victorian", "dickens", "austen", "bronte", "thackeray", "trollope", "hardy", "gaskell", "19th century"] },
  { key: "philosophy", name: "Philosophy & Ethics", keywords: ["philosophy", "ethics", "stoicism", "meditations", "republic", "art of war", "nietzsche", "plato", "aristotle", "marcus aurelius", "tao te ching", "spinoza", "kant"] },
  { key: "adventure", name: "Adventure & Sea Stories", keywords: ["adventure", "sea", "pirate", "treasure island", "robinson crusoe", "shipwreck", "sailing", "safari", "haggard", "kipling", "london"] },
  { key: "romance", name: "Romance & Love Stories", keywords: ["romance", "love", "courtship", "marriage", "pride and prejudice", "sense and sensibility", "wuthering heights", "jane eyre"] },
  { key: "comedy", name: "Satire & Humorous Fiction", keywords: ["humor", "humorous", "satire", "comedy", "wodehouse", "twain", "jeeves", "pickwick", "wit"] },
  { key: "fantasy", name: "Epic Fantasy & Mythology", keywords: ["fantasy", "magic", "dragon", "faerie", "mythology", "fairytale", "legend", "folklore"] },
  { key: "drama", name: "Drama & Plays", keywords: ["play", "drama", "tragedy", "shakespeare", "ibsen", "chekhov", "wilde", "shaw", "sophocles"] },
  { key: "poetry", name: "Classic Poetry", keywords: ["poetry", "poems", "sonnets", "verse", "whitman", "dickinson", "keats", "shelley", "byron", "wordsworth"] },
  { key: "history", name: "History & Biography", keywords: ["history", "biography", "autobiography", "memoir", "historical", "revolution", "war", "empire"] }
];

function generateCategoryCatalog() {
  console.log("=======================================================================");
  console.log("🔍 SCANNING LOCAL STANDARD EBOOKS REPOSITORIES...");
  console.log(`   Path: ${EBOOK_CONTENTS_DIR}`);
  console.log("=======================================================================");

  if (!fs.existsSync(EBOOK_CONTENTS_DIR)) {
    console.error(`❌ Directory not found: ${EBOOK_CONTENTS_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(EBOOK_CONTENTS_DIR, { withFileTypes: true });
  const repoFolders = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);

  console.log(`📚 Total Repository Folders Found: ${repoFolders.length}`);

  const catalog = {
    generatedAt: new Date().toISOString(),
    totalRepositories: repoFolders.length,
    categories: {}
  };

  CATEGORY_RULES.forEach((rule) => {
    catalog.categories[rule.key] = {
      name: rule.name,
      count: 0,
      repositories: []
    };
  });
  catalog.categories["uncategorized"] = {
    name: "General Fiction & Classics",
    count: 0,
    repositories: []
  };

  repoFolders.forEach((folderName) => {
    let textToMatch = folderName.toLowerCase().replace(/_/g, " ");

    // Check content.opf if available
    const opfPath = path.join(EBOOK_CONTENTS_DIR, folderName, "src/epub/content.opf");
    if (fs.existsSync(opfPath)) {
      try {
        const opfContent = fs.readFileSync(opfPath, "utf8").toLowerCase();
        textToMatch += " " + opfContent;
      } catch (e) {}
    }

    let matched = false;
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((kw) => textToMatch.includes(kw))) {
        catalog.categories[rule.key].repositories.push(folderName);
        catalog.categories[rule.key].count++;
        matched = true;
        break; // Match primary category
      }
    }

    if (!matched) {
      catalog.categories["uncategorized"].repositories.push(folderName);
      catalog.categories["uncategorized"].count++;
    }
  });

  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(catalog, null, 2), "utf8");

  console.log("\n=======================================================================");
  console.log(`🎉 AUTOMATED CATEGORY CATALOG GENERATED SUCCESSFULLY!`);
  console.log(`   Saved File: ${OUTPUT_JSON_PATH}`);
  console.log("=======================================================================");
  console.log("📊 Category Breakdowns:");
  Object.keys(catalog.categories).forEach((key) => {
    const cat = catalog.categories[key];
    console.log(`   • ${cat.name} (${key}): ${cat.count} repos`);
  });
  console.log("=======================================================================");
}

generateCategoryCatalog();
