"use strict";

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const StripeCacheSchema = new Schema(
  {
    subscriptionItemId: { type: String, required: true, unique: true, index: true },
    priceId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 }, // TTL index: auto-deletes after 60 seconds
  },
  {
    strict: true,
    versionKey: false,
    timestamps: false,
  }
);

module.exports = model("StripeCache", StripeCacheSchema);
