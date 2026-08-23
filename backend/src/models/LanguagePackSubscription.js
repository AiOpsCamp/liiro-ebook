const mongoose = require("mongoose");

const LanguagePackSubscriptionSchema = new mongoose.Schema(
  {
    languagePackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LanguagePack",
      required: true,
    },
    subscriptionStart: {
      type: Date,
      default: Date.now,
    },
    subscriptionEnd: {
      type: Date,
      required: true,
    },

    // Stripe-related fields
    stripeSubscriptionId: {
      type: String, // Stripe subscription IDs usually start with "sub_"
      required: true, // Ensures every subscription has a Stripe ID
    },
    stripePriceId: {
      type: String, // Price IDs typically look like "price_..."
      required: true, // Ensures every subscription has an associated price ID
    },
    status: {
      type: String, // e.g., "active", "canceled", "incomplete", "trialing"
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    nextInvoiceDate: {
      type: Date, // Explicitly added for next invoicing date
    },

    // Optional fields to store related pricing/product info
    planName: {
      type: String,
    },
    price: {
      type: Number,
    },
    currency: {
      type: String,
    },
    languageName: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = LanguagePackSubscriptionSchema;
module.exports.LanguagePackSubscription = mongoose.model(
  "LanguagePackSubscription",
  LanguagePackSubscriptionSchema
);
