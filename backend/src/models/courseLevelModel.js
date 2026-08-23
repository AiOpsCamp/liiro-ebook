const mongoose = require("mongoose");

const courseLevelSchema = new mongoose.Schema({
  levelTitle: { type: String, required: true },
  overview: String,
  assessmentFlashcardPacks: [
    { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentFlashcardPack" },
  ],
  courseQuizpacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseQuiz" }],
  codeChallengeProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: "CodeChallengeProblem" }],
  vocabularyPacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "VocabularyPack" }],
  dialogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dialogue" }],
  grammarNotes: [
    { title: { type: String, required: true }, content: { type: String, required: true } },
  ],
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
  resources: [{ title: String, url: String }],
  timeLimit: Number,
  rewards: { points: Number, badges: [String] },
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseLevel" }],
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  codeChallenge: { type: mongoose.Schema.Types.ObjectId, ref: "CodeChallenge" },
});

module.exports = mongoose.model("CourseLevel", courseLevelSchema);
