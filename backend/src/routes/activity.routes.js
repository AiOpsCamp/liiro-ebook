"use strict";

const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activity.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/activities", authMiddleware.optionalAuth, activityController.logActivity);
router.get("/activities", authMiddleware.optionalAuth, activityController.getUserActivities);
router.get("/notifications", authMiddleware.optionalAuth, activityController.getUserNotifications);
router.post("/notifications/:notificationId/read", authMiddleware.optionalAuth, activityController.markNotificationRead);

module.exports = router;
