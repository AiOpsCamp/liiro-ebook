"use strict";
/**
 * 🔧 IMPROVED: RevenueCatWebhookCall Model
 *
 * Audit log for all webhook events from RevenueCat.
 *
 * Key Fields:
 * - mongo_user_id (indexed): Your app's user ID
 * - userEmail (indexed): Resolved email for correlation
 * - rc_account: Reference to RevenueCatAccount document
 * - event_type: Event classification (INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.)
 * - event_timestamp_ms: When event occurred (indexed for sorting)
 * - store: Payment provider (STRIPE, APP_STORE, PLAY_STORE)
 * - product_id: Product identifier from store
 * - entitlement_ids: Premium feature access levels
 * - payload: Full webhook payload (for debugging)
 * - changes: Computed diff of subscription state before/after
 *
 * Best Practices:
 * - Archive old webhook calls monthly (>30 days old)
 * - Use changes field to understand what actually changed
 * - Monitor for duplicate event_ids (indicates replay attack or network retry)
 * - Query by rc_account + _id for paginated event history
 * - Monitor webhook processing latency (event_timestamp_ms vs createdAt)
 *
 * 🔧 IMPROVEMENTS:
 * - Added store, product_id, entitlement_ids denormalization
 * - Added composite index for fast pagination
 * - Changed timestamps to createdAt-only (updatedAt not needed)
 *
 * NOTE: This is backward-compatible:
 * - Existing documents without store/product_id/entitlement_ids still work
 * - Your controllers can still rely on `payload` if fields are missing
 */
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const RevenueCatWebhookCallSchema = new Schema(
  {
    // Soft link to your internal user lookup key (fast filter)
    mongo_user_id: { type: String, index: true, required: true },
    userEmail: { type: String, index: true, default: null },
    // Strong reference to the RevenueCatAccount document (if available)
    rc_account: { type: Schema.Types.ObjectId, ref: "RevenueCatAccount", index: true },

    // Handy denormalized fields from the webhook event
    event_id: { type: String, index: true },
    event_type: { type: String, index: true }, // e.g., "CANCELLATION", "INITIAL_PURCHASE", "RENEWAL"
    app_user_id: { type: String, index: true },
    original_app_user_id: { type: String, default: null },
    event_timestamp_ms: { type: Number, index: true },

    // ✅ OPTIONAL denormalized fields (recommended)
    store: { type: String, index: true, default: null }, // "STRIPE" | "PLAY_STORE" | "APP_STORE" etc (as sent by RC)
    product_id: { type: String, index: true, default: null }, // e.g. "yearly:yearly", "prod_..."
    entitlement_ids: { type: [String], default: [], index: true }, // e.g. ["pro"]

    // Full raw payload for auditing/debugging
    payload: { type: Schema.Types.Mixed, required: true },

    // Computed shallow diff between previously stored subscriber and the new one
    changes: { type: Schema.Types.Mixed, default: null },
  },
  {
    strict: true,
    minimize: false,
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Helpful compound index for fast pagination per RC account
RevenueCatWebhookCallSchema.index({ rc_account: 1, _id: -1 }, { name: "idx_rc_account_cursor" });

module.exports = model("RevenueCatWebhookCall", RevenueCatWebhookCallSchema);
