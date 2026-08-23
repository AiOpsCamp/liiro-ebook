"use strict";

const express = require("express");
const router = express.Router();
const storyController = require("../controllers/story.controller");
const ebookMetadataController = require("../controllers/ebookMetadata.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Metadata Routes: Authors, Categories, Tags, Series
router.get("/authors", ebookMetadataController.getAuthors);
router.get("/authors/:slug", ebookMetadataController.getAuthorBySlug);

router.get("/categories", ebookMetadataController.getCategories);
router.get("/categories/:slug", ebookMetadataController.getCategoryBySlug);

router.get("/tags", ebookMetadataController.getTags);
router.get("/tags/:slug", ebookMetadataController.getTagBySlug);

router.get("/series", storyController.getBookSeries);
router.get("/series/:slug", storyController.getBookSeriesBySlug);

// Dedicated Search Endpoint
router.get("/search", storyController.searchStories);

// Dedicated User Library & Bookmark Aggregate Endpoints
router.get("/user/library", authMiddleware, storyController.getUserLibrary);
router.get("/user/bookmarks", authMiddleware, storyController.getUserBookmarks);
router.get("/user/highlights", authMiddleware, storyController.getUserHighlights);
router.post("/progress/batch", authMiddleware, storyController.batchSyncProgress);

// Core Story Routes (Optional Auth so verified JWT user state is attached if token is present)
router.get("/dashboard", authMiddleware.optionalAuth, storyController.getStoriesDashboard);
router.get("/", authMiddleware.optionalAuth, storyController.getStories);
router.get("/slug/:slug", authMiddleware.optionalAuth, storyController.getStoryDetails);
router.get("/slug/:slug/chapters/:chapterId", authMiddleware.optionalAuth, storyController.getChapterContent);

// Protected User Progress, Bookmarks & Highlights Routes (Strict JWT Auth Required)
router.post("/slug/:slug/progress", authMiddleware, storyController.syncProgress);
router.post("/slug/:slug/progress/reset", authMiddleware, storyController.resetProgress);
router.post("/slug/:slug/progress/complete", authMiddleware, storyController.markCompleted);
router.post("/slug/:slug/bookmark", authMiddleware, storyController.toggleBookmark);
router.post("/slug/:slug/highlights", authMiddleware, storyController.addHighlight);
router.delete("/slug/:slug/highlights/:highlightId", authMiddleware, storyController.deleteHighlight);

// Legacy / Direct Slug Fallbacks (MUST BE AT VERY BOTTOM)
router.get("/:idOrSlug", authMiddleware.optionalAuth, storyController.getStoryDetails);
router.get("/:slug/chapters/:chapterId", authMiddleware.optionalAuth, storyController.getChapterContent);
router.post("/:slug/progress", authMiddleware, storyController.syncProgress);
router.post("/:slug/bookmark", authMiddleware, storyController.toggleBookmark);

module.exports = router;
