"use strict";

const crypto = require("crypto");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET = process.env.HETZNER_S3_BUCKET || "multicamp-prod-storage";
const ENDPOINT = process.env.HETZNER_S3_ENDPOINT || "https://nbg1.your-objectstorage.com";
const HMAC_SECRET = process.env.JWT_SECRET || "liiro_ebook_secure_stream_secret_2026";

const s3Client = new S3Client({
  region: "nbg1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.HETZNER_S3_KEY || "KVFSGG7GLKG95GYEJOE3",
    secretAccessKey: process.env.HETZNER_S3_SECRET || "DsaLlvMswIAzVx93FjkvaUyfsqUrzatR8kF1SrGK",
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
function verifyStreamToken(slug, chapterNumber, voice, token, expiresAtMs) {
  if (!token || !expiresAtMs) return false;
  if (Date.now() > Number(expiresAtMs)) return false;

  const expectedPayload = `${slug}:${chapterNumber}:${voice}:${expiresAtMs}`;
  const expectedToken = crypto.createHmac("sha256", HMAC_SECRET).update(expectedPayload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
  } catch (_) {
    return false;
  }
}

/**
 * Fetch Audio Object Stream from Hetzner S3 (with HTTP Range Request support)
 */
async function getS3AudioStream(s3Key, rangeHeader = null) {
  let key = s3Key;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    const urlObj = new URL(key);
    key = urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
    if (key.startsWith(`${BUCKET}/`)) {
      key = key.substring(BUCKET.length + 1);
    }
  }

  const params = {
    Bucket: BUCKET,
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
