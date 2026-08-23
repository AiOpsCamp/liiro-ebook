"use strict";

const mongoose = require("mongoose");
const Story = require("../models/Story.model");
const StoryChapter = require("../models/StoryChapter.model");
const UserStoryProgress = require("../models/UserStoryProgress.model");

function localizeMapField(fieldObj, targetLang = "en", fallback = null) {
  if (fieldObj === undefined || fieldObj === null) return fallback;
  if (typeof fieldObj !== "object") return fieldObj;
  const getVal = (k) => (typeof fieldObj.get === "function" ? fieldObj.get(k) : fieldObj[k]);
  return getVal(targetLang) || getVal("en") || fallback;
}

exports.getStories = async (req, res) => {
  try {
    const { language, difficultyLevel, page = "1", limit = "20" } = req.query;

    const filter = { isPublished: true };
    if (language) filter.languages = language;
    if (difficultyLevel) filter.difficultyLevel = difficultyLevel;

    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.min(1000, parseInt(limit));
    const skip = (pageNum - 1) * pageLimit;

    const [stories, total] = await Promise.all([
      Story.find(filter).sort({ title: 1 }).skip(skip).limit(pageLimit).lean(),
      Story.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: stories.length,
      total,
      pagination: { page: pageNum, limit: pageLimit },
      data: stories,
    });
  } catch (error) {
    console.error("Error in getStories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const GUEST_OBJECT_ID = "000000000000000000000000";

function getEffectiveUserId(req) {
  if (!req) return GUEST_OBJECT_ID;
  if (req.user && (req.user._id || req.user.id)) {
    return (req.user._id || req.user.id).toString();
  }
  const headers = req.headers || {};
  const query = req.query || {};
  const headerId = headers["x-guest-id"] || headers["x-user-id"] || query.guestId;
  if (headerId && /^[0-9a-fA-F]{24}$/.test(headerId.toString())) {
    return headerId.toString();
  }
  return GUEST_OBJECT_ID;
}

exports.getStoriesDashboard = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const RAIL = 50;

    const [allPublished, progressDocs, chapterCounts] = await Promise.all([
      Story.find({ isPublished: true }).sort({ createdAt: -1 }).lean(),
      UserStoryProgress.find({ userId }).sort({ lastVisitedAt: -1, lastReadAt: -1 }).lean(),
      StoryChapter.aggregate([
        { $group: { _id: "$storyId", totalChapters: { $sum: 1 } } }
      ])
    ]);

    const chapterCountMap = {};
    chapterCounts.forEach((c) => { chapterCountMap[c._id.toString()] = c.totalChapters; });

    const progressMap = {};
    progressDocs.forEach((p) => { progressMap[p.storyId.toString()] = p; });

    const mapStory = (s) => ({
      _id: s._id,
      slug: s.slug,
      title: typeof s.title === "object" ? localizeMapField(s.title, "en", "") : (s.title || ""),
      synopsis: typeof s.synopsis === "object" ? localizeMapField(s.synopsis, "en", "") : (s.synopsis || ""),
      coverImageUrl: s.coverImageUrl,
      difficultyLevel: s.difficultyLevel,
      author: s.author,
      totalDurationSeconds: s.totalDurationSeconds || 0,
      totalChapters: chapterCountMap[s._id.toString()] || 1,
      isPremium: s.isPremium || false,
      isFeatured: s.isFeatured || false,
      featuredRank: s.featuredRank || 0,
      contentType: s.contentType || "ebook",
      tags: Array.isArray(s.tags) ? s.tags.map((t) => (typeof t === "object" ? localizeMapField(t, "en", "") : t)) : [],
      userProgress: progressMap[s._id.toString()] || null,
    });

    const mappedAllPublished = allPublished.map(mapStory);

    let topFeaturedDocs = allPublished
      .filter((s) => s.isFeatured)
      .sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999));
    if (topFeaturedDocs.length < 10) {
      topFeaturedDocs = allPublished.slice(0, 20);
    }
    const topFeatured = topFeaturedDocs.map(mapStory);

    const continueReadingDocs = progressDocs.filter(
      (p) => (p.lastActivityType === "reading" || p.lastReadAt || p.currentChapterId)
    ).sort((a, b) => new Date(b.lastReadAt || b.lastVisitedAt || b.updatedAt).getTime() - new Date(a.lastReadAt || a.lastVisitedAt || a.updatedAt).getTime());

    const continueListeningDocs = progressDocs.filter(
      (p) => (p.lastActivityType === "listening" || p.lastListenedAt || p.audioTimestamp > 0)
    ).sort((a, b) => new Date(b.lastListenedAt || b.updatedAt).getTime() - new Date(a.lastListenedAt || a.updatedAt).getTime());

    const recentlyVisitedDocs = progressDocs.filter(
      (p) => p.lastVisitedAt || p.updatedAt
    ).sort((a, b) => new Date(b.lastVisitedAt || b.updatedAt).getTime() - new Date(a.lastVisitedAt || a.updatedAt).getTime());

    const continueReading = continueReadingDocs
      .map((p) => allPublished.find((s) => s._id.toString() === p.storyId.toString()))
      .filter(Boolean)
      .slice(0, RAIL)
      .map(mapStory);

    const continueListening = continueListeningDocs
      .map((p) => allPublished.find((s) => s._id.toString() === p.storyId.toString()))
      .filter(Boolean)
      .slice(0, RAIL)
      .map(mapStory);

    const recentlyVisited = recentlyVisitedDocs
      .map((p) => allPublished.find((s) => s._id.toString() === p.storyId.toString()))
      .filter(Boolean)
      .slice(0, RAIL)
      .map(mapStory);

    const recentlyReadIds = progressDocs.slice(0, RAIL).map((p) => p.storyId.toString());
    const recentlyRead = recentlyReadIds
      .map((id) => allPublished.find((s) => s._id.toString() === id))
      .filter(Boolean)
      .map(mapStory);

    const newest = allPublished.slice(0, RAIL).map(mapStory);
    const beginner = allPublished.filter((s) => /A1|A2|Beginner/i.test(s.difficultyLevel)).slice(0, RAIL).map(mapStory);
    const intermediate = allPublished.filter((s) => /B1|B2|Intermediate/i.test(s.difficultyLevel)).slice(0, RAIL).map(mapStory);
    const advanced = allPublished.filter((s) => /C1|C2|Advanced/i.test(s.difficultyLevel)).slice(0, RAIL).map(mapStory);

    const tagStr = (t) => typeof t === "string" ? t : (t?.en || t?.fi || Object.values(t || {}).find(Boolean) || "");
    const tagMatch = (s, keyword) => Array.isArray(s.tags) && s.tags.some((t) => tagStr(t).toLowerCase().includes(keyword));
    const horror     = allPublished.filter((s) => tagMatch(s, "horror")).slice(0, RAIL).map(mapStory);
    const adventure  = allPublished.filter((s) => tagMatch(s, "adventure")).slice(0, RAIL).map(mapStory);
    const romance    = allPublished.filter((s) => tagMatch(s, "romance")).slice(0, RAIL).map(mapStory);
    const scifi      = allPublished.filter((s) => tagMatch(s, "sci-fi") || tagMatch(s, "scifi")).slice(0, RAIL).map(mapStory);
    const mystery    = allPublished.filter((s) => tagMatch(s, "mystery") || tagMatch(s, "detective")).slice(0, RAIL).map(mapStory);
    const classic    = allPublished.filter((s) => tagMatch(s, "classic")).slice(0, RAIL).map(mapStory);
    const philosophy = allPublished.filter((s) => tagMatch(s, "philosophy") || tagMatch(s, "stoicism") || tagMatch(s, "ethics")).slice(0, RAIL).map(mapStory);
    const comedy     = allPublished.filter((s) => tagMatch(s, "comedy") || tagMatch(s, "humor") || tagMatch(s, "satire")).slice(0, RAIL).map(mapStory);
    const fantasy    = allPublished.filter((s) => tagMatch(s, "fantasy")).slice(0, RAIL).map(mapStory);
    const thriller   = allPublished.filter((s) => tagMatch(s, "thriller") || tagMatch(s, "spy")).slice(0, RAIL).map(mapStory);
    const gothic     = allPublished.filter((s) => tagMatch(s, "gothic")).slice(0, RAIL).map(mapStory);
    const drama      = allPublished.filter((s) => tagMatch(s, "drama") || tagMatch(s, "play")).slice(0, RAIL).map(mapStory);
    const biography  = allPublished.filter((s) => tagMatch(s, "biography") || tagMatch(s, "memoir")).slice(0, RAIL).map(mapStory);
    const nature     = allPublished.filter((s) => tagMatch(s, "nature") || tagMatch(s, "science")).slice(0, RAIL).map(mapStory);
    const victorian  = allPublished.filter((s) => tagMatch(s, "victorian")).slice(0, RAIL).map(mapStory);
    const russian    = allPublished.filter((s) => tagMatch(s, "russian")).slice(0, RAIL).map(mapStory);
    const french      = allPublished.filter((s) => tagMatch(s, "french")).slice(0, RAIL).map(mapStory);
    const children    = allPublished.filter((s) => tagMatch(s, "children") || tagMatch(s, "young readers") || tagMatch(s, "fairy tale")).slice(0, RAIL).map(mapStory);
    const loveStories = allPublished.filter((s) => tagMatch(s, "love stories") || tagMatch(s, "love story") || tagMatch(s, "romance")).slice(0, RAIL).map(mapStory);
    const psychFiction = allPublished.filter((s) => tagMatch(s, "psychological") || tagMatch(s, "psychological fiction")).slice(0, RAIL).map(mapStory);
    const shortStories = allPublished.filter((s) => tagMatch(s, "short stories") || tagMatch(s, "short story")).slice(0, RAIL).map(mapStory);

    const audiobooks = allPublished
      .filter((s) => s.contentType === "audiobook" || s.contentType === "both")
      .slice(0, RAIL)
      .map(mapStory);

    res.status(200).json({
      success: true,
      data: {
        allPublished: mappedAllPublished,
        topFeatured,
        continueReading,
        continueListening,
        recentlyVisited,
        recentlyRead,
        newest,
        audiobooks,
        byLevel: { beginner, intermediate, advanced },
        byGenre: { horror, adventure, romance, scifi, mystery, classic, philosophy, comedy, fantasy, thriller, gothic, drama, biography, nature, victorian, russian, french, children, loveStories, psychFiction, shortStories },
      },
    });
  } catch (error) {
    console.error("Error in getStoriesDashboard:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const { ingestBookFromStandardEbooks } = require("../utils/standardEbooksFetcher");

exports.getStoryDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    const lang = req.query.lang || req.query.language || "en";
    const userId = getEffectiveUserId(req);

    let story = await Story.findOne({ slug, isPublished: true }).lean();
    if (!story) {
      const slugRegex = new RegExp("^" + slug.replace(/-/g, ".*"), "i");
      story = await Story.findOne({ slug: slugRegex, isPublished: true }).lean();
    }

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    let existingChapters = await StoryChapter.find({ storyId: story._id })
      .sort({ chapterNumber: 1, chapterIndex: 1 })
      .select("_id chapterNumber chapterIndex title durationSeconds audioUrl content textPayload")
      .lean();

    if (
      existingChapters.length <= 1 &&
      existingChapters[0] &&
      (typeof existingChapters[0].content === "object"
        ? existingChapters[0].content.en || ""
        : typeof existingChapters[0].content === "string"
        ? existingChapters[0].content
        : ""
      ).includes("Full text from https://github.com/standardebooks/")
    ) {
      const fresh = await ingestBookFromStandardEbooks(story);
      if (fresh && fresh.length > 0) {
        existingChapters = await StoryChapter.find({ storyId: story._id })
          .sort({ chapterNumber: 1, chapterIndex: 1 })
          .select("_id chapterNumber chapterIndex title durationSeconds audioUrl content textPayload")
          .lean();
      }
    }
    const storyTags = Array.isArray(story.tags) ? story.tags : [];
    const [userProgress, similarDocs, authorDocs, seriesDocs] = await Promise.all([
      userId
        ? UserStoryProgress.findOne({ userId, storyId: story._id }).lean()
        : null,
      Story.find({
        _id: { $ne: story._id },
        isPublished: true,
        $or: [
          ...(storyTags.length > 0 ? [{ tags: { $in: storyTags } }] : []),
          ...(story.author ? [{ author: story.author }] : []),
          ...(story.difficultyLevel ? [{ difficultyLevel: story.difficultyLevel }] : []),
        ],
      })
        .limit(10)
        .select("_id title slug author coverImageUrl difficultyLevel contentType hasAudio isAudiobook totalDurationSeconds totalAudioDurationSec tags")
        .lean(),
      story.author
        ? Story.find({
            _id: { $ne: story._id },
            author: story.author,
            isPublished: true,
          })
            .limit(8)
            .select("_id title slug author coverImageUrl difficultyLevel contentType hasAudio isAudiobook totalDurationSeconds totalAudioDurationSec")
            .lean()
        : Promise.resolve([]),
      story.seriesName
        ? Story.find({
            seriesName: story.seriesName,
            isPublished: true,
          })
            .sort({ seriesOrder: 1 })
            .select("_id title slug author coverImageUrl difficultyLevel contentType hasAudio isAudiobook seriesName seriesOrder")
            .lean()
        : Promise.resolve([]),
    ]);

    const formattedChapters = existingChapters.map((ch) => ({
      ...ch,
      chapterNumber: ch.chapterNumber || ch.chapterIndex || 1,
      title: localizeMapField(ch.title, lang, `Chapter ${ch.chapterNumber || ch.chapterIndex || 1}`),
      durationSeconds: localizeMapField(ch.durationSeconds, lang, 0),
      audioUrl: localizeMapField(ch.audioUrl, lang, null),
    }));

    const formattedSimilarStories = (similarDocs || []).map((s) => ({
      _id: s._id,
      slug: s.slug,
      title: typeof s.title === "object" ? localizeMapField(s.title, lang, "") : (s.title || ""),
      author: s.author,
      coverImageUrl: s.coverImageUrl,
      difficultyLevel: s.difficultyLevel,
      contentType: s.contentType || "ebook",
      hasAudio: s.hasAudio || false,
      isAudiobook: s.isAudiobook || false,
      tags: Array.isArray(s.tags) ? s.tags.map((t) => (typeof t === "object" ? localizeMapField(t, lang, "") : t)) : [],
    }));

    const formattedAuthorStories = (authorDocs || []).map((s) => ({
      _id: s._id,
      slug: s.slug,
      title: typeof s.title === "object" ? localizeMapField(s.title, lang, "") : (s.title || ""),
      author: s.author,
      coverImageUrl: s.coverImageUrl,
      difficultyLevel: s.difficultyLevel,
      contentType: s.contentType || "ebook",
      hasAudio: s.hasAudio || false,
      isAudiobook: s.isAudiobook || false,
    }));

    const formattedSeriesStories = (seriesDocs || []).map((s) => ({
      _id: s._id,
      slug: s.slug,
      title: typeof s.title === "object" ? localizeMapField(s.title, lang, "") : (s.title || ""),
      author: s.author,
      coverImageUrl: s.coverImageUrl,
      difficultyLevel: s.difficultyLevel,
      contentType: s.contentType || "ebook",
      hasAudio: s.hasAudio || false,
      isAudiobook: s.isAudiobook || false,
      seriesName: s.seriesName,
      seriesOrder: s.seriesOrder,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...story,
        title: typeof story.title === "object" ? localizeMapField(story.title, lang, "") : (story.title || ""),
        synopsis: typeof story.synopsis === "object" ? localizeMapField(story.synopsis, lang, "") : (story.synopsis || ""),
        languages: story.languages || ["en"],
        contentType: story.contentType || "ebook",
        chapters: formattedChapters,
        userProgress: userProgress || null,
        similarStories: formattedSimilarStories,
        moreByAuthor: formattedAuthorStories,
        seriesBooks: formattedSeriesStories,
      },
    });
  } catch (error) {
    console.error("Error in getStoryDetails:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getStoryByIdOrSlug = exports.getStoryDetails;

exports.getChapterContent = async (req, res) => {
  try {
    const { slug, chapterId } = req.params;
    const lang = req.query.lang || req.query.language || "en";

    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    let chapter = null;
    if (mongoose.Types.ObjectId.isValid(chapterId)) {
      chapter = await StoryChapter.findOne({ _id: chapterId, storyId: story._id }).lean();
    }
    if (!chapter && /^[0-9]+$/.test(chapterId)) {
      const idx = parseInt(chapterId, 10);
      chapter = await StoryChapter.findOne({
        storyId: story._id,
        $or: [{ chapterNumber: idx }, { chapterIndex: idx }],
      }).lean();
    }
    if (!chapter) {
      chapter = await StoryChapter.findOne({ storyId: story._id }).sort({ chapterNumber: 1, chapterIndex: 1 }).lean();
    }

    const currentText = typeof chapter?.content === "object" ? chapter.content.en || "" : typeof chapter?.content === "string" ? chapter.content : "";
    if (!chapter || currentText.includes("Full text from https://github.com/standardebooks/")) {
      const fresh = await ingestBookFromStandardEbooks(story);
      if (fresh && fresh.length > 0) {
        chapter = fresh[0];
      }
    }

    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter not found" });
    }

    const rawText =
      localizeMapField(chapter.textPayload, lang) ||
      localizeMapField(chapter.content, lang) ||
      (Array.isArray(chapter.paragraphs) && chapter.paragraphs.length > 0
        ? chapter.paragraphs.join("\n\n")
        : typeof chapter.content === "string"
        ? chapter.content
        : "");

    const formattedChapter = {
      ...chapter,
      title: localizeMapField(chapter.title, lang, `Chapter ${chapter.chapterNumber || chapter.chapterIndex || 1}`),
      textPayload: rawText,
      audioUrl: localizeMapField(chapter.audioUrl, lang, null),
      audioVoices: localizeMapField(chapter.audioVoices, lang, null),
      durationSeconds: localizeMapField(chapter.durationSeconds, lang, 0),
      wordTimestamps: localizeMapField(chapter.wordTimestamps, lang, []),
    };

    res.status(200).json({ success: true, data: formattedChapter });
  } catch (error) {
    console.error("Error in getChapterContent:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.syncProgress = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const { slug } = req.params;
    const { currentChapterId, audioTimestamp, scrollOffset, currentPageIdx, activityType = "reading", readerSettings } = req.body;

    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const updateFields = {
      lastVisitedAt: new Date(),
      lastActivityType: activityType,
    };

    if (currentChapterId) {
      updateFields.currentChapterId = currentChapterId;
    } else {
      const firstCh = await StoryChapter.findOne({ storyId: story._id }).sort({ chapterNumber: 1 }).select("_id").lean();
      if (firstCh) updateFields.currentChapterId = firstCh._id;
    }

    if (typeof currentPageIdx === "number") updateFields.currentPageIdx = currentPageIdx;

    if (readerSettings && typeof readerSettings === "object") {
      if (readerSettings.theme) updateFields["readerSettings.theme"] = readerSettings.theme;
      if (readerSettings.fontFamily) updateFields["readerSettings.fontFamily"] = readerSettings.fontFamily;
      if (typeof readerSettings.fontSize === "number") updateFields["readerSettings.fontSize"] = readerSettings.fontSize;
      if (readerSettings.textAlign) updateFields["readerSettings.textAlign"] = readerSettings.textAlign;
      if (typeof readerSettings.containerWidth === "number") updateFields["readerSettings.containerWidth"] = readerSettings.containerWidth;
    }

    if (activityType === "listening") {
      updateFields.lastListenedAt = new Date();
      if (typeof audioTimestamp === "number") updateFields.audioTimestamp = audioTimestamp;
    } else {
      updateFields.lastReadAt = new Date();
      if (typeof scrollOffset === "number") updateFields.scrollOffset = scrollOffset;
    }

    const updateDoc = { $set: updateFields };
    if (updateFields.currentChapterId) {
      updateDoc.$addToSet = { completedChapterIds: updateFields.currentChapterId };
    }

    const progress = await UserStoryProgress.findOneAndUpdate(
      { userId, storyId: story._id },
      updateDoc,
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Error in syncProgress:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.resetProgress = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = getEffectiveUserId(req);

    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const firstChapter = await StoryChapter.findOne({ storyId: story._id }).sort({ chapterNumber: 1 }).select("_id").lean();

    const progress = await UserStoryProgress.findOneAndUpdate(
      { userId, storyId: story._id },
      {
        $set: {
          currentChapterId: firstChapter?._id || null,
          completedChapterIds: [],
          audioTimestamp: 0,
          scrollOffset: 0,
          currentPageIdx: 0,
          isCompleted: false,
          lastVisitedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Error in resetProgress:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.markCompleted = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = getEffectiveUserId(req);
    const { isCompleted = true } = req.body;

    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const chapters = await StoryChapter.find({ storyId: story._id }).select("_id").lean();
    const allChapterIds = chapters.map((c) => c._id);

    const progress = await UserStoryProgress.findOneAndUpdate(
      { userId, storyId: story._id },
      {
        $set: {
          completedChapterIds: isCompleted ? allChapterIds : [],
          isCompleted: isCompleted,
          lastVisitedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Error in markCompleted:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = getEffectiveUserId(req);
    const { chapterId } = req.body;

    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    let progress = await UserStoryProgress.findOne({ userId, storyId: story._id });
    if (!progress) {
      progress = new UserStoryProgress({ userId, storyId: story._id, bookmarkedChapterIds: [] });
    }

    const exists = progress.bookmarkedChapterIds.some((id) => id.toString() === chapterId.toString());
    if (exists) {
      progress.bookmarkedChapterIds = progress.bookmarkedChapterIds.filter((id) => id.toString() !== chapterId.toString());
    } else {
      progress.bookmarkedChapterIds.push(chapterId);
    }
    progress.lastVisitedAt = new Date();

    await progress.save();
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Error in toggleBookmark:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addHighlight = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = getEffectiveUserId(req);
    const { chapterId, paragraphIdx = 0, selectedText, note = "", color = "#FEF08A" } = req.body;

    if (!selectedText) {
      return res.status(400).json({ success: false, message: "Selected text is required" });
    }

    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const progress = await UserStoryProgress.findOneAndUpdate(
      { userId, storyId: story._id },
      {
        $push: {
          highlights: { chapterId, paragraphIdx, selectedText, note, color },
        },
        $set: { lastVisitedAt: new Date() },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Error in addHighlight:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteHighlight = async (req, res) => {
  try {
    const { slug, highlightId } = req.params;
    const userId = getEffectiveUserId(req);

    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const progress = await UserStoryProgress.findOneAndUpdate(
      { userId, storyId: story._id },
      {
        $pull: { highlights: { _id: highlightId } },
        $set: { lastVisitedAt: new Date() },
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Error in deleteHighlight:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const BookSeries = require("../models/BookSeries.model.js");

exports.getBookSeries = async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    const seriesList = await BookSeries.find({ isPublished: true }).populate("books").lean();

    const formatted = seriesList.map((s) => ({
      _id: s._id,
      slug: s.slug,
      title: typeof s.title === "object" ? localizeMapField(s.title, lang, "Untitled Series") : (s.title || "Untitled Series"),
      description: typeof s.description === "object" ? localizeMapField(s.description, lang, "") : (s.description || ""),
      author: s.author,
      coverImageUrl: s.coverImageUrl,
      bookCount: s.bookCount || s.books?.length || 0,
      books: Array.isArray(s.books) ? s.books.map((b) => ({
        _id: b._id,
        slug: b.slug,
        title: typeof b.title === "object" ? localizeMapField(b.title, lang, b.slug) : (b.title || b.slug),
        coverImageUrl: b.coverImageUrl,
        author: b.author,
        difficultyLevel: b.difficultyLevel,
        contentType: b.contentType,
      })) : [],
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error in getBookSeries:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getBookSeriesBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const lang = req.query.lang || "en";

    const series = await BookSeries.findOne({ slug, isPublished: true }).populate("books").lean();
    if (!series) {
      return res.status(404).json({ success: false, message: "Book Series not found" });
    }

    const formatted = {
      _id: series._id,
      slug: series.slug,
      title: typeof series.title === "object" ? localizeMapField(series.title, lang, "Untitled Series") : (series.title || "Untitled Series"),
      description: typeof series.description === "object" ? localizeMapField(series.description, lang, "") : (series.description || ""),
      author: series.author,
      coverImageUrl: series.coverImageUrl,
      bookCount: series.bookCount || series.books?.length || 0,
      books: Array.isArray(series.books) ? series.books.map((b) => ({
        _id: b._id,
        slug: b.slug,
        title: typeof b.title === "object" ? localizeMapField(b.title, lang, b.slug) : (b.title || b.slug),
        coverImageUrl: b.coverImageUrl,
        author: b.author,
        difficultyLevel: b.difficultyLevel,
        contentType: b.contentType,
      })) : [],
    };

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error in getBookSeriesBySlug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
