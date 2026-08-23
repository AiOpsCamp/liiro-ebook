/**
 * src/services/query-optimization.service.js
 *
 * Phase 4.1: Query Optimization Utilities
 *
 * Provides optimized query patterns for common operations:
 * - Batch queries to avoid N+1 patterns
 * - .lean() wrapper for read-only queries
 * - Aggregation pipeline helpers
 * - Cache-friendly query builders
 */

"use strict";

const LexiconPack = require("../models/lexicon/LexiconPack.model");
const LexiconProgress = require("../models/lexicon/LexiconProgress.model");
const UserTermProgress = require("../models/lexicon/UserTermProgress.model");

/**
 * Batch fetch multiple packs by ID
 * Replaces multiple find() calls with single batched query
 *
 * @param {Array<ObjectId>} packIds - Pack IDs to fetch
 * @param {Object} selectFields - Fields to select (optional)
 * @returns {Promise<Array>} Packs with selected fields
 */
async function batchFetchPacks(packIds, selectFields = "slug name levelCode language") {
  if (!packIds || packIds.length === 0) return [];

  // Deduplicate and batch
  const uniqueIds = [...new Set(packIds.map((id) => String(id)))];

  return LexiconPack.find({ _id: { $in: uniqueIds } })
    .select(selectFields)
    .lean()
    .exec();
}

/**
 * Find pack by ID or slug (case-insensitive)
 * Optimized to use exact match instead of regex
 *
 * @param {String|ObjectId} idOrSlug - Pack ID or slug
 * @param {Object} selectFields - Fields to select (optional)
 * @returns {Promise<Object|null>} Pack document or null
 */
async function findPackByIdOrSlug(idOrSlug, selectFields = "_id slug name") {
  if (!idOrSlug) return null;

  // Try ID first (indexed and faster)
  const mongoose = require("mongoose");
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    const packById = await LexiconPack.findById(idOrSlug).select(selectFields).lean().exec();

    if (packById) return packById;
  }

  // Then try slug (case-insensitive via collation)
  // Convert to lowercase for consistent matching
  const slug = String(idOrSlug).toLowerCase();
  return LexiconPack.findOne({ slug })
    .select(selectFields)
    .collation({ locale: "en", strength: 2 })
    .lean();
}

/**
 * Optimized pack with relationships query
 * Replaces .populate() with aggregation for better index usage
 *
 * @param {ObjectId} packId - Pack ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Pack with related data
 */
async function fetchPackWithRelationships(packId, options = {}) {
  const { includeModule = false, includeCategory = false, includeTags = false } = options;

  const pipeline = [{ $match: { _id: require("mongoose").Types.ObjectId(packId) } }];

  // Add lookups only if requested (avoid unnecessary joins)
  if (includeModule) {
    pipeline.push({
      $lookup: {
        from: "lexiconmodules",
        localField: "moduleId",
        foreignField: "_id",
        as: "module",
      },
    });
    pipeline.push({ $unwind: { path: "$module", preserveNullAndEmptyArrays: true } });
  }

  if (includeCategory) {
    pipeline.push({
      $lookup: {
        from: "lexiconcategories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    });
    pipeline.push({ $unwind: { path: "$category", preserveNullAndEmptyArrays: true } });
  }

  if (includeTags) {
    pipeline.push({
      $lookup: {
        from: "lexicotags",
        localField: "tagIds",
        foreignField: "_id",
        as: "tags",
      },
    });
  }

  const [result] = await LexiconPack.aggregate(pipeline);
  return result || null;
}

/**
 * Get user progress for multiple packs efficiently
 * Batch query instead of individual lookups
 *
 * @param {ObjectId} userId - User ID
 * @param {Array<ObjectId>} packIds - Pack IDs
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Map of packId -> progress data
 */
async function batchGetUserPackProgress(userId, packIds, options = {}) {
  const { includeTerms = false, fields = "lexiconPack isCompleted" } = options;

  if (!userId || !packIds || packIds.length === 0) return {};

  const query = {
    user: userId,
    lexiconPack: { $in: packIds },
  };

  let docs;
  if (includeTerms) {
    // Include term details
    docs = await LexiconProgress.find(query).lean().exec();
  } else {
    // Only pack-level progress
    docs = await LexiconProgress.find(query).select(fields).lean().exec();
  }

  // Convert to map for O(1) lookups
  const progressMap = {};
  docs.forEach((doc) => {
    progressMap[String(doc.lexiconPack)] = doc;
  });

  return progressMap;
}

/**
 * Get user term progress for multiple terms in a pack
 * Batch query to avoid N+1 pattern
 *
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} packId - Pack ID
 * @param {Array<ObjectId>} termIds - Term IDs
 * @param {String} language - Language code
 * @returns {Promise<Object>} Map of termId -> progress
 */
async function batchGetUserTermProgress(userId, packId, termIds, language) {
  if (!userId || !packId || !termIds || termIds.length === 0) return {};

  const docs = await UserTermProgress.find({
    user: userId,
    lexiconPack: packId,
    term: { $in: termIds },
    language,
  })
    .lean()
    .exec();

  // Convert to map for O(1) lookups
  const progressMap = {};
  docs.forEach((doc) => {
    progressMap[String(doc.term)] = doc;
  });

  return progressMap;
}

/**
 * Optimized aggregation for user global SRS stats
 * Consolidates multiple aggregations into one pipeline
 *
 * @param {ObjectId} userId - User ID
 * @param {String} language - Language code
 * @returns {Promise<Object>} Consolidated stats
 */
async function getGlobalSrsStats(userId, language) {
  const pipeline = [
    {
      $match: {
        user: require("mongoose").Types.ObjectId(userId),
        language,
      },
    },
    { $unwind: "$terms" },
    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,
              totalTerms: { $sum: 1 },
              favorited: {
                $sum: { $cond: ["$terms.favorited", 1, 0] },
              },
              learned: {
                $sum: { $cond: ["$terms.isLearned", 1, 0] },
              },
              markedForReview: {
                $sum: { $cond: ["$terms.markedForReview", 1, 0] },
              },
              avgConfidence: { $avg: "$terms.confidence" },
            },
          },
        ],
        // Additional facets for different cuts
        byPack: [
          {
            $group: {
              _id: "$_id",
              count: { $sum: 1 },
              completed: { $sum: { $cond: ["$isCompleted", 1, 0] } },
            },
          },
        ],
      },
    },
  ];

  const [result] = await LexiconProgress.aggregate(pipeline);
  return result || { stats: [{}], byPack: [] };
}

/**
 * Check pack enrollment and language in single query
 * Replaces two separate calls to LexiconEnrollment and LexiconPack
 *
 * @param {ObjectId} userId - User ID
 * @param {ObjectId|String} packId - Pack ID
 * @returns {Promise<Object>} Enrollment + language info
 */
async function getEnrollmentWithLanguage(userId, packId) {
  const mongoose = require("mongoose");
  const LexiconEnrollment = require("../models/lexicon/LexiconEnrollment.model");

  const packObjId = mongoose.Types.ObjectId.isValid(packId)
    ? packId
    : mongoose.Types.ObjectId.createFromTime(1); // Dummy for invalid ID

  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        lexiconPack: packObjId,
      },
    },
    {
      $lookup: {
        from: "lexiconpacks",
        localField: "lexiconPack",
        foreignField: "_id",
        as: "pack",
      },
    },
    {
      $unwind: {
        path: "$pack",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        language: 1,
        "pack.language": 1,
        "pack.slug": 1,
      },
    },
  ];

  const [result] = await LexiconEnrollment.aggregate(pipeline);
  return result || null;
}

module.exports = {
  batchFetchPacks,
  findPackByIdOrSlug,
  fetchPackWithRelationships,
  batchGetUserPackProgress,
  batchGetUserTermProgress,
  getGlobalSrsStats,
  getEnrollmentWithLanguage,
};
