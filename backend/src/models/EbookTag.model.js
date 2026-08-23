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
    booksCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.EbookTag || mongoose.model("EbookTag", ebookTagSchema);
