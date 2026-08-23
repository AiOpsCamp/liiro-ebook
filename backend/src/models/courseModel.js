const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema(
  {
    title: {
      type: Map,
      of: String,
      required: true,
    },
    body: {
      type: Map,
      of: String,
      required: true,
    },
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    summary: { type: String, required: false },
    languages: {
      type: [String],
      required: false,
      validate: {
        validator: function (v) {
          if (!Array.isArray(v)) return false;
          const unique = new Set(v.map((lang) => String(lang).toLowerCase()));
          return unique.size === v.length;
        },
        message: "Languages must be unique and valid language codes.",
      },
      default: ["en"],
    },
    objectives: [{ type: String, required: false }],
    overview: { type: String, required: false },
    coursePhoto: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(v);
        },
        message: "Invalid course photo URL format.",
      },
    },
    category: { type: String, required: false },
    courseContents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
    levels: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseLevel" }],
    courseQuizpacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseQuiz" }],
    flashcardPacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "AssessmentFlashcardPacks" }],
    vocabularyPacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "LexiconPack" }],
    skills: [{ type: String }],
    technologies: [{ type: String }],
    tags: {
      type: Map,
      of: [String],
      required: false,
      validate: {
        validator: function (v) {
          if (!v) return true;
          for (const [, tagsArray] of v) {
            if (!Array.isArray(tagsArray) || tagsArray.length === 0) return false;
          }
          return true;
        },
        message: "If tags are provided, each language must have at least one tag.",
      },
    },
    courseType: {
      type: String,
      enum: [
        "course",
        "crash-course",
        "project",
        "assessment",
        "interactive-learn",
        "code-challenge",
        "skill-circuit",
        "interview-prep",
      ],
      required: true,
      default: "course",
    },
    hasLevels: { type: Boolean, default: false },
    difficulty: {
      type: String,
      enum: ["Easy", "Intermediate", "Advanced", "A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    hasCourseContent: { type: Boolean, default: true },
    languagePacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "LanguagePack" }],
    completionTime: { type: String, required: false },
    certificateAvailable: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    languagesAvailable: {
      type: [String],
      default: ["en"],
      validate: {
        validator: function (v) {
          if (!Array.isArray(v)) return false;
          const unique = new Set(v.map((lang) => String(lang).toLowerCase()));
          return unique.size === v.length;
        },
        message: "LanguagesAvailable must contain unique language codes.",
      },
    },
    takeawaySkills: [{ type: String }],
    lingoCampConfig: {
      lingoCampLanguage: {
        type: String,
        default: "English",
      },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    skillCircuitContent: [
      {
        contentType: {
          type: String,
          enum: ["Course", "LexiconPack", "Exercise", "Dialogue"],
          required: true,
        },
        contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
        order: { type: Number, default: 1 },
        required: { type: Boolean, default: true },
        notes: { type: String, default: "" },
      },
    ],
    freeCourse: { type: Boolean, default: false },
    trendingCourse: { type: Boolean, default: false },
    prerequisites: { type: String, required: false },
    relevantCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

courseSchema.pre("validate", function () {
  if (this.courseType === "skill-circuit") {
    if (!this.skillCircuitContent || this.skillCircuitContent.length === 0) {
      this.invalidate(
        "skillCircuitContent",
        'Skill Circuit Content is required for courses of type "skill-circuit".'
      );
    }
  } else {
    this.skillCircuitContent = [];
  }
});

courseSchema.pre("save", function () {
  if (this.isNew && !this.slug) {
    this.slug = String(this.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  this.updatedAt = Date.now();
});

courseSchema.index({
  title: "text",
  category: "text",
  tags: "text",
  summary: "text",
  objectives: "text",
  overview: "text",
  skills: "text",
  technologies: "text",
  takeawaySkills: "text",
});
courseSchema.index({ category: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ createdAt: -1 }, { name: "idx_created_desc" });

module.exports = mongoose.model("Course", courseSchema);
module.exports.ContentSchema = ContentSchema;
