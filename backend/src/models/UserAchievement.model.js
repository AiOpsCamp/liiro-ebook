"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const GLOBAL_ACHIEVEMENTS = [
  {
    key: "first_page",
    title: "First Steps",
    description: "Started reading or listening to your first classic masterwork on Liiro.",
    icon: "📖",
    category: "reading",
    requirementCount: 1,
    badgeColor: "#818CF8",
  },
  {
    key: "gothic_master",
    title: "Gothic Connoisseur",
    description: "Read or listened to 3 chilling Gothic horror masterworks (Dr. Jekyll, Frankenstein, Dracula).",
    icon: "🏰",
    category: "genre",
    requirementCount: 3,
    badgeColor: "#F59E0B",
  },
  {
    key: "stoic_scholar",
    title: "Stoic Philosopher",
    description: "Mastered ancient wisdom by completing Meditations or The Art of War.",
    icon: "📜",
    category: "philosophy",
    requirementCount: 1,
    badgeColor: "#10B981",
  },
  {
    key: "nighttime_listener",
    title: "Night Owl Listener",
    description: "Enjoyed an audiobook session during late night hours with rain soundscapes.",
    icon: "🌙",
    category: "audio",
    requirementCount: 1,
    badgeColor: "#A855F7",
  },
  {
    key: "polyglot_reader",
    title: "Trilingual Polyglot",
    description: "Switched between English, Spanish, and French editions for the same book.",
    icon: "🌐",
    category: "language",
    requirementCount: 2,
    badgeColor: "#38BDF8",
  },
  {
    key: "streak_titan",
    title: "Streak Titan",
    description: "Maintained a 7-day consecutive reading streak on Liiro.",
    icon: "🔥",
    category: "streak",
    requirementCount: 7,
    badgeColor: "#EF4444",
  },
];

const userAchievementSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "🏆" },
    category: { type: String, default: "general" },
    requirementCount: { type: Number, default: 1 },
    badgeColor: { type: String, default: "#F59E0B" },
  },
  { timestamps: true }
);

userAchievementSchema.statics.GLOBAL_ACHIEVEMENTS = GLOBAL_ACHIEVEMENTS;

module.exports = mongoose.models.UserAchievement || mongoose.model("UserAchievement", userAchievementSchema);
