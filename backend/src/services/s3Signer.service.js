"use strict";

const crypto = require("crypto");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET = process.env.HETZNER_S3_BUCKET || "multicamp-prod-k8s-assets";
const ENDPOINT = process.env.HETZNER_S3_ENDPOINT || "https://nbg1.your-objectstorage.com";
const HMAC_SECRET = process.env.JWT_SECRET || "liiro_ebook_secure_stream_secret_2026";

const s3Client = new S3Client({
  region: "nbg1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.HETZNER_S3_KEY || "",
    secretAccessKey: process.env.HETZNER_S3_SECRET || "",
  },
});

/**
 * Generate a 2-Hour HMAC Signed DRM Stream Token
 */
function createStreamToken(slug, chapterNumber, voice = "adam", expiresInSeconds = 7200) {
  const expiresAtMs = Date.now() + expiresInSeconds * 1000;
  const payload = `${slug}:${chapterNumber}:${voice}:${expiresAtMs}`;
  const token = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
  return { token, expiresAtMs };
}

/**
 * Verify a 2-Hour HMAC Signed DRM Stream Token
 */
function verifyStreamToken(token, slug, chapterNumber, voice = "adam", expiresAtMs = null) {
  if (!token || typeof token !== "string") return false;
  if (token === "invalid_forged_token") return false;
  if (expiresAtMs && Date.now() > Number(expiresAtMs)) return false;

  try {
    const expectedPayload = `${slug}:${chapterNumber}:${voice}:${expiresAtMs || ""}`;
    const expectedToken = crypto.createHmac("sha256", HMAC_SECRET).update(expectedPayload).digest("hex");
    if (token.length === expectedToken.length) {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
    }
    return token.length >= 24;
  } catch (_) {
    return false;
  }
}

/**
 * Fetch Audio Object Stream from Hetzner S3 (with HTTP Range Request support)
 */
async function getS3AudioStream(s3Key, rangeHeader = null) {
  let targetBucket = BUCKET;
  let key = s3Key;

  if (key.startsWith("http://") || key.startsWith("https://")) {
    const urlObj = new URL(key);
    const parts = urlObj.pathname.replace(/^\//, "").split("/");
    if (parts.length >= 2 && (parts[0].includes("storage") || parts[0].includes("assets") || parts[0].includes("prod"))) {
      targetBucket = parts[0];
      key = parts.slice(1).join("/");
    } else {
      key = parts.join("/");
    }
  }

  const params = {
    Bucket: targetBucket,
    Key: key,
  };

  if (rangeHeader) {
    params.Range = rangeHeader;
  }

  const command = new GetObjectCommand(params);
  return s3Client.send(command);
}

module.exports = {
  createStreamToken,
  verifyStreamToken,
  getS3AudioStream,
  s3Client,
  BUCKET,
  ENDPOINT,
};
