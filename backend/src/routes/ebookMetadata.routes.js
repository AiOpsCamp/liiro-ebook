"use strict";

const express = require("express");
const router = express.Router();
const {
  getCategories,
  getAuthors,
  getTags,
  getStats,
} = require("../controllers/ebookMetadata.controller");

router.get("/categories", getCategories);
router.get("/authors", getAuthors);
router.get("/tags", getTags);
router.get("/stats", getStats);

module.exports = router;
