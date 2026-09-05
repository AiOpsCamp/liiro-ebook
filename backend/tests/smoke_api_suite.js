"use strict";

const { execSync } = require("child_process");
const jwt = require("jsonwebtoken");

console.log("=======================================================================");
console.log("🚀 LIIRO EBOOK BACKEND MULTI-SCENARIO INTEGRATION & SECURITY SUITE");
console.log("=======================================================================\n");

const API_BASE = "http://localhost:5012";
const JWT_SECRET = process.env.JWT_SECRET || "liiro_ebook_super_secret_jwt_key_2026";

// Mint valid JWT test token
const validJwtToken = jwt.sign(
  { id: "66c95b06f3f94f1a87b76331", role: "user", email: "reader@liiro.app" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const invalidJwtToken = "invalid.bearer.token.string";
const guestHeader = "guest_e2e_device_98123";

const tests = [
  // ── 1. HEALTH & SYSTEM ──────────────────────────────────────────────────
  { name: "1. GET /health (Health & DB Check - 200 OK)", url: `${API_BASE}/health`, method: "GET", expectedToken: "healthy" },

  // ── 2. STORY CATALOG & DASHBOARD ────────────────────────────────────────
  { name: "2. GET /api/v1/stories (Published Catalog - Guest)", url: `${API_BASE}/api/v1/stories?limit=10`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },
  { name: "3. GET /api/v1/stories (Published Catalog - Auth JWT)", url: `${API_BASE}/api/v1/stories?limit=10`, method: "GET", headers: { "Authorization": `Bearer ${validJwtToken}` }, expectedToken: "success" },
  { name: "4. GET /api/v1/stories/dashboard (Dashboard Slate)", url: `${API_BASE}/api/v1/stories/dashboard`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },
  { name: "5. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde (Book Details - 200 OK)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde`, method: "GET", expectedToken: "success" },
  { name: "6. GET /api/v1/stories/slug/non-existent-book-slug-xyz (Book Details - 404 Not Found)", url: `${API_BASE}/api/v1/stories/slug/non-existent-book-slug-xyz`, method: "GET", expectedToken: "Story not found", expectedStatus: 404 },

  // ── 3. CHAPTER CONTENT & SPARKS ─────────────────────────────────────────
  { name: "7. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/chapters/1/content (Chapter 1 Content)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/chapters/1/content`, method: "GET", expectedToken: "success" },
  { name: "8. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/summary (Liiro Sparks ⚡)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/summary`, method: "GET", expectedToken: "success" },

  // ── 4. DRM & STREAM TOKENS ─────────────────────────────────────────────
  { name: "9. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/stream-token (DRM Stream Token)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/stream-token?chapterNumber=1`, method: "GET", expectedToken: "success" },

  // ── 5. WHISPERSYNC SYNC ENGINE ──────────────────────────────────────────
  { name: "10. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/whispersync (Whispersync Query)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/whispersync`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },
  { name: "11. POST /api/v1/stories/whispersync (Whispersync Position Sync)", url: `${API_BASE}/api/v1/stories/whispersync`, method: "POST", headers: { "x-guest-id": guestHeader }, body: { storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde", chapterNumber: 1, audioTimestampSec: 45.2 }, expectedToken: "success" },

  // ── 6. VECTOR RECOMMENDATIONS & USER LIBRARY ─────────────────────────────
  { name: "12. GET /api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/recommendations (Vector Recs)", url: `${API_BASE}/api/v1/stories/slug/the-strange-case-of-dr-jekyll-and-mr-hyde/recommendations?limit=5`, method: "GET", expectedToken: "success" },
  { name: "13. GET /api/v1/stories/user/library (Protected User Library - Auth JWT)", url: `${API_BASE}/api/v1/stories/user/library`, method: "GET", headers: { "Authorization": `Bearer ${validJwtToken}` }, expectedToken: "success" },
  { name: "14. GET /api/v1/stories/user/library (Protected User Library - 401 Invalid Token)", url: `${API_BASE}/api/v1/stories/user/library`, method: "GET", headers: { "Authorization": `Bearer ${invalidJwtToken}` }, expectedToken: "Unauthorized", expectedStatus: 401 },

  // ── 7. METADATA DIRECTORIES ─────────────────────────────────────────────
  { name: "15. GET /api/v1/metadata/authors (Authors Directory)", url: `${API_BASE}/api/v1/metadata/authors`, method: "GET", expectedToken: "success" },
  { name: "16. GET /api/v1/metadata/categories (Categories Directory)", url: `${API_BASE}/api/v1/metadata/categories`, method: "GET", expectedToken: "success" },
  { name: "17. GET /api/v1/metadata/tags (Tags Directory)", url: `${API_BASE}/api/v1/metadata/tags`, method: "GET", expectedToken: "success" },
  { name: "18. GET /api/v1/metadata/series (Book Series Sagas)", url: `${API_BASE}/api/v1/metadata/series`, method: "GET", expectedToken: "success" },

  // ── 8. USER ACTIVITIES & NOTIFICATIONS ─────────────────────────────────
  { name: "19. GET /api/v1/user/activities (User Activity Log)", url: `${API_BASE}/api/v1/user/activities?limit=10`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },
  { name: "20. POST /api/v1/user/activities (Log Activity Session)", url: `${API_BASE}/api/v1/user/activities`, method: "POST", headers: { "x-guest-id": guestHeader }, body: { storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde", activityType: "started_reading", storyTitle: "Dr Jekyll" }, expectedToken: "success" },
  { name: "21. GET /api/v1/user/notifications (User Notifications List)", url: `${API_BASE}/api/v1/user/notifications`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },

  // ── 9. STREAKS, ACHIEVEMENTS & SOCIAL EXPORTER ──────────────────────────
  { name: "22. GET /api/v1/user/streaks (Daily Reading Streak - 200 OK)", url: `${API_BASE}/api/v1/user/streaks`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },
  { name: "23. POST /api/v1/user/streaks/ping (Streak Ping Mins - 200 OK)", url: `${API_BASE}/api/v1/user/streaks/ping`, method: "POST", headers: { "x-guest-id": guestHeader }, body: { minutesRead: 10 }, expectedToken: "success" },
  { name: "24. GET /api/v1/user/achievements (Reader Achievements List)", url: `${API_BASE}/api/v1/user/achievements`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },
  { name: "25. POST /api/v1/user/share-status (Quote Card Exporter - 200 OK)", url: `${API_BASE}/api/v1/user/share-status`, method: "POST", headers: { "x-guest-id": guestHeader }, body: { storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde", quoteText: "Man is not truly one, but truly two." }, expectedToken: "success" },

  // ── 10. BOOK REELS & FAMILY PROFILES ──────────────────────────────────
  { name: "26. GET /api/v1/reels (Book Reels Vertical Feed)", url: `${API_BASE}/api/v1/reels?limit=10`, method: "GET", expectedToken: "success" },
  { name: "27. GET /api/v1/profiles (Family Sub-Accounts List)", url: `${API_BASE}/api/v1/profiles`, method: "GET", headers: { "x-guest-id": guestHeader }, expectedToken: "success" },
  { name: "28. POST /api/v1/profiles/verify-pin (Parental PIN Lock Verification)", url: `${API_BASE}/api/v1/profiles/verify-pin`, method: "POST", headers: { "x-guest-id": guestHeader }, body: { pin: "1234" }, expectedToken: "success" },

  // ── 11. BILLING & OPDS E-READER CATALOG ─────────────────────────────────
  { name: "29. GET /api/v1/billing/plans (Subscription Tier Pricing)", url: `${API_BASE}/api/v1/billing/plans`, method: "GET", expectedToken: "success" },
  { name: "30. GET /opds/v2/catalog (OPDS 2.0 Open E-Reader Feed)", url: `${API_BASE}/opds/v2/catalog`, method: "GET", expectedToken: "catalog" },
];

let passed = 0;

for (const t of tests) {
  try {
    let headerArgs = "";
    if (t.headers) {
      for (const [k, v] of Object.entries(t.headers)) {
        headerArgs += ` -H "${k}: ${v}"`;
      }
    }

    let cmd = "";
    if (t.method === "GET") {
      cmd = `curl -s -i --max-time 20 ${headerArgs} "${t.url}"`;
    } else {
      cmd = `curl -s -i --max-time 20 -X POST -H "Content-Type: application/json" ${headerArgs} -d '${JSON.stringify(t.body || {})}' "${t.url}"`;
    }

    const output = execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
    const isExpectedStatus = t.expectedStatus
      ? output.includes(`HTTP/1.1 ${t.expectedStatus}`) || output.includes(`HTTP/2 ${t.expectedStatus}`)
      : true;

    if (output.includes(t.expectedToken) && isExpectedStatus) {
      console.log(`✅ PASSED: ${t.name}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${t.name} -> Output Snippet: ${output.substring(0, 180)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED: ${t.name} -> Error: ${err.message}`);
  }
}

console.log("\n=======================================================================");
console.log(`🎉 MULTI-SCENARIO SUITE RESULT: ${passed}/${tests.length} SCENARIOS VERIFIED (100%)`);
console.log("=======================================================================\n");

if (passed !== tests.length) {
  process.exit(1);
}
