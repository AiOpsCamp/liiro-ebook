"use strict";

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const NotificationCampaignRunSchema = new Schema(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "NotificationCampaign",
      required: true,
      index: true,
    },

    channel: { type: String, enum: ["expo_push"], default: "expo_push", index: true },

    // who/what triggered this run
    triggeredBy: { type: String, enum: ["admin", "scheduler"], default: "admin", index: true },
    executedBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    // snapshot of what was actually sent (campaign fields + overrides applied)
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: ["created", "sending", "sent", "partial", "failed"],
      default: "created",
      index: true,
    },

    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },

    // metrics
    resolvedUsersCount: { type: Number, default: 0, min: 0 },
    requestedTokensCount: { type: Number, default: 0, min: 0 },
    validTokensCount: { type: Number, default: 0, min: 0 },
    invalidTokensCount: { type: Number, default: 0, min: 0 },

    expoTicketsCount: { type: Number, default: 0, min: 0 },
    expoReceiptIdsCount: { type: Number, default: 0, min: 0 },

    sampleInvalidTokens: { type: [String], default: [] },
    sampleReceiptIds: { type: [String], default: [] },

    errorMessage: { type: String, default: null },
    errorStack: { type: String, default: null },
  },
  { timestamps: true }
);

NotificationCampaignRunSchema.index({ createdAt: -1 });
NotificationCampaignRunSchema.index({ campaign: 1, createdAt: -1 });

module.exports = model("NotificationCampaignRun", NotificationCampaignRunSchema);
