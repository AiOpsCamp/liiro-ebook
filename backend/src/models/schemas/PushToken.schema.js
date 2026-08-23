"use strict";
const mongoose = require("mongoose");

const PushTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, trim: true },
    deviceId: { type: String, trim: true, default: null },
    platform: { type: String, enum: ["ios", "android", "web", "unknown"], default: "unknown" },
    appVersion: { type: String, default: null },
    expoProjectId: { type: String, default: null },

    lastSeenAt: { type: Date, default: Date.now },

    disabled: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
    invalidAt: { type: Date, default: null },

    // Optional diagnostics
    lastErrorAt: { type: Date, default: null },
    lastError: { type: String, default: null },
  },
  { _id: true, timestamps: true }
);

module.exports = PushTokenSchema;
