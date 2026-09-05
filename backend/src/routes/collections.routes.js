const express = require("express");
const router = express.Router();
const collectionController = require("../controllers/collection.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// All collection routes support optionalAuth (or guest-id)
router.use(authMiddleware.optionalAuth);

// List & Create
router.get("/", collectionController.getCollections);
router.post("/", collectionController.createCollection);

// Check collections for a story
router.get("/story/:storyIdentifier", collectionController.getStoryCollections);

// Single Collection operations
router.get("/slug/:slug", collectionController.getCollectionBySlug);
router.patch("/:id", collectionController.updateCollection);
router.delete("/:id", collectionController.deleteCollection);

// Manage stories in a collection
router.post("/:id/stories", collectionController.addStoryToCollection);
router.delete("/:id/stories/:storyId", collectionController.removeStoryFromCollection);

module.exports = router;
