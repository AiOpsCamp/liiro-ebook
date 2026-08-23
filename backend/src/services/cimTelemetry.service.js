"use strict";

/**
 * Fire-and-forget daily telemetry rollup for the two CIM penalties (category
 * overload + confusable-pair). Shared by UserTermProgress.model.js and
 * LexiconProgress.model.js so the increment logic lives in exactly one
 * place. See CimTelemetryDaily.model.js for why this exists.
 *
 * Never awaited by callers — must not add latency or failure risk to the
 * SRS scoring hot path (mirrors the existing logAnswerEvent pattern in
 * progress.controller.js).
 */
function todayUtcDateKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function recordCimPenalty({ language, categoryPenalty = 0, confusablePenalty = 0 }) {
  if (categoryPenalty <= 0 && confusablePenalty <= 0) return;

  const CimTelemetryDaily = require("../models/lexicon/CimTelemetryDaily.model");
  const date = todayUtcDateKey();
  const lang = String(language || "unknown").toLowerCase();

  const inc = {};
  if (categoryPenalty > 0) {
    inc.categoryPenaltyCount = 1;
    inc.categoryPenaltySum = categoryPenalty;
  }
  if (confusablePenalty > 0) {
    inc.confusablePenaltyCount = 1;
    inc.confusablePenaltySum = confusablePenalty;
  }

  CimTelemetryDaily.updateOne({ date, language: lang }, { $inc: inc }, { upsert: true }).catch(
    (err) => {
      console.error("Error recording CIM telemetry:", err.message);
    }
  );
}

module.exports = { recordCimPenalty, todayUtcDateKey };
