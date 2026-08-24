"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const userStreakSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true, default: "guest_user" },
    currentStreak: { type: Number, default: 1 },
    longestStreak: { type: Number, default: 1 },
    totalActiveDays: { type: Number, default: 1 },
    lastActiveDate: { type: String, required: true }, // YYYY-MM-DD format
    dailyGoalMinutes: { type: Number, default: 15 },
    todayMinutesRead: { type: Number, default: 5 },
    unlockedAchievements: [{ type: String }], // Array of achievement keys e.g. ["gothic_master", "stoic_scholar"]
  },
  { timestamps: true }
);

module.exports = mongoose.models.UserStreak || mongoose.model("UserStreak", userStreakSchema);
