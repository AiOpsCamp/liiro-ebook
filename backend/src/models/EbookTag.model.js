"use strict";

const mongoose = require("mongoose");

const ebookTagSchema = new mongoose.Schema(
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

ebookTagSchema.virtual("books", {
  ref: "Story",
  localField: "name",
  foreignField: "tags",
  justOne: false,
});

module.exports = mongoose.models.EbookTag || mongoose.model("EbookTag", ebookTagSchema, "tags");
