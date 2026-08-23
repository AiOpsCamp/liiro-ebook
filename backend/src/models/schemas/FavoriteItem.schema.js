"use strict";

const mongoose = require("mongoose");
const {
  Schema,
  Schema: {
    Types: { ObjectId },
  },
} = mongoose;

module.exports = new Schema(
  {
    itemId: { type: ObjectId, required: true, refPath: "itemType" },
    itemType: {
      type: String,
      required: true,
      enum: ["LexiconPack", "Dialogue", "Exercise"],
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
