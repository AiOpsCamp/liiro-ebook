const mongoose = require("mongoose");

const SlideSchema = new mongoose.Schema({
  title: { type: String },
  content: { type: String },
  order: { type: Number },
});

const LessonSchema = new mongoose.Schema(
  {
    lessonTitle: { type: Map, of: String, required: true },
    lessonType: { type: String },
    lessonNumber: { type: Number, default: 0 },
    freePreview: { type: Boolean, default: false },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    content: { type: Map, of: String },
    promptToCreate: { type: String },
    slides: [SlideSchema],
    audioUrls: [{ type: String }],
    videoUrls: [{ type: String }],
    includes: {
      type: [{ type: String, enum: ["article", "video", "exercise"] }],
      default: ["article"],
    },
  },
  { timestamps: true }
);

LessonSchema.pre("save", function () {
  if (!this.includes || this.includes.length === 0) {
    const calculated = [];
    if (this.slides && this.slides.length > 0) {
      calculated.push("article");
    }
    if (this.videoUrls && this.videoUrls.length > 0) {
      calculated.push("video");
    }
    if (this.lessonType === "exercise") {
      calculated.push("exercise");
    }
    // Fallback if still empty
    if (calculated.length === 0) {
      calculated.push("article");
    }
    this.includes = calculated;
  }
});

module.exports = mongoose.model("Lesson", LessonSchema);
