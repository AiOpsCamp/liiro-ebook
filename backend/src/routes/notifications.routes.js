"use strict";

const express = require("express");
const router = express.Router();
const notificationsController = require("../modules/user/controllers/notifications.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, notificationsController.list);
router.get("/unread-count", authMiddleware, notificationsController.unreadCount);
router.post("/mark-read", authMiddleware, notificationsController.markReadMany);
router.post("/mark-all-read", authMiddleware, notificationsController.markReadAll);

module.exports = router;
