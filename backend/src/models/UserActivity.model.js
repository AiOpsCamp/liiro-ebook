"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const userActivitySchema = new Schema(
  {
    userId: { type: String, required: true, index: true, default: "guest_user" },
    activityType: {
      type: String,
      enum: [
        "started_reading",
        "paused_reading",
        "completed_chapter",
        "started_listening",
        "paused_listening",
        "completed_audiobook",
        "changed_language",
        "added_bookmark",
        "achieved_streak",
      ],
      required: true,
      index: true,
    },
    storyId: { type: Schema.Types.ObjectId, ref: "Story" },
    storySlug: { type: String, required: true, index: true },
    storyTitle: { type: String, required: true },
    chapterNumber: { type: Number, default: 1 },
    chapterTitle: { type: String, default: "" },
    activeLang: { type: String, default: "en" },
    readingMode: { type: String, enum: ["text", "audiobook", "slideshow"], default: "text" },
    positionSec: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    deviceType: { type: String, default: "web" },
    triggeredNotification: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userActivitySchema.index({ userId: 1, activityType: 1 });
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ storySlug: 1, createdAt: -1 });

module.exports = mongoose.models.UserActivity || mongoose.model("UserActivity", userActivitySchema);
