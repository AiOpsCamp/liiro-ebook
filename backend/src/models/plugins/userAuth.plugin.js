"use strict";
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports = function userAuthPlugin(schema) {
  schema.methods.matchPasswords = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  /**
   * Issues a short-lived access token + long-lived refresh token,
   * stores a SHA-256 hash of the refresh token in the RefreshToken collection
   * for per-session revocation, and sets httpOnly cookies.
   *
   * @param {import("express").Response} res
   * @param {{ ip?: string, userAgent?: string }} [ctx]
   * @returns {{ accessToken: string, refreshToken: string }}
   */
  schema.methods.getSignedJwtToken = async function (res, ctx = {}) {
    const RefreshToken = require("mongoose").model("RefreshToken");

    const payload = {
      id: this._id,
      role: this.role,
      emailVerified: this.emailVerified,
    };

    // Access token: long-lived since frontend lacks refresh logic.
    const accessTokenTtl = process.env.JWT_ACCESS_TTL || "365d";
    // Refresh token: long-lived
    const refreshTokenTtl = process.env.JWT_REFRESH_TTL || "365d";

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: accessTokenTtl,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: refreshTokenTtl,
    });

    // Store hash of the refresh token for revocation lookup
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const refreshTtlMs = parseTtlToMs(refreshTokenTtl);
    await RefreshToken.create({
      user: this._id,
      tokenHash,
      expiresAt: new Date(Date.now() + refreshTtlMs),
      ip: ctx.ip || null,
      userAgent: ctx.userAgent || null,
    });

    const isProd = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    const sameSite = isProd ? "none" : "lax";
    const secure = isProd;

    const baseCookieOpts = { httpOnly: true, secure, sameSite, domain: cookieDomain, path: "/" };

    res.cookie("refreshToken", refreshToken, {
      ...baseCookieOpts,
      maxAge: refreshTtlMs,
    });

    // Short-lived access token cookie mirrors the JWT TTL
    const accessTtlMs = parseTtlToMs(accessTokenTtl);
    res.cookie("jwt", accessToken, {
      ...baseCookieOpts,
      maxAge: accessTtlMs,
    });

    return { accessToken, refreshToken };
  };
};

// Convert a jsonwebtoken expiresIn string (e.g. "15m", "30d") to milliseconds.
function parseTtlToMs(ttl) {
  if (typeof ttl === "number") return ttl * 1000;
  const match = String(ttl).match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // fallback 30d
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60 * 1000;
  if (unit === "h") return n * 60 * 60 * 1000;
  if (unit === "d") return n * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
}
