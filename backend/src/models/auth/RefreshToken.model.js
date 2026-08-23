"use strict";

const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // SHA-256 hex of the raw refresh token — never store the token itself
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date, default: null },
    // optional context for future device-management UI
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ user: 1, revokedAt: 1 });

// Revoke a single token by its raw value
RefreshTokenSchema.statics.revokeByRaw = async function (rawToken) {
  if (!rawToken) return;
  const hash = require("crypto").createHash("sha256").update(rawToken).digest("hex");
  await this.updateOne({ tokenHash: hash, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

// Revoke all active tokens for a user
RefreshTokenSchema.statics.revokeAllForUser = async function (userId) {
  await this.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
