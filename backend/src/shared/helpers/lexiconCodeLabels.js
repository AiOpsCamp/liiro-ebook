"use strict";

const fs = require("fs");
const path = require("path");

/**
 * JSON-backed code label localization.
 * - Keeps module cached in memory after first require (Node behavior).
 * - You can later add all languages into the JSON without changing code.
 */

const LABELS_PATH = path.join(__dirname, "lexiconCodeLabels.json");

function loadLabels() {
  const raw = fs.readFileSync(LABELS_PATH, "utf8");
  const json = JSON.parse(raw);

  if (!json || typeof json !== "object") {
    throw new Error("lexiconCodeLabels.json is invalid: expected an object");
  }
  if (!json.status || !json.level || !json.difficulty) {
    throw new Error("lexiconCodeLabels.json is invalid: missing status/level/difficulty");
  }

  return {
    STATUS_LABELS: json.status,
    LEVEL_LABELS: json.level,
    DIFFICULTY_LABELS: json.difficulty,
  };
}

// cached after first load
let _cache = null;
function getLabels() {
  if (_cache) return _cache;
  _cache = loadLabels();
  return _cache;
}

/**
 * localizeCode(dict, code, lang, fallback)
 * Fallback order: lang (exact) -> lang lowercase -> en -> code/fallback
 */
function localizeCode(dict, code, lang, fallback = null) {
  if (!code) return fallback;
  const c = String(code).trim();
  const row = dict?.[c];
  if (!row) return fallback ?? c;

  const l = String(lang || "").trim();
  if (l && row[l] != null) return row[l];

  const ll = l.toLowerCase();
  if (ll && row[ll] != null) return row[ll];

  return row.en ?? fallback ?? c;
}

module.exports = {
  // getters so callers can destructure like before
  get STATUS_LABELS() {
    return getLabels().STATUS_LABELS;
  },
  get LEVEL_LABELS() {
    return getLabels().LEVEL_LABELS;
  },
  get DIFFICULTY_LABELS() {
    return getLabels().DIFFICULTY_LABELS;
  },
  localizeCode,
};
