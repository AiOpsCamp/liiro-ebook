"use strict";

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

/* -------------------------------------------------------------------------- */
/*                                  Subschemas                                */
/* -------------------------------------------------------------------------- */

const TargetingSchema = new Schema(
  {
    roles: [{ type: String, enum: ["admin", "moderator", "premiumUser", "freeUser"] }],
    includeFreeUsers: { type: Boolean, default: false },
    includePremiumUsers: { type: Boolean, default: false },

    createdWithinDays: { type: Number, default: undefined },
    createdBeforeDays: { type: Number, default: undefined },

    lastLoginWithinDays: { type: Number, default: undefined },
    lastLoginBeforeDays: { type: Number, default: undefined },

    onlyActiveUsers: { type: Boolean, default: false },
    emailVerifiedOnly: { type: Boolean, default: false },
    onboardingCompletedOnly: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * New audience format used by your controller resolveAudience()
 * allowed: broadcast|users|user|single
 */
const AudienceSchema = new Schema(
  {
    target: { type: String, enum: ["broadcast", "users", "user", "single"], default: "broadcast" },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
    userIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expoPushToken: { type: String, default: undefined },
  },
  { _id: false }
);

const TokenPolicySchema = new Schema(
  {
    includeLegacy: { type: Boolean, default: true },
    requireNotDisabled: { type: Boolean, default: true },
    requireNotRevoked: { type: Boolean, default: true },
    requireNotInvalid: { type: Boolean, default: true },
  },
  { _id: false }
);

const LegacyStatsSchema = new Schema(
  {
    totalTokens: { type: Number, default: 0 },
    chunks: { type: Number, default: 0 },
    expoErrors: { type: Number, default: 0 },
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/*                                   Main schema                              */
/* -------------------------------------------------------------------------- */

const NotificationCampaignSchema = new Schema(
  {
    channel: { type: String, enum: ["expo_push"], default: "expo_push", index: true },

    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, default: undefined },

    // Expo options
    sound: { type: String, default: "default" },
    ttl: { type: Number, default: undefined },
    priority: { type: String, enum: ["default", "normal", "high"], default: "high" },
    channelId: { type: String, default: undefined },

    // NEW system fields (used by your controller)
    audience: { type: AudienceSchema, default: () => ({ target: "broadcast" }) },
    tokenPolicy: { type: TokenPolicySchema, default: () => ({}) },

    // Legacy targeting (keep for compatibility / UI)
    targeting: { type: TargetingSchema, default: () => ({}) },

    status: {
      type: String,
      // ✅ MUST include "partial" + "sending" + "scheduled" used by refined workflow
      enum: ["draft", "scheduled", "sending", "sent", "failed", "partial", "canceled"],
      default: "draft",
      index: true,
    },

    // Scheduling
    scheduledAt: { type: Date, default: undefined, index: true },

    // Send timestamps
    sentAt: { type: Date, default: undefined },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Legacy stats
    stats: { type: LegacyStatsSchema, default: () => ({}) },

    // New stats from controller
    resolvedUsersCount: { type: Number, default: 0 },
    requestedTokensCount: { type: Number, default: 0 },
    validTokensCount: { type: Number, default: 0 },
    invalidTokensCount: { type: Number, default: 0 },
    sampleInvalidTokens: [{ type: String }],

    expoTicketsCount: { type: Number, default: 0 },
    expoReceiptIdsCount: { type: Number, default: 0 },
    sampleReceiptIds: [{ type: String }],

    deviceNotRegisteredCount: { type: Number, default: 0 },
    messageTooBigCount: { type: Number, default: 0 },
    otherReceiptErrorCount: { type: Number, default: 0 },

    lastError: { type: String, default: undefined }, // legacy
    errorMessage: { type: String, default: null },
    errorStack: { type: String, default: null },
  },
  { timestamps: true }
);

NotificationCampaignSchema.index({ createdAt: -1 });
NotificationCampaignSchema.index({ status: 1, scheduledAt: 1 });

module.exports = model("NotificationCampaign", NotificationCampaignSchema);
