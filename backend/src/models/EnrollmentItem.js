const mongoose = require("mongoose");

const EnrollmentItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "course",
      "crash-course",
      "project",
      "assessment",
      "interactive-learn",
      "code-challenge",
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "enrollments.type",
  },
  progressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Progress",
    required: false,
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = EnrollmentItemSchema;
