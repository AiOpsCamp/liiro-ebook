"use strict";

const express = require("express");
const router = express.Router();
const quoteController = require("../controllers/quote.controller");

router.get("/", quoteController.getQuotes);
router.post("/seed", quoteController.seedCuratedQuotes);
router.get("/:id", quoteController.getQuoteById);
router.post("/:id/like", quoteController.likeQuote);
router.post("/:id/share", quoteController.shareQuote);

module.exports = router;
