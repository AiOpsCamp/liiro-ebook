"use strict";

const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billing.controller");

const authMiddleware = require("../middlewares/authMiddleware");

// Stripe Webhook Endpoint
router.post("/webhook/stripe", billingController.handleStripeWebhook);

// RevenueCat In-App Purchase Webhook Endpoint (iOS & Android)
router.post("/webhook/revenuecat", billingController.handleRevenueCatWebhook);

// User Subscription & Checkout Session Endpoints
router.get("/subscription", authMiddleware.optionalAuth, billingController.getUserSubscription);
router.post("/create-checkout-session", authMiddleware.optionalAuth, billingController.createCheckoutSession);
router.post("/portal-session", authMiddleware.optionalAuth, billingController.createPortalSession);
router.post("/listening-session", authMiddleware.optionalAuth, billingController.logListeningSession);

module.exports = router;
