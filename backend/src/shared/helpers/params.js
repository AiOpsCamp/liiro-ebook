"use strict";

function parseSlug(input) {
  const s = String(input || "")
    .trim()
    .toLowerCase();
  return s || null;
}

function parseBool(input, defaultValue = false) {
  if (input === undefined || input === null || input === "") return defaultValue;
  const v = String(input).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(v)) return true;
  if (["false", "0", "no", "n", "off"].includes(v)) return false;
  return defaultValue;
}

function parseLimit(input, { min = 1, max = 100, defaultValue = 50 } = {}) {
  const n = Number.parseInt(input, 10);
  const v = Number.isFinite(n) ? n : defaultValue;
  return Math.min(Math.max(v, min), max);
}

module.exports = { parseSlug, parseBool, parseLimit };
