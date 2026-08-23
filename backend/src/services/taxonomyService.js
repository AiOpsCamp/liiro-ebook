"use strict";

const LexiconCategory = require("../models/lexicon/LexiconCategory.model");
const LexiconTag = require("../models/lexicon/LexiconTag.model");

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let categoriesCache = { data: null, expiry: 0 };
let tagsCache = { data: null, expiry: 0 };

async function getAllCategoriesCached() {
  const now = Date.now();
  if (categoriesCache.data && categoriesCache.expiry > now) {
    return categoriesCache.data;
  }
  const categories = await LexiconCategory.find()
    .select("_id name slug parent order type")
    .lean();
  categoriesCache = {
    data: categories,
    expiry: now + TTL_MS,
  };
  return categories;
}

async function getAllTagsCached() {
  const now = Date.now();
  if (tagsCache.data && tagsCache.expiry > now) {
    return tagsCache.data;
  }
  const tags = await LexiconTag.find().select("_id name slug").lean();
  tagsCache = {
    data: tags,
    expiry: now + TTL_MS,
  };
  return tags;
}

function invalidateTaxonomyCache() {
  categoriesCache = { data: null, expiry: 0 };
  tagsCache = { data: null, expiry: 0 };
}

module.exports = {
  getAllCategoriesCached,
  getAllTagsCached,
  invalidateTaxonomyCache,
};
