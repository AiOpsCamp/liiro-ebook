const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../projects/langoreads/.env") });

const uri = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

// Priority keywords & authors for Top 100 Curation
const TOP_100_HIGH_PRIORITY_SLUGS = [
  "alices-adventures-in-wonderland",
  "the-great-gatsby",
  "the-count-of-monte-cristo",
  "war-and-peace",
  "les-miserables",
  "treasure-island",
  "dracula",
  "frankenstein",
  "pride-and-prejudice",
  "the-adventures-of-sherlock-holmes",
  "ulysses",
  "moby-dick",
  "the-time-machine",
  "the-picture-of-dorian-gray",
  "the-three-musketeers",
  "the-wonderful-wizard-of-oz",
  "the-murder-of-roger-ackroyd",
  "crime-and-punishment",
  "the-merry-adventures-of-robin-hood",
  "the-souls-of-black-folk",
  "the-wind-in-the-willows",
  "peter-and-wendy",
  "the-secret-garden",
  "how-the-other-half-lives",
  "the-adventures-of-tom-sawyer",
  "the-adventures-of-huckleberry-finn",
  "le-morte-darthur",
  "captain-blood",
  "the-call-of-the-wild",
  "white-fang",
  "king-solomons-mines",
  "around-the-world-in-eighty-days",
  "journey-to-the-center-of-the-earth",
  "twenty-thousand-leagues-under-the-seas",
  "the-strange-case-of-dr-jekyll-and-mr-hyde",
  "wuthering-heights",
  "jane-eyre",
  "great-expectations",
  "a-tale-of-two-cities",
  "david-copperfield",
  "the-war-of-the-worlds",
  "the-invisible-man",
  "the-metamorphosis",
  "mrs-dalloway",
  "to-the-lighthouse",
  "the-age-of-innocence",
  "babbitt",
  "main-street",
  "heidi",
  "black-beauty",
  "anne-of-green-gables",
  "little-women",
  "the-history-of-the-decline-and-fall-of-the-roman-empire",
  "autobiography-of-benjamin-franklin",
  "twelve-years-a-slave",
  "the-interesting-narrative-of-the-life-of-olaudah-equiano"
];

async function markTop100FeaturedEbooks() {
  await mongoose.connect(uri);
  const Story = require("../projects/langoreads/models/Story.model.js");

  // Reset existing featured status
  await Story.updateMany({}, { isFeatured: false, featuredRank: 0 });

  const allPublished = await Story.find({ isPublished: true }).lean();
  console.log(`⭐ Curating Top 100 Featured Masterwork Ebooks from ${allPublished.length} published titles...`);

  const featuredList = [];
  const processedSlugs = new Set();

  // 1. Add High Priority Curated Slugs first
  for (const slug of TOP_100_HIGH_PRIORITY_SLUGS) {
    const story = allPublished.find((s) => s.slug === slug);
    if (story && !processedSlugs.has(story.slug)) {
      featuredList.push(story);
      processedSlugs.add(story.slug);
    }
  }

  // 2. Fill remaining slots up to 100 with top classic illustrated books, audiobooks, and major authors
  const remainingCandidates = allPublished.filter((s) => !processedSlugs.has(s.slug));

  // Sort remaining candidates by score (has illustrations, has audio, word count, prestige tags)
  remainingCandidates.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.tags?.includes("illustrated")) scoreA += 50;
    if (b.tags?.includes("illustrated")) scoreB += 50;

    if (a.contentType === "both" || a.contentType === "audiobook") scoreA += 30;
    if (b.contentType === "both" || b.contentType === "audiobook") scoreB += 30;

    if (a.tags?.includes("classic")) scoreA += 20;
    if (b.tags?.includes("classic")) scoreB += 20;

    return scoreB - scoreA;
  });

  for (const candidate of remainingCandidates) {
    if (featuredList.length >= 100) break;
    featuredList.push(candidate);
    processedSlugs.add(candidate.slug);
  }

  console.log(`\nWriting ${featuredList.length} Top Featured Ebooks to MongoDB...`);

  let rank = 1;
  for (const item of featuredList) {
    await Story.findByIdAndUpdate(item._id, {
      isFeatured: true,
      featuredRank: rank,
    });
    const titleStr = typeof item.title === "object" ? (item.title.en || Object.values(item.title)[0]) : item.title;
    console.log(`  ⭐ [#${rank}] '${titleStr}' by ${item.author} (Slug: ${item.slug})`);
    rank++;
  }

  console.log("\n==================================================");
  console.log("🏆 TOP 100 FEATURED EBOOKS CURATION COMPLETE!");
  console.log("==================================================");
  console.log(`⭐ Total Featured Ebooks Marked: ${featuredList.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(0);
}

markTop100FeaturedEbooks().catch((err) => {
  console.error("❌ Curation Error:", err);
  process.exit(1);
});
