"use strict";

const router = require("express").Router();
const authMiddleware = require("../../../middlewares/authMiddleware.js");

const userPreferencesController = require("../controllers/userPreferences.controller.js");

/**
 * OLD endpoints (keep for backward compatibility)
 */
router.get("/lingoCampConfig", authMiddleware, userPreferencesController.getLanguageConfig);
router.put("/lingoCampConfig", authMiddleware, userPreferencesController.updateLanguageConfig);

/**
 * NEW generic endpoints (preferred)
 * These do the exact same thing as /lingoCampConfig
 */
router.get("/config", authMiddleware, userPreferencesController.getLanguageConfig);
router.put("/config", authMiddleware, userPreferencesController.updateLanguageConfig);

/**
 * Languages list (already generic)
 */
router.get("/languages", userPreferencesController.getLanguages);

module.exports = router;
