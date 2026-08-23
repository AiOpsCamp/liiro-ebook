"use strict";
/**
 * 🔧 IMPROVED: StoreOffering Model
 *
 * Product catalog definition for in-app purchases across all platforms.
 * Links your billing system to app store pricing and RevenueCat offerings.
 *
 * Key Fields:
 * - key (unique, indexed): Stable product ID (e.g., "premium_yearly")
 * - title: Display name for UI
 * - features: List of features included (e.g., ["unlimited_content", "offline_mode"])
 * - active: Enable/disable offering without deletion
 *
 * Store Mappings:
 * - stripe: Web billing (productId, priceId for Stripe API lookups)
 * - apple: iOS via StoreKit (productId)
 * - google: Android via Play Billing (productId, basePlanId, offerId)
 * - revenuecat: RevenueCat packaging (entitlementId, packageId, offeringId)
 *
 * Best Practices:
 * - Use stable keys that don't change (enables backward compatibility)
 * - Keep feature list up-to-date (used by client for permission checks)
 * - Always map offerings across all 3 stores (Stripe, Apple, Google)
 * - Use RevenueCat entitlementId to group related offerings
 * - Document pricing in metadata field for internal reference
 * - Set active=false before deleting (maintains historical data)
 *
 * Example:
 * {
 *   key: "premium_yearly",
 *   title: "Premium Yearly",
 *   features: ["unlimited_packs", "offline_mode"],
 *   stripe: { productId: "prod_...", priceId: "price_..." },
 *   apple: { productId: "com.example.premium.yearly" },
 *   google: { productId: "com.example.premium", basePlanId: "yearly" },
 *   revenuecat: { entitlementId: "premium", packageId: "$annual" }
 * }
 *
 * 🔧 IMPROVEMENTS:
 * - Added comprehensive inline documentation
 * - Noted index on active + createdAt for efficient queries
 * - Documented backward compatibility strategy
 */

const mongoose = require("mongoose");

const StoreOfferingSchema = new mongoose.Schema(
  {
    // Stable ID across platforms (recommend: match your RevenueCat package id or your own key)
    key: { type: String, required: true, unique: true, index: true },

    title: { type: String, required: true },
    description: { type: String, default: "" },
    features: { type: [String], default: [] },

    active: { type: Boolean, default: true },

    // Optional fallback display info (real price comes from StoreKit/Play Billing)
    display: {
      currency: { type: String, default: "" }, // "usd"
      amountCents: { type: Number, default: null },
      type: { type: String, enum: ["recurring", "one_time", ""], default: "" },
      interval: { type: String, enum: ["day", "week", "month", "year", ""], default: "" },
      intervalCount: { type: Number, default: null },
    },

    // Web (Stripe)
    stripe: {
      productId: { type: String, default: null },
      priceId: { type: String, default: null },
    },

    // iOS (Apple)
    apple: {
      productId: { type: String, default: null },
    },

    // Android (Google Play)
    google: {
      productId: { type: String, default: null },
      basePlanId: { type: String, default: null },
      offerId: { type: String, default: null },
    },

    // Optional (nice to have)
    revenuecat: {
      entitlementId: { type: String, default: null },
      offeringId: { type: String, default: null },
      packageId: { type: String, default: null },
    },

    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

StoreOfferingSchema.index({ active: 1, createdAt: -1 });

module.exports = mongoose.model("StoreOffering", StoreOfferingSchema);
