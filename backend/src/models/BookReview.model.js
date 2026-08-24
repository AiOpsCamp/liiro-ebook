"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookReviewSchema = new Schema(
  {
    storyId: { type: Schema.Types.ObjectId, ref: "Story", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, required: true, trim: true },
    authorAvatarUrl: { type: String, default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true, trim: true, maxlength: 3000 },
    source: { type: String, enum: ["user", "goodreads", "editorial"], default: "user", index: true },
    goodreadsReviewId: { type: String, default: null },
    likesCount: { type: Number, default: 0 },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookReviewSchema.index({ storyId: 1, createdAt: -1 });

module.exports = mongoose.models.BookReview || mongoose.model("BookReview", bookReviewSchema);
