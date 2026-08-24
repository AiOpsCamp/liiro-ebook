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
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event = req.body;

    if (webhookSecret && sig) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error("⚠️ Stripe Webhook Signature Verification Failed:", err.message);
        return res.status(400).json({ success: false, message: `Webhook Signature Error: ${err.message}` });
      }
    }

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

    if (!authHeader || authHeader !== expectedAuth) {
      return res.status(401).json({ success: false, message: "Unauthorized RevenueCat webhook request" });
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

// ── User-Facing Billing Endpoints ───────────────────────────────────────────

exports.getUserSubscription = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(200).json({
        success: true,
        data: { isPremium: false, subscriptionTier: "free", expiresAt: null },
      });
    }

    const user = await User.findById(userId).select("isPremium subscriptionTier subscriptionExpiresAt stripeCustomerId").lean();
    res.status(200).json({
      success: true,
      data: {
        isPremium: user?.isPremium || false,
        subscriptionTier: user?.subscriptionTier || "free",
        expiresAt: user?.subscriptionExpiresAt || null,
        stripeCustomerId: user?.stripeCustomerId || null,
      },
    });
  } catch (error) {
    console.error("Error in getUserSubscription:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { priceId = "price_12345_pro_monthly", cancelUrl, successUrl } = req.body;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(200).json({
        success: true,
        message: "Stripe test mode fallback",
        url: `${successUrl || "http://localhost:8086"}?session_id=cs_test_mock_123`,
      });
    }

    const stripe = require("stripe")(stripeKey);
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: userId ? String(userId) : undefined,
        success_url: successUrl || "http://localhost:8086/details/alices-adventures-in-wonderland?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: cancelUrl || "http://localhost:8086",
      });

      return res.status(200).json({ success: true, url: session.url });
    } catch (stripeErr) {
      console.warn("⚠️ Stripe API Notice (Fallback to mock session):", stripeErr.message);
      return res.status(200).json({
        success: true,
        message: "Stripe test mode session active",
        url: `${successUrl || "http://localhost:8086"}?session_id=cs_test_mock_123`,
      });
    }
  } catch (error) {
    console.error("Error in createCheckoutSession:", error);
    res.status(500).json({ success: false, message: "Checkout Error", error: error.message });
  }
};

exports.createPortalSession = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { returnUrl } = req.body;

    const user = userId ? await User.findById(userId).select("stripeCustomerId").lean() : null;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || !user?.stripeCustomerId) {
      return res.status(200).json({
        success: true,
        message: "Portal session fallback",
        url: returnUrl || "http://localhost:8086",
      });
    }

    const stripe = require("stripe")(stripeKey);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || "http://localhost:8086",
    });

    res.status(200).json({ success: true, url: portalSession.url });
  } catch (error) {
    console.error("Error in createPortalSession:", error);
    res.status(500).json({ success: false, message: "Portal Error", error: error.message });
  }
};

// ── Metered Audiobook Listening Session Heartbeat (BookBeat Parity) ─────────

exports.logListeningSession = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { durationSeconds = 30 } = req.body;

    if (!userId) {
      return res.status(200).json({ success: true, message: "Guest session logged" });
    }

    const secs = Math.min(Math.max(parseInt(durationSeconds) || 30, 1), 300);
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { usedListeningSecondsCurrentCycle: secs } },
      { new: true }
    ).select("monthlyListeningLimitHours usedListeningSecondsCurrentCycle").lean();

    const limitSecs = (user?.monthlyListeningLimitHours || 20) * 3600;
    const usedSecs = user?.usedListeningSecondsCurrentCycle || 0;
    const remainingHours = Math.max(0, (limitSecs - usedSecs) / 3600);

    res.status(200).json({
      success: true,
      data: {
        usedSeconds: usedSecs,
        limitHours: user?.monthlyListeningLimitHours || 20,
        remainingHours: parseFloat(remainingHours.toFixed(1)),
        isQuotaExhausted: usedSecs >= limitSecs,
      },
    });
  } catch (error) {
    console.error("Error in logListeningSession:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
