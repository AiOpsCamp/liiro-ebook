"use strict";

const mongoose = require("mongoose");

const narratorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    sampleAudioUrl: { type: String, default: "" },
    catalogCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Narrator || mongoose.model("Narrator", narratorSchema);
