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

// User Analytics, Reading Streaks & Social Sharing Endpoints
router.get("/user/analytics/summary", authMiddleware.optionalAuth, storyController.getUserAnalyticsSummary);
router.get("/user/analytics/heatmap", authMiddleware.optionalAuth, storyController.getUserAnalyticsHeatmap);
router.get("/user/streak", authMiddleware.optionalAuth, storyController.getUserStreak);
router.post("/user/streak/freeze", authMiddleware.optionalAuth, storyController.freezeUserStreak);
const reviewController = require("../controllers/review.controller");
const summaryController = require("../controllers/summary.controller");

// Dedicated Book & Goodreads Review Endpoints
router.get("/slug/:slug/reviews", reviewController.getStoryReviews);
router.post("/slug/:slug/reviews", authMiddleware.optionalAuth, reviewController.addReview);
router.post("/reviews/:reviewId/like", reviewController.likeReview);
router.get("/slug/:slug/export/epub", storyController.exportStoryEpub);
router.get("/slug/:slug/summary", summaryController.getBookSummary);
router.get("/share/:slug", storyController.getStoryShareMetadata);
// Dedicated Whispersync Bi-Directional Position Sync Engine
router.post("/whispersync", authMiddleware.optionalAuth, storyController.syncWhispersyncPosition);
router.get("/whispersync", authMiddleware.optionalAuth, storyController.getWhispersyncPosition);
router.get("/slug/:slug/whispersync", authMiddleware.optionalAuth, storyController.getWhispersyncPosition);

// 2-Hour DRM HMAC Pre-Signed Hetzner S3 Stream Token & Proxy Endpoints
router.get("/slug/:slug/stream-token", authMiddleware.optionalAuth, storyController.getStreamToken);
router.post("/slug/:slug/stream-token", authMiddleware.optionalAuth, storyController.getStreamToken);
router.get("/slug/:slug/stream", storyController.streamAudio);

// Enterprise HLS Audio Streaming & Transcoding Endpoints (.m3u8 & .ts segments)
router.get("/slug/:slug/hls/:chapterNumber/playlist.m3u8", storyController.getHLSPlaylist);
router.get("/slug/:slug/hls/:chapterNumber/:segmentFile", storyController.getHLSSegment);
router.post("/slug/:slug/hls/transcode", authMiddleware, storyController.transcodeStoryToHLS);

// AI Vector Search & Semantic Recommendation Engine Endpoints
router.get("/recommendations/personalized", authMiddleware.optionalAuth, storyController.getPersonalizedRecommendations);
router.get("/slug/:slug/recommendations", storyController.getStoryRecommendations);

// Background Queue Worker Status Endpoint
router.get("/queue/status", authMiddleware, storyController.getQueueStatus);

// Core Story Routes (Optional Auth so verified JWT user state is attached if token is present)
router.get("/dashboard", authMiddleware.optionalAuth, storyController.getStoriesDashboard);
router.get("/", authMiddleware.optionalAuth, storyController.getStories);
router.get("/slug/:slug", authMiddleware.optionalAuth, storyController.getStoryDetails);
router.get("/slug/:slug/chapters/:chapterId", authMiddleware.optionalAuth, storyController.getChapterContent);

// Protected User Progress, Bookmarks & Highlights Routes (Strict JWT Auth Required)
router.post("/progress/batch", authMiddleware.optionalAuth, storyController.batchSyncProgress);
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
