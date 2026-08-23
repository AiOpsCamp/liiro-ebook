"use strict";
const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { ObjectId } = Schema.Types;

// Existing sub-schemas (keep as-is)
const EnrollmentItemSchema = require("./EnrollmentItem");
const NotificationSchema = require("./Notification");
const LingoCampConfig = require("./LingoCampConfig");

// Extracted schemas (keep your existing pattern)
const StripeCustomerInfoSchema = require("./schemas/StripeCustomerInfo.schema");
const BadgeSchema = require("./schemas/Badge.schema");
const AuthProvidersSchema = require("./schemas/AuthProviders.schema");
const AdminFlagsSchema = require("./schemas/AdminFlags.schema");
const TrialUsageSchema = require("./schemas/TrialUsage.schema");
const PushTokenSchema = require("./schemas/PushToken.schema");
require("./auth/RefreshToken.model");

// ✅ Plugins (you created these)
const userActivityPlugin = require("./plugins/userActivity.plugin");
const userAuthPlugin = require("./plugins/userAuth.plugin");

const UserSchema = new Schema(
  {
    // Authentication & profile
    username: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    first_name: { type: String },
    last_name: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    location: { type: String },
    picture: { type: String },
    firebase_uuid: { type: String, unique: true, sparse: true },

    // Roles & flags
    role: {
      type: String,
      enum: ["admin", "moderator", "premiumUser", "freeUser"],
      default: "freeUser",
    },
    emailVerified: { type: Boolean, default: false },
    onBoarding: { type: Boolean, default: false },

    // (Optional legacy indicator - keep if your app uses it)
    hasYearlySubscription: { type: Boolean, default: false },
    subscriptionExpirationDate: { type: Date, default: null },

    // Stripe customer info
    stripeCustomerInfo: { type: StripeCustomerInfoSchema, default: undefined },

    // ✅ RevenueCat reference (ONLY subscription source of truth)
    revenueCat: { type: ObjectId, ref: "RevenueCatAccount" },

    // ✅ Quick subscription snapshot (Stripe/Manually granted)
    subscription: { type: require("./schemas/UserSubscription.schema"), default: undefined },

    languagePackSubscriptions: [
      {
        languagePackId: { type: ObjectId, ref: "LanguagePack" },
        subscriptionStart: { type: Date },
        subscriptionEnd: { type: Date },
      },
    ],

    // Progress and activity tracking
    xp_score: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now },
    activityDates: [Date],

    // Course-related arrays
    enrollments: [EnrollmentItemSchema],
    favoriteCourses: [{ type: ObjectId, ref: "Course" }],
    inProgressCourses: [
      {
        courseId: { type: ObjectId, ref: "Course" },
        lastCompletedLessonId: { type: ObjectId, ref: "Lesson" },
        nextLessonId: { type: ObjectId, ref: "Lesson" },
        progressId: { type: ObjectId, ref: "Progress" },
        enrollmentDate: { type: Date, default: Date.now },
        lastAccessed: { type: Date, default: Date.now },
        completionPercentage: { type: Number, default: 0 },
      },
    ],
    completedCourses: [
      {
        courseId: { type: ObjectId, ref: "Course" },
        completionDate: { type: Date, default: Date.now },
      },
    ],
    paidCourses: [{ type: ObjectId, ref: "Course" }],
    paidAssessments: [{ type: ObjectId, ref: "Assessment" }],
    enrolledCodeChallenges: [{ type: ObjectId, ref: "CodeChallenge" }],
    cart: [{ type: ObjectId, ref: "Course" }],

    cimHistory: [
      {
        packId: { type: require("mongoose").Schema.Types.ObjectId, ref: "LexiconPack" },
        recommendedAt: { type: Date, default: Date.now },
      },
    ],

    // Pack of the Day
    packOfTheDay: { type: ObjectId, ref: "LexiconPack" },
    packOfTheDayDate: { type: String }, // e.g. YYYY-MM-DD
    packOfTheDayCompleted: { type: Boolean, default: false },

    // Daily practice
    dailyLexiconPacks: [{ type: ObjectId, ref: "LexiconPack" }],
    dailyPacksDate: { type: Date },
    dailyExercises: [{ type: ObjectId, ref: "Exercise" }],
    dailyExercisesDate: { type: Date },
    dailyExerciseType: { type: String, enum: ["listening", "reading", "writing", "speaking"] },

    // Admin / account controls
    adminNotes: { type: String, maxlength: 2000 },
    lastAdminAction: {
      type: String,
      enum: [
        "ROLE_CHANGED",
        "SUSPENDED",
        "UNSUSPENDED",
        "DELETED",
        "RESTORED",
        "IMPERSONATED",
        "FORCE_LOGOUT",
      ],
    },
    lastAdminActionAt: { type: Date },
    lastAdminId: { type: ObjectId, ref: "User" },

    accountStatus: {
      type: String,
      enum: ["active", "pending_verification", "suspended", "deleted"],
      default: "pending_verification",
    },

    lastKnownIp: { type: String },
    lastKnownUserAgent: { type: String },

    authProviders: { type: AuthProvidersSchema, default: undefined },
    adminFlags: { type: AdminFlagsSchema, default: undefined },

    // Notifications
    notifications: [NotificationSchema],

    // Multi-device Expo push tokens
    pushTokens: { type: [PushTokenSchema], default: [] },

    // Legacy single token (backwards compatibility)
    notificationToken: { type: String, default: null },

    // Badges
    badges: [BadgeSchema],

    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // External configs
    lingoCampConfig: { type: ObjectId, ref: "LingoCampConfig" },

    // Favorites (packs, exercises, dialogues)
    favoriteItems: {
      type: [require("./schemas/FavoriteItem.schema")],
      default: [],
    },

    // Trial usage & reset
    trialUsage: { type: TrialUsageSchema, default: undefined },
    trialResetAt: { type: Date },

    // Admin controls
    isSuspended: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    suspensionReason: { type: String, maxlength: 500 },
    deletedAt: { type: Date },
    deletedBy: { type: ObjectId, ref: "User" },
    deleteReason: { type: String, maxlength: 500 },
    tokenInvalidBefore: { type: Date, default: new Date(0) },
    restoreAccountToken: { type: String, select: false },
    restoreAccountExpires: { type: Date },
  },
  { timestamps: true }
);

/* ======================================================
   Indexes (OPTIMIZED - only critical indexes)
====================================================== */
/**
 * Kept only essential indexes to stay under MongoDB's 64-index limit.
 * Additional composite indexes managed via src/db/indexes.js.
 */
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ emailVerified: 1, lastLogin: -1 });

// Push token indexes (critical for multi-device support)
UserSchema.index({ "pushTokens.token": 1 }, { name: "idx_pushTokens_token" });
UserSchema.index({ "pushTokens.deviceId": 1 }, { name: "idx_pushTokens_deviceId" });

try {
  UserSchema.index(
    { username: "text", email: "text", first_name: "text", last_name: "text" },
    { name: "user_text_search", default_language: "english" }
  );
} catch {}

/* ======================================================
   Methods
====================================================== */
UserSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

/* ======================================================
   Plugins
====================================================== */
UserSchema.plugin(userActivityPlugin);
UserSchema.plugin(userAuthPlugin);

module.exports = model("User", UserSchema);
// Back-compat export (kept exactly as you had)
module.exports.LingoCampConfig = LingoCampConfig;
