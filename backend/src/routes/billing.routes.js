"use strict";

const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billing.controller");

// Stripe Webhook Endpoint
router.post("/webhook/stripe", billingController.handleStripeWebhook);

// RevenueCat In-App Purchase Webhook Endpoint (iOS & Android)
router.post("/webhook/revenuecat", billingController.handleRevenueCatWebhook);

module.exports = router;
