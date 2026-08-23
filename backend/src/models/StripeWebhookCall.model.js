"use strict";

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const StripeWebhookCallSchema = new Schema(
  {
    event_id: { type: String, index: true },
    event_type: { type: String, index: true }, // e.g., "checkout.session.completed", "customer.subscription.updated"
    livemode: { type: Boolean, default: false },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  {
    strict: true,
    minimize: false,
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

module.exports = model("StripeWebhookCall", StripeWebhookCallSchema);
