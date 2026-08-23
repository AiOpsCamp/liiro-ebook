"use strict";

const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryChapter",
    },
    paragraphIdx: {
      type: Number,
      default: 0,
    },
    selectedText: {
      type: String,
    },
    text: {
      type: String,
    },
    note: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#FEF08A",
    },
  },
  { timestamps: true }
);

const userStoryProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    currentChapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryChapter",
    },
    lastChapterIndex: {
      type: Number,
      default: 1,
    },
    lastParagraphIndex: {
      type: Number,
      default: 0,
    },
    lastAudioTimeSeconds: {
      type: Number,
      default: 0,
    },
    completedChapterIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryChapter",
      },
    ],
    completedChapterIndexes: [
      {
        type: Number,
      },
    ],
    bookmarkedChapterIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryChapter",
      },
    ],
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    highlights: [highlightSchema],
    audioTimestamp: {
      type: Number,
      default: 0,
    },
    scrollOffset: {
      type: Number,
      default: 0,
    },
    currentPageIdx: {
      type: Number,
      default: 0,
    },
    lastActivityType: {
      type: String,
      enum: ["reading", "listening", "visited"],
      default: "reading",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    lastListenedAt: {
      type: Date,
    },
    readerSettings: {
      theme: { type: String, default: "light" },
      fontFamily: { type: String, default: "serif" },
      fontSize: { type: Number, default: 18 },
      textAlign: { type: String, default: "left" },
      containerWidth: { type: Number, default: 680 },
    },
  },
  { timestamps: true }
);

userStoryProgressSchema.index({ userId: 1, storyId: 1 }, { unique: true });

module.exports = mongoose.models.UserStoryProgress || mongoose.model("UserStoryProgress", userStoryProgressSchema);
