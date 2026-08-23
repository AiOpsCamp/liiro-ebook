const mongoose = require("mongoose");
const slugify = require("slugify");

/**
 * LanguagePack Schema
 * Represents a language's learning bundle, including courses, vocabulary packs,
 * metadata, pricing, publishing controls, discovery filters, governance, and sorting/sequencing.
 */
const languagePackSchema = new mongoose.Schema(
  {
    /* -------------------------------------------------------------------------- */
    /*                               BASIC METADATA                               */
    /* -------------------------------------------------------------------------- */
    packType: {
      type: String,
      default: "core", // e.g. core, advanced, special
      trim: true,
      index: true,
    },

    /**
     * Manual list ordering (admin controlled).
     * Use this when you want a deterministic UI order.
     */
    sequence: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, trim: true },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    /**
     * BCP-47-ish locale tag (keep exact casing), e.g. "en", "bn", "zh-CN", "zh-TW"
     * IMPORTANT: Do not lowercase this in middleware.
     */
    languageCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: /^[a-z]{2}(-[A-Z]{2})?$/,
    },

    /* ---------------------------- identity/locale ---------------------------- */
    iso639_3: { type: String, trim: true }, // e.g. zho, deu, spa
    nativeName: { type: String, trim: true }, // e.g. Deutsch, Español
    dialects: [{ type: String, trim: true }],

    script: { type: String, trim: true },
    writingDirection: {
      type: String,
      enum: ["ltr", "rtl"],
      default: "ltr",
    },

    countryOrRegion: { type: String, trim: true, uppercase: true }, // e.g. CN, TW, BR
    languageBase: { type: String, trim: true, lowercase: true }, // e.g. "zh"
    hasTones: { type: Boolean, default: false },

    /* -------------------------------------------------------------------------- */
    /*                            DIFFICULTY / SCOPE                              */
    /* -------------------------------------------------------------------------- */
    difficulty: { type: String, trim: true, default: "A1" },
    cefrRange: {
      min: { type: String, trim: true, default: "A1" },
      max: { type: String, trim: true, default: "A1" },
    },

    learningGoals: [{ type: String, trim: true, lowercase: true }],
    domains: [{ type: String, trim: true, lowercase: true }],
    recommendedDailyMinutes: { type: Number, default: 10 },

    /* -------------------------------------------------------------------------- */
    /*                    SORTING / DISCOVERY SIGNALS (NEW)                        */
    /* -------------------------------------------------------------------------- */
    /**
     * "Demand" = how much users want this language (captures intent).
     * You can update these from analytics (search logs, waitlist signups, etc.)
     */
    demand: {
      searchCount: { type: Number, default: 0 },
      interestCount: { type: Number, default: 0 },

      /**
       * Admin-defined demand boost (manual).
       * Useful to promote new languages even before data exists.
       */
      manualBoost: { type: Number, default: 0 },

      /**
       * Computed score you can store (or compute on read).
       * Example formula:
       * demandScore = searchCount*1 + interestCount*3 + manualBoost
       */
      score: { type: Number, default: 0, index: true },

      lastCalculatedAt: { type: Date },
    },

    /**
     * "Usage" = how much learners actually use it (captures engagement).
     */
    usage: {
      activeLearners30d: { type: Number, default: 0 },
      lessonsCompleted30d: { type: Number, default: 0 },
      minutesStudied30d: { type: Number, default: 0 },
      retentionD7: { type: Number, default: 0, min: 0, max: 1 },
      retentionD30: { type: Number, default: 0, min: 0, max: 1 },
      score: { type: Number, default: 0 },
      lastCalculatedAt: { type: Date },
    },

    /**
     * One single "sortScore" used for default sorting when you want a combined ranking.
     * Example:
     * sortScore = usage.score*0.6 + demand.score*0.4 + popularityScore
     */
    sortScore: { type: Number, default: 0 },

    /**
     * Timestamp to support "Trending" sorting (recent momentum).
     * You can update trendScore daily/hourly.
     */
    trend: {
      score: { type: Number, default: 0 },
      windowDays: { type: Number, default: 7 },
      lastCalculatedAt: { type: Date },
    },

    /**
     * Optional: last time this pack was featured/promoted (helps rotation)
     */
    lastFeaturedAt: { type: Date },

    /* -------------------------------------------------------------------------- */
    /*                             LIFECYCLE / GOVERNANCE                         */
    /* -------------------------------------------------------------------------- */
    status: {
      type: String,
      default: "IN_PROGRESS",
      enum: ["IN_PROGRESS", "COMPLETED", "DRAFT", "ARCHIVED"],
    },

    moderation: {
      status: {
        type: String,
        enum: ["approved", "pending", "rejected"],
        default: "pending",
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      note: { type: String, trim: true },
    },

    version: { type: String, trim: true },
    lastContentUpdateAt: { type: Date },

    /* -------------------------------------------------------------------------- */
    /*                                DESCRIPTIONS                                */
    /* -------------------------------------------------------------------------- */
    overview: { type: String, trim: true },
    objectives: { type: String, trim: true },
    takeawaySkills: { type: String, trim: true },
    prerequisites: { type: String, trim: true },
    targetAudience: { type: String, trim: true },
    category: { type: String, trim: true },
    instructor: { type: String, trim: true },
    author: { type: String, trim: true },

    /* -------------------------------------------------------------------------- */
    /*                               DISCOVERY / FILTERS                          */
    /* -------------------------------------------------------------------------- */
    region: {
      type: String,
      enum: ["europe", "asia", "africa", "americas", "oceania", "middle-east"],
      index: true,
    },
    subregion: { type: String, trim: true, index: true },

    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    collections: [{ type: String, trim: true, lowercase: true, index: true }],

    featured: { type: Boolean, default: false, index: true },
    featuredOrder: { type: Number, default: 0, index: true },

    // legacy/general score (keep)
    popularityScore: { type: Number, default: 0, index: true },

    badge: {
      type: String,
      enum: ["new", "popular", "updated", "limited", null],
      default: null,
      index: true,
    },

    /* -------------------------------------------------------------------------- */
    /*                               PACK CONTENTS                                */
    /* -------------------------------------------------------------------------- */
    packContent: {
      courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    },

    features: {
      courses: { type: Boolean, default: false },
      vocabularyPacks: { type: Boolean, default: true },
      listeningExercises: { type: Boolean, default: false },
      readingExercises: { type: Boolean, default: false },
      dialogs: { type: Boolean, default: false },
      interactiveLearn: { type: Boolean, default: false },
      skillCircuit: { type: Boolean, default: false },
      pronunciationFocus: { type: Boolean, default: false },
    },

    speechRecognition: {
      enabled: { type: Boolean, default: false },
      provider: { type: String, trim: true },
    },

    supportedUILanguages: [{ type: String, trim: true, lowercase: true, index: true }],
    explanationsLanguageCode: { type: String, trim: true },

    /* -------------------------------------------------------------------------- */
    /*                               ASSESSMENT / PROGRESSION                     */
    /* -------------------------------------------------------------------------- */
    placementTestAvailable: { type: Boolean, default: false },

    levelMapping: [
      {
        level: { type: String, trim: true },
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      },
    ],

    /* -------------------------------------------------------------------------- */
    /*                             CONTENT METRICS / STATS                        */
    /* -------------------------------------------------------------------------- */
    completionTime: { type: String, trim: true },
    certificateAvailable: { type: Boolean, default: false },

    counts: {
      courses: { type: Number, default: 0 },
      lessons: { type: Number, default: 0 },
      words: { type: Number, default: 0 },
      phrases: { type: Number, default: 0 },
      dialogs: { type: Number, default: 0 },
      quizzes: { type: Number, default: 0 },
    },

    estimatedHours: { type: Number, default: 0 },

    duration: { type: String, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    enrollmentCount: { type: Number, default: 0, index: true },
    packLevel: { type: String, trim: true },

    /* -------------------------------------------------------------------------- */
    /*                                   PRICING                                  */
    /* -------------------------------------------------------------------------- */
    price: { type: Number, default: 0 },
    freePack: { type: Boolean, default: false },

    pricing: {
      currency: { type: String, trim: true, uppercase: true, default: "USD" },
      amount: { type: Number, default: 0 },
      isFree: { type: Boolean, default: false, index: true },
    },

    sale: {
      active: { type: Boolean, default: false, index: true },
      amount: { type: Number, default: 0 },
      startsAt: { type: Date },
      endsAt: { type: Date },
    },

    trialAvailable: { type: Boolean, default: false },

    /* -------------------------------------------------------------------------- */
    /*                                MEDIA / BRANDING                            */
    /* -------------------------------------------------------------------------- */
    image: { type: String, default: "https://via.placeholder.com/300" },

    coverImage: {
      url: { type: String, trim: true },
      alt: { type: String, trim: true },
    },

    thumbnailImage: {
      url: { type: String, trim: true },
      alt: { type: String, trim: true },
    },

    promoVideoUrl: { type: String, trim: true },
    themeColor: { type: String, trim: true },

    /* -------------------------------------------------------------------------- */
    /*                                SEO / SEARCH                                */
    /* -------------------------------------------------------------------------- */
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: [{ type: String, trim: true, lowercase: true }],
    },

    searchKeywords: [{ type: String, trim: true, lowercase: true, index: true }],

    /* -------------------------------------------------------------------------- */
    /*                                PUBLICATION                                 */
    /* -------------------------------------------------------------------------- */
    production: { type: Boolean, default: false, index: true },

    visibility: {
      type: String,
      enum: ["public", "private", "archived"],
      default: "public",
      index: true,
    },

    archived: { type: Boolean, default: false, index: true },

    publishAt: { type: Date, index: true },
    unpublishAt: { type: Date, index: true },

    releaseChannels: {
      production: { type: Boolean, default: true },
      staging: { type: Boolean, default: false },
    },

    /* -------------------------------------------------------------------------- */
    /*                               RELATIONSHIPS                                */
    /* -------------------------------------------------------------------------- */
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* -------------------------------------------------------------------------- */
/*                               INDEXING SETUP                               */
/* -------------------------------------------------------------------------- */
/**
 * OPTIMIZED: Kept only critical unique constraint indexes.
 * Unique indexes automatically created by unique: true constraints.
 * Composite indexes for dashboard sorting managed via src/db/indexes.js.
 */
// Unique fields are auto-indexed (slug, language, languageCode)

// Deterministic UI sorting
languagePackSchema.index({ sequence: 1, title: 1 });

/* -------------------------------------------------------------------------- */
/*                                MIDDLEWARES                                 */
/* -------------------------------------------------------------------------- */
languagePackSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  if (this.language) this.language = this.language.trim().toLowerCase();

  // DO NOT lowercase languageCode; it must preserve casing for zh-CN / zh-TW
  if (this.languageCode) this.languageCode = this.languageCode.trim();

  // Derive languageBase & region when languageCode includes region (e.g. zh-CN)
  if (this.languageCode && !this.languageBase) {
    const [base] = this.languageCode.split("-");
    if (base) this.languageBase = base.toLowerCase();
  }
  if (this.languageCode && !this.countryOrRegion && this.languageCode.includes("-")) {
    const [, region] = this.languageCode.split("-");
    if (region) this.countryOrRegion = region.toUpperCase();
  }

  // Keep compatibility fields aligned (optional)
  if (this.pricing) {
    if (typeof this.pricing.isFree === "boolean") this.freePack = this.pricing.isFree;
    if (typeof this.pricing.amount === "number") this.price = this.pricing.amount;
  } else {
    this.pricing = {
      currency: "USD",
      amount: this.price || 0,
      isFree: this.freePack || (this.price || 0) === 0,
    };
  }

  next();
});

/* -------------------------------------------------------------------------- */
/*                                  VIRTUALS                                  */
/* -------------------------------------------------------------------------- */
languagePackSchema.virtual("publicUrl").get(function () {
  return `/languages/${this.slug}`;
});

languagePackSchema.virtual("isPublished").get(function () {
  const now = new Date();
  const timeOk =
    (!this.publishAt || this.publishAt <= now) && (!this.unpublishAt || this.unpublishAt > now);
  return this.production === true && this.visibility === "public" && !this.archived && timeOk;
});

/* -------------------------------------------------------------------------- */
/*                                 EXPORT MODEL                               */
/* -------------------------------------------------------------------------- */
const LanguagePack = mongoose.model("LanguagePack", languagePackSchema);
module.exports = LanguagePack;
