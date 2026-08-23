"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    packId: { type: Schema.Types.ObjectId, ref: "LexiconPack", required: true },
    slug: { type: String, required: true, index: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
