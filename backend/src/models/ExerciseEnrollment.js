// models/ExerciseEnrollment.js

const mongoose = require("mongoose");

const ExerciseEnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise", // Ensure you have an Exercise model
      required: true,
    },
    language: { type: String, required: true }, // Language for the enrollment (ISO code)
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure a user can enroll only once per exercise per language
ExerciseEnrollmentSchema.index({ user: 1, exercise: 1, language: 1 }, { unique: true });

module.exports = mongoose.model("ExerciseEnrollment", ExerciseEnrollmentSchema);
