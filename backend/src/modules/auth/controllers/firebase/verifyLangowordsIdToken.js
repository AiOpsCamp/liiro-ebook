"use strict";

const admin = require("./langowords.firebaseAdmin");

const CACHE_MS = 60 * 1000; // 1 minute cache to avoid repeated verification calls
const cache = new Map(); // token -> { decoded, expAt }

async function verifyLangowordsIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    const err = new Error("Missing or invalid Firebase ID token");
    err.statusCode = 400;
    err.code = "missing_id_token";
    throw err;
  }

  // small in-memory cache
  const hit = cache.get(idToken);
  if (hit && hit.expAt > Date.now()) return hit.decoded;

  const decoded = await admin.auth().verifyIdToken(idToken);

  const expectedProjectId =
    (process.env.LANGOWORDS_FIREBASE_PROJECT_ID || "").trim() ||
    (process.env.FIREBASE_PROJECT_ID || "").trim() ||
    null;

  // audience must match Firebase project id
  if (expectedProjectId && decoded.aud !== expectedProjectId) {
    const err = new Error(
      `Firebase token audience mismatch. Expected "${expectedProjectId}" but got "${decoded.aud}".`
    );
    err.statusCode = 401;
    err.code = "firebase_aud_mismatch";
    throw err;
  }

  // issuer must match too
  if (expectedProjectId) {
    const expectedIss = `https://securetoken.google.com/${expectedProjectId}`;
    if (decoded.iss && decoded.iss !== expectedIss) {
      const err = new Error(
        `Firebase token issuer mismatch. Expected "${expectedIss}" but got "${decoded.iss}".`
      );
      err.statusCode = 401;
      err.code = "firebase_iss_mismatch";
      throw err;
    }
  }

  // store cache (do not cache longer than token expiry)
  const tokenExpMs = decoded.exp ? decoded.exp * 1000 : Date.now() + CACHE_MS;
  const expAt = Math.min(Date.now() + CACHE_MS, tokenExpMs);
  cache.set(idToken, { decoded, expAt });

  return decoded;
}

module.exports = { verifyLangowordsIdToken };
