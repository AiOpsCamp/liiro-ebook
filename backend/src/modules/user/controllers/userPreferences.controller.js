"use strict";
/**
 * src/controllers/user/userPreferences.controller.js  (drop-ready replacement)
 * -----------------------------------------------------------------------------
 * Fixes the validation error:
 *   User validation failed: recentlyViewedPacks.X.slug is required
 *
 * Root cause:
 *   Calling `user.save()` triggers validation for the whole User document,
 *   including old invalid subdocs in recentlyViewedPacks.
 *
 * Best fix (safe + production-friendly):
 *   - Never save the whole User doc here.
 *   - Update `onBoarding` using updateOne (no full validation).
 *   - Create/update preferences in the preferences model only.
 * -----------------------------------------------------------------------------
 */
const mongoose = require("mongoose");
const User = require("../../../models/User.model");

// This model is registered as "LingoCampConfig" in User schema ref
const UserPreferencesModel = require("../../../models/UserPreferences.model");

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Korean",
  "Italian",
  "Portuguese",
  "Russian",
  "Bengali",
];

function _asString(v) {
  return typeof v === "string" ? v.trim() : v;
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * GET /api/v1/lingocamp/config (or legacy)
 * Retrieves user's preferences/config
 */
async function getUserPreferences(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;

    const user = await User.findById(userId).populate({
      path: "lingoCampConfig",
      populate: { path: "languagePackId", model: "LanguagePack" },
    });

    if (!user) {
      return res.status(404).send({ message: "User not found", success: false });
    }

    const prefs = user.lingoCampConfig;
    const languagePack = prefs?.languagePackId;

    // Ensure languagePack.features has defaults (defensive)
    const defaultFeatures = {
      courses: false,
      vocabularyPacks: true,
      listeningExercises: false,
      readingExercises: false,
      dialogs: false,
      interactiveLearn: false,
      skillCircuit: false,
    };

    if (languagePack) {
      let updateNeeded = false;

      if (!languagePack.features) {
        languagePack.features = defaultFeatures;
        updateNeeded = true;
      } else {
        for (const key of Object.keys(defaultFeatures)) {
          if (typeof languagePack.features[key] === "undefined") {
            languagePack.features[key] = defaultFeatures[key];
            updateNeeded = true;
          }
        }
      }

      if (updateNeeded) await languagePack.save();
    }

    // subscription check against selected language pack
    let hasSubscription = false;
    if (user.languagePackSubscriptions?.length > 0 && languagePack?._id) {
      const languagePackId = String(languagePack._id);
      hasSubscription = user.languagePackSubscriptions.some(
        (sub) => String(sub.languagePackId) === languagePackId
      );
    }

    return res.send({
      message: "Language configuration fetched successfully",
      success: true,
      data: prefs,
      subscription: hasSubscription,
    });
  } catch (error) {
    console.error("getUserPreferences error:", error);
    return res.status(500).send({
      message: "Server error",
      data: error.message,
      success: false,
    });
  }
}

/**
 * PUT /api/v1/lingocamp/config (or legacy)
 * Updates user's preferences/config (partial update)
 *
 * IMPORTANT:
 * - Avoids user.save() to prevent validation failures from old invalid subdocs.
 */
async function updateUserPreferences(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;

    const {
      defaultLanguage,
      userLanguage,
      languagePackId,
      levelOrProficiency,
      dailyWeeklyLearningGoals,
      interests,
      tags,
    } = req.body || {};

    // Load minimal fields only (don’t hydrate entire doc arrays)
    const user = await User.findById(userId).select("_id lingoCampConfig onBoarding").lean(false);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    // Validate interests if provided
    let sanitizedInterests = [];
    if (Array.isArray(interests)) {
      for (const i of interests) {
        if (mongoose.Types.ObjectId.isValid(i)) {
          sanitizedInterests.push(i);
        } else if (typeof i === "string") {
          const cat = await mongoose.connection.db.collection("lexiconcategories").findOne({
            $or: [{ "name.en": new RegExp(`^${i}$`, "i") }, { slug: new RegExp(`^${i}$`, "i") }],
          });
          if (cat) sanitizedInterests.push(String(cat._id));
        }
      }
    }

    // Validate tags if provided
    let sanitizedTags = [];
    if (Array.isArray(tags)) {
      for (const t of tags) {
        if (mongoose.Types.ObjectId.isValid(t)) {
          sanitizedTags.push(t);
        } else if (typeof t === "string") {
          const tag = await mongoose.connection.db.collection("lexicontags").findOne({
            "name.en": new RegExp(`^${t}$`, "i"),
          });
          if (tag) sanitizedTags.push(String(tag._id));
        }
      }
    }

    const hasPayload =
      typeof defaultLanguage !== "undefined" ||
      typeof userLanguage !== "undefined" ||
      typeof languagePackId !== "undefined" ||
      typeof levelOrProficiency !== "undefined" ||
      typeof dailyWeeklyLearningGoals !== "undefined" ||
      typeof sanitizedInterests !== "undefined" ||
      typeof sanitizedTags !== "undefined";

    if (!hasPayload) {
      return res.status(400).json({
        message: "At least one configuration field is required",
        success: false,
      });
    }

    // Load or create config doc
    let config = user.lingoCampConfig
      ? await UserPreferencesModel.findById(user.lingoCampConfig)
      : null;

    if (!config) {
      config = await UserPreferencesModel.create({
        defaultLanguage: isNonEmptyString(defaultLanguage) ? defaultLanguage : "English",
        userLanguage: isNonEmptyString(userLanguage) ? userLanguage : "Finnish",
        languagePackId: languagePackId ?? undefined,
        levelOrProficiency: isNonEmptyString(levelOrProficiency) ? levelOrProficiency : "",
        dailyWeeklyLearningGoals: isNonEmptyString(dailyWeeklyLearningGoals)
          ? dailyWeeklyLearningGoals
          : "",
        interests: sanitizedInterests ?? [],
        tags: sanitizedTags ?? [],
      });

      // Link config to user without triggering validation on the full user doc
      await User.updateOne({ _id: user._id }, { $set: { lingoCampConfig: config._id } });
    } else {
      // Partial updates
      if (isNonEmptyString(defaultLanguage)) config.defaultLanguage = defaultLanguage;
      if (isNonEmptyString(userLanguage)) config.userLanguage = userLanguage;
      if (isNonEmptyString(languagePackId)) config.languagePackId = languagePackId;
      if (typeof levelOrProficiency !== "undefined") config.levelOrProficiency = levelOrProficiency;
      if (typeof dailyWeeklyLearningGoals !== "undefined") {
        config.dailyWeeklyLearningGoals = dailyWeeklyLearningGoals;
      }
      if (typeof sanitizedInterests !== "undefined") {
        config.interests = sanitizedInterests;
      }
      if (typeof sanitizedTags !== "undefined") {
        config.tags = sanitizedTags;
      }
      await config.save();
    }

    // ✅ Set onboarding flag using updateOne (no full User validation)
    if (!user.onBoarding) {
      await User.updateOne({ _id: user._id }, { $set: { onBoarding: true } });
    }

    return res.json({
      message: "Language configuration updated successfully",
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("updateUserPreferences error:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      data: error.message,
    });
  }
}

async function getAvailableLanguages(req, res) {
  try {
    return res.send({
      message: "Languages fetched successfully",
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error("getAvailableLanguages error:", error);
    return res.status(500).send({
      message: "Server error",
      data: error.message,
      success: false,
    });
  }
}

/**
 * Backward-compatible exports (so old routes still work without change)
 */
module.exports = {
  // generic names
  getUserPreferences,
  updateUserPreferences,
  getAvailableLanguages,

  // legacy names used by your old routes
  getLanguageConfig: getUserPreferences,
  updateLanguageConfig: updateUserPreferences,
  getLanguages: getAvailableLanguages,
};
