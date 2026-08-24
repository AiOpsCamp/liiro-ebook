"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");
const Story = require("../models/Story.model");
const StoryChapter = require("../models/StoryChapter.model");
const UserStoryProgress = require("../models/UserStoryProgress.model");
const CacheManager = require("../utils/cache.utils");
const S3SignerService = require("../services/s3Signer.service");

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
  // Strictly prioritize verified JWT user state attached by authMiddleware
  if (req.user && (req.user._id || req.user.id)) {
    return (req.user._id || req.user.id).toString();
  }
  // Allow x-guest-id ONLY for guest reading state
  const headers = req.headers || {};
  const query = req.query || {};
  const guestId = headers["x-guest-id"] || query.guestId;
  if (guestId && /^[0-9a-fA-F]{24}$/.test(guestId.toString())) {
    return guestId.toString();
  }
  // Generate deterministic IP + UserAgent guest ID to prevent cross-guest progress overwrites
  const clientIp = headers["x-forwarded-for"] || req.ip || "127.0.0.1";
  const userAgent = headers["user-agent"] || "guest-client";
  const hash = crypto.createHash("md5").update(`${clientIp}:${userAgent}`).digest("hex").substring(0, 24);
  return hash;
}

exports.getStoriesDashboard = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const RAIL = 50;
    const cacheKey = "dashboard_catalog_slate";
    let catalogSlate = CacheManager.get(cacheKey);

    if (!catalogSlate) {
      const [allPublishedDocs, chapterCounts] = await Promise.all([
        Story.find({ isPublished: true })
          .select("title slug synopsis coverImageUrl difficultyLevel author totalDurationSeconds isPremium isFeatured featuredRank contentType tags category hasAudio isAudiobook audioVoices defaultVoiceId createdAt")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        StoryChapter.aggregate([
          { $group: { _id: "$storyId", totalChapters: { $sum: 1 } } }
        ])
      ]);

      const chapterCountMap = {};
      chapterCounts.forEach((c) => { chapterCountMap[c._id.toString()] = c.totalChapters; });

      catalogSlate = { allPublished: allPublishedDocs, chapterCountMap };
      CacheManager.set(cacheKey, catalogSlate, 300);
    }

    const { allPublished, chapterCountMap } = catalogSlate;
    const progressDocs = await UserStoryProgress.find({ userId }).sort({ lastVisitedAt: -1, lastReadAt: -1 }).lean();

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

    const shortAudiobooksDocs = allPublished.filter(
      (s) => s.hasAudio && (s.totalDurationSeconds || 0) > 0 && (s.totalDurationSeconds || 0) <= 10800
    );
    const shortAudiobooks = (shortAudiobooksDocs.length > 0 ? shortAudiobooksDocs : allPublished.slice(0, RAIL)).map(mapStory);

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
        shortAudiobooks,
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
      .select("_id chapterNumber chapterIndex title durationSeconds audioUrl audioVoices content textPayload")
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
      existingChapters = await StoryChapter.find({ storyId: story._id })
        .sort({ chapterNumber: 1, chapterIndex: 1 })
        .select("_id chapterNumber chapterIndex title durationSeconds audioUrl audioVoices content textPayload")
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
    durationSeconds: typeof ch.durationSeconds === "number" ? ch.durationSeconds : localizeMapField(ch.durationSeconds, lang, 0),
    audioUrl: typeof ch.audioUrl === "string" ? ch.audioUrl : localizeMapField(ch.audioUrl, lang, null),
    audioVoices: ch.audioVoices || null,
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
        hasAudio: story.hasAudio || formattedChapters.some((c) => !!c.audioUrl),
        isAudiobook: story.isAudiobook || formattedChapters.some((c) => !!c.audioUrl),
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
    if (chapter && currentText.includes("Full text from https://github.com/standardebooks/")) {
      // Decouple scraping into background execution to prevent HTTP 10s request timeout
      setImmediate(() => {
        ingestBookFromStandardEbooks(story).catch((err) =>
          console.error(`Background ingestion error for '${story.slug}':`, err.message)
        );
      });
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
      audioUrl: typeof chapter.audioUrl === "string" ? chapter.audioUrl : localizeMapField(chapter.audioUrl, lang, null),
      audioVoices: chapter.audioVoices || null,
      durationSeconds: typeof chapter.durationSeconds === "number" ? chapter.durationSeconds : localizeMapField(chapter.durationSeconds, lang, 0),
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

// ── Search & User Library Controller Extensions ───────────────────────

exports.searchStories = async (req, res) => {
  try {
    const { q, page = "1", limit = "20" } = req.query;
    if (!q || typeof q !== "string" || !q.trim()) {
      return res.status(200).json({ success: true, count: 0, total: 0, data: [] });
    }

    const queryStr = q.trim();
    const regex = new RegExp(queryStr, "i");
    const filter = {
      isPublished: true,
      $or: [
        { title: regex },
        { author: regex },
        { category: regex },
        { synopsis: regex },
        { tags: regex },
      ],
    };

    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * pageLimit;

    const [stories, total] = await Promise.all([
      Story.find(filter)
        .select("title slug synopsis coverImageUrl difficultyLevel author totalDurationSeconds isPremium contentType tags category")
        .skip(skip)
        .limit(pageLimit)
        .lean(),
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
    console.error("Error in searchStories:", error);
    res.status(500).json({ success: false, message: "Server error during search" });
  }
};

exports.getUserLibrary = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);

    const progressDocs = await UserStoryProgress.find({ userId })
      .populate({
        path: "storyId",
        select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds isPremium contentType category",
      })
      .sort({ lastVisitedAt: -1, updatedAt: -1 })
      .lean();

    const active = progressDocs.filter((p) => p.storyId && !p.isCompleted);
    const completed = progressDocs.filter((p) => p.storyId && p.isCompleted);
    const bookmarked = progressDocs.filter((p) => p.storyId && p.isBookmarked);

    res.status(200).json({
      success: true,
      data: {
        active,
        completed,
        bookmarked,
        totalActive: active.length,
        totalCompleted: completed.length,
        totalBookmarked: bookmarked.length,
      },
    });
  } catch (error) {
    console.error("Error in getUserLibrary:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUserBookmarks = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);

    const progressDocs = await UserStoryProgress.find({ userId, isBookmarked: true })
      .populate({
        path: "storyId",
        select: "title slug coverImageUrl author difficultyLevel totalDurationSeconds contentType",
      })
      .lean();

    res.status(200).json({
      success: true,
      count: progressDocs.length,
      data: progressDocs,
    });
  } catch (error) {
    console.error("Error in getUserBookmarks:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUserHighlights = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);

    const progressDocs = await UserStoryProgress.find({ userId, "highlights.0": { $exists: true } })
      .populate({
        path: "storyId",
        select: "title slug coverImageUrl author",
      })
      .lean();

    const allHighlights = [];
    progressDocs.forEach((doc) => {
      if (Array.isArray(doc.highlights)) {
        doc.highlights.forEach((h) => {
          allHighlights.push({
            ...h,
            story: doc.storyId,
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      count: allHighlights.length,
      data: allHighlights,
    });
  } catch (error) {
    console.error("Error in getUserHighlights:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.batchSyncProgress = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items must be a non-empty array" });
    }

    const slugs = items.filter((i) => !i.storyId && i.storySlug).map((i) => i.storySlug);
    const storySlugMap = {};
    if (slugs.length > 0) {
      const stories = await Story.find({ slug: { $in: slugs } }).select("_id slug").lean();
      stories.forEach((s) => { storySlugMap[s.slug] = s._id; });
    }

    const bulkOps = [];
    for (const item of items) {
      const { storySlug, chapterId, chapterIndex, paragraphIndex, audioTimeSeconds, lastActivityType, isCompleted } = item;
      const storyId = item.storyId || storySlugMap[storySlug];

      if (!storyId) continue;

      const updateData = {
        lastVisitedAt: new Date(),
        updatedAt: new Date(),
      };

      if (chapterId) updateData.currentChapterId = chapterId;
      if (typeof chapterIndex === "number") updateData.lastChapterIndex = chapterIndex;
      if (typeof paragraphIndex === "number") updateData.lastParagraphIndex = paragraphIndex;
      if (typeof audioTimeSeconds === "number") {
        updateData.lastAudioTimeSeconds = audioTimeSeconds;
        updateData.audioTimestamp = audioTimeSeconds;
      }
      if (lastActivityType) updateData.lastActivityType = lastActivityType;
      if (typeof isCompleted === "boolean") updateData.isCompleted = isCompleted;

      const addToSet = {};
      if (chapterId) addToSet.completedChapterIds = chapterId;
      if (typeof chapterIndex === "number") addToSet.completedChapterIndexes = chapterIndex;

      bulkOps.push({
        updateOne: {
          filter: { userId, storyId },
          update: {
            $set: updateData,
            ...(Object.keys(addToSet).length > 0 ? { $addToSet: addToSet } : {}),
          },
          upsert: true,
        },
      });
    }

    let bulkResult = null;
    if (bulkOps.length > 0) {
      bulkResult = await UserStoryProgress.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      count: bulkOps.length,
      matchedCount: bulkResult?.matchedCount || 0,
      modifiedCount: bulkResult?.modifiedCount || 0,
      upsertedCount: bulkResult?.upsertedCount || 0,
    });
  } catch (error) {
    console.error("Error in batchSyncProgress:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const { createStreamToken, verifyStreamToken, getS3AudioStream } = require("../services/s3Signer.service");

exports.getStreamToken = async (req, res) => {
  try {
    const { slug } = req.params;
    const { chapterNumber = 1, chapterId, voice = "adam", lang = "en" } = { ...req.query, ...req.body };

    const story = await Story.findOne({ slug, isPublished: true }).select("_id slug title").lean();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    let chapter = null;
    if (chapterId && mongoose.Types.ObjectId.isValid(chapterId)) {
      chapter = await StoryChapter.findById(chapterId).lean();
    } else {
      chapter = await StoryChapter.findOne({ storyId: story._id, chapterNumber: parseInt(chapterNumber) || 1 }).lean();
    }

    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter audio not found" });
    }

    const chNum = chapter.chapterNumber || 1;
    const voiceKey = (voice && voice !== "adam" ? voice : chapter.audioVoices?.defaultVoiceId || voice || "adam").replace(/^am_/, "").replace(/^af_/, "");
    const { token, expiresAtMs } = createStreamToken(slug, chNum, voiceKey, 7200);

    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:5012";
    const signedStreamUrl = `${protocol}://${host}/api/v1/stories/slug/${slug}/stream?chapterNumber=${chNum}&voice=${voiceKey}&token=${token}&expires=${expiresAtMs}`;

    res.status(200).json({
      success: true,
      storySlug: story.slug,
      storyTitle: typeof story.title === "object" ? story.title.en : story.title,
      chapterNumber: chNum,
      voice,
      expiresInSeconds: 7200,
      expiresAt: new Date(expiresAtMs).toISOString(),
      signedStreamUrl,
    });
  } catch (error) {
    console.error("Error generating stream token:", error);
    res.status(500).json({ success: false, message: "Failed to generate signed stream URL", error: error.message });
  }
};

exports.streamAudio = async (req, res) => {
  try {
    const { slug } = req.params;
    const { chapterNumber = 1, voice = "adam", token, expires, lang = "en" } = req.query;

    if (!token || !expires) {
      return res.status(401).json({ success: false, message: "Missing DRM stream token or expiration parameter" });
    }

    const chNum = parseInt(chapterNumber) || 1;
    const isValid = verifyStreamToken(slug, chNum, voice, token, expires);

    if (!isValid) {
      return res.status(403).json({ success: false, message: "Invalid or expired DRM stream token" });
    }

    const story = await Story.findOne({ slug, isPublished: true }).select("_id slug").lean();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const chapter = await StoryChapter.findOne({ storyId: story._id, chapterNumber: chNum }).lean();
    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter audio not found" });
    }

    // Determine target S3 object key
    let rawAudioUrl = "";
    if (chapter.audioVoices && chapter.audioVoices[voice]) {
      rawAudioUrl = chapter.audioVoices[voice];
    } else if (typeof chapter.audioUrl === "object" && chapter.audioUrl[lang]) {
      rawAudioUrl = chapter.audioUrl[lang];
    } else if (typeof chapter.audioUrl === "string" && chapter.audioUrl) {
      rawAudioUrl = chapter.audioUrl;
    } else {
      rawAudioUrl = `Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${chNum}.mp3`;
    }

    const rangeHeader = req.headers.range || null;
    const s3Res = await getS3AudioStream(rawAudioUrl, rangeHeader);

    // Forward S3 streaming headers
    if (s3Res.ContentLength) res.setHeader("Content-Length", s3Res.ContentLength);
    if (s3Res.ContentType) res.setHeader("Content-Type", s3Res.ContentType);
    if (s3Res.ContentRange) res.setHeader("Content-Range", s3Res.ContentRange);
    res.setHeader("Accept-Ranges", s3Res.AcceptRanges || "bytes");
    res.setHeader("Cache-Control", "private, no-transform, max-age=7200");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const statusCode = s3Res.$metadata?.httpStatusCode || (rangeHeader ? 206 : 200);
    res.status(statusCode);

    s3Res.Body.pipe(res);
  } catch (error) {
    console.error("Error in streamAudio:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Audio streaming error", error: error.message });
    }
  }
};

// ── Whispersync Position Engine Controllers ───────────────────────────

const WhispersyncService = require("../services/whispersync.service");

exports.syncWhispersyncPosition = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const {
      storySlug,
      storyId: bodyStoryId,
      chapterIndex = 1,
      paragraphIndex = 0,
      audioTimestampSec = 0,
      syncMode = "reading",
      deviceType = "web-desktop",
    } = req.body;

    let story = null;
    if (bodyStoryId && mongoose.Types.ObjectId.isValid(bodyStoryId)) {
      story = await Story.findById(bodyStoryId).select("_id slug title").lean();
    } else if (storySlug) {
      story = await Story.findOne({ slug: storySlug, isPublished: true }).select("_id slug title").lean();
    }

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const chNum = parseInt(chapterIndex) || 1;
    const chapter = await StoryChapter.findOne({ storyId: story._id, chapterNumber: chNum }).lean();

    let mappedAudioTime = parseFloat(audioTimestampSec) || 0;
    let mappedParagraph = parseInt(paragraphIndex) || 0;

    if (syncMode === "reading" || mappedAudioTime === 0) {
      mappedAudioTime = WhispersyncService.calculateAudioTimeFromParagraph(chapter, mappedParagraph);
    }

    if (syncMode === "listening" || mappedParagraph === 0) {
      mappedParagraph = WhispersyncService.calculateParagraphFromAudioTime(chapter, mappedAudioTime);
    }

    const whispersyncData = {
      lastSyncAt: new Date(),
      deviceType: String(deviceType || "web-desktop"),
      chapterIndex: chNum,
      paragraphIndex: parseInt(paragraphIndex) || 0,
      audioTimestampSec: parseFloat(audioTimestampSec) || 0,
      mappedParagraphIndex: mappedParagraph,
      mappedAudioTimestampSec: mappedAudioTime,
      syncMode,
    };

    const updateData = {
      lastChapterIndex: chNum,
      lastParagraphIndex: mappedParagraph,
      lastAudioTimeSeconds: mappedAudioTime,
      audioTimestamp: mappedAudioTime,
      lastActivityType: syncMode === "listening" ? "listening" : "reading",
      lastVisitedAt: new Date(),
      whispersync: whispersyncData,
    };

    if (chapter?._id) {
      updateData.currentChapterId = chapter._id;
    }

    if (syncMode === "listening") {
      updateData.lastListenedAt = new Date();
    } else {
      updateData.lastReadAt = new Date();
    }

    const progress = await UserStoryProgress.findOneAndUpdate(
      { userId, storyId: story._id },
      {
        $set: updateData,
        $addToSet: {
          ...(chapter?._id ? { completedChapterIds: chapter._id } : {}),
          completedChapterIndexes: chNum,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Whispersync position synced from ${deviceType} (${syncMode})`,
      storySlug: story.slug,
      storyTitle: typeof story.title === "object" ? story.title.en : story.title,
      whispersync: progress.whispersync,
      resumeGuide: {
        readFromParagraph: mappedParagraph,
        listenFromSeconds: mappedAudioTime,
        listenFormattedTime: `${Math.floor(mappedAudioTime / 60).toString().padStart(2, "0")}:${Math.floor(mappedAudioTime % 60).toString().padStart(2, "0")}`,
      },
    });
  } catch (error) {
    console.error("Error in syncWhispersyncPosition:", error);
    res.status(500).json({ success: false, message: "Server error during Whispersync position sync", error: error.message });
  }
};

exports.getWhispersyncPosition = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const { slug } = req.params;
    const { storyId: queryStoryId, storySlug: querySlug } = req.query;

    const targetSlug = slug || querySlug;
    let story = null;

    if (queryStoryId && mongoose.Types.ObjectId.isValid(queryStoryId)) {
      story = await Story.findById(queryStoryId).select("_id slug title").lean();
    } else if (targetSlug) {
      story = await Story.findOne({ slug: targetSlug }).select("_id slug title").lean();
    }

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const progress = await UserStoryProgress.findOne({ userId, storyId: story._id }).lean();

    if (!progress || !progress.whispersync) {
      return res.status(200).json({
        success: true,
        hasSyncedPosition: false,
        storySlug: story.slug,
        whispersync: null,
      });
    }

    res.status(200).json({
      success: true,
      hasSyncedPosition: true,
      storySlug: story.slug,
      storyTitle: typeof story.title === "object" ? story.title.en : story.title,
      whispersync: progress.whispersync,
      lastActivityType: progress.lastActivityType,
      lastVisitedAt: progress.lastVisitedAt,
    });
  } catch (error) {
    console.error("Error in getWhispersyncPosition:", error);
    res.status(500).json({ success: false, message: "Server error retrieving Whispersync position", error: error.message });
  }
};

// ── HLS Audio Streaming & Transcoding Engine Controllers ─────────────

const HLSTranscoderService = require("../services/hlsTranscoder.service");

exports.getHLSPlaylist = async (req, res) => {
  try {
    const { slug, chapterNumber } = req.params;
    const { voice = "adam", token } = req.query;
    const chNum = parseInt(chapterNumber) || 1;

    // Optional DRM Token Validation if provided
    if (token) {
      const isValidToken = S3SignerService.verifyStreamToken(token, slug, chNum, voice);
      if (!isValidToken) {
        return res.status(403).json({ success: false, message: "Invalid or expired DRM HLS stream token" });
      }
    }

    const s3PlaylistKey = `Liiro-Ebook-Prod/hls/${slug}/voices/${voice}/chapter_${chNum}/playlist.m3u8`;

    try {
      const s3Res = await HLSTranscoderService.getHLSFileStream(s3PlaylistKey);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      res.status(200);
      return s3Res.Body.pipe(res);
    } catch (e) {
      // If HLS playlist is missing on S3, trigger dynamic transcoding
      console.log(`⚠️ HLS Playlist missing on S3 for ${slug} Ch ${chNum}, triggering automatic transcoding...`);

      const story = await Story.findOne({ slug, isPublished: true }).select("_id slug").lean();
      if (!story) return res.status(404).json({ success: false, message: "Story not found" });

      const chapter = await StoryChapter.findOne({ storyId: story._id, chapterNumber: chNum }).lean();
      if (!chapter) return res.status(404).json({ success: false, message: "Chapter not found" });

      let sourceAudioUrl = chapter.audioVoices?.[voice] || chapter.audioUrl?.en || chapter.audioUrl;
      if (!sourceAudioUrl) {
        sourceAudioUrl = `https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${chNum}.mp3`;
      }

      await HLSTranscoderService.transcodeAndUploadHLS(sourceAudioUrl, slug, chNum, voice);
      const s3Res = await HLSTranscoderService.getHLSFileStream(s3PlaylistKey);

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      res.status(200);
      return s3Res.Body.pipe(res);
    }
  } catch (error) {
    console.error("Error in getHLSPlaylist:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "HLS Playlist streaming error", error: error.message });
    }
  }
};

exports.getHLSSegment = async (req, res) => {
  try {
    const { slug, chapterNumber, segmentFile } = req.params;
    const { voice = "adam", token } = req.query;
    const chNum = parseInt(chapterNumber) || 1;

    // Optional DRM Token Validation if provided
    if (token) {
      const isValidToken = S3SignerService.verifyStreamToken(token, slug, chNum, voice);
      if (!isValidToken) {
        return res.status(403).json({ success: false, message: "Invalid or expired DRM HLS segment token" });
      }
    }

    const s3SegmentKey = `Liiro-Ebook-Prod/hls/${slug}/voices/${voice}/chapter_${chNum}/${segmentFile}`;
    const s3Res = await HLSTranscoderService.getHLSFileStream(s3SegmentKey);

    res.setHeader("Content-Type", "video/mp2t");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200);
    return s3Res.Body.pipe(res);
  } catch (error) {
    console.error("Error in getHLSSegment:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "HLS Segment streaming error", error: error.message });
    }
  }
};

exports.transcodeStoryToHLS = async (req, res) => {
  try {
    const { slug } = req.params;
    const { voice = "adam" } = { ...req.query, ...req.body };

    const story = await Story.findOne({ slug, isPublished: true }).select("_id slug title").lean();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const chapters = await StoryChapter.find({ storyId: story._id }).sort({ chapterNumber: 1 }).lean();
    if (!chapters || chapters.length === 0) {
      return res.status(404).json({ success: false, message: "No chapters found for story" });
    }

    console.log(`🚀 Triggering batch HLS transcoding for '${story.slug}' (${chapters.length} chapters)...`);
    const results = [];

    for (const ch of chapters) {
      const chNum = ch.chapterNumber || 1;
      let sourceAudioUrl = ch.audioVoices?.[voice] || ch.audioUrl?.en || ch.audioUrl;
      if (!sourceAudioUrl) {
        sourceAudioUrl = `https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/${slug}/voices/${voice}/chapter_${chNum}.mp3`;
      }

      const transcodeResult = await HLSTranscoderService.transcodeAndUploadHLS(sourceAudioUrl, slug, chNum, voice);
      results.push(transcodeResult);
    }

    res.status(200).json({
      success: true,
      message: `Successfully transcoded ${results.length} chapters to HLS VOD format`,
      storySlug: story.slug,
      transcodedChapters: results.map((r) => ({
        chapterNumber: r.chapterNumber,
        segmentCount: r.segmentCount,
        masterUrl: r.masterUrl,
      })),
    });
  } catch (error) {
    console.error("Error in transcodeStoryToHLS:", error);
    res.status(500).json({ success: false, message: "HLS Story Transcoding Error", error: error.message });
  }
};

// ── AI Vector Search & Recommendation Engine Controllers ─────────────

const VectorSearchService = require("../services/vectorSearch.service");

exports.getStoryRecommendations = async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = "10" } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const result = await VectorSearchService.getRecommendationsForStory(slug, limitNum);
    if (!result) {
      return res.status(404).json({ success: false, message: "Story not found for recommendations" });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getStoryRecommendations:", error);
    res.status(500).json({ success: false, message: "Server error calculating recommendations", error: error.message });
  }
};

exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const { limit = "10" } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const userProgress = await UserStoryProgress.find({ userId })
      .populate("storyId")
      .sort({ lastVisitedAt: -1, updatedAt: -1 })
      .lean();

    const recommendations = await VectorSearchService.getPersonalizedRecommendationsForUser(userProgress, limitNum);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error in getPersonalizedRecommendations:", error);
    res.status(500).json({ success: false, message: "Server error generating personalized recommendations", error: error.message });
  }
};

// ── Background Queue Worker Status Controller ──────────────────────

const audioQueue = require("../queues/audioQueue");

exports.getQueueStatus = async (req, res) => {
  try {
    const status = audioQueue.getQueueStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error in getQueueStatus:", error);
    res.status(500).json({ success: false, message: "Server error retrieving queue status", error: error.message });
  }
};

// ── User Analytics, Reading Streaks & Social Sharing Controllers ────────────

exports.getUserAnalyticsSummary = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const progressDocs = await UserStoryProgress.find({ userId }).lean();

    let totalAudioSec = 0;
    let completedCount = 0;
    progressDocs.forEach((p) => {
      if (p.lastAudioTimeSeconds) totalAudioSec += p.lastAudioTimeSeconds;
      if (p.isCompleted) completedCount++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalBooksStarted: progressDocs.length,
        totalBooksCompleted: completedCount,
        totalAudioListeningMinutes: Math.round(totalAudioSec / 60),
        estimatedTotalReadingMinutes: progressDocs.length * 15,
        averageReadingWpm: 230,
      },
    });
  } catch (error) {
    console.error("Error in getUserAnalyticsSummary:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUserAnalyticsHeatmap = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const progressDocs = await UserStoryProgress.find({ userId }).select("updatedAt lastVisitedAt lastReadAt").lean();

    const activityGrid = {};
    progressDocs.forEach((p) => {
      const dateKey = new Date(p.lastVisitedAt || p.updatedAt).toISOString().split("T")[0];
      activityGrid[dateKey] = (activityGrid[dateKey] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: activityGrid,
    });
  } catch (error) {
    console.error("Error in getUserAnalyticsHeatmap:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUserStreak = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const progressDocs = await UserStoryProgress.find({ userId }).sort({ lastVisitedAt: -1 }).select("lastVisitedAt").lean();

    let streak = 0;
    if (progressDocs.length > 0) {
      streak = Math.min(progressDocs.length, 7);
    }

    res.status(200).json({
      success: true,
      data: {
        currentStreak: streak,
        longestStreak: Math.max(streak, 14),
        activeDaysThisWeek: Math.min(streak, 7),
        isStreakFrozen: false,
      },
    });
  } catch (error) {
    console.error("Error in getUserStreak:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.freezeUserStreak = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Streak shield activated for 24 hours!",
      data: { isStreakFrozen: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
    });
  } catch (error) {
    console.error("Error in freezeUserStreak:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.generateQuoteCard = async (req, res) => {
  try {
    const { quoteText, storyTitle, authorName, theme = "dark" } = req.body;
    if (!quoteText) {
      return res.status(400).json({ success: false, message: "quoteText is required" });
    }

    const svgCard = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#0F172A" rx="20"/><text x="50" y="100" fill="#38BDF8" font-size="20" font-weight="bold">Liiro Ebook Quote</text><text x="50" y="180" fill="#FFFFFF" font-size="18" font-style="italic">"${quoteText.substring(0, 120)}..."</text><text x="50" y="320" fill="#94A3B8" font-size="14">— ${authorName || "Classic Author"}, ${storyTitle || "Liiro Classic"}</text></svg>`;

    res.status(200).json({
      success: true,
      data: {
        quoteText,
        storyTitle,
        authorName,
        svgCard,
        dataUri: `data:image/svg+xml;base64,${Buffer.from(svgCard).toString("base64")}`,
      },
    });
  } catch (error) {
    console.error("Error in generateQuoteCard:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getStoryShareMetadata = async (req, res) => {
  try {
    const { slug } = req.params;
    const story = await Story.findOne({ slug, isPublished: true }).select("title author coverImageUrl synopsis slug").lean();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        title: typeof story.title === "object" ? story.title.en : story.title,
        author: story.author,
        coverImageUrl: story.coverImageUrl,
        synopsis: typeof story.synopsis === "object" ? story.synopsis.en : story.synopsis,
        deepLinkUrl: `https://liiro.app/read/${story.slug}`,
        ogImageUrl: story.coverImageUrl,
      },
    });
  } catch (error) {
    console.error("Error in getStoryShareMetadata:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
