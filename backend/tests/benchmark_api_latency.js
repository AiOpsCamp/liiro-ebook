"use strict";

const { execSync } = require("child_process");

const BASE_URL = "http://localhost:5012";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Yzk1YjA2ZjNmOTRmMWE4N2I3NjMzMSIsInJvbGUiOiJ1c2VyIiwiZW1haWwiOiJyZWFkZXJAbGlpcm8uYXBwIiwiaWF0IjoxNzg3NzY2NTcxLCJleHAiOjE3ODc3NzAxNzF9.7sFylTE3RPm_CDOej1QfJHElK8gI73POsEOxSs3DdKE";
const GUEST_ID = "guest_e2e_device_98123";

const endpoints = [
  { name: "GET /health", url: `${BASE_URL}/health` },
  { name: "GET /api/v1/stories", url: `${BASE_URL}/api/v1/stories?limit=10` },
  { name: "GET /api/v1/stories/dashboard", url: `${BASE_URL}/api/v1/stories/dashboard`, headers: { "x-guest-id": GUEST_ID } },
  { name: "GET /api/v1/stories/slug/dracula", url: `${BASE_URL}/api/v1/stories/slug/dracula` },
  { name: "GET /api/v1/stories/slug/dracula/chapters/1/content", url: `${BASE_URL}/api/v1/stories/slug/dracula/chapters/1/content` },
  { name: "GET /api/v1/stories/slug/dracula/summary", url: `${BASE_URL}/api/v1/stories/slug/dracula/summary` },
  { name: "GET /api/v1/stories/slug/dracula/stream-token", url: `${BASE_URL}/api/v1/stories/slug/dracula/stream-token?chapterNumber=1` },
  { name: "GET /api/v1/stories/slug/dracula/whispersync", url: `${BASE_URL}/api/v1/stories/slug/dracula/whispersync`, headers: { "x-guest-id": GUEST_ID } },
  { name: "GET /api/v1/stories/slug/dracula/recommendations", url: `${BASE_URL}/api/v1/stories/slug/dracula/recommendations?limit=5` },
  { name: "GET /api/v1/stories/user/library", url: `${BASE_URL}/api/v1/stories/user/library`, headers: { Authorization: AUTH_TOKEN } },
  { name: "GET /api/v1/metadata/authors", url: `${BASE_URL}/api/v1/metadata/authors` },
  { name: "GET /api/v1/metadata/categories", url: `${BASE_URL}/api/v1/metadata/categories` },
  { name: "GET /api/v1/metadata/tags", url: `${BASE_URL}/api/v1/metadata/tags` },
  { name: "GET /api/v1/metadata/series", url: `${BASE_URL}/api/v1/metadata/series` },
  { name: "GET /api/v1/user/activities", url: `${BASE_URL}/api/v1/user/activities?limit=10`, headers: { "x-guest-id": GUEST_ID } },
  { name: "GET /api/v1/user/notifications", url: `${BASE_URL}/api/v1/user/notifications`, headers: { "x-guest-id": GUEST_ID } },
  { name: "GET /api/v1/user/streaks", url: `${BASE_URL}/api/v1/user/streaks`, headers: { "x-guest-id": GUEST_ID } },
  { name: "GET /api/v1/user/achievements", url: `${BASE_URL}/api/v1/user/achievements`, headers: { "x-guest-id": GUEST_ID } },
  { name: "GET /api/v1/reels", url: `${BASE_URL}/api/v1/reels?limit=10` },
  { name: "GET /api/v1/profiles", url: `${BASE_URL}/api/v1/profiles`, headers: { "x-guest-id": GUEST_ID } },
  { name: "GET /api/v1/billing/plans", url: `${BASE_URL}/api/v1/billing/plans` },
  { name: "GET /opds/v2/catalog", url: `${BASE_URL}/opds/v2/catalog` },
];

async function runBenchmark() {
  console.log("=======================================================================");
  console.log("⚡ LIIRO EBOOK API RESPONSE TIME LATENCY BENCHMARK");
  console.log("=======================================================================");

  const results = [];

  for (const ep of endpoints) {
    let headerStr = "";
    if (ep.headers) {
      for (const [k, v] of Object.entries(ep.headers)) {
        headerStr += `-H "${k}: ${v}" `;
      }
    }

    const cmd = `curl -s -w "%{time_total}" -o /dev/null ${headerStr} "${ep.url}"`;
    try {
      const timeSecStr = execSync(cmd).toString().trim();
      const timeMs = Math.round(parseFloat(timeSecStr) * 1000);
      const status = timeMs < 50 ? "🟢 BLAZING" : timeMs < 200 ? "🟡 MODERATE" : "🔴 SLOW";
      results.push({ name: ep.name, latencyMs: timeMs, status });
      console.log(`${status} ${ep.name} -> ${timeMs} ms`);
    } catch (e) {
      console.error(`❌ FAILED ${ep.name}:`, e.message);
    }
  }

  console.log("=======================================================================");
  const avgMs = Math.round(results.reduce((a, b) => a + b.latencyMs, 0) / results.length);
  console.log(`📊 AVERAGE LATENCY ACROSS ${results.length} ENDPOINTS: ${avgMs} ms`);
  console.log("=======================================================================");
}

runBenchmark().catch(console.error);
