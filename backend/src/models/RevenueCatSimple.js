"use strict";

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const RevenueCatSimpleSchema = new Schema(
  {
    // Your own application's user id coming from RC attributes
    // (subscriber.subscriber_attributes.mongo_user_id.value)
    mongo_user_id: { type: String, index: true, unique: true, sparse: true },

    // RevenueCat's original_app_user_id (useful fallback / debugging)
    original_app_user_id: { type: String, index: true, sparse: true },

    // Copied straight from RC response
    request_date: { type: Date, required: true },
    request_date_ms: { type: Number, required: true },

    // Store the RC "subscriber" blob as-is (dynamic keys under entitlements/subscriptions stay intact)
    subscriber: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    minimize: false, // keep empty objects if RC sends them
  }
);

module.exports = model("RevenueCatSimple", RevenueCatSimpleSchema);
