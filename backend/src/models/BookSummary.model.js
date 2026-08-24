"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const keyTakeawaySchema = new Schema({
  takeawayNumber: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  quote: { type: String, default: null },
  audioUrl: { type: String, default: null },
});

const bookSummarySchema = new Schema(
  {
    storyId: { type: Schema.Types.ObjectId, ref: "Story", required: true, index: true },
    slug: { type: String, required: true, index: true },
    overview: { type: String, required: true },
    estimatedReadMinutes: { type: Number, default: 5 },
    estimatedAudioMinutes: { type: Number, default: 12 },
    summaryAudioUrl: { type: String, default: null },
    keyTakeaways: [keyTakeawaySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.BookSummary || mongoose.model("BookSummary", bookSummarySchema);
