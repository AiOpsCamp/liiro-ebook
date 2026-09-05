"use strict";

const mongoose = require("mongoose");

const BookQuoteSchema = new mongoose.Schema(
  {
    quoteText: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      index: true
    },
    storySlug: {
      type: String,
      required: true,
      index: true
    },
    storyTitle: {
      type: String,
      required: true
    },
    authorName: {
      type: String,
      required: true,
      index: true
    },
    authorSlug: {
      type: String
    },
    coverUrl: {
      type: String
    },
    chapterNumber: {
      type: Number,
      default: 1
    },
    chapterTitle: {
      type: String
    },
    category: {
      type: String,
      default: "Wisdom",
      enum: ["Wisdom", "Adventure", "Love & Romance", "Philosophy", "Mystery", "Life & Hope", "Courage"],
      index: true
    },
    themeTag: {
      type: String,
      default: "classic"
    },
    likesCount: {
      type: Number,
      default: 0
    },
    sharesCount: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

BookQuoteSchema.index({ category: 1, isFeatured: -1, likesCount: -1 });

module.exports = mongoose.model("BookQuote", BookQuoteSchema);
