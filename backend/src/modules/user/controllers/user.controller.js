"use strict";
const crypto = require("crypto");
const User = require("../../../models/User.model");
const { createNotification } = require("../../../shared/helpers/notification.controller");
const { checkAndAwardBadges } = require("../../../shared/helpers/badgeService");
const { httpError } = require("../../../shared/helpers/http");
const StoreOffering = require("../../../models/StoreOffering.model");
const notificationService = require("../../../services/notification.service");
function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function requireUserId(req) {
  const userId = req.user && (req.user._id || req.user.id);
  if (!userId) throw httpError(401, "Unauthorized");
  return userId;
}

function _pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

async function maybeUpdateLevel(userId) {
  const userLite = await User.findById(userId).select("level xp_score").lean();
  if (!userLite) throw httpError(404, "User not found");

  const prevLevel = userLite.level ?? 0;
  const xp = userLite.xp_score ?? 0;
  const nextLevel = Math.floor(xp / 200);

  if (nextLevel !== prevLevel) {
    const upd = await User.updateOne(
      { _id: userId, level: { $ne: nextLevel } },
      { $set: { level: nextLevel } }
    );

    if (upd.modifiedCount > 0) {
      try {
        await checkAndAwardBadges(userId);
        const msg =
          nextLevel > prevLevel
            ? `Congratulations! You've reached level ${nextLevel}.`
            : `Your level has dropped to ${nextLevel}.`;
        await createNotification(userId, "level-change", msg);
      } catch (e) {
        console.warn("Level change side-effects failed:", e?.message || e);
      }
    }
  }
}

/* ======================================================
   Existing endpoint (UNCHANGED)
====================================================== */
async function getUserInfo(req, res) {
  const userId = requireUserId(req);
  await maybeUpdateLevel(userId);

  const freshUser = await User.findById(userId)
    .select(
      `
        -stripeCustomerInfo
        -recentlyViewedPacks
        -dailyLexiconPacks
        -dailyExercises
        -enrollments
        -completedCourses
        -favoriteItems
        -inProgressCourses
        -notifications
        -cart
        -languagePackSubscriptions
        -activityDates
        -paidCourses
        -favoriteCourses
        -paidAssessments
      `
    )
    .populate([
      { path: "revenueCat", select: {}, options: { lean: true } },
      { path: "lingoCampConfig", options: { lean: true } },
    ])
    .lean();

  if (!freshUser) throw httpError(404, "User not found");

  // ✅ FIX: Get subscription from populated revenueCat (RevenueCatAccount), not from User directly
  const responseData = {
    ...freshUser,
    langowordSubscription: freshUser?.revenueCat?.langowordSubscription || null,
    notificationToken: freshUser?.notificationToken ?? null,
  };

  return res.status(200).json({
    success: true,
    message: "User info fetched successfully",
    data: responseData,
  });
}
/* ======================================================
   ✅ DROP-IN: getUserInfoClean that returns EXACT "currentSubscription" shape
   - Source of truth: RevenueCatAccount.langowordSubscription
   - Offering mapping: same logic as billing controller (/revenuecat/webhook-events/me)
====================================================== */
/**
 * Requirements:
 * - req.user exists (auth middleware)
 * - User has: revenueCat (ObjectId -> RevenueCatAccount)
 * - RevenueCatAccount has: langowordSubscription (as in your schema)
 * - StoreOffering model exists (same as billing controller)
 */
async function getUserInfoClean(req, res) {
  const authedUserId = req.user?._id || req.user?.id;
  if (!authedUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

  // ---------- helpers (same style as billing controller) ----------
  const _asLower = (v) => {
    const s = String(v ?? "").trim();
    return s ? s.toLowerCase() : null;
  };
  const _asString = (v) => String(v ?? "").trim();

  function offeringToDTO(doc) {
    if (!doc) return null;
    return {
      key: doc.key,
      title: doc.title,
      description: doc.description || "",
      features: Array.isArray(doc.features) ? doc.features : [],
      display: doc.display || {},
      stripe: doc.stripe || {},
      apple: doc.apple || {},
      google: doc.google || {},
      revenuecat: doc.revenuecat || {},
    };
  }
  function _offeringMini(doc) {
    if (!doc) return null;
    return { key: doc.key, title: doc.title };
  }
  function buildOfferingLookupMap(offerings) {
    const map = new Map();
    for (const o of offerings) {
      if (o?.stripe?.priceId) map.set(String(o.stripe.priceId), o);
      if (o?.stripe?.productId) map.set(String(o.stripe.productId), o);
      if (o?.apple?.productId) map.set(String(o.apple.productId), o);
      if (o?.google?.productId) map.set(String(o.google.productId), o);
      if (o?.google?.basePlanId) map.set(String(o.google.basePlanId), o);
      if (o?.google?.offerId) map.set(String(o.google.offerId), o);
      if (o?.revenuecat?.entitlementId) map.set(String(o.revenuecat.entitlementId), o);
      if (o?.revenuecat?.packageId) map.set(String(o.revenuecat.packageId), o);
      if (o?.revenuecat?.offeringId) map.set(String(o.revenuecat.offeringId), o);
      if (o?.metadata?.rcProductId) map.set(String(o.metadata.rcProductId), o);
    }
    return map;
  }

  // ---------- load user + RC account + notifications unread count ----------
  const [user, unreadNotificationsCount] = await Promise.all([
    User.findById(authedUserId)
      .select(
        [
          "-password",
          "-stripeCustomerInfo",
          "-notifications",
          "-pushTokens",
          "-recentlyViewedPacks",
          "-dailyLexiconPacks",
          "-dailyExercises",
          "-enrollments",
          "-languagePackSubscriptions",
          "-activityDates",
          "-resetPasswordToken",
          "-resetPasswordExpires",
          "-restoreAccountToken",
          "-restoreAccountExpires",
          "-tokenInvalidBefore",
          "-lastKnownIp",
          "-lastKnownUserAgent",
        ].join(" ")
      )
      .select(
        "_id username email first_name last_name picture role emailVerified onBoarding gender location xp_score level lastLogin accountStatus isSuspended suspendedAt createdAt updatedAt revenueCat lingoCampConfig"
      )
      .populate([
        {
          path: "revenueCat",
          select: [
            "_id",
            "mongo_user_id",
            "userEmail",
            "langowordSubscription",
            "request_date",
            "request_date_ms",
            "createdAt",
            "updatedAt",
          ].join(" "),
          options: { lean: true },
        },
        { path: "lingoCampConfig", options: { lean: true } },
      ])
      .lean(),
    notificationService.getUnreadCount(authedUserId),
  ]);

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // ---------- offerings lookup (for key/title/offering) ----------
  const offerings = await StoreOffering.find({ active: true })
    .select("key title description features display stripe apple google revenuecat metadata")
    .lean();
  const lookup = buildOfferingLookupMap(offerings);

  // ---------- currentSubscription EXACT SHAPE ----------
  const rcSub = user?.revenueCat?.langowordSubscription || null;

  const emptyCurrentSubscription = {
    isPremium: false,
    scheduledCancellation: false,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    store: null,
    productIdentifier: null,
    productPlanIdentifier: null,
    entitlementIds: [],
    expiresDate: null,
    price: { amount: null, currency: null },
    managementUrl: null,
    willRenew: null,
    unsubscribeDetectedAt: null,
    key: null,
    title: null,
    offering: null,
  };

  let currentSubscription = emptyCurrentSubscription;

  const isDirectPremium =
    user?.role === "admin" ||
    user?.role === "premiumUser" ||
    user?.isPremium === true ||
    (user?.subscription && (user.subscription.isPremium || user.subscription.isActive)) ||
    (user?.hasYearlySubscription && user?.subscriptionExpirationDate && new Date(user.subscriptionExpirationDate) > new Date());

  if (rcSub) {
    // Defensive premium check: honor the stored `active` flag BUT also enforce
    // the expiry date. The `active` flag only flips when a RevenueCat webhook or
    // an explicit sync updates this snapshot; if that update is missed (e.g. a
    // webhook that couldn't be delivered), a subscription that has already
    // lapsed could otherwise still read as premium. A null expiresDate means a
    // lifetime/non-expiring entitlement (stays active).
    const notExpired = !rcSub.expiresDate || new Date(rcSub.expiresDate).getTime() > Date.now();
    const isPremium = (!!rcSub.active && notExpired) || isDirectPremium;
    const willRenew = typeof rcSub.willRenew === "boolean" ? rcSub.willRenew : null;
    const unsubscribeDetectedAt = rcSub.unsubscribeDetectedAt || null;
    const scheduledCancellation = !!(isPremium && willRenew === false && unsubscribeDetectedAt);

    const priceId = rcSub.productPlanIdentifier ? String(rcSub.productPlanIdentifier) : null;
    const productId = rcSub.productIdentifier ? String(rcSub.productIdentifier) : null;

    // Same offering resolution logic as billing controller:
    let currentOffering =
      (priceId && lookup.get(priceId)) || (productId && lookup.get(productId)) || null;

    // if not found, try entitlement ids
    if (!currentOffering && Array.isArray(rcSub.entitlementIds) && rcSub.entitlementIds.length) {
      for (const ent of rcSub.entitlementIds) {
        const hit = lookup.get(String(ent));
        if (hit) {
          currentOffering = hit;
          break;
        }
      }
    }

    currentSubscription = {
      isPremium,
      scheduledCancellation,
      cancelAtPeriodEnd: scheduledCancellation,
      currentPeriodEnd: rcSub.expiresDate || null, // keep exact name like billing controller
      store: rcSub.store || null,
      productIdentifier: rcSub.productIdentifier || null,
      productPlanIdentifier: rcSub.productPlanIdentifier || null,
      entitlementIds: Array.isArray(rcSub.entitlementIds) ? rcSub.entitlementIds : [],
      expiresDate: rcSub.expiresDate || null,
      price: rcSub.price
        ? { amount: rcSub.price.amount ?? null, currency: rcSub.price.currency ?? null }
        : { amount: null, currency: null },
      managementUrl: rcSub.managementUrl || null,
      willRenew,
      unsubscribeDetectedAt,
      key: currentOffering?.key || null,
      title: currentOffering?.title || null,
      offering: offeringToDTO(currentOffering),
    };
  } else if (isDirectPremium) {
    currentSubscription = {
      ...emptyCurrentSubscription,
      isPremium: true,
      title: "Pro Subscription",
      offering: { key: "pro", title: "LangoWords Pro" },
    };
  }

  // ---------- user DTO ----------
  const dto = {
    _id: user._id,
    username: user.username,
    email: user.email,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    picture: user.picture || null,
    role: user.role,
    emailVerified: !!user.emailVerified,
    onBoarding: !!user.onBoarding,
    gender: user.gender || null,
    location: user.location || null,
    xp_score: user.xp_score ?? 0,
    level: user.level ?? 0,
    lastLogin: user.lastLogin || null,
    accountStatus: user.accountStatus,
    isSuspended: !!user.isSuspended,
    suspendedAt: user.suspendedAt || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    unreadNotificationsCount,

    // ✅ EXACT SHAPE you requested
    currentSubscription,

    // optional: keep RC metadata if you want
    revenueCat: user.revenueCat
      ? {
          id: user.revenueCat._id,
          mongo_user_id: user.revenueCat.mongo_user_id || null,
          userEmail: user.revenueCat.userEmail || null,
          request_date: user.revenueCat.request_date || null,
          request_date_ms: user.revenueCat.request_date_ms || null,
          updatedAt: user.revenueCat.updatedAt || null,
        }
      : null,

    lingoCampConfig: user.lingoCampConfig || null,
  };

  return res.status(200).json({
    success: true,
    message: "User info fetched successfully (RevenueCat source of truth)",
    data: dto,
  });
}
async function updateNotificationToken(req, res) {
  const userId = requireUserId(req);
  const raw = (req.body && (req.body.token || req.body.notificationToken)) || "";
  const token = String(raw).trim();
  if (!token) throw httpError(400, "Missing 'token' in body");

  const result = await User.updateOne(
    { _id: userId, notificationToken: { $ne: token } },
    { $set: { notificationToken: token } },
    { timestamps: false }
  );

  const unchanged = result.modifiedCount === 0;
  return res.status(200).json({
    success: true,
    message: unchanged ? "Token unchanged." : "Token updated.",
    data: { notificationToken: token },
  });
}

async function updateMe(req, res) {
  const userId = req.user && req.user._id;
  if (!userId) throw httpError(401, "Unauthorized");

  const allowedFields = ["username", "first_name", "last_name", "gender", "location", "picture"];
  const updates = {};
  for (const key of allowedFields) {
    if (req.body?.[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) throw httpError(400, "No valid fields provided to update");

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) throw httpError(404, "User not found");

  return res.status(200).json({
    success: true,
    message: "User info updated successfully",
    data: user,
  });
}

async function deleteMe(req, res) {
  const user = req.user;
  if (!user) throw httpError(401, "Unauthorized");

  const reason = (req.body && (req.body.reason || req.body.deleteReason)) || "";
  const restoreToken = crypto.randomBytes(32).toString("hex");

  user.restoreAccountToken = hashToken(restoreToken);
  user.restoreAccountExpires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  user.deletedAt = new Date();
  user.accountStatus = "deleted";
  user.deleteReason = String(reason).slice(0, 500) || user.deleteReason;
  user.tokenInvalidBefore = new Date();

  await user.save({ validateBeforeSave: false });

  res.clearCookie("jwt");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Account deleted (soft). You can restore within 14 days.",
    data: {
      deletedAt: user.deletedAt,
      restoreUntil: user.restoreAccountExpires,
      restoreToken,
    },
  });
}

async function restoreAccount(req, res) {
  const token = req.body && req.body.token;
  if (!token) throw httpError(400, "token is required");

  const tokenHash = hashToken(token);

  const user = await User.findOne({
    restoreAccountToken: tokenHash,
    restoreAccountExpires: { $gt: new Date() },
    accountStatus: "deleted",
  }).select("+restoreAccountToken");

  if (!user) throw httpError(400, "Invalid or expired restore token");

  user.deletedAt = null;
  user.accountStatus = "active";
  user.deleteReason = "";
  user.restoreAccountToken = undefined;
  user.restoreAccountExpires = undefined;
  user.tokenInvalidBefore = new Date();

  await user.save({ validateBeforeSave: false });

  res.clearCookie("jwt");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Account restored. Please login again.",
    data: null,
  });
}

module.exports = {
  getUserInfo,
  getUserInfoClean,
  updateNotificationToken,
  updateMe,
  deleteMe,
  restoreAccount,
};
