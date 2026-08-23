"use strict";
/**
 * src/controllers/auth/pushTokens.controller.js
 * -----------------------------------------------------------------------------
 * Multi-device Expo push token controller (drop-ready)
 *
 * Requires User model to have:
 *   - pushTokens: [{ token, deviceId, platform, appVersion, expoProjectId, lastSeenAt, revokedAt, invalidAt, disabled }]
 *   - notificationToken (legacy single token) - kept in sync (optional)
 *
 * Endpoints (recommended):
 *   POST /api/v1/auth/me/push-token           (register/update token for a device)
 *   POST /api/v1/auth/me/push-token/revoke    (revoke token for a device on logout)
 *   GET  /api/v1/auth/me/push-tokens          (debug/list tokens for current user)
 *
 * Body for upsert:
 *   {
 *     "token": "ExponentPushToken[...]",
 *     "deviceId": "uuid-stored-on-device",
 *     "platform": "ios"|"android"|"web"|"unknown",
 *     "appVersion": "1.2.3",
 *     "expoProjectId": "xxxxx"
 *   }
 *
 * Body for revoke:
 *   { "deviceId": "uuid-stored-on-device" }
 * -----------------------------------------------------------------------------
 */

const User = require("../../../models/User.model");
const UserEngagement = require("../../../models/lexicon/UserEngagement.model");

const sanitizeString = (s = "") => String(s).trim();

const MAX_DEVICES_PER_USER = 5;

/** Validate an IANA timezone string (e.g. "America/New_York") without a lib. */
function isValidTimezone(tz) {
  if (!tz || typeof tz !== "string") return false;
  try {
    // Throws RangeError for an unknown/invalid timezone.
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the device's timezone so per-user local-time scheduling (daily CIM
 * notifications) fires at the user's real morning/evening/night rather than UTC.
 * Best-effort — never blocks token registration.
 */
async function saveUserTimezone(userId, tz) {
  if (!isValidTimezone(tz)) return;
  try {
    await UserEngagement.updateOne(
      { user: userId },
      { $set: { timezone: tz } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("saveUserTimezone failed:", err.message);
  }
}

function normalizePlatform(p) {
  const v = sanitizeString(p).toLowerCase();
  return ["ios", "android", "web", "unknown"].includes(v) ? v : "unknown";
}

function dedupeByTokenKeepNewest(pushTokens = []) {
  const map = new Map();
  for (const t of pushTokens) {
    const token = sanitizeString(t?.token);
    if (!token) continue;

    const prev = map.get(token);
    const tTime = new Date(t?.lastSeenAt || 0).getTime();
    const pTime = prev ? new Date(prev?.lastSeenAt || 0).getTime() : -1;

    if (!prev || tTime >= pTime) map.set(token, t);
  }
  return Array.from(map.values());
}

function sortNewestFirst(pushTokens = []) {
  return pushTokens.sort(
    (a, b) => new Date(b?.lastSeenAt || 0).getTime() - new Date(a?.lastSeenAt || 0).getTime()
  );
}

function pruneToMax(pushTokens = [], max = MAX_DEVICES_PER_USER) {
  const m = Math.max(1, Math.min(50, Number(max) || MAX_DEVICES_PER_USER));
  return pushTokens.slice(0, m);
}

/**
 * POST /api/v1/auth/me/push-token
 * Register or update token for a device
 */
async function upsertPushToken(req, res) {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const token = sanitizeString(req.body?.token || req.body?.notificationToken);
    const deviceId = sanitizeString(req.body?.deviceId);
    const platform = normalizePlatform(req.body?.platform);
    const appVersion = sanitizeString(req.body?.appVersion || "") || null;
    const expoProjectId = sanitizeString(req.body?.expoProjectId || "") || null;
    const timezone = sanitizeString(req.body?.timezone || req.body?.timeZone || "");

    if (!token) return res.status(400).json({ success: false, message: "token is required" });
    if (!deviceId) return res.status(400).json({ success: false, message: "deviceId is required" });

    const user = await User.findById(userId).select("pushTokens notificationToken").exec();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const now = new Date();
    const list = Array.isArray(user.pushTokens) ? user.pushTokens : [];

    const idx = list.findIndex((t) => sanitizeString(t?.deviceId) === deviceId);

    if (idx >= 0) {
      // update device
      list[idx].token = token;
      list[idx].platform = platform;
      list[idx].appVersion = appVersion;
      list[idx].expoProjectId = expoProjectId;
      list[idx].lastSeenAt = now;

      // device is active again
      list[idx].revokedAt = null;
      list[idx].invalidAt = null;
      list[idx].disabled = false;
    } else {
      // add new device
      list.push({
        token,
        deviceId,
        platform,
        appVersion,
        expoProjectId,
        lastSeenAt: now,
        revokedAt: null,
        invalidAt: null,
        disabled: false,
      });
    }

    // normalize: de-dupe tokens, sort, prune
    let normalized = dedupeByTokenKeepNewest(list);
    normalized = sortNewestFirst(normalized);
    normalized = pruneToMax(normalized, MAX_DEVICES_PER_USER);

    user.pushTokens = normalized;

    // ✅ keep legacy field in sync with most recent active token
    user.notificationToken = normalized[0]?.token || user.notificationToken || null;

    await user.save({ validateBeforeSave: false });

    // Store the device timezone (best-effort) for local-time notification scheduling.
    await saveUserTimezone(userId, timezone);

    return res.status(200).json({
      success: true,
      message:
        idx >= 0 ? "Push token updated for device." : "Push token registered for new device.",
      data: {
        deviceId,
        platform,
        token,
        devicesCount: user.pushTokens.length,
        legacyNotificationToken: user.notificationToken,
      },
    });
  } catch (err) {
    console.error("upsertPushToken error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      details: err.message,
    });
  }
}

/**
 * POST /api/v1/auth/me/push-token/revoke
 * Revoke token for a device (logout/unregister)
 */
async function revokePushToken(req, res) {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const deviceId = sanitizeString(req.body?.deviceId);
    if (!deviceId) return res.status(400).json({ success: false, message: "deviceId is required" });

    const user = await User.findById(userId).select("pushTokens notificationToken").exec();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const now = new Date();
    let found = false;

    for (const t of user.pushTokens || []) {
      if (sanitizeString(t?.deviceId) === deviceId) {
        t.revokedAt = now;
        t.lastSeenAt = now;
        found = true;
      }
    }

    if (!found) {
      return res
        .status(404)
        .json({ success: false, message: "No push token found for that deviceId" });
    }

    // update legacy token to newest active
    const active = (user.pushTokens || []).filter(
      (t) => !t.revokedAt && !t.invalidAt && !t.disabled
    );
    active.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
    user.notificationToken = active[0]?.token || null;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Push token revoked for device.",
      data: { deviceId, legacyNotificationToken: user.notificationToken },
    });
  } catch (err) {
    console.error("revokePushToken error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      details: err.message,
    });
  }
}

/**
 * GET /api/v1/auth/me/push-tokens
 * List tokens for current user (debug/admin UX)
 */
async function listMyPushTokens(req, res) {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId).select("pushTokens notificationToken").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      data: {
        legacyNotificationToken: user.notificationToken || null,
        pushTokens: user.pushTokens || [],
      },
    });
  } catch (err) {
    console.error("listMyPushTokens error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  upsertPushToken,
  revokePushToken,
  listMyPushTokens,
};
