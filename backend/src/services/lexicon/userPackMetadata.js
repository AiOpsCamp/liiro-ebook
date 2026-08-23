"use strict";

const LexiconEnrollment = require("../../models/lexicon/LexiconEnrollment.model");
const UserTermProgress = require("../../models/lexicon/UserTermProgress.model");
const LexiconCategory = require("../../models/lexicon/LexiconCategory.model");
const User = require("../../models/User.model");
const { getLocalizedField } = require("../../shared/helpers/pack.helpers");

/**
 * Helper to batch-fetch and index user metadata for a set of pack IDs.
 */
async function fetchAndIndexUserPackMetadata(userId, packIds, scope) {
  const ids = Array.isArray(packIds) ? packIds.map((id) => String(id)) : [];

  const [enrollments, progressDocs, userDoc, categories] = await Promise.all([
    userId && ids.length
      ? LexiconEnrollment.find({ ...scope.enrollmentBase(userId), lexiconPack: { $in: ids } })
          .select("lexiconPack")
          .lean()
      : [],
    userId && ids.length
      ? UserTermProgress.aggregate([
          {
            $match: {
              ...scope.progressBase(userId),
              lexiconPack: { $in: ids },
            },
          },
          {
            $group: {
              _id: "$lexiconPack",
              totalCount: { $sum: 1 },
              completedCount: {
                $sum: { $cond: [{ $eq: ["$masteryLevel", 5] }, 1, 0] },
              },
            },
          },
        ])
      : [],
    userId
      ? User.findById(userId).select("favoriteItems subscription").lean()
      : null,
    LexiconCategory.find({ active: true }).select("_id name").lean(),
  ]);

  const enrolledPackIds = new Set(enrollments.map((e) => String(e.lexiconPack)));
  
  const completedMap = new Map();
  progressDocs.forEach((p) => {
    completedMap.set(String(p._id), p.totalCount > 0 && p.completedCount === p.totalCount);
  });

  const favoriteSet = new Set(
    (userDoc?.favoriteItems || [])
      .filter((i) => i.itemType === "LexiconPack")
      .map((i) => String(i.itemId))
  );

  const categoryNameById = new Map(
    categories.map((c) => [
      String(c._id),
      getLocalizedField(c.name, scope.uiISO, scope.targetISO, ""),
    ])
  );

  const hasPremium = !!userDoc?.subscription?.active;

  return {
    enrolledPackIds,
    completedMap,
    favoriteSet,
    categoryNameById,
    hasPremium,
  };
}

module.exports = { fetchAndIndexUserPackMetadata };
