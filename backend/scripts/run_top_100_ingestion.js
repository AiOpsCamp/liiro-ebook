const { execSync } = require("child_process");

// Exact Standard Ebooks repos for the Top 100 Launch Catalog
const top100Repos = [
  // Gothic & Horror
  "charlotte-perkins-gilman_short-fiction",
  "charlotte-bronte_jane-eyre",
  "emily-bronte_wuthering-heights",
  "gaston-leroux_the-phantom-of-the-opera_alexander-teixeira-de-mattos",
  "washington-irving_the-legend-of-sleepy-hollow",
  "sheridan-le-fanu_carmilla",
  "henry-james_the-turn-of-the-screw",
  "nathaniel-hawthorne_the-house-of-the-seven-gables",
  "charlotte-bronte_villette",
  "anne-bronte_the-tenant-of-wildfell-hall",

  // Sci-Fi & Speculative
  "jules-verne_twenty-thousand-leagues-under-the-seas_f-p-walter",
  "jules-verne_around-the-world-in-eighty-days_george-makepeace-towle",
  "jules-verne_journey-to-the-center-of-the-earth_f-p-walter",
  "edgar-rice-burroughs_a-princess-of-mars",
  "edgar-rice-burroughs_the-gods-of-mars",
  "h-g-wells_the-first-men-in-the-moon",
  "edward-bellamy_looking-backward-2000-1887",
  "william-morris_news-from-nowhere",
  "h-g-wells_the-food-of-the-gods-and-how-it-came-to-earth",
  "charlotte-perkins-gilman_herland",
  "edwin-a-abbott_flatland",

  // Mystery & Detective
  "arthur-conan-doyle_the-hound-of-the-baskervilles",
  "arthur-conan-doyle_a-study-in-scarlet",
  "arthur-conan-doyle_the-sign-of-the-four",
  "arthur-conan-doyle_the-memoirs-of-sherlock-holmes",
  "arthur-conan-doyle_the-return-of-sherlock-holmes",
  "wilkie-collins_the-moonstone",
  "wilkie-collins_the-woman-in-white",
  "charles-dickens_the-mystery-of-edwin-drood",
  "maurice-leblanc_the-extraordinary-adventures-of-arsene-lupin-gentleman-burglar_george-morehead",
  "g-k-chesterton_the-innocence-of-father-brown",
  "g-k-chesterton_the-wisdom-of-father-brown",
  "erskine-childers_the-riddle-of-the-sands",
  "john-buchan_the-thirty-nine-steps",

  // Adventure & Exploration
  "jack-london_white-fang",
  "herman-melville_moby-dick",
  "alexandre-dumas_the-count-of-monte-cristo_anonymous",
  "alexandre-dumas_the-three-musketeers_ediam-robson",
  "alexandre-dumas_twenty-years-after",
  "mark-twain_the-adventures-of-tom-sawyer",
  "mark-twain_the-adventures-of-huckleberry-finn",
  "daniel-defoe_the-life-and-adventures-of-robinson-crusoe",
  "h-rider-haggard_king-solomons-mines",
  "h-rider-haggard_she",
  "edgar-rice-burroughs_tarzan-of-the-apes",
  "jack-london_the-sea-wolf",
  "robert-louis-stevenson_kidnapped",

  // Romance & Society
  "jane-austen_sense-and-sensibility",
  "jane-austen_emma",
  "jane-austen_mansfield-park",
  "jane-austen_northanger-abbey",
  "jane-austen_persuasion",
  "louisa-may-alcott_little-women",
  "leo-tolstoy_anna-karenina_constance-garnett",
  "gustave-flaubert_madame-bovary_eleanor-marx-aveling",
  "edith-wharton_the-age-of-innocence",
  "edith-wharton_the-house-of-mirth",
  "thomas-hardy_far-from-the-madding-crowd",
  "thomas-hardy_tess-of-the-durbervilles",
  "nathaniel-hawthorne_the-scarlet-letter",

  // World Masterworks & Philosophy
  "franz-kafka_the-metamorphosis_david-wyllie",
  "fyodor-dostoevsky_crime-and-punishment_constance-garnett",
  "fyodor-dostoevsky_the-brothers-karamazov_constance-garnett",
  "victor-hugo_les-miserables_isabel-f-hapgood",
  "charles-dickens_a-tale-of-two-cities",
  "charles-dickens_great-expectations",
  "homer_the-odyssey_samuel-butler",
  "homer_the-iliad_samuel-butler",
  "marcus-aurelius_meditations_george-long",
  "plato_the-republic_benjamin-jowett",
  "friedrich-nietzsche_beyond-good-and-evil_helen-zimmern",
  "sun-tzu_the-art-of-war_lionel-giles",
  "niccolo-machiavelli_the-prince_w-k-marriott",
  "joseph-conrad_heart-of-darkness",

  // Fantasy & Children
  "l-frank-baum_the-wonderful-wizard-of-oz",
  "j-m-barrie_peter-and-wendy",
  "frances-hodgson-burnett_the-secret-garden",
  "frances-hodgson-burnett_a-little-princess",
  "kenneth-grahame_the-wind-in-the-willows",
  "brothers-grimm_grimms-fairy-tales_edgar-taylor_marian-edwardes",
  "hans-christian-andersen_fairy-tales_h-p-paull"
];

console.log("=======================================================================");
console.log(`🚀 STARTING MASTER LAUNCH BATCH INGESTION FOR ${top100Repos.length} EBOOKS`);
console.log("   Target Database: Hetzner Production MongoDB (liiro_prod)");
console.log("   CDN Target: Hetzner S3 (multicamp-prod-storage)");
console.log("=======================================================================\n");

let success = 0;
let failed = 0;

for (let i = 0; i < top100Repos.length; i++) {
  const repo = top100Repos[i];
  console.log(`\n-------------------------------------------------------`);
  console.log(`🚀 [${i + 1}/${top100Repos.length}] INGESTING REPO: ${repo}`);
  console.log(`-------------------------------------------------------`);

  try {
    execSync(`node scripts/ingest_standard_ebook.js "${repo}"`, { stdio: "inherit" });
    success++;
  } catch (err) {
    console.error(`⚠️ Notice for "${repo}":`, err.message);
    failed++;
  }
}

console.log("\n=======================================================================");
console.log("🎉 MASTER LAUNCH BATCH INGESTION COMPLETE!");
console.log(`   Total Success: ${success} Books`);
console.log(`   Total Failed/Notice: ${failed} Books`);
console.log("=======================================================================");
