const fs = require("fs");
const path = require("path");

const EBOOK_CONTENTS_DIR = path.join(__dirname, "../../ebook-contents");
const OUTPUT_JSON_PATH = path.join(__dirname, "../data/series_catalog.json");

// Known custom sagas & series mappings
const CUSTOM_SERIES_RULES = [
  {
    name: "Alice Series",
    slug: "alice-series",
    author: "Lewis Carroll",
    description: "The complete Alice's Adventures in Wonderland and Through the Looking-Glass saga by Lewis Carroll",
    repos: [
      { repo: "lewis-carroll_alices-adventures-in-wonderland_john-tenniel", title: "Alice’s Adventures in Wonderland", order: 1 },
      { repo: "lewis-carroll_through-the-looking-glass_john-tenniel", title: "Through the Looking-Glass", order: 2 }
    ]
  },
  {
    name: "Doctor Dolittle Series",
    slug: "doctor-dolittle-series",
    author: "Hugh Lofting",
    description: "The complete Doctor Dolittle animal adventures collection by Hugh Lofting",
    repos: [
      { repo: "hugh-lofting_the-story-of-doctor-dolittle", title: "The Story of Doctor Dolittle", order: 1 },
      { repo: "hugh-lofting_the-voyages-of-doctor-dolittle", title: "The Voyages of Doctor Dolittle", order: 2 }
    ]
  },
  {
    name: "Peter Pan Series",
    slug: "peter-pan-series",
    author: "J. M. Barrie",
    description: "The complete Peter Pan and Neverland saga by J. M. Barrie",
    repos: [
      { repo: "j-m-barrie_the-little-white-bird", title: "The Little White Bird", order: 1 },
      { repo: "j-m-barrie_peter-and-wendy", title: "Peter and Wendy", order: 2 }
    ]
  },
  {
    name: "The D'Artagnan Romances Series",
    slug: "d-artagnan-romances-series",
    author: "Alexandre Dumas",
    description: "The complete Three Musketeers and D'Artagnan saga by Alexandre Dumas",
    repos: [
      { repo: "alexandre-dumas_the-three-musketeers_william-robson", title: "The Three Musketeers", order: 1 },
      { repo: "alexandre-dumas_twenty-years-after_william-robson", title: "Twenty Years After", order: 2 }
    ]
  }
];

function generateSeriesCatalog() {
  console.log("=======================================================================");
  console.log("🔍 AUTOMATED OPF PARSER: EXTRACTING BOOK SERIES METADATA...");
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

  console.log(`📚 Total Repositories to Scan: ${repoFolders.length}`);

  const seriesMap = new Map();

  // 1. Add Custom Sagas first
  CUSTOM_SERIES_RULES.forEach((cs) => {
    seriesMap.set(cs.slug, {
      name: cs.name,
      slug: cs.slug,
      author: cs.author,
      description: cs.description,
      books: cs.repos
    });
  });

  // 2. Extract from content.opf
  repoFolders.forEach((folderName) => {
    const opfPath = path.join(EBOOK_CONTENTS_DIR, folderName, "src/epub/content.opf");
    if (!fs.existsSync(opfPath)) return;

    try {
      const opfXml = fs.readFileSync(opfPath, "utf8");

      // Extract belongs-to-collection
      const collectionMatches = [...opfXml.matchAll(/<meta[^>]*property="belongs-to-collection"[^>]*>([^<]+)<\/meta>/gi)];
      
      for (const m of collectionMatches) {
        const rawSeriesName = m[1] ? m[1].trim() : "";
        if (!rawSeriesName) continue;
        if (
          rawSeriesName.includes("Guardian") ||
          rawSeriesName.includes("BBC") ||
          rawSeriesName.includes("Britannica") ||
          rawSeriesName.includes("Telegraph") ||
          rawSeriesName.includes("Pulitzer") ||
          rawSeriesName.includes("Haycraft") ||
          rawSeriesName.includes("Cornerstones") ||
          rawSeriesName.includes("Radcliffe") ||
          rawSeriesName.includes("Modern Library") ||
          rawSeriesName.includes("Top 100") ||
          rawSeriesName.includes("Harvard Classics") ||
          rawSeriesName.includes("Le Monde") ||
          rawSeriesName.includes("James Tait Black") ||
          rawSeriesName.includes("Prix Femina")
        ) {
          continue; // Skip generic award / best-of list collections
        }

        // Extract group-position (volume number)
        const positionMatch = opfXml.match(/<meta[^>]*property="group-position"[^>]*>(\d+)<\/meta>/i);
        const position = positionMatch ? parseInt(positionMatch[1], 10) : 99;

        // Extract Title
        const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
        const title = titleMatch ? titleMatch[1].trim() : folderName;

        // Extract Author
        const authorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
        const author = authorMatch ? authorMatch[1].trim() : "";

        const seriesName = rawSeriesName.endsWith(" Series") || rawSeriesName.endsWith(" Saga")
          ? rawSeriesName
          : `${rawSeriesName} Series`;
        const seriesSlug = seriesName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        if (!seriesMap.has(seriesSlug)) {
          seriesMap.set(seriesSlug, {
            name: seriesName,
            slug: seriesSlug,
            author: author,
            description: `The complete ${seriesName} collection by ${author}`,
            books: []
          });
        }

        const seriesEntry = seriesMap.get(seriesSlug);
        if (!seriesEntry.books.some((b) => b.repo === folderName)) {
          seriesEntry.books.push({
            repo: folderName,
            title: title,
            order: position
          });
        }
      }
    } catch (e) {}
  });

  const seriesList = Array.from(seriesMap.values())
    .filter((s) => s.books.length > 1)
    .map((s) => {
      s.books.sort((a, b) => a.order - b.order);
      s.totalBooks = s.books.length;
      return s;
    })
    .sort((a, b) => b.totalBooks - a.totalBooks);

  const outputData = {
    generatedAt: new Date().toISOString(),
    totalSeriesFound: seriesList.length,
    series: seriesList
  };

  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(outputData, null, 2), "utf8");

  console.log("\n=======================================================================");
  console.log(`🎉 AUTOMATED SERIES CATALOG GENERATED SUCCESSFULLY!`);
  console.log(`   Saved File: ${OUTPUT_JSON_PATH}`);
  console.log(`   Total Multi-Book Series Discovered: ${seriesList.length}`);
  console.log("=======================================================================");
  console.log("📚 Top Discovered Book Series Sagas:");
  seriesList.slice(0, 15).forEach((s, idx) => {
    console.log(`   ${idx + 1}. ${s.name} (${s.author}) — ${s.totalBooks} Books [slug: ${s.slug}]`);
  });
  console.log("=======================================================================");
}

generateSeriesCatalog();
