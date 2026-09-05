const Story = require("../models/Story.model");
const StoryChapter = require("../models/StoryChapter.model");
const EbookCategory = require("../models/EbookCategory.model");
const mongoose = require("mongoose");

const formatTitle = (t) => {
  if (!t) return "Untitled Classic";
  if (typeof t === "string") return t;
  return t.en || Object.values(t)[0] || "Untitled Classic";
};

/**
 * GET /api/v1/admin/stats
 * Overview KPI metrics across the platform
 */
exports.getAdminStats = async (req, res) => {
  try {
    const totalStories = await Story.countDocuments();
    const publishedStories = await Story.countDocuments({ isPublished: true });
    const audioStories = await Story.countDocuments({ hasAudio: true });
    const featuredStories = await Story.countDocuments({ isFeatured: true });
    const totalChapters = await StoryChapter.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        totalStories,
        publishedStories,
        draftStories: totalStories - publishedStories,
        audioStories,
        audioPercentage: totalStories > 0 ? Math.round((audioStories / totalStories) * 100) : 0,
        featuredStories,
        totalChapters
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch admin stats." });
  }
};

/**
 * GET /api/v1/admin/stories
 * Paginated list of stories with filter & search capabilities
 */
exports.listAdminStories = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, category, audioStatus, featured, sort } = req.query;

    const query = {};

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { "title.en": { $regex: sanitized, $options: "i" } },
        { title: { $regex: sanitized, $options: "i" } },
        { slug: { $regex: sanitized, $options: "i" } },
        { authorName: { $regex: sanitized, $options: "i" } },
        { author: { $regex: sanitized, $options: "i" } }
      ];
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (audioStatus === "hasAudio") {
      query.hasAudio = true;
    } else if (audioStatus === "noAudio") {
      query.hasAudio = { $ne: true };
    }

    if (featured === "featured") {
      query.isFeatured = true;
    } else if (featured === "standard") {
      query.isFeatured = { $ne: true };
    }

    let sortObj = { createdAt: -1 };
    if (sort === "title") sortObj = { "title.en": 1, title: 1 };
    if (sort === "chapters") sortObj = { totalChapters: -1 };
    if (sort === "featured") sortObj = { isFeatured: -1, createdAt: -1 };

    const total = await Story.countDocuments(query);
    const stories = await Story.find(query)
      .select("title slug authorName author category coverImageUrl hasAudio isFeatured isPublished totalChapters readTimeMinutes difficultyLevel publishedAt")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = stories.map((s) => ({
      _id: s._id,
      title: formatTitle(s.title),
      slug: s.slug,
      author: s.authorName || s.author || "Classic Author",
      category: typeof s.category === "object" ? (s.category?.name || "Classic") : (s.category || "Classic"),
      coverImageUrl: s.coverImageUrl || "",
      hasAudio: Boolean(s.hasAudio),
      isFeatured: Boolean(s.isFeatured),
      isPublished: Boolean(s.isPublished),
      totalChapters: s.totalChapters || 1,
      readTimeMinutes: s.readTimeMinutes || 30,
      difficultyLevel: s.difficultyLevel || "Standard",
      publishedAt: s.publishedAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        stories: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Admin list stories error:", error);
    return res.status(500).json({ success: false, error: "Failed to list admin stories." });
  }
};

/**
 * PATCH /api/v1/admin/stories/:id/toggle-feature
 * Toggle featured flag for a story
 */
exports.toggleFeatureStory = async (req, res) => {
  try {
    const { id } = req.params;
    let story = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      story = await Story.findById(id);
    } else {
      story = await Story.findOne({ slug: id });
    }

    if (!story) {
      return res.status(404).json({ success: false, error: "Story not found." });
    }

    story.isFeatured = !story.isFeatured;
    await story.save();

    return res.status(200).json({
      success: true,
      message: `Story "${formatTitle(story.title)}" is now ${story.isFeatured ? "Featured ⭐" : "Standard"}.`,
      data: {
        _id: story._id,
        slug: story.slug,
        isFeatured: story.isFeatured
      }
    });
  } catch (error) {
    console.error("Admin toggle feature error:", error);
    return res.status(500).json({ success: false, error: "Failed to toggle feature status." });
  }
};

/**
 * PATCH /api/v1/admin/stories/:id/metadata
 * Update category, author, difficulty, publish status, or synopsis
 */
exports.updateStoryMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, authorName, difficultyLevel, isPublished, isFeatured, synopsis } = req.body;

    let story = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      story = await Story.findById(id);
    } else {
      story = await Story.findOne({ slug: id });
    }

    if (!story) {
      return res.status(404).json({ success: false, error: "Story not found." });
    }

    if (category !== undefined) story.category = category;
    if (authorName !== undefined) {
      story.authorName = authorName;
      story.author = authorName;
    }
    if (difficultyLevel !== undefined) story.difficultyLevel = difficultyLevel;
    if (isPublished !== undefined) story.isPublished = Boolean(isPublished);
    if (isFeatured !== undefined) story.isFeatured = Boolean(isFeatured);
    if (synopsis !== undefined) {
      if (typeof story.synopsis === "object") {
        story.synopsis.en = synopsis;
      } else {
        story.synopsis = synopsis;
      }
    }

    await story.save();

    return res.status(200).json({
      success: true,
      message: "Story metadata updated successfully.",
      data: {
        _id: story._id,
        title: formatTitle(story.title),
        slug: story.slug,
        category: story.category,
        authorName: story.authorName,
        difficultyLevel: story.difficultyLevel,
        isPublished: story.isPublished,
        isFeatured: story.isFeatured
      }
    });
  } catch (error) {
    console.error("Admin update story error:", error);
    return res.status(500).json({ success: false, error: "Failed to update story metadata." });
  }
};

/**
 * GET /api/v1/admin/stories/:id/chapters
 * Inspect chapters and audio alignment health
 */
exports.getStoryChaptersAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    let story = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      story = await Story.findById(id).lean();
    } else {
      story = await Story.findOne({ slug: id }).lean();
    }

    if (!story) {
      return res.status(404).json({ success: false, error: "Story not found." });
    }

    const chapters = await StoryChapter.find({ storyId: story._id })
      .select("chapterNumber title hasAudio audioUrl audioVoices durationSeconds")
      .sort({ chapterNumber: 1 })
      .lean();

    const formattedChapters = chapters.map((ch) => ({
      _id: ch._id,
      chapterNumber: ch.chapterNumber,
      title: formatTitle(ch.title),
      hasAudio: Boolean(ch.hasAudio),
      audioUrl: ch.audioUrl || "",
      voices: Object.keys(ch.audioVoices || {}),
      durationSeconds: ch.durationSeconds || 0
    }));

    return res.status(200).json({
      success: true,
      data: {
        story: {
          _id: story._id,
          title: formatTitle(story.title),
          slug: story.slug,
          hasAudio: Boolean(story.hasAudio),
          totalChapters: chapters.length,
          audioChaptersCount: chapters.filter((c) => c.hasAudio).length
        },
        chapters: formattedChapters
      }
    });
  } catch (error) {
    console.error("Admin story chapters error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch story chapters." });
  }
};
