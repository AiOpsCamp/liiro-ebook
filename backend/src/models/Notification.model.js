"use strict";

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // classification
    type: { type: String, required: true, index: true }, // e.g. "campaign", "system", "level-change"
    title: { type: String, default: "" },
    body: { type: String, required: true },

    // extra payload for client
    data: { type: Schema.Types.Mixed, default: undefined },
    link: { type: String, default: "" },

    // source tracking
    source: { type: String, default: "system", index: true }, // "system" | "admin" | "campaign"
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "NotificationCampaign",
      default: null,
      index: true,
    },

    // read / archive
    readAt: { type: Date, default: null, index: true },
    archivedAt: { type: Date, default: null, index: true },

    // idempotency (prevents duplicates on retries)
    dedupeKey: { type: String, default: null },
  },
  { timestamps: true }
);

// Efficient listing: newest first by _id, per user, excluding archived
NotificationSchema.index({ user: 1, archivedAt: 1, _id: -1 });

// Efficient unread query
NotificationSchema.index({ user: 1, archivedAt: 1, readAt: 1, _id: -1 });

// Dedupe: allow multiple notifications without dedupeKey, but enforce uniqueness when provided
NotificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });

// Retention (TTL): delete old notifications after N days (default 180)
// IMPORTANT: TTL deletes documents permanently. Choose value carefully.
const days = Number(process.env.NOTIFICATIONS_TTL_DAYS || 180);
if (Number.isFinite(days) && days > 0) {
  NotificationSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: Math.floor(days * 24 * 60 * 60) }
  );
}

module.exports = model("Notification", NotificationSchema);
