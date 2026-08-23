"use strict";
const mongoose = require("mongoose");

const StripeProductSchema = new mongoose.Schema(
  {
    stripeProductId: { type: String, index: true, unique: true, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
    livemode: { type: Boolean, default: false },

    // Stripe "features": [{ name: "..." }]
    features: [{ type: String }],

    // Optional: store any extra tags for app usage
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StripeProduct", StripeProductSchema);
