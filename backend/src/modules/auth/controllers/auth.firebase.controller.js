"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../../models/User.model");
const { verifyIdToken } = require("./firebase/verifyIdToken");

// Must match your schema enums
const STATUS_ACTIVE = "active";
const STATUS_PENDING = "pending_verification";

function httpError(statusCode, publicMessage, extra = {}) {
  const err = new Error(publicMessage || "Error");
  err.statusCode = statusCode || 500;
  err.expose = true;
  err.publicMessage = publicMessage;
  if (extra.code) err.code = extra.code;
  if (extra.details) err.details = extra.details;
  if (extra.payload) err.payload = extra.payload;
  return err;
}

function asString(v) {
  return String(v || "").trim();
}

function asEmail(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function safeNameParts(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
}

function randomUnusedPassword() {
  // Your schema requires password; Firebase owns auth so this is never used.
  return crypto.randomBytes(24).toString("hex");
}

function usernameFromEmail(email) {
  const base = email
    .split("@")[0]
    .replace(/[^a-z0-9_]/gi, "")
    .slice(0, 18);
  return base || `user_${crypto.randomBytes(4).toString("hex")}`;
}

function providerFlags(decoded) {
  const provider = decoded?.firebase?.sign_in_provider || "";
  const flags = { firebase: true };
  if (provider === "google.com") flags.google = true;
  if (provider === "password") flags.firebasePassword = true;
  return flags;
}

function mergeProviders(existing = {}, incoming = {}) {
  return { ...(existing || {}), ...(incoming || {}) };
}

function getOnboardingStatus(user) {
  return user?.onBoarding ?? user?.onboardingStatus ?? user?.onboarding ?? false;
}

/**
 * POST /api/v1/auth/firebase
 * Body: { token: <Firebase ID token> }
 *
 * Drop-in compatible response shape with your legacy fb-email-login:
 * {
 *   success, message,
 *   data: { tokens, firebase, onboardingStatus, user }
 * }
 */
async function firebaseExchange(req, res, next) {
  try {
    const firebaseIdToken = asString(req.body?.token);
    if (!firebaseIdToken) {
      throw httpError(400, "Please provide a Firebase token", { code: "missing_token" });
    }

    let decoded;
    try {
      const defaultAdmin = require("./firebase/liiro.firebaseAdmin");
      const projectConfig = req.app.locals.projectConfig || { firebase: { projectId: "liiro-ebook" } };
      const firebaseAdmin = req.app.locals.firebaseAdmin || defaultAdmin;

      decoded = await verifyIdToken(firebaseIdToken, projectConfig.firebase, firebaseAdmin);
    } catch (err) {
      // Log the verbose verifier detail (audience/issuer mismatch, etc.) server-side,
      // but return a clean generic message — never leak token/project internals.
      console.warn("[firebaseExchange] verifyIdToken failed:", err);
      throw httpError(401, "Your session could not be verified. Please sign in again.", {
        code: "invalid_firebase_token",
      });
    }

    const uid = asString(decoded?.uid);
    const email = asEmail(decoded?.email);
    const emailVerified = !!decoded?.email_verified;
    const picture = asString(decoded?.picture);
    const { first, last } = safeNameParts(decoded?.name);
    const incomingProviders = providerFlags(decoded);

    if (!uid) throw httpError(401, "Invalid Firebase token (missing uid)", { code: "missing_uid" });
    if (!email) throw httpError(400, "Firebase token missing email", { code: "missing_email" });

    // 1) Find by Firebase UID
    let user = await User.findOne({ firebase_uuid: uid });

    // 2) If not found by UID, try link by email or create new
    if (!user) {
      const byEmail = await User.findOne({ email });

      if (byEmail) {
        const updates = {};
        if (byEmail.firebase_uuid !== uid) updates.firebase_uuid = uid;

        // Keep Mongo email in sync (rare but possible)
        if (byEmail.email !== email) updates.email = email;

        // only upgrade emailVerified
        if (emailVerified && !byEmail.emailVerified) updates.emailVerified = true;

        // account status
        if (emailVerified) updates.accountStatus = STATUS_ACTIVE;
        else if (!byEmail.accountStatus) updates.accountStatus = STATUS_PENDING;

        // provider flags
        updates.authProviders = mergeProviders(byEmail.authProviders, incomingProviders);

        // fill blanks only
        if (!byEmail.picture && picture) updates.picture = picture;
        if (!byEmail.first_name && first) updates.first_name = first;
        if (!byEmail.last_name && last) updates.last_name = last;

        if (Object.keys(updates).length) {
          await User.updateOne({ _id: byEmail._id }, { $set: updates }, { timestamps: false });
        }
        user = await User.findById(byEmail._id);
      } else {
        // Create new user
        user = await User.create({
          firebase_uuid: uid,
          email,
          username: usernameFromEmail(email),
          password: randomUnusedPassword(), // required by your schema
          first_name: first || undefined,
          last_name: last || undefined,
          picture: picture || undefined,
          emailVerified,
          accountStatus: emailVerified ? STATUS_ACTIVE : STATUS_PENDING,
          authProviders: incomingProviders,
        });
      }
    } else {
      // Existing user by UID -> minimal sync
      const updates = {};
      if (user.email !== email) updates.email = email;
      if (emailVerified && !user.emailVerified) updates.emailVerified = true;
      if (emailVerified && user.accountStatus !== STATUS_ACTIVE)
        updates.accountStatus = STATUS_ACTIVE;
      if (!emailVerified && !user.accountStatus) updates.accountStatus = STATUS_PENDING;

      updates.authProviders = mergeProviders(user.authProviders, incomingProviders);

      if (!user.picture && picture) updates.picture = picture;
      if (!user.first_name && first) updates.first_name = first;
      if (!user.last_name && last) updates.last_name = last;

      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates }, { timestamps: false });
        user = await User.findById(user._id);
      }
    }

    // Gatekeeping
    if (user.accountStatus === "deleted" || user.deletedAt) {
      throw httpError(403, "Account has been deleted", { code: "account_deleted" });
    }
    if (user.accountStatus === "suspended" || user.isSuspended) {
      throw httpError(403, "Account is suspended", { code: "account_suspended" });
    }

    // metadata
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastKnownIp: req.ip,
          lastKnownUserAgent: req.headers["user-agent"],
          lastLogin: new Date(),
        },
      },
      { timestamps: false }
    );

    // Issue backend JWT pair — now async (stores refresh token hash for revocation)
    const tokens = await user.getSignedJwtToken(res, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    const onboardingStatus = getOnboardingStatus(user);

    // ✅ Drop-in legacy-compatible response
    return res.status(200).json({
      success: true,
      message: "Logged in via Firebase",
      data: {
        tokens,
        firebase: {
          idToken: firebaseIdToken, // the Firebase ID token client sent
          refreshToken: null, // not available in SDK-first exchange (keep shape stable)
          uid,
        },
        onboardingStatus,
        user: {
          id: String(user._id),
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          firebase_uuid: user.firebase_uuid,
          accountStatus: user.accountStatus,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/firebase/refresh
 * Verifies the refresh token hash, rotates the token pair, and revokes the old token.
 */
async function refresh(req, res, next) {
  try {
    const RefreshToken = mongoose.model("RefreshToken");
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) throw httpError(401, "No refresh token", { code: "missing_refresh_token" });

    // 1. Verify JWT signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
    } catch (_) {
      throw httpError(401, "Invalid or expired refresh token", { code: "invalid_refresh_token" });
    }

    // 2. Verify hash exists in DB and has not been revoked (prevents token reuse)
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const stored = await RefreshToken.findOne({ tokenHash, revokedAt: null });
    if (!stored) {
      throw httpError(401, "Refresh token has been revoked", { code: "token_revoked" });
    }

    const user = await User.findById(decoded.id).select(
      "_id role emailVerified tokenInvalidBefore accountStatus isSuspended deletedAt onBoarding onboardingStatus onboarding"
    );
    if (!user) throw httpError(401, "User not found", { code: "user_not_found" });

    if (user.accountStatus === "deleted" || user.deletedAt) {
      throw httpError(403, "Account has been deleted", { code: "account_deleted" });
    }
    if (user.accountStatus === "suspended" || user.isSuspended) {
      throw httpError(403, "Account is suspended", { code: "account_suspended" });
    }

    const tokenIatMs = (decoded.iat || 0) * 1000;
    if (tokenIatMs < new Date(user.tokenInvalidBefore || 0).getTime()) {
      throw httpError(401, "Session invalidated. Please login again.", {
        code: "session_invalidated",
      });
    }

    // 3. Revoke the old token (rotation — old token cannot be reused)
    await RefreshToken.updateOne({ _id: stored._id }, { $set: { revokedAt: new Date() } });

    // 4. Issue a new token pair and store the new refresh token hash
    const tokens = await user.getSignedJwtToken(res, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { accessToken: tokens.accessToken },
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const RefreshToken = mongoose.model("RefreshToken");
    const rawToken = req.cookies?.refreshToken;
    // Revoke this specific session's refresh token
    if (rawToken) await RefreshToken.revokeByRaw(rawToken);
    res.clearCookie("jwt");
    res.clearCookie("refreshToken");
    return res.status(200).json({ success: true, message: "Logged out", data: null });
  } catch (err) {
    return next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    const RefreshToken = mongoose.model("RefreshToken");
    const authUser = req.user;
    if (!authUser?._id && !authUser?.id)
      throw httpError(401, "Unauthorized", { code: "unauthorized" });
    const userId = authUser._id || authUser.id;

    // Revoke all refresh tokens for this user
    await RefreshToken.revokeAllForUser(userId);

    // Also set tokenInvalidBefore so any access tokens issued before now are rejected
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          tokenInvalidBefore: new Date(),
          lastAdminAction: "FORCE_LOGOUT",
          lastAdminActionAt: new Date(),
        },
      },
      { timestamps: false }
    );

    res.clearCookie("jwt");
    res.clearCookie("refreshToken");
    return res
      .status(200)
      .json({ success: true, message: "Logged out from all devices", data: null });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) throw httpError(401, "Unauthorized", { code: "unauthorized" });

    const user = await User.findById(id).select(
      "username email first_name last_name picture firebase_uuid role emailVerified onBoarding accountStatus"
    );
    if (!user) throw httpError(404, "User not found", { code: "user_not_found" });

    return res.status(200).json({ success: true, message: "OK", data: { user } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  firebaseExchange,
  refresh,
  logout,
  logoutAll,
  me,
};
