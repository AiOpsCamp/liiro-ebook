"use strict";

const mongoose = require("mongoose");
const { Expo } = require("expo-server-sdk");
const User = require("../models/User.model");
const { createNotification } = require("../shared/helpers/notification.controller");

const expo = new Expo();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const sanitizeString = (s = "") => String(s).trim();

function uniq(arr) {
  return [...new Set(arr)];
}
function normalizeTokens(tokens) {
  return uniq(tokens.map((t) => String(t || "").trim()).filter(Boolean));
}
function splitExpoTokens(tokens) {
  const valid = [];
  const invalid = [];
  for (const t of tokens) {
    if (Expo.isExpoPushToken(t)) valid.push(t);
    else invalid.push(t);
  }
  return { valid, invalid };
}

async function sendViaExpo(messages) {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }
  const receiptIds = tickets.map((t) => t && t.id).filter(Boolean);
  return { tickets, receiptIds };
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** ---------------------------
 * Segments
 * --------------------------*/
const ALLOWED_SEGMENTS = [
  "new_users_1d",
  "new_users_7d",
  "new_users_30d",
  "active_24h",
  "inactive_7d",
  "inactive_30d",
  "inactive_90d",
  "free_users",
  "premium_users",
  "moderators",
  "subscribed_active",
  "subscribed_expired",
  "yearly_subscribers",
  "onboarding_complete",
  "onboarding_incomplete",
  "email_verified",
  "email_unverified",
  "level_5_plus",
  "level_10_plus",
  "xp_1000_plus",
];

function baseHasAnyPushTokenFilter() {
  return {
    accountStatus: { $ne: "deleted" },
    isSuspended: { $ne: true },
    $or: [
      { notificationToken: { $type: "string", $ne: "" } }, // legacy
      { "pushTokens.token": { $type: "string", $ne: "" } }, // multi-device
    ],
  };
}

function buildSegmentUserFilter(segment) {
  const seg = String(segment || "").trim();
  const now = new Date();
  const base = baseHasAnyPushTokenFilter();

  switch (seg) {
    case "new_users_1d":
      return { ...base, createdAt: { $gte: daysAgo(1) } };
    case "new_users_7d":
      return { ...base, createdAt: { $gte: daysAgo(7) } };
    case "new_users_30d":
      return { ...base, createdAt: { $gte: daysAgo(30) } };
    case "active_24h":
      return { ...base, lastLogin: { $gte: hoursAgo(24) } };
    case "inactive_7d":
      return { ...base, lastLogin: { $lte: daysAgo(7) } };
    case "inactive_30d":
      return { ...base, lastLogin: { $lte: daysAgo(30) } };
    case "inactive_90d":
      return { ...base, lastLogin: { $lte: daysAgo(90) } };
    case "free_users":
      return { ...base, role: "freeUser" };
    case "premium_users":
      return { ...base, role: "premiumUser" };
    case "moderators":
      return { ...base, role: "moderator" };
    case "subscribed_active":
      return {
        ...base,
        $or: [{ role: "premiumUser" }, { subscriptionExpirationDate: { $gt: now } }],
      };
    case "subscribed_expired":
      return { ...base, subscriptionExpirationDate: { $type: "date", $lte: now } };
    case "yearly_subscribers":
      return { ...base, hasYearlySubscription: true };
    case "onboarding_complete":
      return { ...base, onBoarding: true };
    case "onboarding_incomplete":
      return { ...base, onBoarding: false };
    case "email_verified":
      return { ...base, emailVerified: true };
    case "email_unverified":
      return { ...base, emailVerified: false };
    case "level_5_plus":
      return { ...base, level: { $gte: 5 } };
    case "level_10_plus":
      return { ...base, level: { $gte: 10 } };
    case "xp_1000_plus":
      return { ...base, xp_score: { $gte: 1000 } };
    default:
      return null;
  }
}

/** ---------------------------
 * Multi-device token extraction
 * --------------------------*/
function extractUserExpoTokens(user, opts = {}) {
  const {
    includeLegacy = true,
    requireNotRevoked = true,
    requireNotInvalid = true,
    requireNotDisabled = true,
    requireSeenWithinDays = null, // e.g. 90
  } = opts;

  const out = [];

  // New pushTokens[]
  if (Array.isArray(user?.pushTokens)) {
    for (const pt of user.pushTokens) {
      if (!pt || !pt.token) continue;
      if (requireNotDisabled && pt.disabled) continue;
      if (requireNotRevoked && pt.revokedAt) continue;
      if (requireNotInvalid && pt.invalidAt) continue;

      if (typeof requireSeenWithinDays === "number") {
        const cutoff = daysAgo(requireSeenWithinDays);
        const lastSeen = pt.lastSeenAt ? new Date(pt.lastSeenAt) : null;
        if (!lastSeen || isNaN(lastSeen.getTime()) || lastSeen < cutoff) continue;
      }

      out.push(String(pt.token).trim());
    }
  }

  // Legacy notificationToken
  if (includeLegacy && user?.notificationToken) {
    const t = String(user.notificationToken).trim();
    if (t) out.push(t);
  }

  return out.filter(Boolean);
}

/**
 * Resolve audience into tokens and recipient user ids.
 * Supports:
 *  - broadcast
 *  - segment
 *  - segments (any/all)
 *  - user
 *  - users
 *  - single
 */
async function resolveAudience(audience, opts = {}) {
  const a = audience || {};
  const target = a.target;

  const tokenPolicy = {
    includeLegacy: true,
    requireNotRevoked: true,
    requireNotInvalid: true,
    requireNotDisabled: true,
    requireSeenWithinDays: null,
    ...opts.tokenPolicy,
  };

  let tokens = [];
  let recipientUserIds = [];

  const selectFields = "_id notificationToken pushTokens";

  if (target === "single") {
    if (!a.expoPushToken) throw new Error("audience.expoPushToken is required for target=single");
    tokens = [sanitizeString(a.expoPushToken)];
  } else if (target === "user") {
    if (!a.userId || !isValidObjectId(a.userId))
      throw new Error("audience.userId must be a valid ObjectId");

    const u = await User.findById(a.userId).select(selectFields).lean();
    if (!u) throw new Error("Target user not found");

    tokens = extractUserExpoTokens(u, tokenPolicy);
    recipientUserIds = [String(u._id)];
  } else if (target === "users") {
    const ids = Array.isArray(a.userIds) ? a.userIds.filter(isValidObjectId) : [];
    if (ids.length === 0)
      throw new Error("audience.userIds must be a non-empty array of valid ObjectIds");

    const users = await User.find({ _id: { $in: ids } })
      .select(selectFields)
      .lean();
    tokens = users.flatMap((u) => extractUserExpoTokens(u, tokenPolicy));
    recipientUserIds = users.map((u) => String(u._id));
  } else if (target === "broadcast") {
    const users = await User.find(baseHasAnyPushTokenFilter()).select(selectFields).lean();
    tokens = users.flatMap((u) => extractUserExpoTokens(u, tokenPolicy));
    recipientUserIds = users.map((u) => String(u._id));
  } else if (target === "segment") {
    const seg = sanitizeString(a.segment);
    if (!seg) throw new Error("audience.segment is required for target=segment");
    if (!ALLOWED_SEGMENTS.includes(seg)) throw new Error("Invalid segment");

    const filter = buildSegmentUserFilter(seg);
    if (!filter) throw new Error("Invalid segment");

    const users = await User.find(filter).select(selectFields).lean();
    tokens = users.flatMap((u) => extractUserExpoTokens(u, tokenPolicy));
    recipientUserIds = users.map((u) => String(u._id));
  } else if (target === "segments") {
    const segs = Array.isArray(a.segments) ? a.segments.map(sanitizeString).filter(Boolean) : [];
    if (segs.length === 0) throw new Error("audience.segments is required for target=segments");

    const invalid = segs.filter((s) => !ALLOWED_SEGMENTS.includes(s));
    if (invalid.length) throw new Error("Invalid segments: " + invalid.join(", "));

    const mode = String(a.segmentMode || "any") === "all" ? "all" : "any";

    const filters = segs.map((s) => buildSegmentUserFilter(s)).filter(Boolean);
    if (filters.length === 0) throw new Error("No valid segment filters.");

    const mongoFilter = mode === "all" ? { $and: filters } : { $or: filters };

    const users = await User.find(mongoFilter).select(selectFields).lean();
    tokens = users.flatMap((u) => extractUserExpoTokens(u, tokenPolicy));
    recipientUserIds = users.map((u) => String(u._id));
  } else {
    throw new Error("Invalid audience.target");
  }

  return { tokens: normalizeTokens(tokens), recipientUserIds };
}

/**
 * Executes an Expo push send with an already-built snapshot.
 * Supports multi-device tokens via resolveAudience().
 */
async function executeExpoSend(snapshot, options = {}) {
  const { limit = null, dryRun = false, tokenPolicy = undefined } = options;

  const { tokens, recipientUserIds } = await resolveAudience(snapshot.audience, { tokenPolicy });

  if (tokens.length === 0) {
    return {
      recipientUserIds,
      tokens,
      validTokens: [],
      invalidTokens: [],
      tickets: [],
      receiptIds: [],
    };
  }

  const cappedTokens =
    typeof limit === "number" && limit > 0 ? tokens.slice(0, Math.floor(limit)) : tokens;

  const { valid: validTokens, invalid: invalidTokens } = splitExpoTokens(cappedTokens);

  if (dryRun) {
    return {
      recipientUserIds,
      tokens: cappedTokens,
      validTokens,
      invalidTokens,
      tickets: [],
      receiptIds: [],
    };
  }

  if (validTokens.length === 0) {
    return {
      recipientUserIds,
      tokens: cappedTokens,
      validTokens,
      invalidTokens,
      tickets: [],
      receiptIds: [],
    };
  }

  const messages = validTokens.map((to) => ({
    to,
    title: sanitizeString(snapshot.title),
    body: sanitizeString(snapshot.body),
    sound: snapshot.sound === "none" ? undefined : "default",
    data: snapshot.data && typeof snapshot.data === "object" ? snapshot.data : undefined,
  }));

  const { tickets, receiptIds } = await sendViaExpo(messages);

  // Optional in-app persistence (fire-and-forget)
  if (snapshot.saveInApp && recipientUserIds.length > 0) {
    const inAppType = sanitizeString(snapshot.inAppType || "admin-push") || "admin-push";
    Promise.allSettled(
      recipientUserIds.map((uid) =>
        createNotification(uid, inAppType, sanitizeString(snapshot.body), {
          title: sanitizeString(snapshot.title),
          data: snapshot.data && typeof snapshot.data === "object" ? snapshot.data : undefined,
          source: snapshot.source || "admin",
          campaignId: snapshot.campaignId,
          runId: snapshot.runId,
        })
      )
    ).catch(() => {});
  }

  return {
    recipientUserIds,
    tokens: cappedTokens,
    validTokens,
    invalidTokens,
    tickets,
    receiptIds,
  };
}

module.exports = {
  executeExpoSend,
  resolveAudience,
  ALLOWED_SEGMENTS,
};
