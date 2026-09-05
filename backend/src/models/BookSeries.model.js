const mongoose = require("mongoose");

const bookSeriesSchema = new mongoose.Schema(
  {
    title: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    author: {
      type: String,
      trim: true,
      default: "Various Authors",
    },
    description: {
      type: mongoose.Schema.Types.Mixed,
    },
    coverImageUrl: {
      type: String,
      trim: true,
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
      },
    ],
    bookCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

bookSeriesSchema.index({ slug: 1 });
bookSeriesSchema.index({ isPublished: 1 });

module.exports = mongoose.models.BookSeries || mongoose.model("BookSeries", bookSeriesSchema);
