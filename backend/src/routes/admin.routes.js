const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const adminMiddleware = require("../middlewares/adminMiddleware");

// Guard all admin routes with adminMiddleware
router.use(adminMiddleware);

// KPI Overview Stats
router.get("/stats", adminController.getAdminStats);

// Story Management Endpoints
router.get("/stories", adminController.listAdminStories);
router.patch("/stories/:id/toggle-feature", adminController.toggleFeatureStory);
router.patch("/stories/:id/metadata", adminController.updateStoryMetadata);
router.get("/stories/:id/chapters", adminController.getStoryChaptersAdmin);

module.exports = router;
