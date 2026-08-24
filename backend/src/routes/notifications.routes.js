"use strict";

const express = require("express");
const router = express.Router();
const notificationsController = require("../modules/user/controllers/notifications.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware.optionalAuth, notificationsController.list);
router.get("/unread-count", authMiddleware.optionalAuth, notificationsController.unreadCount);
router.post("/mark-read", authMiddleware.optionalAuth, notificationsController.markReadMany);
router.post("/mark-all-read", authMiddleware.optionalAuth, notificationsController.markReadAll);

module.exports = router;
