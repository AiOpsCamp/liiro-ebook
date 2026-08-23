"use strict";

const { createLexiconScope } = require("./lexiconLanguageService");

const normalizeLang = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

module.exports = { createLexiconScope, normalizeLang };
