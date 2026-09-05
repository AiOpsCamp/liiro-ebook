"use strict";

const Story = require("../models/Story.model");
const BookSummary = require("../models/BookSummary.model");

/**
 * Enterprise Multilingual & Multi-Voice Liiro Sparks Controller
 * =========================================================================
 * - Hero Image CDN linkage (Hetzner S3)
 * - Multilingual text resolution (English default, Bengali, Spanish, etc.)
 * - Multi-Voice & Multi-Quality Audio Tracks (High 192k, Standard 96k, Low 48k)
 * - Whispersync sentence timestamp alignment for Sparks audio player
 */

const resolveField = (val, lang = "en", fallback = "en") => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val[lang] || val[fallback] || Object.values(val)[0] || "";
  }
  return String(val);
};

exports.getBookSummary = async (req, res) => {
  try {
    const { slug } = req.params;
    const reqLang = req.query.lang || "en";
    const reqVoice = req.query.voiceId || "af_heart";
    const reqQuality = req.query.quality || "high_192k";

    const story = await Story.findOne({ slug, isPublished: true })
      .select("_id slug title author coverImageUrl totalDurationSeconds")
      .lean();

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    let summary = await BookSummary.findOne({ storyId: story._id }).lean();

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: "Liiro Sparks summary not yet generated for this title.",
      });
    }

    // Resolve Multilingual Text
    const localizedSummary = {
      _id: summary._id,
      storyId: summary.storyId,
      storySlug: summary.storySlug,
      heroImageUrl: summary.heroImageUrl || summary.sparksCoverUrl || story.coverImageUrl,
      sparksCoverUrl: summary.sparksCoverUrl || summary.heroImageUrl || story.coverImageUrl,
      summaryTitle: resolveField(summary.summaryTitle, reqLang),
      oneSentenceSummary: resolveField(summary.oneSentenceSummary, reqLang),
      summaryText: resolveField(summary.summaryText, reqLang),
      overview: resolveField(summary.overview || summary.summaryText, reqLang),
      estimatedReadingTimeMinutes: summary.estimatedReadingTimeMinutes || 10,
      estimatedAudioMinutes: summary.estimatedAudioMinutes || 12,

      keyTakeaways: Array.isArray(summary.keyTakeaways)
        ? summary.keyTakeaways.map((t, idx) => ({
            takeawayNumber: t.takeawayNumber || idx + 1,
            title: resolveField(t.title, reqLang),
            description: resolveField(t.description || t.content, reqLang),
            content: resolveField(t.description || t.content, reqLang),
            quote: t.quote ? resolveField(t.quote, reqLang) : null,
          }))
        : [],

      chapterBreakdowns: Array.isArray(summary.chapterBreakdowns)
        ? summary.chapterBreakdowns.map((c) => ({
            act: resolveField(c.act, reqLang),
            chapters: resolveField(c.chapters, reqLang),
            summary: resolveField(c.summary, reqLang),
          }))
        : [],

      // Multilingual & Multi-Voice Audio Engine Pipeline
      audioTracks: summary.audioTracks || [],
      activeAudioTrack: (summary.audioTracks && summary.audioTracks.length > 0)
        ? (summary.audioTracks.find((t) => t.lang === reqLang && t.voiceId === reqVoice && t.quality === reqQuality) ||
           summary.audioTracks.find((t) => t.lang === reqLang) ||
           summary.audioTracks[0])
        : {
            trackId: `sparks_${slug}_${reqLang}_${reqVoice}`,
            lang: reqLang,
            voiceId: reqVoice,
            voiceName: "Heart (Female US)",
            quality: reqQuality,
            audioUrl: summary.defaultAudioUrl || `https://multicamp-prod-storage.nbg1.your-objectstorage.com/LangoReads-Prod/ebooks/${slug}/audio/sparks_${reqLang}.mp3`,
            durationSeconds: (summary.estimatedAudioMinutes || 12) * 60,
            timestamps: [
              { sentenceIndex: 0, startTime: 0, endTime: 15, text: resolveField(summary.oneSentenceSummary, reqLang) },
              { sentenceIndex: 1, startTime: 15, endTime: 120, text: resolveField(summary.summaryText, reqLang).substring(0, 200) }
            ]
          }
    };

    res.status(200).json({
      success: true,
      featureName: "Liiro Sparks ⚡",
      data: {
        story,
        summary: localizedSummary,
      },
    });
  } catch (error) {
    console.error("Error in getBookSummary:", error);
    res.status(500).json({ success: false, message: "Server error fetching book summary" });
  }
};
