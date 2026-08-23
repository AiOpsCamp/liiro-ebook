const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vocabularyPack: { type: mongoose.Schema.Types.ObjectId, ref: "VocabularyPack", required: true },
    language: { type: String, required: true }, // Language for the enrollment
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ user: 1, vocabularyPack: 1, language: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
