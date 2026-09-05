const mongoose = require("mongoose");

const ReadingGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
      index: true
    },
    targetBooks: {
      type: Number,
      default: 25,
      min: 1,
      max: 1000
    },
    targetMinutes: {
      type: Number,
      default: 5000
    },
    completedMinutes: {
      type: Number,
      default: 0
    },
    completedBooks: [
      {
        storyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Story"
        },
        slug: String,
        title: String,
        coverImageUrl: String,
        authorName: String,
        completedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

ReadingGoalSchema.index({ userId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("ReadingGoal", ReadingGoalSchema, "readinggoals");
