const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    contents: [
      {
        contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content" },
        lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
      },
    ],
    lessonCount: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
    currentContentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content" },
    currentLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    lastCompletedLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    nextLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Progress", ProgressSchema);
