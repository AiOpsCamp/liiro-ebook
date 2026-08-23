"use strict";

const { LRUCache } = require("lru-cache");
const mongoose = require("mongoose");
const UserTermProgress = require("../models/lexicon/UserTermProgress.model");

// 5-minute in-memory TTL per user/language combination
const srsCache = new LRUCache({
  max: 5000,
  ttl: 5 * 60 * 1000,
});

async function getGlobalSrsStats(userId, language) {
  const cacheKey = `srs:stats:${userId}:${language}`;
  const cached = srsCache.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const uid = new mongoose.Types.ObjectId(String(userId));

  const [aggResult] = await UserTermProgress.aggregate([
    {
      $match: {
        user: uid,
        language,
      },
    },
    {
      $group: {
        _id: null,
        dueCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$nextReviewAt", null] },
                  { $lte: ["$nextReviewAt", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
        activeCount: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $gt: ["$confidence", 0] },
                  { $eq: ["$isLearned", true] },
                  { $eq: ["$markedForReview", true] },
                ],
              },
              1,
              0,
            ],
          },
        },
        learnedCount: {
          $sum: {
            $cond: [{ $eq: ["$isLearned", true] }, 1, 0],
          },
        },
      },
    },
  ]);

  const result = {
    dueCount: aggResult?.dueCount || 0,
    activeCount: aggResult?.activeCount || 0,
    learnedCount: aggResult?.learnedCount || 0,
  };

  srsCache.set(cacheKey, result);
  return result;
}

function invalidateSrsStats(userId, language) {
  if (userId && language) {
    srsCache.delete(`srs:stats:${userId}:${language}`);
  }
}

module.exports = {
  getGlobalSrsStats,
  invalidateSrsStats,
};
