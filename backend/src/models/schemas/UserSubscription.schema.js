"use strict";
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * RevenueCat-derived subscription mirror stored on User for quick reads.
 * RevenueCatAccount remains the source of truth.
 *
 * NOTE: cancelAtPeriodEnd/currentPeriodEnd/cancellationScheduledAt are UI hints.
 * They do NOT control entitlements; RevenueCat does.
 */
const UserSubscriptionSchema = new Schema(
  {
    isPremium: { type: Boolean, default: false, index: true },
    entitlementIds: { type: [String], default: [] },
    productIdentifier: { type: String, default: null },
    productPlanIdentifier: { type: String, default: null },
    store: { type: String, default: null }, // "stripe" | "app_store" | "play_store"
    expiresDate: { type: Date, default: null, index: true },
    price: {
      amount: { type: Number, default: null },
      currency: { type: String, default: null },
    },
    managementUrl: { type: String, default: null },

    // ✅ Stripe cancellation UI hint (NOT source of truth)
    cancelAtPeriodEnd: { type: Boolean, default: false },
    currentPeriodEnd: { type: Date, default: null },
    cancellationScheduledAt: { type: Date, default: null },
  },
  { _id: false }
);

module.exports = UserSubscriptionSchema;
