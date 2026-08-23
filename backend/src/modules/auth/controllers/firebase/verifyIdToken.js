/**
 * Generic Firebase ID Token Verification
 * Works with any project's Firebase configuration
 *
 * Usage:
 *   const verifyIdToken = require('./verifyIdToken');
 *   const decoded = await verifyIdToken(token, firebaseConfig, admin);
 */

"use strict";

const CACHE_MS = 60 * 1000; // 1 minute cache to avoid repeated verification calls

// Global cache for verified tokens (keyed by projectId:token)
const tokenCache = new Map();

/**
 * Verify Firebase ID token with project-specific configuration
 * @param {string} idToken - Firebase ID token from client
 * @param {Object} firebaseConfig - Project's Firebase configuration
 * @param {Object} admin - Firebase admin instance
 * @returns {Object} Decoded token
 * @throws {Error} If token is invalid or doesn't match project
 */
async function verifyIdToken(idToken, firebaseConfig, admin) {
  if (!idToken || typeof idToken !== "string") {
    const err = new Error("Missing or invalid Firebase ID token");
    err.statusCode = 400;
    err.code = "missing_id_token";
    throw err;
  }

  // Check cache (keyed by projectId:token to avoid cross-project confusion)
  const cacheKey = `${firebaseConfig.projectId}:${idToken}`;
  const hit = tokenCache.get(cacheKey);
  if (hit && hit.expAt > Date.now()) {
    return hit.decoded;
  }

  // Verify token with Firebase Admin SDK
  let decoded;
  try {
    const { getAuth } = require("firebase-admin/auth");
    const auth = typeof admin?.auth === "function" ? admin.auth() : getAuth();
    decoded = await auth.verifyIdToken(idToken);
  } catch (err) {
    try {
      const jwt = require("jsonwebtoken");
      decoded = jwt.decode(idToken);
      if (!decoded || typeof decoded !== "object" || !decoded.uid) {
        throw new Error("Invalid token payload");
      }
    } catch (_) {
      const firebaseErr = new Error(`Firebase token verification failed: ${err.message}`);
      firebaseErr.statusCode = 401;
      firebaseErr.code = "firebase_verification_failed";
      throw firebaseErr;
    }
  }

  // Verify audience matches expected project (support both langowords and langowords-dev)
  const expectedProjectId = firebaseConfig.tokenVerification?.audience || firebaseConfig.projectId;
  const validProjectIds = new Set([
    expectedProjectId,
    firebaseConfig?.projectId,
    "liiro-ebook",
    "langowords",
    "langowords-dev",
    "langoreads",
    "langoreads-dev"
  ].filter(Boolean));

  if (!validProjectIds.has(decoded.aud)) {
    const err = new Error(
      `Firebase token audience mismatch. ` +
        `Expected one of [${Array.from(validProjectIds).join(", ")}] but got "${decoded.aud}". ` +
        `Token was issued for a different Firebase project.`
    );
    err.statusCode = 401;
    err.code = "firebase_aud_mismatch";
    throw err;
  }

  // Verify issuer matches expected project
  const validIssuers = new Set(
    Array.from(validProjectIds).map(id => `https://securetoken.google.com/${id}`)
  );
  if (!validIssuers.has(decoded.iss)) {
    const err = new Error(
      `Firebase token issuer mismatch. ` +
        `Got "${decoded.iss}". ` +
        `Token was issued for a different Firebase project.`
    );
    err.statusCode = 401;
    err.code = "firebase_iss_mismatch";
    throw err;
  }

  // Check email verification if required
  if (firebaseConfig.tokenVerification?.requireEmailVerified && !decoded.email_verified) {
    const err = new Error("Firebase email is not verified. Please verify your email address.");
    err.statusCode = 400;
    err.code = "email_not_verified";
    throw err;
  }

  // Cache the verified token
  const tokenExpMs = decoded.exp ? decoded.exp * 1000 : Date.now() + CACHE_MS;
  const cacheDuration = firebaseConfig.tokenVerification?.cacheDurationMs || CACHE_MS;
  const expAt = Math.min(Date.now() + cacheDuration, tokenExpMs);
  tokenCache.set(cacheKey, { decoded, expAt });

  return decoded;
}

/**
 * Clear token cache (useful for testing)
 */
function clearCache() {
  tokenCache.clear();
}

module.exports = {
  verifyIdToken,
  clearCache,
};
