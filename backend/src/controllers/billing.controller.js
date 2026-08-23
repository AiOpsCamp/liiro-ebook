"use strict";

const mongoose = require("mongoose");

/**
 * Stripe & RevenueCat Webhook Entitlement Controller
 * Real-time subscription lifecycle listener for Web, iOS App Store, and Google Play Store
 */

// Simple User Schema reference for billing updates
const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));

exports.handleStripeWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (!event || !event.type) {
      return res.status(400).json({ success: false, message: "Invalid Stripe event payload" });
    }

    console.log(`💳 [Stripe Webhook] Received event: ${event.type}`);

    const dataObject = event.data?.object || {};
    const customerId = dataObject.customer;
    const clientUserId = dataObject.client_reference_id || dataObject.metadata?.userId;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "checkout.session.completed": {
        const isPaid = dataObject.status === "active" || dataObject.payment_status === "paid";
        const tier = dataObject.metadata?.tier || "pro";
        const expiresAt = dataObject.current_period_end
          ? new Date(dataObject.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (clientUserId && mongoose.Types.ObjectId.isValid(clientUserId)) {
          await User.findByIdAndUpdate(clientUserId, {
            $set: {
              isPremium: isPaid,
              subscriptionTier: isPaid ? tier : "free",
              stripeCustomerId: customerId,
              subscriptionExpiresAt: expiresAt,
              updatedAt: new Date(),
            },
          });
          console.log(`   ✅ User '${clientUserId}' subscription updated to '${tier}' (active: ${isPaid})`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        if (clientUserId && mongoose.Types.ObjectId.isValid(clientUserId)) {
          await User.findByIdAndUpdate(clientUserId, {
            $set: {
              isPremium: false,
              subscriptionTier: "free",
              updatedAt: new Date(),
            },
          });
          console.log(`   ❌ User '${clientUserId}' subscription canceled`);
        }
        break;
      }

      default:
        console.log(`   ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    res.status(500).json({ success: false, message: "Stripe Webhook Error", error: error.message });
  }
};

exports.handleRevenueCatWebhook = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const expectedAuth = process.env.REVENUECAT_WEBHOOK_AUTH || "Bearer liiro_rc_webhook_secret_2026";

    if (authHeader && authHeader !== expectedAuth) {
      return res.status(403).json({ success: false, message: "Unauthorized RevenueCat webhook request" });
    }

    const { event } = req.body;
    if (!event) {
      return res.status(400).json({ success: false, message: "Invalid RevenueCat event payload" });
    }

    const { type, app_user_id, expiration_at_ms, entitlement_id } = event;
    console.log(`📱 [RevenueCat Webhook] Event: ${type} for User '${app_user_id}' (Entitlement: ${entitlement_id})`);

    const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (app_user_id && mongoose.Types.ObjectId.isValid(app_user_id)) {
      if (type === "INITIAL_PURCHASE" || type === "RENEWAL" || type === "UNCANCEL") {
        await User.findByIdAndUpdate(app_user_id, {
          $set: {
            isPremium: true,
            subscriptionTier: entitlement_id || "pro",
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date(),
          },
        });
        console.log(`   ✅ User '${app_user_id}' in-app purchase renewed (${type})`);
      } else if (type === "CANCELLATION" || type === "EXPIRATION") {
        await User.findByIdAndUpdate(app_user_id, {
          $set: {
            isPremium: false,
            subscriptionTier: "free",
            updatedAt: new Date(),
          },
        });
        console.log(`   ❌ User '${app_user_id}' in-app entitlement expired (${type})`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling RevenueCat webhook:", error);
    res.status(500).json({ success: false, message: "RevenueCat Webhook Error", error: error.message });
  }
};
