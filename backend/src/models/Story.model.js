"use strict";

const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    title: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    author: {
      type: String,
      trim: true,
      default: "Unknown",
    },
    synopsis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    category: {
      type: String,
      trim: true,
      default: "World Literature Masterworks",
    },
    coverImageUrl: {
      type: String,
      trim: true,
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    difficultyLevel: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", "Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "B2",
    },
    totalDurationSeconds: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,
    },
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryChapter",
      },
    ],
    tags: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    contentType: {
      type: String,
      enum: ["ebook", "audiobook", "both"],
      default: "both",
    },
    source: {
      type: String,
      trim: true,
      default: "Standard Ebooks",
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    sourceRepo: {
      type: String,
      trim: true,
    },
    importedAt: {
      type: Date,
      default: Date.now,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredRank: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

storySchema.index({ isPublished: 1, difficultyLevel: 1 });
storySchema.index({ category: 1 });

module.exports = mongoose.models.Story || mongoose.model("Story", storySchema);
