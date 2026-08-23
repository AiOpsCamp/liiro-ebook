"use strict";

const { createLexiconScope } = require("../../shared/helpers/lexiconLanguageService");

const normalizeLang = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

module.exports = { createLexiconScope, normalizeLang };
