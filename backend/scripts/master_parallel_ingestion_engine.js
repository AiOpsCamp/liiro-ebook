require("dotenv").config();
const { fork, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const CATALOG_PATH = path.join(__dirname, "../data/category_repositories.json");
const INGEST_SCRIPT = path.join(__dirname, "ingest_standard_ebook.js");

function parseArgs() {
  const args = process.argv.slice(2);
  let concurrency = 8;
  let limit = 0;
  let categoryFilter = null;

  for (const arg of args) {
    if (arg.startsWith("--concurrency=")) {
      concurrency = parseInt(arg.split("=")[1], 10) || 8;
    } else if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1], 10) || 0;
    } else if (arg.startsWith("--category=")) {
      categoryFilter = arg.split("=")[1];
    }
  }

  return { concurrency, limit, categoryFilter };
}

async function runMasterParallelEngine() {
  const { concurrency, limit, categoryFilter } = parseArgs();

  console.log("=======================================================================");
  console.log("🚀 MASTER MULTI-PROCESS PARALLEL EBOOK INGESTION ENGINE");
  console.log(`   Worker Processes (Concurrency): ${concurrency}`);
  if (categoryFilter) console.log(`   Category Filter: ${categoryFilter}`);
  if (limit > 0) console.log(`   Batch Limit: ${limit} Books`);
  console.log("=======================================================================\n");

  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`❌ Catalog file not found at ${CATALOG_PATH}`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  let repoList = [];

  if (categoryFilter && catalog.categories[categoryFilter]) {
    repoList = catalog.categories[categoryFilter].repositories || [];
  } else {
    // Collect all unique repos across categories
    const set = new Set();
    for (const catKey of Object.keys(catalog.categories || {})) {
      const repos = catalog.categories[catKey].repositories || [];
      repos.forEach((r) => set.add(r));
    }
    repoList = Array.from(set);
  }

  if (limit > 0) {
    repoList = repoList.slice(0, limit);
  }

  console.log(`📚 Total Books Queued for Parallel Processing: ${repoList.length}\n`);

  let completedCount = 0;
  let failedCount = 0;
  let queueIndex = 0;

  async function worker(id) {
    while (queueIndex < repoList.length) {
      const currentIdx = queueIndex++;
      const repo = repoList[currentIdx];
      console.log(`▶️ [Worker ${id}] Launching [${currentIdx + 1}/${repoList.length}]: ${repo}`);

      await new Promise((resolve) => {
        const child = fork(INGEST_SCRIPT, [repo], { stdio: "inherit" });
        child.on("exit", (code) => {
          if (code === 0) {
            completedCount++;
            console.log(`✅ [Worker ${id}] Finished [${currentIdx + 1}/${repoList.length}]: ${repo}`);
          } else {
            failedCount++;
            console.error(`❌ [Worker ${id}] Failed [${currentIdx + 1}/${repoList.length}] (exit ${code}): ${repo}`);
          }
          resolve();
        });
      });
    }
  }

  // Launch 'concurrency' worker promises in parallel
  const workers = [];
  for (let i = 1; i <= Math.min(concurrency, repoList.length); i++) {
    workers.push(worker(i));
  }
  await Promise.all(workers);

  // Trigger Category, Author, Branding, and Series linking post-deployment
  console.log("\n=======================================================================");
  console.log("🔗 TRIGGERING AUTOMATED CATEGORY, AUTHOR & SERIES LINKING POST-DEPLOYMENT...");
  console.log("=======================================================================");

  try {
    execSync("node scripts/relink_and_clean_categories.js", { stdio: "inherit" });
    execSync("node scripts/ingest_and_link_book_series.js", { stdio: "inherit" });
    execSync("node scripts/clean_dead_series.js", { stdio: "inherit" });
    execSync("node scripts/replace_branding.js", { stdio: "inherit" });
  } catch (err) {
    console.error("Warning during post-deployment linking:", err.message);
  }

  console.log("\n=======================================================================");
  console.log("🎉 MASTER PARALLEL INGESTION COMPLETE!");
  console.log(`   Successfully Ingested: ${completedCount}/${repoList.length}`);
  console.log(`   Failed Ingestions: ${failedCount}`);
  console.log("=======================================================================");
  process.exit(0);
}

runMasterParallelEngine().catch((err) => {
  console.error("Fatal Error in Parallel Engine:", err);
  process.exit(1);
});
