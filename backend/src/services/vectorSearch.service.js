"use strict";

const Story = require("../models/Story.model");
const CacheManager = require("../utils/cache.utils");

/**
 * AI Vector Search & Semantic Recommendation Engine
 * Computes multi-dimensional cosine similarity vectors across book metadata, synopses, tags, and difficulty levels.
 */
class VectorSearchService {
  /**
   * Tokenize and normalize text into a frequency vector
   */
  static tokenize(text) {
    if (!text || typeof text !== "string") return new Map();
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const tfMap = new Map();
    words.forEach((w) => tfMap.set(w, (tfMap.get(w) || 0) + 1));
    return tfMap;
  }

  /**
   * Cosine Similarity between two term frequency maps
   */
  static cosineSimilarity(tfMapA, tfMapB) {
    if (tfMapA.size === 0 || tfMapB.size === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    tfMapA.forEach((val, key) => {
      normA += val * val;
      if (tfMapB.has(key)) {
        dotProduct += val * tfMapB.get(key);
      }
    });

    tfMapB.forEach((val) => {
      normB += val * val;
    });

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Extract searchable string from localized title/synopsis/tags
   */
  static getLocalizedStr(field, fallback = "") {
    if (!field) return fallback;
    if (typeof field === "string") return field;
    if (typeof field === "object") return field.en || Object.values(field).find(Boolean) || fallback;
    return fallback;
  }

  /**
   * Compute comprehensive similarity score between target story and candidate story
   */
  static computeSimilarityScore(target, candidate) {
    if (String(target._id) === String(candidate._id)) return 0;

    // 1. Synopsis & Title Text Vector Cosine Similarity (Weight: 0.45)
    const targetText = `${this.getLocalizedStr(target.title)} ${this.getLocalizedStr(target.synopsis)}`;
    const candidateText = `${this.getLocalizedStr(candidate.title)} ${this.getLocalizedStr(candidate.synopsis)}`;

    const tfTarget = this.tokenize(targetText);
    const tfCandidate = this.tokenize(candidateText);
    const textSimilarity = this.cosineSimilarity(tfTarget, tfCandidate);

    // 2. Tag & Keyword Overlap (Weight: 0.30)
    const targetTags = new Set((target.tags || []).map((t) => this.getLocalizedStr(t).toLowerCase()));
    const candidateTags = new Set((candidate.tags || []).map((t) => this.getLocalizedStr(t).toLowerCase()));

    let tagOverlapCount = 0;
    targetTags.forEach((tag) => {
      if (candidateTags.has(tag)) tagOverlapCount++;
    });
    const maxTags = Math.max(1, Math.min(targetTags.size, candidateTags.size));
    const tagSimilarity = tagOverlapCount / maxTags;

    // 3. Author & Category Match (Weight: 0.15)
    let metaScore = 0;
    if (target.author && candidate.author && target.author.toLowerCase() === candidate.author.toLowerCase()) {
      metaScore += 0.6;
    }
    if (target.category && candidate.category && target.category.toLowerCase() === candidate.category.toLowerCase()) {
      metaScore += 0.4;
    }

    // 4. CEFR Difficulty Level Match (Weight: 0.10)
    let levelScore = 0;
    if (target.difficultyLevel && candidate.difficultyLevel) {
      if (target.difficultyLevel === candidate.difficultyLevel) {
        levelScore = 1.0;
      } else if (
        (target.difficultyLevel.startsWith("A") && candidate.difficultyLevel.startsWith("A")) ||
        (target.difficultyLevel.startsWith("B") && candidate.difficultyLevel.startsWith("B")) ||
        (target.difficultyLevel.startsWith("C") && candidate.difficultyLevel.startsWith("C"))
      ) {
        levelScore = 0.5;
      }
    }

    // Weighted composite score
    const finalScore = textSimilarity * 0.45 + tagSimilarity * 0.30 + metaScore * 0.15 + levelScore * 0.10;
    return Math.round(finalScore * 1000) / 1000;
  }

  /**
   * Get Top N Recommendations for a specific story slug
   */
  static async getRecommendationsForStory(slug, limit = 10) {
    const cacheKey = `recommendations_${slug}_limit_${limit}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) return cached;

    const targetStory = await Story.findOne({ slug, isPublished: true }).lean();
    if (!targetStory) return null;

    const allPublished = await Story.find({ isPublished: true, _id: { $ne: targetStory._id } })
      .select("title slug synopsis coverImageUrl difficultyLevel author totalDurationSeconds isPremium contentType tags category")
      .lean();

    const scored = allPublished
      .map((story) => {
        const similarityScore = this.computeSimilarityScore(targetStory, story);
        return {
          _id: story._id,
          slug: story.slug,
          title: this.getLocalizedStr(story.title, story.slug),
          synopsis: this.getLocalizedStr(story.synopsis, ""),
          author: story.author,
          coverImageUrl: story.coverImageUrl,
          difficultyLevel: story.difficultyLevel,
          totalDurationSeconds: story.totalDurationSeconds || 0,
          contentType: story.contentType || "ebook",
          category: story.category,
          tags: (story.tags || []).map((t) => this.getLocalizedStr(t)),
          similarityScore,
        };
      })
      .filter((s) => s.similarityScore > 0.05)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    const result = {
      targetSlug: targetStory.slug,
      targetTitle: this.getLocalizedStr(targetStory.title, targetStory.slug),
      recommendationsCount: scored.length,
      recommendations: scored,
    };

    CacheManager.set(cacheKey, result, 600); // 10 minutes cache
    return result;
  }

  /**
   * Get Personalized Recommendations based on User's Progress History
   */
  static async getPersonalizedRecommendationsForUser(userProgressDocs, limit = 10) {
    if (!Array.isArray(userProgressDocs) || userProgressDocs.length === 0) {
      // Fallback to top featured books if user has no reading history
      const featured = await Story.find({ isPublished: true, isFeatured: true })
        .sort({ featuredRank: 1 })
        .limit(limit)
        .select("title slug synopsis coverImageUrl difficultyLevel author totalDurationSeconds contentType tags category")
        .lean();
      return featured;
    }

    const readStoryIds = userProgressDocs.map((p) => String(p.storyId?._id || p.storyId)).filter(Boolean);
    const recentStoryIds = readStoryIds.slice(0, 5);

    const recentStories = await Story.find({ _id: { $in: recentStoryIds } }).lean();
    const candidateStories = await Story.find({ isPublished: true, _id: { $nin: readStoryIds } })
      .select("title slug synopsis coverImageUrl difficultyLevel author totalDurationSeconds isPremium contentType tags category")
      .lean();

    const scoredMap = new Map();

    for (const candidate of candidateStories) {
      let maxScore = 0;
      for (const target of recentStories) {
        const score = this.computeSimilarityScore(target, candidate);
        if (score > maxScore) maxScore = score;
      }
      if (maxScore > 0.05) {
        scoredMap.set(candidate._id.toString(), {
          _id: candidate._id,
          slug: candidate.slug,
          title: this.getLocalizedStr(candidate.title, candidate.slug),
          synopsis: this.getLocalizedStr(candidate.synopsis, ""),
          author: candidate.author,
          coverImageUrl: candidate.coverImageUrl,
          difficultyLevel: candidate.difficultyLevel,
          totalDurationSeconds: candidate.totalDurationSeconds || 0,
          contentType: candidate.contentType || "ebook",
          category: candidate.category,
          similarityScore: maxScore,
        });
      }
    }

    const recommendations = Array.from(scoredMap.values())
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return recommendations;
  }
}

module.exports = VectorSearchService;
