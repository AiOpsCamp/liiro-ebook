"use strict";

const CIM_CONFIG = require("../config/cim.config");

/**
 * LangoWords Memory Score (LMRS) — shared spacing formula.
 *
 * Previously this exact formula was copy-pasted independently in
 * UserTermProgress.model.js and LexiconProgress.model.js. Any tuning
 * (weights, day buckets, the CIM penalty) had to be applied twice, with no
 * guardrail against the two copies silently diverging. This is now the
 * single source of truth; both models call it with their own field names
 * normalized into this shape.
 *
 * @param {object} input
 * @param {Date|string|null} input.lastPractisedAt
 * @param {Date|string|null} input.firstSeenAt
 * @param {number} input.confidence        0-3
 * @param {number} input.correctCount
 * @param {number} input.incorrectCount
 * @param {number} input.currentStreak
 * @param {number} input.longestStreak
 * @param {"correct"|"incorrect"|null} input.lastResult
 * @param {boolean} input.markedForReview
 * @param {number} input.interferenceCount  same-category terms practiced in
 *   the CIM window (CIM_CONFIG.WINDOW_MS) — see src/config/cim.config.js
 * @param {number} input.confusablePairCount  recently-practiced terms that are
 *   an actual confusable pair with this term (LexiconTerm.confusableWith) —
 *   a real lexical-similarity signal, not a topic-frequency proxy
 * @param {number} userStreak
 * @returns {{ memoryScore: number, nextReviewAt: Date, cimPenalty: number, confusablePenalty: number }}
 */
function computeMemoryScoreAndNextReview(input, userStreak = 0) {
  if (!input) return { memoryScore: 0, nextReviewAt: null, cimPenalty: 0, confusablePenalty: 0 };

  const now = new Date();
  const lastPractisedAt = input.lastPractisedAt || input.firstSeenAt || now;
  const gapMs = now.getTime() - new Date(lastPractisedAt).getTime();
  const gapDays = gapMs > 0 ? gapMs / (1000 * 60 * 60 * 24) : 0;

  const confidence = typeof input.confidence === "number" ? input.confidence : 0;
  const correctCount = typeof input.correctCount === "number" ? input.correctCount : 0;
  const incorrectCount = typeof input.incorrectCount === "number" ? input.incorrectCount : 0;
  const currentStreak = typeof input.currentStreak === "number" ? input.currentStreak : 0;
  const longestStreak = typeof input.longestStreak === "number" ? input.longestStreak : 0;
  const lastResult = input.lastResult || null;
  const marked = !!input.markedForReview;
  const interferenceCount =
    typeof input.interferenceCount === "number" ? input.interferenceCount : 0;
  const confusablePairCount =
    typeof input.confusablePairCount === "number" ? input.confusablePairCount : 0;

  // Confidence scale is 0-3 (no "Mastered" tier). Multiplier rescaled from
  // 1.2 to 2.0 so the max achievable base (confidence=3 * 2.0 = 6.0) matches
  // what confidence=5 * 1.2 used to contribute under the old 0-5 scale —
  // preserving B's relative weight against P/R/F rather than silently
  // shrinking it to 3.6 and skewing the whole formula's balance.
  const B = confidence * 2.0;
  let P = currentStreak * 0.3 + longestStreak * 0.1 + correctCount * 0.05 - incorrectCount * 0.05;
  if (lastResult === "correct") P += 0.5;
  else if (lastResult === "incorrect") P -= 0.5;

  const D = 0;
  const safeGapDays = Math.max(0, gapDays);
  const R = Math.log(1 + safeGapDays) * 0.8;

  let F = incorrectCount * 0.07;
  if (marked) F += 1.2;
  if (safeGapDays > 3) F += 0.4 * (safeGapDays - 3);

  // CIM Penalty: compress schedule if the user studied too many terms of the
  // same category/module in the shared interference window.
  let cimPenalty = 0;
  if (interferenceCount > CIM_CONFIG.HIGH_COUNT) {
    cimPenalty = Math.min(
      CIM_CONFIG.MAX_PENALTY,
      (interferenceCount - CIM_CONFIG.HIGH_COUNT) * CIM_CONFIG.PENALTY_STEP
    );
  }

  // Confusable-pair penalty: real term-level interference, based on actual
  // lexical similarity (see src/utils/stringSimilarity.js), not topic
  // frequency. Starts from the first recently-practiced confusable partner —
  // no "over N" threshold, since even one genuinely confusable term studied
  // nearby is a real interference risk.
  const confusablePenalty = Math.min(
    CIM_CONFIG.CONFUSABLE_MAX_PENALTY,
    confusablePairCount * CIM_CONFIG.CONFUSABLE_PENALTY_PER_PAIR
  );

  let memoryScore = B + P + D + R - F - cimPenalty - confusablePenalty;
  if (memoryScore < 0) memoryScore = 0;
  if (memoryScore > 10) memoryScore = 10;

  let daysToNext;
  if (memoryScore < 2) daysToNext = 0.33;
  else if (memoryScore < 4) daysToNext = 1;
  else if (memoryScore < 6) daysToNext = 3;
  else if (memoryScore < 8) daysToNext = 7;
  else if (memoryScore < 10) daysToNext = 14;
  else daysToNext = 30;

  // Elastic Neural States momentum scaling
  let mElastic = 1.0;
  if (userStreak > 0) {
    mElastic = 1.0 + Math.min(0.15, userStreak * 0.01);
  } else {
    mElastic = 0.85;
  }
  daysToNext = daysToNext * mElastic;

  const nextReviewAt = new Date(now.getTime() + daysToNext * 24 * 60 * 60 * 1000);
  return { memoryScore, nextReviewAt, cimPenalty, confusablePenalty };
}

module.exports = { computeMemoryScoreAndNextReview };
