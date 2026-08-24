"use strict";

const express = require("express");
const router = express.Router();
const reelsController = require("../controllers/reels.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", reelsController.getReels);
router.get("/story/:storySlug", reelsController.getStoryReels);
router.post("/:id/like", reelsController.likeReel);
router.post("/", authMiddleware.optionalAuth, reelsController.createReel);

module.exports = router;
