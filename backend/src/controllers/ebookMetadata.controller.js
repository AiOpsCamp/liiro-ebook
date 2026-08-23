"use strict";

const EbookAuthor = require("../models/EbookAuthor.model");
const EbookCategory = require("../models/EbookCategory.model");
const EbookTag = require("../models/EbookTag.model");
const Story = require("../models/Story.model");
const CacheManager = require("../utils/cache.utils");

// ── Authors ─────────────────────────────────────────────────────────────
exports.getAuthors = async (req, res) => {
  try {
    const cached = CacheManager.get("authors_list");
    if (cached) {
      return res.status(200).json(cached);
    }

    const authors = await EbookAuthor.find({})
      .sort({ bookCount: -1, name: 1 })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel isPremium contentType tags", strictPopulate: false })
      .lean();

    const responseData = { success: true, count: authors.length, data: authors };
    CacheManager.set("authors_list", responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getAuthors:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAuthorBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `author_slug_${slug}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const author = await EbookAuthor.findOne({ slug })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds isPremium contentType tags synopsis", strictPopulate: false })
      .lean();

    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    const responseData = { success: true, data: author };
    CacheManager.set(cacheKey, responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getAuthorBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Categories ──────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const cached = CacheManager.get("categories_list");
    if (cached) {
      return res.status(200).json(cached);
    }

    const categories = await EbookCategory.find({})
      .sort({ bookCount: -1, name: 1 })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel isPremium contentType tags", strictPopulate: false })
      .lean();

    const responseData = { success: true, count: categories.length, data: categories };
    CacheManager.set("categories_list", responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `category_slug_${slug}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const category = await EbookCategory.findOne({ slug })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds isPremium contentType tags synopsis", strictPopulate: false })
      .lean();

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const responseData = { success: true, data: category };
    CacheManager.set(cacheKey, responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getCategoryBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Tags ────────────────────────────────────────────────────────────────
exports.getTags = async (req, res) => {
  try {
    const cached = CacheManager.get("tags_list");
    if (cached) {
      return res.status(200).json(cached);
    }

    const tags = await EbookTag.find({})
      .sort({ bookCount: -1, name: 1 })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel isPremium contentType tags", strictPopulate: false })
      .lean();

    const responseData = { success: true, count: tags.length, data: tags };
    CacheManager.set("tags_list", responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getTags:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getTagBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `tag_slug_${slug}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const tag = await EbookTag.findOne({ slug })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds isPremium contentType tags synopsis", strictPopulate: false })
      .lean();

    if (!tag) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    const responseData = { success: true, data: tag };
    CacheManager.set(cacheKey, responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getTagBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Stats ───────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const cached = CacheManager.get("stats_summary");
    if (cached) {
      return res.status(200).json(cached);
    }

    const [totalStories, totalCategories, totalAuthors, totalTags] = await Promise.all([
      Story.countDocuments({ isPublished: true }),
      EbookCategory.countDocuments({}),
      EbookAuthor.countDocuments({}),
      EbookTag.countDocuments({}),
    ]);

    const responseData = {
      success: true,
      data: {
        totalStories,
        totalCategories,
        totalAuthors,
        totalTags,
      },
    };
    CacheManager.set("stats_summary", responseData, 300);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getStats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
