"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const sparksTakeawaySchema = new Schema({
  takeawayNumber: { type: Number },
  title: { type: Schema.Types.Mixed, required: true }, // Multilingual string or map
  description: { type: Schema.Types.Mixed, required: true }, // Multilingual string or map
  quote: { type: Schema.Types.Mixed, default: null },
});

const sparksChapterBreakdownSchema = new Schema({
  act: { type: Schema.Types.Mixed },
  chapters: { type: Schema.Types.Mixed },
  summary: { type: Schema.Types.Mixed },
});

const sparksAudioTrackSchema = new Schema({
  trackId: { type: String, required: true },
  lang: { type: String, default: "en" }, // en, bn, es, etc.
  voiceId: { type: String, default: "af_heart" }, // af_heart, am_adam, etc.
  voiceName: { type: String, default: "Heart (Female US)" },
  quality: { type: String, enum: ["high_192k", "standard_96k", "low_48k"], default: "high_192k" },
  audioUrl: { type: String, required: true },
  durationSeconds: { type: Number, default: 0 },
  timestamps: [
    {
      sentenceIndex: { type: Number },
      startTime: { type: Number },
      endTime: { type: Number },
      text: { type: String }
    }
  ]
});

const bookSummarySchema = new Schema(
  {
    storyId: { type: Schema.Types.ObjectId, ref: "Story", required: true, index: true },
    storySlug: { type: String, required: true, index: true },
    heroImageUrl: { type: String, default: null }, // Hetzner S3 CDN artwork URL
    sparksCoverUrl: { type: String, default: null },
    
    // Multilingual Content (Default "en", fallback "en")
    summaryTitle: { type: Schema.Types.Mixed, default: "Liiro Sparks ⚡" },
    oneSentenceSummary: { type: Schema.Types.Mixed, default: "" },
    summaryText: { type: Schema.Types.Mixed, default: "" },
    overview: { type: Schema.Types.Mixed, default: "" },

    keyTakeaways: [sparksTakeawaySchema],
    chapterBreakdowns: [sparksChapterBreakdownSchema],

    estimatedReadingTimeMinutes: { type: Number, default: 10 },
    estimatedAudioMinutes: { type: Number, default: 12 },

    // Multilingual, Multi-Voice, Multi-Quality Audio Pipeline Streams
    audioTracks: [sparksAudioTrackSchema],
    defaultAudioUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.BookSummary || mongoose.model("BookSummary", bookSummarySchema);
