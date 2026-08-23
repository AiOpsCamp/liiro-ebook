const mongoose = require("mongoose");

const CourseQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["mcq", "mcq-multi", "true-false", "matching", "text-input"],
    required: true,
  },
  text: { type: String, required: true },
  options: [String],
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  imageUrl: String,
  audioUrl: String,
});

const CourseQuizSchema = new mongoose.Schema({
  title: String,
  questions: [CourseQuestionSchema],
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: false },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: false },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: false },
  levelId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLevel", required: false },
  addedTo: [String],
});

module.exports = mongoose.model("CourseQuiz", CourseQuizSchema);
