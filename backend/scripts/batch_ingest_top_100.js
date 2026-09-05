const { execSync } = require("child_process");
const https = require("https");
const mongoose = require("mongoose");

const AUTH_MONGO_URI = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/liiro_prod?authSource=admin&directConnection=true";

// Desired slugs from Top 100 Launch List
const targetSlugs = [
  // Gothic & Horror
  "the-yellow-wallpaper", "jane-eyre", "wuthering-heights", "the-phantom-of-the-opera", "the-legend-of-sleepy-hollow",
  "carmilla", "the-fall-of-the-house-of-usher", "the-turn-of-the-screw", "the-house-of-the-seven-gables", "villette", "the-tenant-of-wildfell-hall",

  // Sci-Fi
  "twenty-thousand-leagues-under-the-seas", "around-the-world-in-eighty-days", "journey-to-the-center-of-the-earth",
  "a-princess-of-mars", "the-gods-of-mars", "the-first-men-in-the-moon", "looking-backward", "news-from-nowhere",
  "the-food-of-the-gods", "herland", "flatland",

  // Mystery
  "the-hound-of-the-baskervilles", "a-study-in-scarlet", "the-sign-of-the-four", "the-memoirs-of-sherlock-holmes",
  "the-return-of-sherlock-holmes", "the-moonstone", "the-woman-in-white", "the-murders-in-the-rue-morgue",
  "the-mystery-of-edwin-drood", "arsene-lupin-gentleman-burglar", "the-innocence-of-father-brown", "the-wisdom-of-father-brown",
  "the-riddle-of-the-sands", "the-thirty-nine-steps",

  // Adventure
  "white-fang", "moby-dick", "the-count-of-monte-cristo", "the-three-musketeers", "twenty-years-after",
  "the-adventures-of-tom-sawyer", "adventures-of-huckleberry-finn", "robinson-crusoe", "king-solomons-mines", "she",
  "tarzan-of-the-apes", "the-sea-wolf", "kidnapped",

  // Romance & Society
  "sense-and-sensibility", "emma", "mansfield-park", "northanger-abbey", "persuasion", "little-women", "anna-karenina",
  "madame-bovary", "the-age-of-innocence", "the-house-of-mirth", "far-from-the-madding-crowd", "tess-of-the-durbervilles", "the-scarlet-letter",

  // World Masterworks & Philosophy
  "the-metamorphosis", "crime-and-punishment", "the-brothers-karamazov", "les-miserables", "a-tale-of-two-cities",
  "great-expectations", "the-odyssey", "the-iliad", "meditations", "the-republic", "beyond-good-and-evil",
  "the-art-of-war", "the-prince", "heart-of-darkness",

  // Fantasy & Children
  "the-wonderful-wizard-of-oz", "peter-and-wendy", "the-secret-garden", "a-little-princess", "the-wind-in-the-willows",
  "grimms-fairy-tales", "andersens-fairy-tales"
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Liiro-Ebook-Ingester" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve([]); }
      });
    }).on("error", () => resolve([]));
  });
}

async function main() {
  console.log("=======================================================================");
  console.log("🚀 BATCH INGESTION CONTROLLER FOR TOP 100 LAUNCH CATALOG");
  console.log(`   Target Slugs to Ingest: ${targetSlugs.length}`);
  console.log("=======================================================================\n");

  // Fetch all Standard Ebooks GitHub repos to map exact repo names
  let allRepos = [];
  for (let page = 1; page <= 12; page++) {
    const reposPage = await fetchJson(`https://api.github.com/orgs/standardebooks/repos?per_page=100&page=${page}`);
    if (!Array.isArray(reposPage) || reposPage.length === 0) break;
    allRepos.push(...reposPage.map(r => r.name));
  }
  console.log(`📦 Fetched ${allRepos.length} repos from Standard Ebooks GitHub Organization.\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < targetSlugs.length; i++) {
    const slug = targetSlugs[i];
    console.log(`\n======================================================`);
    console.log(`🚀 [${i + 1}/${targetSlugs.length}] PROCESSING: ${slug}`);
    console.log(`======================================================`);

    // Match exact repo name ending with _slug or containing _slug_
    const matchingRepo = allRepos.find(r => r.endsWith(`_${slug}`) || r.includes(`_${slug}_`));

    if (!matchingRepo) {
      console.log(`⚠️ Repo match fallback trying slug directly: "${slug}"`);
    }

    const repoToIngest = matchingRepo || slug;
    console.log(`👉 Ingesting repo: "${repoToIngest}"...`);

    try {
      execSync(`node scripts/ingest_standard_ebook.js "${repoToIngest}"`, { stdio: "inherit" });
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to ingest "${repoToIngest}":`, err.message);
      failedCount++;
    }
  }

  console.log("\n=======================================================================");
  console.log("🎉 TOP 100 LAUNCH CATALOG BATCH INGESTION COMPLETE!");
  console.log(`   Total Success: ${successCount}`);
  console.log(`   Total Failed: ${failedCount}`);
  console.log("=======================================================================");
}

main().catch(err => {
  console.error("Batch error:", err);
  process.exit(1);
});
