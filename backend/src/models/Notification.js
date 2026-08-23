const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      "courseEnrollment",
      "courseCompletion",
      "assessmentResult",
      "newCourseAvailable",
      "customMessage",
    ],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: false,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

module.exports = NotificationSchema;
