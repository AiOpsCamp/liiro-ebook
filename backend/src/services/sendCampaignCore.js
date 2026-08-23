"use strict";

const _os = require("os");
const mongoose = require("mongoose");
const { Expo } = require("expo-server-sdk");
const User = require("../models/User.model");
const NotificationCampaign = require("../models/NotificationCampaign.model");

const expo = new Expo();

const sanitize = (s = "") => String(s).trim();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const uniq = (arr) => [...new Set(arr)];
const normalizeTokens = (tokens) => uniq(tokens.map((t) => String(t || "").trim()).filter(Boolean));

function splitExpoTokens(tokens) {
  const valid = [];
  const invalid = [];
  for (const t of tokens) (Expo.isExpoPushToken(t) ? valid : invalid).push(t);
  return { valid, invalid };
}

async function sendViaExpo(messages) {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }
  const receiptIds = tickets.map((t) => t?.id).filter(Boolean);
  return { tickets, receiptIds, chunksCount: chunks.length };
}

async function processReceiptsBestEffort(receiptIds) {
  try {
    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      return { deviceNotRegistered: 0, messageTooBig: 0, other: 0 };
    }
    let deviceNotRegistered = 0;
    let messageTooBig = 0;
    let other = 0;

    const chunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of chunks) {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const id of Object.keys(receipts || {})) {
        const r = receipts[id];
        if (!r || r.status !== "error") continue;
        const code = r.details?.error;
        if (code === "DeviceNotRegistered") deviceNotRegistered++;
        else if (code === "MessageTooBig") messageTooBig++;
        else other++;
      }
    }
    return { deviceNotRegistered, messageTooBig, other };
  } catch {
    return { deviceNotRegistered: 0, messageTooBig: 0, other: 0 };
  }
}

/** -------------------------------------------------------
 * Token extraction (multi-device + optional legacy)
 * ------------------------------------------------------*/
function extractUserTokens(user, opts = {}) {
  const {
    includeLegacy = true,
    requireNotDisabled = true,
    requireNotRevoked = true,
    requireNotInvalid = true,
  } = opts;

  const out = [];

  if (Array.isArray(user?.pushTokens)) {
    for (const pt of user.pushTokens) {
      if (!pt?.token) continue;
      if (requireNotDisabled && pt.disabled) continue;
      if (requireNotRevoked && pt.revokedAt) continue;
      if (requireNotInvalid && pt.invalidAt) continue;
      out.push(String(pt.token).trim());
    }
  }

  if (includeLegacy && user?.notificationToken) {
    const t = String(user.notificationToken).trim();
    if (t) out.push(t);
  }

  return out.filter(Boolean);
}

/** -------------------------------------------------------
 * Audience resolution (new system)
 * ------------------------------------------------------*/
async function resolveAudience(audience, tokenPolicy) {
  const a = audience || {};
  const target = sanitize(a.target);

  let users = [];
  let recipientUserIds = [];
  let tokens = [];

  const selectFields = "_id pushTokens notificationToken accountStatus isSuspended deletedAt";

  if (target === "single") {
    const expoPushToken = sanitize(a.expoPushToken);
    if (!expoPushToken) throw new Error("audience.expoPushToken is required for target=single");
    tokens = [expoPushToken];
    return { users: [], recipientUserIds: [], tokens: normalizeTokens(tokens) };
  }

  if (target === "user") {
    const userId = sanitize(a.userId);
    if (!isValidObjectId(userId))
      throw new Error("audience.userId must be a valid ObjectId for target=user");
    const u = await User.findById(userId).select(selectFields).lean();
    if (!u) throw new Error("Target user not found");
    users = [u];
  } else if (target === "users") {
    const ids = Array.isArray(a.userIds) ? a.userIds.map(String).filter(isValidObjectId) : [];
    if (ids.length === 0)
      throw new Error("audience.userIds must be a non-empty array of valid ObjectIds");
    users = await User.find({ _id: { $in: ids } })
      .select(selectFields)
      .lean();
  } else if (target === "broadcast") {
    users = await User.find({
      accountStatus: { $ne: "deleted" },
      isSuspended: { $ne: true },
      $or: [
        { "pushTokens.token": { $type: "string", $ne: "" } },
        { notificationToken: { $type: "string", $ne: "" } },
      ],
    })
      .select(selectFields)
      .lean();
  } else {
    throw new Error("Invalid audience.target (allowed: broadcast|users|user|single)");
  }

  recipientUserIds = users.map((u) => String(u._id));
  tokens = normalizeTokens(users.flatMap((u) => extractUserTokens(u, tokenPolicy)));

  return { users, recipientUserIds, tokens };
}

/* -------------------------------------------------------------------------- */
/*                             CORE SEND FUNCTION                              */
/* -------------------------------------------------------------------------- */
/**
 * sendCampaignCore
 * Reusable send logic for:
 * - API endpoint (manual send)
 * - scheduler (auto send scheduled campaigns)
 */
async function sendCampaignCore({
  campaignId,
  dryRun = false,
  limit = null,
  overrides = null,
  tokenPolicyOverride = null,
  // actor is optional metadata for lock ownership etc.
  _actor = { type: "api", userId: null },
} = {}) {
  if (!isValidObjectId(campaignId)) throw new Error("Invalid campaign id");

  const campaign = await NotificationCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Allowed states to send:
  if (!["draft", "failed", "scheduled"].includes(campaign.status)) {
    throw new Error(`Campaign status is ${campaign.status}, cannot send`);
  }

  // Apply overrides
  const snapshot = {
    title: overrides?.title !== undefined ? sanitize(overrides.title) : sanitize(campaign.title),
    body: overrides?.body !== undefined ? sanitize(overrides.body) : sanitize(campaign.body),
    sound: overrides?.sound !== undefined ? overrides.sound : campaign.sound,
    data: overrides?.data !== undefined ? overrides.data : campaign.data,
    audience: overrides?.audience !== undefined ? overrides.audience : campaign.audience,
  };

  if (!snapshot.title) throw new Error("title is required");
  if (!snapshot.body) throw new Error("body is required");

  const tokenPolicy = {
    includeLegacy: true,
    requireNotDisabled: true,
    requireNotRevoked: true,
    requireNotInvalid: true,
    ...(campaign.tokenPolicy && typeof campaign.tokenPolicy === "object"
      ? campaign.tokenPolicy
      : {}),
    ...(tokenPolicyOverride && typeof tokenPolicyOverride === "object" ? tokenPolicyOverride : {}),
  };

  // Mark sending
  campaign.status = "sending";
  campaign.startedAt = new Date();
  campaign.finishedAt = null;
  campaign.errorMessage = null;
  campaign.errorStack = null;

  // If it was scheduled, clear scheduling fields once actually sending
  if (campaign.scheduledAt) campaign.scheduledAt = undefined;

  await campaign.save();

  // Resolve tokens
  const { recipientUserIds, tokens } = await resolveAudience(snapshot.audience, tokenPolicy);

  let finalTokens = tokens;
  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    finalTokens = finalTokens.slice(0, Math.floor(limit));
  }

  // Save resolution stats
  campaign.resolvedUsersCount = recipientUserIds.length;
  campaign.requestedTokensCount = finalTokens.length;
  await campaign.save();

  if (finalTokens.length === 0) {
    campaign.status = "failed";
    campaign.finishedAt = new Date();
    campaign.errorMessage = "No recipient tokens found.";
    await campaign.save();
    throw new Error("No recipient tokens found.");
  }

  const { valid, invalid } = splitExpoTokens(finalTokens);

  campaign.validTokensCount = valid.length;
  campaign.invalidTokensCount = invalid.length;
  campaign.sampleInvalidTokens = invalid.slice(0, 25);
  await campaign.save();

  if (valid.length === 0) {
    campaign.status = "failed";
    campaign.finishedAt = new Date();
    campaign.errorMessage = "No valid Expo push tokens.";
    await campaign.save();
    throw new Error("No valid Expo push tokens found.");
  }

  // DRY RUN
  if (dryRun) {
    campaign.status = "draft"; // keep as draft on dry run
    campaign.finishedAt = new Date();
    await campaign.save();

    return {
      success: true,
      dryRun: true,
      campaignId: campaign._id,
      counts: {
        resolvedUsers: recipientUserIds.length,
        requestedTokens: finalTokens.length,
        validTokens: valid.length,
        invalidTokens: invalid.length,
      },
      sample: {
        validTokens: valid.slice(0, 25),
        invalidTokens: invalid.slice(0, 25),
      },
    };
  }

  // SEND
  const messages = valid.map((to) => ({
    to,
    title: snapshot.title,
    body: snapshot.body,
    sound: snapshot.sound === "none" ? undefined : "default",
    data: snapshot.data && typeof snapshot.data === "object" ? snapshot.data : undefined,
  }));

  const { tickets, receiptIds, chunksCount } = await sendViaExpo(messages);

  // Save expo stats (new style)
  campaign.expoTicketsCount = tickets.length;
  campaign.expoReceiptIdsCount = receiptIds.length;
  campaign.sampleReceiptIds = receiptIds.slice(0, 25);

  // Save legacy stats too (so your old UI still looks good)
  campaign.stats = campaign.stats || {};
  campaign.stats.totalTokens = valid.length;
  campaign.stats.chunks = chunksCount;
  campaign.stats.expoErrors = tickets.filter((t) => t?.status === "error").length;

  const ticketHasError = tickets.some((t) => t && t.status === "error");

  // IMPORTANT: your schema must allow "partial"
  campaign.status = ticketHasError ? "partial" : "sent";
  campaign.finishedAt = new Date();
  campaign.sentAt = new Date();

  const r = await processReceiptsBestEffort(receiptIds);
  campaign.deviceNotRegisteredCount = r.deviceNotRegistered;
  campaign.messageTooBigCount = r.messageTooBig;
  campaign.otherReceiptErrorCount = r.other;

  await campaign.save();

  return {
    success: true,
    message: "Expo push request sent (queued by Expo).",
    campaignId: campaign._id,
    status: campaign.status,
    counts: {
      resolvedUsers: recipientUserIds.length,
      requestedTokens: finalTokens.length,
      validTokens: valid.length,
      invalidTokens: invalid.length,
      tickets: tickets.length,
      receiptIds: receiptIds.length,
    },
    receiptStats: r,
    receiptIds,
    tickets,
  };
}

module.exports = { sendCampaignCore };
