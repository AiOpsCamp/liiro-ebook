"use strict";

const mongoose = require("mongoose");

const UserPreferencesSchema = new mongoose.Schema(
  {
    defaultLanguage: { type: String, default: "English" },
    userLanguage: { type: String, default: "Finnish" },
    languagePackId: { type: mongoose.Schema.Types.ObjectId, ref: "LanguagePack" },
    levelOrProficiency: {
      type: String,
      enum: [
        "",
        "No Experience",
        "Starter",
        "Beginner",
        "Elementary",
        "Intermediate",
        "Advanced",
        "Proficient",
      ],
      default: "",
    },
    dailyWeeklyLearningGoals: {
      type: String,
      enum: [
        "5 minutes/day",
        "15 minutes/day",
        "30 minutes/day",
        "1 hour/day",
        "2 lessons/week",
        "5 lessons/week",
        "10 lessons/week",
        "custom",
      ],
      default: "",
    },
    interests: [{ type: mongoose.Schema.Types.ObjectId, ref: "LexiconCategory" }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "LexiconTag" }],
  },
  { timestamps: true }
);

// IMPORTANT: keep model name "LingoCampConfig" for backward compatibility
const LingoCampConfig =
  mongoose.models.LingoCampConfig || mongoose.model("LingoCampConfig", UserPreferencesSchema);

module.exports = LingoCampConfig;

module.exports.UserPreferencesSchema = UserPreferencesSchema;
