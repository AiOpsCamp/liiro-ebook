// models/ExerciseProgress.js

const mongoose = require("mongoose");

const ExerciseProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    language: { type: String, required: true }, // Language of progress (ISO code)
    termsProgress: [
      {
        lexiconTerm: { type: mongoose.Schema.Types.ObjectId, ref: "LexiconTerm", required: true },
        confidence: { type: Number, default: 0, min: 0, max: 5 },
        favorite: { type: Boolean, default: false },
        markedForReview: { type: Boolean, default: false },
        isLearned: { type: Boolean, default: false },
      },
    ],
    progressUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure a user has only one progress document per exercise per language
ExerciseProgressSchema.index({ user: 1, exercise: 1, language: 1 }, { unique: true });

module.exports = mongoose.model("ExerciseProgress", ExerciseProgressSchema);
