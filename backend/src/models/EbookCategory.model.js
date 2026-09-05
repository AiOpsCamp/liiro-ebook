"use strict";

const mongoose = require("mongoose");

const ebookCategorySchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    icon: {
      type: String,
      default: "BookOpen",
    },
    keywords: [
      {
        type: String,
      },
    ],
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

ebookCategorySchema.index({ bookCount: -1, name: 1 });
ebookCategorySchema.index({ name: 1 });

ebookCategorySchema.virtual("books", {
  ref: "Story",
  localField: "name",
  foreignField: "category",
  justOne: false,
});

module.exports = mongoose.models.EbookCategory || mongoose.model("EbookCategory", ebookCategorySchema, "categories");
