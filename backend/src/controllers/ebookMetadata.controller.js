"use strict";

const EbookAuthor = require("../models/EbookAuthor.model");
const EbookCategory = require("../models/EbookCategory.model");
const EbookTag = require("../models/EbookTag.model");
const Story = require("../models/Story.model");
const CacheManager = require("../utils/cache.utils");

// ── Authors ─────────────────────────────────────────────────────────────
exports.getAuthors = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    if (page || limit || search) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 24));
      const skip = (pageNum - 1) * limitNum;

      const filter = {};
      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const [authors, total] = await Promise.all([
        EbookAuthor.find(filter)
          .sort({ bookCount: -1, name: 1 })
          .skip(skip)
          .limit(limitNum)
          .populate({ path: "books", select: "title slug coverImageUrl author difficultyLevel isPremium contentType tags", strictPopulate: false })
          .lean(),
        EbookAuthor.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        count: authors.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        data: authors,
      });
    }

    const cached = await CacheManager.get("authors_list");
    if (cached) {
      return res.status(200).json(cached);
    }

    const authors = await EbookAuthor.find({})
      .select("-books")
      .sort({ bookCount: -1, name: 1 })
      .limit(100)
      .lean();

    const responseData = { success: true, count: authors.length, data: authors };
    await CacheManager.set("authors_list", responseData, 600);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getAuthors:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Narrators ───────────────────────────────────────────────────────────
const Narrator = require("../models/Narrator.model");

exports.getNarrators = async (req, res) => {
  try {
    const narrators = [
      { name: "Adam", slug: "adam", bio: "Resonant, clear storytelling voice profile", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300", catalogCount: 42, voiceId: "am_adam" },
      { name: "Michael", slug: "michael", bio: "Warm, authoritative classic literature narrator", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300", catalogCount: 38, voiceId: "am_michael" },
      { name: "Bella", slug: "bella", bio: "Expressive, engaging narrative voice", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300", catalogCount: 29, voiceId: "af_bella" },
      { name: "Heart", slug: "heart", bio: "Soothing, immersive storytelling voice", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300", catalogCount: 24, voiceId: "af_heart" },
    ];

    res.status(200).json({ success: true, count: narrators.length, data: narrators });
  } catch (error) {
    console.error("Error in getNarrators:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAuthorBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `author_slug_v3_${slug}`;
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    let author = await EbookAuthor.findOne({ slug }).lean();
    let authorName = author ? author.name : slug.replace(/-/g, " ");

    const cleanSlug = slug.replace(/-/g, " ");
    const parts = cleanSlug.split(" ").filter(Boolean);
    const regexPattern = parts.join(".*");
    const nameRegex = new RegExp(regexPattern, "i");

    const books = await Story.find({
      $or: [
        { author: nameRegex },
        ...(author ? [{ authorId: author._id }, { author: author.name }] : []),
      ],
      isPublished: true,
    })
      .select("title slug coverImageUrl author difficultyLevel totalDurationSeconds totalAudioDurationSec isPremium contentType tags synopsis hasAudio isAudiobook")
      .lean();

    if (!author && books.length === 0) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    const responseData = {
      success: true,
      data: {
        _id: author?._id || null,
        name: author?.name || authorName.replace(/\b\w/g, l => l.toUpperCase()),
        slug: slug,
        avatarUrl: author?.avatarUrl || (books[0]?.coverImageUrl || ""),
        bio: author?.bio || `Collection of masterworks by ${author?.name || authorName}.`,
        bookCount: books.length,
        books,
      },
    };
    await CacheManager.set(cacheKey, responseData, 600);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getAuthorBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Categories ──────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const cached = await CacheManager.get("categories_list_v5");
    if (cached) {
      return res.status(200).json(cached);
    }

    const categories = await EbookCategory.find({})
      .select("-books")
      .sort({ name: 1 })
      .lean();

    const categoryCounts = await Story.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } }
    ]);
    const countMap = new Map(categoryCounts.map(c => [c._id ? c._id.toString() : "", c.count]));

    const formattedCategories = categories.map((cat) => ({
      ...cat,
      bookCount: countMap.get(cat._id.toString()) || 0,
    }));

    const responseData = { success: true, count: formattedCategories.length, data: formattedCategories };
    await CacheManager.set("categories_list_v5", responseData, 600);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `category_slug_v6_${slug}`;
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const category = await EbookCategory.findOne({ slug }).lean();

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const books = await Story.find({
      isPublished: true,
      $or: [
        { categoryId: category._id },
        { category: category.slug },
        { category: category.name },
        { tags: category.slug }
      ]
    })
      .select("title slug coverImageUrl author authorName difficultyLevel totalDurationSeconds totalAudioDurationSec isPremium contentType tags synopsis hasAudio isAudiobook hasArtworks isIllustrated illustrationsCount")
      .lean();

    const responseData = {
      success: true,
      data: {
        ...category,
        bookCount: books.length,
        books,
      },
    };
    await CacheManager.set(cacheKey, responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getCategoryBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Tags ────────────────────────────────────────────────────────────────
exports.getTags = async (req, res) => {
  try {
    const cached = await CacheManager.get("tags_list_v5");
    if (cached) {
      return res.status(200).json(cached);
    }

    const tags = await EbookTag.find({})
      .select("-books")
      .sort({ bookCount: -1, name: 1 })
      .limit(300)
      .lean();

    const responseData = { success: true, count: tags.length, data: tags };
    await CacheManager.set("tags_list_v5", responseData, 600);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getTags:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getTagBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `tag_slug_v5_${slug}`;
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    let tag = await EbookTag.findOne({ slug }).lean();
    if (!tag) {
      const nameFromSlug = slug.replace(/-/g, " ");
      tag = await EbookTag.findOne({
        $or: [
          { slug: slug },
          { name: { $regex: new RegExp(`^${nameFromSlug.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }
        ]
      }).lean();
    }

    const tagIdentifier = tag ? tag.name : slug.replace(/-/g, " ");
    const matchTargets = [slug, tagIdentifier];
    if (tag && tag._id) matchTargets.push(tag._id);

    const books = await Story.find({
      isPublished: true,
      tags: { $in: matchTargets }
    })
      .select("title slug coverImageUrl author authorName difficultyLevel totalDurationSeconds totalAudioDurationSec isPremium contentType tags synopsis hasAudio isAudiobook hasArtworks isIllustrated illustrationsCount")
      .lean();

    const responseData = {
      success: true,
      data: {
        tag: tag || { name: tagIdentifier, slug },
        bookCount: books.length,
        books,
      },
    };
    await CacheManager.set(cacheKey, responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getTagBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ── Stats ───────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const cached = await CacheManager.get("stats_summary");
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
    await CacheManager.set("stats_summary", responseData, 300);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getStats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
