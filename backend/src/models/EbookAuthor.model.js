"use strict";

const mongoose = require("mongoose");

const ebookAuthorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    bookCount: {
      type: Number,
      default: 0,
    },
    booksCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ebookAuthorSchema.virtual("books", {
  ref: "Story",
  localField: "name",
  foreignField: "author",
  justOne: false,
});

module.exports = mongoose.models.EbookAuthor || mongoose.model("EbookAuthor", ebookAuthorSchema);
