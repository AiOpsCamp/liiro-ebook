"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Price info from RevenueCat when available on /v1/subscribers
 */
const RevenueCatPriceSchema = new Schema(
  {
    amount: { type: Number }, // e.g., 4.99
    currency: { type: String, trim: true }, // e.g., "USD"
  },
  { _id: false }
);

/**
 * One subscription per productIdentifier (e.g., "monthly_langowords")
 */
const RevenueCatSubscriptionSchema = new Schema(
  {
    productIdentifier: { type: String, required: true, index: true }, // "monthly_langowords"
    productPlanIdentifier: { type: String, trim: true }, // "monthly-plan"

    store: {
      type: String,
      enum: ["play_store", "app_store", "stripe", "promotional", "amazon"],
    },
    displayName: { type: String },

    isSandbox: { type: Boolean, default: false },

    // Lifecycle
    purchaseDate: { type: Date },
    originalPurchaseDate: { type: Date },
    expiresDate: { type: Date },
    gracePeriodExpiresDate: { type: Date },

    // Renewal / cancellation
    unsubscribeDetectedAt: { type: Date },
    billingIssuesDetectedAt: { type: Date },
    autoResumeDate: { type: Date },

    // Commerce details
    storeTransactionId: { type: String, index: true, sparse: true },
    managementUrl: { type: String, trim: true },
    price: { type: RevenueCatPriceSchema },

    // Convenience flags (computed on ingest)
    isActive: { type: Boolean, default: false },
    willRenew: { type: Boolean, default: false },
    refundedAt: { type: Date },

    periodType: {
      type: String,
      enum: ["normal", "trial", "intro", "prepaid"],
      default: "normal",
    },
  },
  { _id: false }
);

/**
 * One entitlement per identifier (e.g., "pro", "1 Month Subscription")
 */
const RevenueCatEntitlementSchema = new Schema(
  {
    identifier: { type: String, required: true, index: true }, // "pro"
    productIdentifier: { type: String, required: true }, // "monthly_langowords"
    productPlanIdentifier: { type: String },
    purchaseDate: { type: Date },
    expiresDate: { type: Date },
    gracePeriodExpiresDate: { type: Date },

    // Convenience
    isActive: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Optional: keep compact audit snapshots to help debug
 */
const RevenueCatSnapshotSchema = new Schema(
  {
    requestDate: { type: Date },
    source: { type: String, enum: ["client", "server", "webhook"], default: "server" },
    payload: { type: Schema.Types.Mixed }, // keep small!
  },
  { timestamps: true }
);

/**
 * (Legacy) Top-level container embedded in User — kept for compatibility
 * Not used in the new approach, but exported so older code won't break.
 */
const RevenueCatContainerSchema = new Schema(
  {
    // Identity / bookkeeping
    appUserId: { type: String, index: true, sparse: true }, // original_app_user_id
    firstSeen: { type: Date },
    lastSeen: { type: Date },
    managementUrl: { type: String },

    // Collections (arrays for validation + indexing)
    subscriptions: [RevenueCatSubscriptionSchema],
    entitlements: [RevenueCatEntitlementSchema],

    // Denormalized quick-look fields
    hasActiveEntitlement: { type: Boolean, default: false },
    activeEntitlementIds: [{ type: String }], // e.g., ["pro"]
    latestExpirationDate: { type: Date },

    // Optional snapshots
    snapshots: [RevenueCatSnapshotSchema],
  },
  { _id: false }
);

module.exports = {
  RevenueCatContainerSchema,
  RevenueCatSubscriptionSchema,
  RevenueCatEntitlementSchema,
  RevenueCatSnapshotSchema,
};
