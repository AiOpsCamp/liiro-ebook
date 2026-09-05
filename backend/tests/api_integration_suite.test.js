"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const BASE_URL = process.env.API_URL || "http://127.0.0.1:5012";

test("Liiro Ebook Production API Test Suite", async (t) => {

  await t.test("1. System Health & APM Metrics Endpoint", async () => {
    const res = await request(BASE_URL).get("/health");
    assert.equal(res.status, 200, "Health endpoint should return 200 OK");
    assert.equal(res.body.status, "healthy", "Status should be healthy");
    assert.equal(res.body.database.connected, true, "MongoDB should be connected");
    assert.ok(typeof res.body.database.latencyMs === "number", "Latency should be a number");
    assert.ok(res.body.memory.heapUsedMb > 0, "Heap used should be greater than 0");
  });

  await t.test("2. Stories Catalog & Whispersync Endpoints", async () => {
    const res = await request(BASE_URL).get("/api/v1/stories?limit=5");
    assert.equal(res.status, 200, "Stories listing should return 200 OK");
    assert.ok(Array.isArray(res.body.data), "Stories data should be an array");
    assert.ok(res.body.data.length > 0, "Should return at least 1 story");

    const slug = "peter-and-wendy";

    // Fetch story detail (includes chapters and audio metadata)
    const detailRes = await request(BASE_URL).get(`/api/v1/stories/slug/${slug}`);
    assert.equal(detailRes.status, 200, "Story detail should return 200 OK");
    assert.equal(detailRes.body.data.slug, slug, "Slug should match");
    assert.ok(Array.isArray(detailRes.body.data.chapters), "Chapters should be an array");
    assert.ok(detailRes.body.data.chapters.length > 0, "Story should contain chapters");

    // Fetch specific chapter content & Whispersync timestamps
    const chId = detailRes.body.data.chapters[0]._id;
    const chRes = await request(BASE_URL).get(`/api/v1/stories/slug/${slug}/chapters/${chId}`);
    assert.equal(chRes.status, 200, "Chapter content endpoint should return 200 OK");
    assert.ok(chRes.body.data, "Should return chapter content");
  });

  await t.test("3. OPDS 2.0 Catalog & Publications Feed", async () => {
    const res = await request(BASE_URL).get("/opds/v2/publications");
    assert.equal(res.status, 200, "OPDS feed should return 200 OK");
    assert.ok(res.body.metadata, "OPDS should contain metadata");
    assert.ok(Array.isArray(res.body.publications), "OPDS publications should be an array");
  });

  await t.test("4. Auth Lifecycle & GDPR Account Deletion", async () => {
    const testEmail = `gdpr_test_${Date.now()}@liiro.app`;
    const testPassword = "SecurePassword2026!";

    // Register test user
    const regRes = await request(BASE_URL)
      .post("/api/v1/auth/register")
      .send({ username: "gdpr_tester", email: testEmail, password: testPassword });

    assert.equal(regRes.status, 201, "User registration should return 201 Created");
    assert.ok(regRes.body.token, "Should return JWT token");
    const token = regRes.body.token;

    // Verify /me endpoint
    const meRes = await request(BASE_URL)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(meRes.status, 200, "GET /auth/me should return 200 OK");
    assert.equal(meRes.body.data.email, testEmail, "Email should match registered email");

    // Test GDPR Right to Erasure / Account Deletion
    const delRes = await request(BASE_URL)
      .delete("/api/v1/auth/account")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(delRes.status, 200, "GDPR deletion should return 200 OK");
    assert.equal(delRes.body.success, true, "Should confirm successful erasure");

    // Verify token is no longer valid for deleted user
    const postDelRes = await request(BASE_URL)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(postDelRes.status, 404, "Deleted user should return 404 Not Found");
  });

  await t.test("5. Security: Rejection of Invalid Tokens & Unauthorized Requests", async () => {
    const res = await request(BASE_URL)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid_fake_token_12345");

    assert.equal(res.status, 401, "Invalid token should return 401 Unauthorized");
  });
});
