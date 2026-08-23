const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema(
  {
    contentTitle: { type: Map, of: String, required: true },
    overview: { type: Map, of: String },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Content", ContentSchema);
