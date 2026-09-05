"use strict";

const mongoose = require("mongoose");

const storyChapterSchema = new mongoose.Schema(
  {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    chapterNumber: {
      type: Number,
      required: true,
    },
    chapterIndex: {
      type: Number,
    },
    title: {
      type: mongoose.Schema.Types.Mixed,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
    },
    textPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    paragraphs: [
      {
        type: String,
      },
    ],
    audioUrl: {
      type: mongoose.Schema.Types.Mixed,
    },
    audioPath: {
      type: mongoose.Schema.Types.Mixed,
    },
    audioVoices: {
      type: mongoose.Schema.Types.Mixed,
    },
    durationSeconds: {
      type: mongoose.Schema.Types.Mixed,
    },
    language: {
      type: String,
      default: "en",
    },
    hasAudio: {
      type: Boolean,
      default: false,
    },
    audioBitrates: {
      type: mongoose.Schema.Types.Mixed,
    },
    paragraphTimestamps: {
      type: mongoose.Schema.Types.Mixed,
    },
    sentenceTimestamps: {
      type: mongoose.Schema.Types.Mixed,
    },
    wordTimestamps: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamps: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

storyChapterSchema.index({ storyId: 1, chapterNumber: 1 });
storyChapterSchema.index({ storyId: 1, chapterIndex: 1 });

module.exports = mongoose.models.StoryChapter || mongoose.model("StoryChapter", storyChapterSchema);
