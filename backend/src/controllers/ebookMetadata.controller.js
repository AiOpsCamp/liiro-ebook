"use strict";

const EbookAuthor = require("../models/EbookAuthor.model");
const EbookCategory = require("../models/EbookCategory.model");
const EbookTag = require("../models/EbookTag.model");
const Story = require("../models/Story.model");

// ── Authors ─────────────────────────────────────────────────────────────
exports.getAuthors = async (req, res) => {
  try {
    const authors = await EbookAuthor.find({})
      .sort({ bookCount: -1, name: 1 })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel isPremium contentType tags", strictPopulate: false })
      .lean();

    res.status(200).json({ success: true, count: authors.length, data: authors });
  } catch (error) {
    console.error("Error in getAuthors:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAuthorBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const author = await EbookAuthor.findOne({ slug })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds isPremium contentType tags synopsis", strictPopulate: false })
      .lean();

    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    res.status(200).json({ success: true, data: author });
  } catch (error) {
    console.error("Error in getAuthorBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Categories ──────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const categories = await EbookCategory.find({})
      .sort({ bookCount: -1, name: 1 })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel isPremium contentType tags", strictPopulate: false })
      .lean();

    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await EbookCategory.findOne({ slug })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds isPremium contentType tags synopsis", strictPopulate: false })
      .lean();

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error("Error in getCategoryBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Tags ────────────────────────────────────────────────────────────────
exports.getTags = async (req, res) => {
  try {
    const tags = await EbookTag.find({})
      .sort({ bookCount: -1, name: 1 })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel isPremium contentType tags", strictPopulate: false })
      .lean();

    res.status(200).json({ success: true, count: tags.length, data: tags });
  } catch (error) {
    console.error("Error in getTags:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getTagBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tag = await EbookTag.findOne({ slug })
      .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds isPremium contentType tags synopsis", strictPopulate: false })
      .lean();

    if (!tag) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    res.status(200).json({ success: true, data: tag });
  } catch (error) {
    console.error("Error in getTagBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Stats ───────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const totalStories = await Story.countDocuments({ isPublished: true });
    const totalCategories = await EbookCategory.countDocuments({});
    const totalAuthors = await EbookAuthor.countDocuments({});
    const totalTags = await EbookTag.countDocuments({});

    return res.status(200).json({
      success: true,
      data: {
        totalStories,
        totalCategories,
        totalAuthors,
        totalTags,
      },
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
