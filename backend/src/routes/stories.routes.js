"use strict";

const express = require("express");
const router = express.Router();
const storyController = require("../controllers/story.controller");
const ebookMetadataController = require("../controllers/ebookMetadata.controller");

// Metadata Routes: Authors, Categories, Tags, Series
router.get("/authors", ebookMetadataController.getAuthors);
router.get("/authors/:slug", ebookMetadataController.getAuthorBySlug);

router.get("/categories", ebookMetadataController.getCategories);
router.get("/categories/:slug", ebookMetadataController.getCategoryBySlug);

router.get("/tags", ebookMetadataController.getTags);
router.get("/tags/:slug", ebookMetadataController.getTagBySlug);

router.get("/series", storyController.getBookSeries);
router.get("/series/:slug", storyController.getBookSeriesBySlug);

// Core Story Routes
router.get("/dashboard", storyController.getStoriesDashboard);
router.get("/", storyController.getStories);
router.get("/slug/:slug", storyController.getStoryDetails);
router.get("/slug/:slug/chapters/:chapterId", storyController.getChapterContent);
router.post("/slug/:slug/progress", storyController.syncProgress);
router.post("/slug/:slug/progress/reset", storyController.resetProgress);
router.post("/slug/:slug/progress/complete", storyController.markCompleted);
router.post("/slug/:slug/bookmark", storyController.toggleBookmark);
router.post("/slug/:slug/highlights", storyController.addHighlight);
router.delete("/slug/:slug/highlights/:highlightId", storyController.deleteHighlight);

// Legacy / Direct Slug Fallbacks
router.get("/:idOrSlug", storyController.getStoryDetails);
router.get("/:slug/chapters/:chapterId", storyController.getChapterContent);
router.post("/:slug/progress", storyController.syncProgress);
router.post("/:slug/bookmark", storyController.toggleBookmark);

module.exports = router;
