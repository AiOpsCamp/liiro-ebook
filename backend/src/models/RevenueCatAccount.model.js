"use strict";
/**
 * 🔧 IMPROVED: RevenueCatAccount Model
 *
 * Stores user subscription state synced from RevenueCat.
 *
 * Key Fields:
 * - mongo_user_id (unique): Your app's user ID (indexed for fast lookup)
 * - userEmail: Denormalized email for debugging (indexed)
 * - request_date_ms: Timestamp for monotonic updates
 * - subscriber: Full RevenueCat subscriber snapshot (contains all entitlements)
 * - langowordSubscription: Normalized subscription state for app logic
 * - webhook_call_ids: Audit trail of webhook events that updated this doc
 *
 * Best Practices:
 * - Always include user ID in RevenueCat subscriber_attributes.mongo_user_id
 * - Monitor webhook_call_ids array size (consider archiving old entries)
 * - Cache this document in memory for high-traffic endpoints
 * - Archive old documents monthly to keep collection lean
 *
 * 🔧 IMPROVEMENT: Added userEmail field for better debugging
 */
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PriceSchema = new Schema(
  {
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
  },
  { _id: false, strict: true }
);

const LangowordSubscriptionSchema = new Schema(
  {
    active: { type: Boolean, default: false, index: true },
    willRenew: { type: Boolean, default: null, index: true },
    unsubscribeDetectedAt: { type: Date, default: null, index: true },

    productIdentifier: { type: String, default: null, index: true },
    productPlanIdentifier: { type: String, default: null, index: true },

    entitlementIds: { type: [String], default: [], index: true },

    expiresDate: { type: Date, default: null, index: true },

    store: { type: String, default: null, index: true },
    price: { type: PriceSchema, default: null },

    storeTransactionId: { type: String, default: null, index: true },
    isSandbox: { type: Boolean, default: null, index: true },

    managementUrl: { type: String, default: null },
  },
  { _id: false, strict: true }
);

const RevenueCatAccountSchema = new Schema(
  {
    mongo_user_id: { type: String, index: true, unique: true, required: true },

    // ✅ NEW: helps debugging
    userEmail: { type: String, index: true, default: null },

    request_date: { type: String, required: true },
    request_date_ms: { type: Number, required: true },

    subscriber: { type: Schema.Types.Mixed, required: true },

    langowordSubscription: { type: LangowordSubscriptionSchema, default: null },

    webhook_call_ids: [{ type: Schema.Types.ObjectId, ref: "RevenueCatWebhookCall", index: true }],
  },
  {
    strict: true,
    minimize: false,
    timestamps: false,
    versionKey: false,
  }
);

module.exports = model("RevenueCatAccount", RevenueCatAccountSchema);
