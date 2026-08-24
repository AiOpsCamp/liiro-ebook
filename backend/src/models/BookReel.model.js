"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookReelSchema = new Schema(
  {
    storyId: { type: Schema.Types.ObjectId, ref: "Story", default: null },
    storySlug: { type: String, index: true, default: null },
    storyTitle: { type: String, required: true },
    bookTitlePill: { type: String, default: "" },
    creatorName: { type: String, required: true, default: "Liiro Curators" },
    creatorAvatarUrl: { type: String, default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200" },
    mediaType: { type: String, enum: ["video", "image"], required: true, default: "video" },
    mediaUrl: { type: String, required: true },
    posterUrl: { type: String, default: null },
    audioUrl: { type: String, default: null },
    caption: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.BookReel || mongoose.model("BookReel", bookReelSchema);
