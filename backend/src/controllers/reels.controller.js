"use strict";

const BookReel = require("../models/BookReel.model");
const Story = require("../models/Story.model");

/**
 * Short Video & Image Book Reels Feed Controller
 */

const CacheManager = require("../utils/cache.utils");

exports.getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `reels_feed_p${page}_l${limit}_s${req.query.storySlug || "all"}`;
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const query = {};
    if (req.query.storySlug) {
      query.storySlug = req.query.storySlug;
    }

    const [reels, total] = await Promise.all([
      BookReel.find(query)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookReel.countDocuments(query),
    ]);

    const responseData = {
      success: true,
      count: reels.length,
      total,
      page,
      data: reels,
    };

    await CacheManager.set(cacheKey, responseData, 300);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getReels:", error);
    res.status(500).json({ success: false, message: "Server error fetching book reels" });
  }
};

exports.getStoryReels = async (req, res) => {
  try {
    const { storySlug } = req.params;
    const reels = await BookReel.find({ storySlug }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: reels.length,
      data: reels,
    });
  } catch (error) {
    console.error("Error in getStoryReels:", error);
    res.status(500).json({ success: false, message: "Server error fetching story reels" });
  }
};

exports.likeReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await BookReel.findByIdAndUpdate(id, { $inc: { likesCount: 1 } }, { new: true });
    if (!reel) {
      return res.status(404).json({ success: false, message: "Reel not found" });
    }
    res.status(200).json({ success: true, likesCount: reel.likesCount });
  } catch (error) {
    console.error("Error in likeReel:", error);
    res.status(500).json({ success: false, message: "Server error liking reel" });
  }
};

exports.createReel = async (req, res) => {
  try {
    const { storySlug, storyTitle, mediaType, mediaUrl, posterUrl, audioUrl, caption, creatorName, creatorAvatarUrl, tags } = req.body;
    if (!mediaUrl || !caption) {
      return res.status(400).json({ success: false, message: "mediaUrl and caption are required" });
    }

    let storyId = null;
    if (storySlug) {
      const story = await Story.findOne({ slug: storySlug }).select("_id").lean();
      if (story) storyId = story._id;
    }

    const reel = await BookReel.create({
      storyId,
      storySlug,
      storyTitle: storyTitle || "Bookish Aesthetic",
      bookTitlePill: storyTitle ? `📖 ${storyTitle}` : "📖 Discovery Reel",
      creatorName: creatorName || "Liiro Curators",
      creatorAvatarUrl: creatorAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
      mediaType: mediaType || "video",
      mediaUrl,
      posterUrl,
      audioUrl,
      caption,
      tags: tags || ["classics", "audiobook"],
    });

    res.status(201).json({ success: true, data: reel });
  } catch (error) {
    console.error("Error in createReel:", error);
    res.status(500).json({ success: false, message: "Server error creating reel" });
  }
};
