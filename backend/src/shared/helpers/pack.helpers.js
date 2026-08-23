"use strict";
const mongoose = require("mongoose");

/* ───────────────────────────── Basics ───────────────────────────── */

/** Force http → https for CDN / image URLs */
function toHttps(url = "") {
  return String(url || "")
    .trim()
    .replace(/^http:\/\//i, "https://");
}

/**
 * Very light string cleaner for params / labels (NOT for HTML rendering).
 * Keeps it intentionally conservative: removes a few problematic characters.
 */
function sanitizeString(value = "") {
  return String(value ?? "")
    .replace(/[<>;$`\\]/g, "")
    .trim();
}

/** Escape regex special chars (safe for RegExp construction) */
function escapeRegex(value = "") {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Mongo ObjectId guard */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Normalize language keys consistently */
function normalizeLangKey(lang) {
  const s = String(lang ?? "").trim();
  return s ? s.toLowerCase() : null;
}

/**
 * Convert Mongoose Map → plain object (safe no-op otherwise).
 * Useful for API responses / exports.
 */
function mapToObj(value) {
  if (!value) return value;
  if (value instanceof Map) return Object.fromEntries(value.entries());
  return value;
}

/** Normalize known multilingual fields on a pack (admin/export convenience) */
function normalizePackMaps(pack) {
  if (!pack || typeof pack !== "object") return pack;

  const fields = [
    "name",
    "topic",
    "description",
    "status",
    "level",
    "difficulty",
    "category",
    "subcategory",
    "module",
    "tags",
  ];

  for (const f of fields) {
    if (pack[f]) pack[f] = mapToObj(pack[f]);
  }
  return pack;
}

/* ───────────────────────────── Localization ───────────────────────────── */

/**
 * Safe multilingual getter.
 *
 * Priority:
 *   1) primary language
 *   2) fallback language
 *   3) en
 *   4) english
 *   5) first available non-empty value
 *
 * Notes:
 * - Returns `defaultValue` if nothing is found (default: null).
 * - Works with both Mongoose Map and plain object.
 * - Supports non-string values too (e.g., arrays for tags).
 */
function getLocalizedField(fieldObj, primaryLangISO, fallbackLangISO, defaultValue = null) {
  if (!fieldObj || typeof fieldObj !== "object") return defaultValue;

  const data = fieldObj instanceof Map ? Object.fromEntries(fieldObj.entries()) : fieldObj;

  const primary = normalizeLangKey(primaryLangISO);
  const fallback = normalizeLangKey(fallbackLangISO);

  const hasValue = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    // allow numbers/objects/booleans as "present"
    return true;
  };

  // Try exact key and some common variants (defensive)
  const pickByKey = (k) => {
    if (!k) return undefined;
    return data[k] ?? data[k.toLowerCase?.()] ?? data[k.toUpperCase?.()] ?? undefined;
  };

  const v1 = pickByKey(primary);
  if (hasValue(v1)) return v1;

  const v2 = pickByKey(fallback);
  if (hasValue(v2)) return v2;

  if (hasValue(data.en)) return data.en;
  if (hasValue(data.english)) return data.english;

  const first = Object.values(data).find((v) => hasValue(v));
  return hasValue(first) ? first : defaultValue;
}

/* ───────────────────────────── Audio helpers ───────────────────────────── */

const AUDIO_BASE = "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-audio";

/**
 * Slugify text for audio file naming.
 * - Lowercases
 * - Removes diacritics
 * - Keeps a-z0-9 and hyphen
 */
function slugifyForAudio(text = "") {
  const s = String(text ?? "").trim();
  if (!s) return "";

  return s
    .toLowerCase()
    .normalize("NFKD") // strip accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build term/example audio URL.
 * @param {string} englishText - ideally the canonical English term used for audio generation
 * @param {string} langISO - target language folder (e.g. "fi")
 */
function buildAudioUrl(englishText, langISO = "en") {
  const slug = slugifyForAudio(englishText);
  const lang = normalizeLangKey(langISO) || "en";
  if (!slug) return null;
  return `${AUDIO_BASE}/${lang}/${slug}-${lang}.mp3`;
}

/**
 * Deduplicate & filter formatted terms for a specific language pair.
 * 
 * Rules:
 * 1. Filters out terms where term === definition (case-insensitive & trimmed), e.g. "hei" === "hei".
 * 2. Filters out terms where definition is empty, "N/A", or whitespace.
 * 3. Deduplicates terms that have the same normalized target definition for this language pair.
 * 
 * @param {Array} terms - Array of formatted terms, e.g. [{ term, definition, ... }]
 * @returns {Array} Cleaned, deduplicated terms array
 */
function deduplicateAndFilterTerms(terms) {
  if (!Array.isArray(terms)) return [];

  const seen = new Set();
  const result = [];

  for (const t of terms) {
    if (!t) continue;
    const termVal = String(t.term ?? "").trim();
    const defVal = String(t.definition ?? "").trim();

    if (!termVal || !defVal || termVal === "N/A" || defVal === "N/A") continue;

    // Normalize
    const normTerm = termVal.toLowerCase().replace(/\s+/g, " ");
    const normDef = defVal.toLowerCase().replace(/\s+/g, " ");

    if (!normTerm || !normDef) continue;
    // Skip if term equals definition (e.g. "hei" - "hei")
    if (normTerm === normDef) continue;

    // Deduplicate by normalized target definition for this language pair
    if (seen.has(normDef)) {
      continue;
    }

    seen.add(normDef);
    result.push(t);
  }

  return result;
}

module.exports = {
  // basics
  toHttps,
  sanitizeString,
  escapeRegex,
  isValidObjectId,
  normalizeLangKey,

  // localization
  getLocalizedField,

  // audio
  buildAudioUrl,
  slugifyForAudio,

  // map helpers
  mapToObj,
  normalizePackMaps,

  // deduplication
  deduplicateAndFilterTerms,
};
