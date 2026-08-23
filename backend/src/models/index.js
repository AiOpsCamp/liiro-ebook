"use strict";

/**
 * This file exists to ensure all Mongoose models are registered
 * before any controller tries to populate refs.
 *
 * Usage:
 *   require("./models"); // from src/server.js (recommended)
 *
 * Notes on conventions:
 * - *.model.js  => Mongoose model (mongoose.model)
 * - other files => usually subdocument schemas used inside User
 */

// ---- Subdocument schemas (used inside User.model.js) ----
// (These typically export mongoose.Schema objects)
require("./EnrollmentItem");
require("./Notification"); // embedded notifications array on User (NOT the Notification collection)
require("./LanguagePackSubscription");

// ---- Mongoose models (must be registered) ----
require("./LingoCampConfig"); // should export mongoose.model("LingoCampConfig", ...)
require("./RevenueCat"); // mongoose.model("RevenueCatAccount", ...)
require("./RevenueCatAccount.model"); // mongoose.model("User", ...)
require("./RevenueCatSimple"); // mongoose.model("User", ...)
require("./RevenueCatWebhookCall"); // mongoose.model("User", ...)
require("./Notification.model"); // mongoose.model("Notification", ...)
require("./User.model"); // mongoose.model("User", ...)
require("./LanguagePack.model"); // mongoose.model("User", ...)
require("./lexicon/UserEngagement.model");
require("./lexicon/DailyGoalProgress.model");
require("./lexicon/WeeklyRoadmapProgress.model");
require("./auth/RefreshToken.model");
// You can optionally export the models for convenience:
const mongoose = require("mongoose");

module.exports = {
  User: mongoose.models.User,
  Notification: mongoose.models.Notification,
  RevenueCatAccount: mongoose.models.RevenueCatAccount,
  LingoCampConfig: mongoose.models.LingoCampConfig,
};
