"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const userNotificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true, default: "guest_user" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String, default: "🔔" },
    type: { type: String, enum: ["activity", "streak", "release", "system"], default: "activity" },
    isRead: { type: Boolean, default: false },
    storySlug: { type: String, default: null },
    activityId: { type: Schema.Types.ObjectId, ref: "UserActivity", default: null },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, isRead: 1 });
userNotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.UserNotification || mongoose.model("UserNotification", userNotificationSchema);
