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
    booksCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.EbookCategory || mongoose.model("EbookCategory", ebookCategorySchema);
