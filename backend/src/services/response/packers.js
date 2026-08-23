"use strict";

const { toHttps, getLocalizedField } = require("../../shared/helpers/pack.helpers");
const { LEVEL_LABELS, DIFFICULTY_LABELS, localizeCode } = require("../../shared/helpers/lexiconCodeLabels");

/**
 * Resolves pack category name using categoryId map first, falling back to legacy category string/map.
 */
function resolveCategory(pack, categoryNameById, scope) {
  if (pack?.categoryId && categoryNameById) {
    const catName = categoryNameById.get(String(pack.categoryId));
    if (catName) return catName;
  }
  if (pack?.category) {
    return getLocalizedField(pack.category, scope?.uiISO, scope?.targetISO, "");
  }
  return "";
}

/**
 * Formats a pack object with user enrollment, completion, and favorite status.
 */
function formatPackWithEnrollment(pack, metadata, scope, extra = {}) {
  const id = String(pack._id);
  const uiLang = scope?.uiISO || "en";

  const levelStr = pack.levelCode
    ? localizeCode(LEVEL_LABELS, pack.levelCode, uiLang, "")
    : pack.level
    ? getLocalizedField(pack.level, scope?.uiISO, scope?.targetISO, "")
    : "";

  const difficultyStr = pack.difficultyCode
    ? localizeCode(DIFFICULTY_LABELS, pack.difficultyCode, uiLang, "")
    : pack.difficulty
    ? getLocalizedField(pack.difficulty, scope?.uiISO, scope?.targetISO, "")
    : "";

  return {
    _id: pack._id,
    slug: pack.slug,
    name: getLocalizedField(pack.name, scope?.uiISO, scope?.targetISO, ""),
    category: resolveCategory(pack, metadata?.categoryNameById, scope),
    image_url: toHttps(pack.image_url || ""),
    free_access: !!pack.free_access,
    level: levelStr,
    difficulty: difficultyStr,
    isEnrolled: metadata?.enrolledPackIds?.has(id) || false,
    isFavourite: metadata?.favoriteSet?.has(id) || false,
    isCompleted: metadata?.completedMap?.get(id) || false,
    access: pack.free_access
      ? { free: true, premium: false }
      : { free: false, premium: !!metadata?.hasPremium },
    ...extra,
  };
}

module.exports = { formatPackWithEnrollment, resolveCategory };
