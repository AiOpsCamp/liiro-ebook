"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    packId: { type: Schema.Types.ObjectId, ref: "LexiconPack", required: true },
    slug: { type: String, required: true, index: true },
    activityType: {
      type: String,
      required: true,
      enum: [
        "flat",
        "flashcards",
        "slideshow",
        "learn-flow",
        "practice",
        "audio-practice",
        "audio-test",
        "test",
        "quiz",
      ],
      index: true,
    },
    metadata: { type: Object, default: {} },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { _id: false }
);
