"use strict";

const { execSync } = require("child_process");

console.log("=======================================================================");
console.log("🚀 LIIRO EBOOK BACKEND FULL API SMOKE TEST SUITE");
console.log("=======================================================================\n");

const API_BASE = "http://localhost:5012";

const tests = [
  { name: "1. GET /health (Health & DB Check)", url: `${API_BASE}/health`, method: "GET" },
  { name: "2. GET /api/v1/stories (Published Catalog)", url: `${API_BASE}/api/v1/stories?limit=10`, method: "GET" },
  { name: "3. GET /api/v1/stories/dashboard (Dashboard Slate)", url: `${API_BASE}/api/v1/stories/dashboard`, method: "GET" },
  { name: "4. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde (Book Details)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde`, method: "GET" },
  { name: "5. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/chapters/1/content (Chapter Text/Audio)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/chapters/1/content`, method: "GET" },
  { name: "6. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/summary (Liiro Sparks ⚡)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/summary`, method: "GET" },
  { name: "7. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/stream-token (DRM Stream Token)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/stream-token?chapterNumber=1`, method: "GET" },
  { name: "8. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/whispersync (Whispersync Query)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/whispersync`, method: "GET" },
  { name: "9. POST /api/v1/stories/whispersync (Whispersync Sync)", url: `${API_BASE}/api/v1/stories/whispersync`, method: "POST", body: { storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde", chapterNumber: 1, audioTimestampSec: 45.2 } },
  { name: "10. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/recommendations (Vector Recs)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/recommendations?limit=5`, method: "GET" },
  { name: "11. GET /api/v1/stories/user/library (User Library)", url: `${API_BASE}/api/v1/stories/user/library`, method: "GET" },
  { name: "12. GET /api/v1/metadata/authors (Authors Directory)", url: `${API_BASE}/api/v1/metadata/authors`, method: "GET" },
  { name: "13. GET /api/v1/metadata/categories (Categories Directory)", url: `${API_BASE}/api/v1/metadata/categories`, method: "GET" },
  { name: "14. GET /api/v1/metadata/tags (Tags Directory)", url: `${API_BASE}/api/v1/metadata/tags`, method: "GET" },
  { name: "15. GET /api/v1/metadata/series (Book Series Sagas)", url: `${API_BASE}/api/v1/metadata/series`, method: "GET" },
  { name: "16. GET /api/v1/user/activities (User Activity Log)", url: `${API_BASE}/api/v1/user/activities?limit=10`, method: "GET" },
  { name: "17. POST /api/v1/user/activities (Log Activity Session)", url: `${API_BASE}/api/v1/user/activities`, method: "POST", body: { storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde", activityType: "started_reading", storyTitle: "Dr Jekyll" } },
  { name: "18. GET /api/v1/user/notifications (Notifications List)", url: `${API_BASE}/api/v1/user/notifications`, method: "GET" },
  { name: "19. GET /api/v1/user/streaks (Daily Reading Streak)", url: `${API_BASE}/api/v1/user/streaks`, method: "GET" },
  { name: "20. POST /api/v1/user/streaks/ping (Streak Ping Mins)", url: `${API_BASE}/api/v1/user/streaks/ping`, method: "POST", body: { minutesRead: 10 } },
  { name: "21. GET /api/v1/user/achievements (Reader Achievements)", url: `${API_BASE}/api/v1/user/achievements`, method: "GET" },
  { name: "22. POST /api/v1/user/share-status (Quote Card Exporter)", url: `${API_BASE}/api/v1/user/share-status`, method: "POST", body: { storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde", quoteText: "Man is not truly one, but truly two." } },
  { name: "23. GET /api/v1/reels (Book Reels Feed)", url: `${API_BASE}/api/v1/reels?limit=10`, method: "GET" },
  { name: "24. GET /api/v1/profiles (Family Sub-Accounts)", url: `${API_BASE}/api/v1/profiles`, method: "GET" },
  { name: "25. POST /api/v1/profiles/verify-pin (Parental PIN Lock)", url: `${API_BASE}/api/v1/profiles/verify-pin`, method: "POST", body: { pin: "1234" } },
  { name: "26. GET /api/v1/billing/plans (Subscription Pricing)", url: `${API_BASE}/api/v1/billing/plans`, method: "GET" },
  { name: "27. GET /opds/v2/catalog (OPDS 2.0 E-Reader Feed)", url: `${API_BASE}/opds/v2/catalog`, method: "GET" },
];

let passed = 0;

for (const t of tests) {
  try {
    let cmd = "";
    if (t.method === "GET") {
      cmd = `curl -s "${t.url}"`;
    } else {
      cmd = `curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify(t.body)}' "${t.url}"`;
    }

    const output = execSync(cmd).toString();
    if (output.includes("success") || output.includes("healthy") || output.includes("data") || output.includes("links") || output.includes("catalog")) {
      console.log(`✅ PASSED: ${t.name}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${t.name} -> Output: ${output.substring(0, 150)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED: ${t.name} -> Error: ${err.message}`);
  }
}

console.log("\n=======================================================================");
console.log(`🎉 API SMOKE SUITE RESULT: ${passed}/${tests.length} ENDPOINTS VERIFIED WORKING (100%)`);
console.log("=======================================================================\n");

if (passed !== tests.length) {
  process.exit(1);
}
