"use strict";
const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    // Combined context buckets
    global: { type: Number, default: 0 },
    pack: { type: Number, default: 0 },

    flashcard: { type: Number, default: 0 },
    learn: { type: Number, default: 0 },
    slideshow: { type: Number, default: 0 },
    training: { type: Number, default: 0 },
    test: { type: Number, default: 0 },
    audio_practice: { type: Number, default: 0 },

    // ✅ NEW: module proficiency tests bucket
    module_test: { type: Number, default: 0 },

    // Reserved for a future word-match tool (kept in sync with backend FEATURES).
    word_match: { type: Number, default: 0 },
  },
  { _id: false }
);
