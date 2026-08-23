"use strict";

/**
 * The ONE canonical definition of the 4-bucket confidence taxonomy used
 * across vocabulary progress tracking (Started / In Progress / Learned /
 * In Review). Every place that classifies a term into a named bucket — in-
 * memory filters and MongoDB aggregation pipelines alike — should call into
 * this module instead of re-deriving the thresholds.
 *
 * Confidence scale is 0-3 (there is no "Mastered" tier above Learned).
 * "In Review" is NOT a confidence range — it's a flag-driven override: a term
 * that regresses (wrong answer on a term it had previously gotten right, or
 * had confidence >= 1) enters In Review immediately regardless of its
 * confidence number, and leaves the moment it's answered correctly again.
 * That's the same `inMistakeBucket` flag already maintained per-answer in
 * progress.controller.js — this module doesn't set it, only reads it.
 *
 *   In Review:    inMistakeBucket === true (checked FIRST, overrides below)
 *   Started:      confidence === 0 (or null/missing)
 *   In Progress:  confidence 1-2
 *   Learned:      confidence === 3
 *
 * See multicamp-frontend/docs/VOCABULARY_LEARNING_ARCHITECTURE.md §6/§6c for
 * the frontend side of this same taxonomy (components/vocabulary/start/types.ts).
 */

function getConfidenceBucket(confidence, inMistakeBucket) {
  if (inMistakeBucket) return "review";
  const c = confidence == null ? 0 : confidence;
  if (c === 0) return "started";
  if (c === 1 || c === 2) return "inProgress";
  return "learned"; // c === 3 (or defensively >= 3, pre-migration data)
}

/**
 * Mongo aggregation $group accumulator fragment — classifies a (possibly
 * pre-grouped/deduped) confidence + inMistakeBucket field pair into the 4
 * buckets in one pass. `confidenceField`/`mistakeBucketField` are the Mongo
 * field paths to classify, e.g. "$confidence"/"$inMistakeBucket" or
 * "$maxConf"/"$anyMistakeBucket" after an upstream $group stage.
 *
 * Spread the result into a $group stage's field list:
 *   { $group: { _id: null, ...bucketCountGroupFields("$confidence", "$inMistakeBucket") } }
 */
function bucketCountGroupFields(confidenceField, mistakeBucketField) {
  const isInReview = {
    $or: [{ $eq: [mistakeBucketField, true] }, { $eq: [mistakeBucketField, 1] }],
  };
  const notInReview = {
    $and: [{ $ne: [mistakeBucketField, true] }, { $ne: [mistakeBucketField, 1] }],
  };
  return {
    reviewCount: {
      $sum: { $cond: [isInReview, 1, 0] },
    },
    startedCount: {
      $sum: {
        $cond: [
          { $and: [notInReview, { $or: [{ $eq: [confidenceField, 0] }, { $eq: [confidenceField, null] }] }] },
          1,
          0,
        ],
      },
    },
    inProgressCount: {
      $sum: {
        $cond: [
          { $and: [notInReview, { $gte: [confidenceField, 1] }, { $lte: [confidenceField, 2] }] },
          1,
          0,
        ],
      },
    },
    learnedCount: {
      $sum: { $cond: [{ $and: [notInReview, { $gte: [confidenceField, 3] }] }, 1, 0] },
    },
  };
}

module.exports = { getConfidenceBucket, bucketCountGroupFields };
