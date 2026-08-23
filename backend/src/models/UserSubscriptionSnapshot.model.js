"use strict";
const mongoose = require("mongoose");

const PriceSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
  },
  { _id: false }
);

const UserSubscriptionSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // RevenueCat identifiers
    rcAppUserId: { type: String, default: null, index: true },
    rcRequestDateMs: { type: Number, default: null, index: true },

    // Snapshot fields (your desired "User.subscription" shape)
    subscription: {
      isPremium: { type: Boolean, default: false, index: true },
      entitlementIds: { type: [String], default: [] },
      productIdentifier: { type: String, default: null },
      productPlanIdentifier: { type: String, default: null },
      store: { type: String, default: null }, // stripe/app_store/play_store
      expiresDate: { type: Date, default: null, index: true },
      price: { type: PriceSchema, default: null },
      managementUrl: { type: String, default: null },
    },

    // Keep a small reference to RC doc if you want
    revenueCatAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RevenueCatAccount",
      default: null,
    },
  },
  { timestamps: true }
);

// Avoid duplicate snapshots for same user+request
UserSubscriptionSnapshotSchema.index(
  { userId: 1, rcRequestDateMs: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("UserSubscriptionSnapshot", UserSubscriptionSnapshotSchema);
