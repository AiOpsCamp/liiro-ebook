"use strict";

const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activity.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const streakController = require("../controllers/streak.controller");

router.post("/activities", authMiddleware.optionalAuth, activityController.logActivity);
router.get("/activities", authMiddleware.optionalAuth, activityController.getUserActivities);
router.get("/notifications", authMiddleware.optionalAuth, activityController.getUserNotifications);
router.post("/notifications/:notificationId/read", authMiddleware.optionalAuth, activityController.markNotificationRead);

// Gamified Reading Streaks & Achievements
router.get("/streaks", authMiddleware.optionalAuth, streakController.getUserStreak);
router.post("/streaks/ping", authMiddleware.optionalAuth, streakController.pingDailyStreak);
router.get("/achievements", authMiddleware.optionalAuth, streakController.getUserAchievements);
router.post("/share-status", authMiddleware.optionalAuth, streakController.generateSocialQuoteCard);

module.exports = router;
