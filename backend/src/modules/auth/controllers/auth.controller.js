"use strict";

const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../../models/User.model");
const { httpError } = require("../../../utils/httpError");
const { ensureStripeCustomerForUser } = require("./stripeCustomer.helper.js");
const { ensureRevenueCatCustomerBestEffort } = require("../../../services/revenuecat.service");

let LingoCampConfig;
try {
  ({ LingoCampConfig } = require("../../../models/User.model"));
} catch (_) {
  // leave undefined; firebaseRegister will throw a clear error if config is requested
}

const {
  genUsernameFromEmail,
  genRandomPasswordHex,
  generateUsername,
  generateRandomPassword,
  fbErrorToHttp,
  isValidEmail,
  passwordIssue,
} = require("./helpers");

const { verifyIdToken } = require("./firebase/verifyIdToken");

const AXIOS_TIMEOUT_MS = 10_000;

function asEmail(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function asString(v) {
  return String(v || "").trim();
}

function axiosConfig() {
  return { timeout: AXIOS_TIMEOUT_MS, validateStatus: () => true };
}

async function firebasePost(url, payload, fallbackMessage) {
  const resp = await axios.post(url, payload, axiosConfig());
  if (resp.status < 200 || resp.status >= 300) {
    const err = new Error(fallbackMessage || "Firebase request failed");
    err.statusCode = resp.status;
    err.payload = resp.data;
    throw err;
  }
  return resp.data;
}

// Best-effort stripe ensure wrapper (doesn't block auth)
async function ensureStripeBestEffort(user, context) {
  try {
    await ensureStripeCustomerForUser(user);
  } catch (e) {
    console.error(`[auth] ensureStripeCustomerForUser failed (${context}):`, e?.message || e);
  }
}

// ✅ Best-effort RevenueCat ensure wrapper (doesn't block auth)
async function ensureRevenueCatBestEffort(user, context) {
  try {
    await ensureRevenueCatCustomerBestEffort(user, context);
  } catch (e) {
    // best-effort wrapper should already swallow, but keep safe:
    console.error(
      `[auth] ensureRevenueCatCustomerBestEffort failed (${context}):`,
      e?.message || e
    );
  }
}

// ✅ Robust Firebase Web API Key extractor across project config & env variables
function getFirebaseApiKey(req) {
  return (
    req.app.locals?.projectConfig?.firebase?.apiKey ||
    req.app.locals?.projectConfig?.firebase?.clientConfig?.apiKey ||
    process.env.LANGOWORDS_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    process.env.FIREBASE_WEB_API_KEY ||
    "AIzaSyCZhSVLqU5oQMS_TYG4MYlMPgiMwhnUrps"
  );
}

/* ======================================================
   FIREBASE EMAIL + PASSWORD REGISTER (REST)
====================================================== */
async function fbEmailRegister(req, res) {
  const email = asEmail(req.body?.email);
  const password = asString(req.body?.password);
  if (!isValidEmail(email)) throw httpError(400, "Please enter a valid email address.");
  const pwIssue = passwordIssue(password);
  if (pwIssue) throw httpError(400, pwIssue);

  const API_KEY = getFirebaseApiKey(req);
  if (!API_KEY) throw httpError(500, "firebase.apiKey missing from project config");

  try {
    const signUpURL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const su = await axios.post(
      signUpURL,
      { email, password, returnSecureToken: true },
      axiosConfig()
    );

    if (su.status < 200 || su.status >= 300) {
      const err = new Error("Failed to create Firebase user");
      err.statusCode = su.status;
      err.payload = su.data;
      throw err;
    }

    const { localId: firebaseUid, idToken } = su.data || {};
    if (!firebaseUid || !idToken) throw httpError(502, "Invalid Firebase response");

    // Send verification email (best effort)
    const oobURL = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`;
    axios.post(oobURL, { requestType: "VERIFY_EMAIL", idToken }, axiosConfig()).catch(() => {});

    let user = await User.findOne({ email });

    if (!user) {
      const requestedUsername = asString(req.body?.username);
      const requestedRole = req.body?.role;
      const requestedIsPremium = req.body?.isPremium;
      const userData = {
        username: requestedUsername || genUsernameFromEmail(email),
        email,
        password: genRandomPasswordHex(12),
        firebase_uuid: firebaseUid,
        emailVerified: false,
        accountStatus: "pending_verification",
        authProviders: { firebasePassword: true },
        ...(requestedRole ? { role: requestedRole } : {}),
        ...(typeof requestedIsPremium === "boolean" ? { isPremium: requestedIsPremium } : {}),
      };

      const createdUsers = await User.create([userData], { session: null });
      user = Array.isArray(createdUsers) ? createdUsers[0] : createdUsers;
    } else {
      const updates = {};
      if (!user.firebase_uuid) updates.firebase_uuid = firebaseUid;
      updates["authProviders.firebasePassword"] = true;

      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates }, { timestamps: false });
        user = await User.findById(user._id);
      }
    }

    // ✅ Ensure Stripe customer exists (best effort - fire and forget)
    ensureStripeBestEffort(user, "fbEmailRegister").catch((err) => {
      console.error("[auth] ensureStripeBestEffort uncaught error:", err?.message);
    });

    // ✅ Ensure RevenueCat subscriber exists (best effort - fire and forget)
    ensureRevenueCatBestEffort(user, "fbEmailRegister").catch((err) => {
      console.error("[auth] ensureRevenueCatBestEffort uncaught error:", err?.message);
    });

    return res.status(201).json({
      success: true,
      message: "Registered with Firebase. Verification email sent.",
      data: {
        verificationRequired: true,
        user: {
          id: String(user._id),
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          firebase_uuid: user.firebase_uuid,
          stripeCustomerId: user.stripeCustomerInfo?.id || null,
          revenueCatAppUserId: String(user._id), // RC uses Mongo _id as app_user_id
        },
      },
    });
  } catch (err) {
    const { status, message, code } = fbErrorToHttp(err, "Failed to create Firebase user");
    const e = httpError(status, message, { code });
    e.code = code || e.code;
    throw e;
  }
}

/* ======================================================
   FIREBASE EMAIL + PASSWORD LOGIN (REST)
====================================================== */
async function fbEmailLogin(req, res) {
  const email = asEmail(req.body?.email);
  const password = asString(req.body?.password);
  if (!email || !password) throw httpError(400, "Please enter your email and password.");

  const API_KEY = getFirebaseApiKey(req);
  if (!API_KEY) throw httpError(500, "firebase.apiKey missing from project config");

  try {
    const signInURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const si = await axios.post(
      signInURL,
      { email, password, returnSecureToken: true },
      axiosConfig()
    );

    if (si.status < 200 || si.status >= 300) {
      const err = new Error("Failed to login with Firebase");
      err.statusCode = si.status;
      err.payload = si.data;
      throw err;
    }

    const {
      idToken: fbIdToken,
      refreshToken: fbRefreshToken,
      localId: firebaseUid,
    } = si.data || {};
    if (!fbIdToken || !firebaseUid) throw httpError(502, "Invalid Firebase response");

    // Lookup emailVerified (best effort)
    let emailVerified = false;
    try {
      const lookupURL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`;
      const lk = await axios.post(lookupURL, { idToken: fbIdToken }, axiosConfig());
      if (lk.status >= 200 && lk.status < 300) {
        emailVerified = !!lk.data?.users?.[0]?.emailVerified;
      }
    } catch (_) {}

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: genUsernameFromEmail(email),
        email,
        password: genRandomPasswordHex(12),
        firebase_uuid: firebaseUid,
        emailVerified,
        accountStatus: emailVerified ? "active" : "pending_verification",
        authProviders: { firebasePassword: true },
      });
    } else {
      if (user.deletedAt || user.accountStatus === "deleted")
        throw httpError(403, "Account has been deleted");
      if (user.isSuspended || user.accountStatus === "suspended")
        throw httpError(403, "Account is suspended");

      const updates = {};
      if (!user.firebase_uuid) updates.firebase_uuid = firebaseUid;
      if (user.emailVerified !== emailVerified) updates.emailVerified = emailVerified;
      if (emailVerified && user.accountStatus !== "active") updates.accountStatus = "active";
      updates["authProviders.firebasePassword"] = true;

      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates }, { timestamps: false });
        user = await User.findById(user._id);
      }
    }

    // ✅ Ensure Stripe customer exists (best effort - fire and forget)
    ensureStripeBestEffort(user, "fbEmailLogin").catch((err) => {
      console.error("[auth] ensureStripeBestEffort uncaught error:", err?.message);
    });

    // ✅ Ensure RevenueCat subscriber exists (best effort - fire and forget)
    ensureRevenueCatBestEffort(user, "fbEmailLogin").catch((err) => {
      console.error("[auth] ensureRevenueCatBestEffort uncaught error:", err?.message);
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { lastKnownIp: req.ip, lastKnownUserAgent: req.headers["user-agent"] } },
      { timestamps: false }
    );

    const tokens = await user.getSignedJwtToken(res, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    const onboardingStatus = user.onBoarding ?? user.onboardingStatus ?? user.onboarding ?? false;

    return res.status(200).json({
      success: true,
      message: "Logged in via Firebase email/password",
      data: {
        tokens,
        firebase: {
          idToken: fbIdToken,
          refreshToken: fbRefreshToken || null,
          uid: firebaseUid,
        },
        onboardingStatus,
        user: {
          id: String(user._id),
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          firebase_uuid: user.firebase_uuid,
          accountStatus: user.accountStatus,
          stripeCustomerId: user.stripeCustomerInfo?.id || null,
          revenueCatAppUserId: String(user._id),
        },
      },
    });
  } catch (err) {
    let { status, message, code } = fbErrorToHttp(err, "Failed to login with Firebase");

    if (code === "INVALID_LOGIN_CREDENTIALS" || code === "EMAIL_NOT_FOUND" || code === "INVALID_PASSWORD" || status === 401) {
      try {
        const existingUser = await User.findOne({ email }).lean();
        if (existingUser) {
          status = 401;
          code = "INVALID_PASSWORD";
          message = "The password you entered is incorrect.";
        } else {
          status = 404;
          code = "EMAIL_NOT_FOUND";
          message = "No account found with this email address.";
        }
      } catch (_) {}
    }

    const e = httpError(status, message, { code });
    e.code = code || e.code;
    throw e;
  }
}

/* ======================================================
   FIREBASE FORGOT PASSWORD (REST)
====================================================== */
async function fbEmailForgotPassword(req, res) {
  const email = asEmail(req.body?.email);
  if (!isValidEmail(email)) throw httpError(400, "Please enter a valid email address.");

  // Neutral, non-enumerating response used for ALL outcomes below.
  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a password reset link has been sent.",
    data: null,
  };

  const API_KEY = getFirebaseApiKey(req);
  if (!API_KEY) throw httpError(500, "firebase.apiKey missing from project config");

  try {
    const oobURL = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`;
    await firebasePost(
      oobURL,
      { requestType: "PASSWORD_RESET", email },
      "Failed to send password reset email"
    );
  } catch (err) {
    // Do NOT leak whether the email exists. EMAIL_NOT_FOUND / any Firebase error
    // still returns the same generic success message. Only surface genuine
    // service-outage errors (so the user knows to retry), never account state.
    const { status, code } = fbErrorToHttp(err, "Failed to send password reset email");
    if (status === 503 || status === 429) {
      throw httpError(status, fbErrorToHttp(err).message, { code });
    }
    // For EMAIL_NOT_FOUND / INVALID_EMAIL / etc. → swallow and return generic 200.
  }

  return res.status(200).json(genericResponse);
}

/* ======================================================
   RESET PASSWORD WITH OOB CODE (REST)
====================================================== */
async function fbEmailResetPasswordWithOobCode(req, res) {
  const API_KEY = getFirebaseApiKey(req);
  if (!API_KEY) throw httpError(500, "firebase.apiKey missing from project config");
  const oobCode = asString(req.body?.oobCode);
  const newPassword = asString(req.body?.newPassword);

  if (!oobCode) throw httpError(400, "This reset link is invalid or has already been used.");
  const resetPwIssue = passwordIssue(newPassword);
  if (resetPwIssue) throw httpError(400, resetPwIssue);

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${API_KEY}`;
    const data = await firebasePost(url, { oobCode, newPassword }, "Password reset failed");
    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
      data: { email: data.email || null, requestType: data.requestType || null },
    });
  } catch (err) {
    const { status, message, code } = fbErrorToHttp(err, "Password reset failed");
    const e = httpError(status, message, { code });
    e.code = code || e.code;
    throw e;
  }
}

/* ======================================================
   RESEND VERIFICATION (REST)
====================================================== */
async function fbResendVerification(req, res) {
  const idToken = asString(req.body?.idToken);
  if (!idToken) throw httpError(400, "idToken is required (Firebase ID token from client).");

  const API_KEY = getFirebaseApiKey(req);
  if (!API_KEY) throw httpError(500, "firebase.apiKey missing from project config");

  try {
    const oobURL = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`;
    await firebasePost(
      oobURL,
      { requestType: "VERIFY_EMAIL", idToken },
      "Failed to resend verification email"
    );
    return res.status(200).json({
      success: true,
      message: "Verification email sent (Firebase).",
      data: null,
    });
  } catch (err) {
    const { status, message, code } = fbErrorToHttp(err, "Failed to resend verification email");
    const e = httpError(status, message, { code });
    e.code = code || e.code;
    throw e;
  }
}

/* ======================================================
   CHANGE PASSWORD (REST) - Auth required
====================================================== */
async function fbChangePassword(req, res) {
  const currentPassword = asString(req.body?.currentPassword);
  const newPassword = asString(req.body?.newPassword);

  if (!currentPassword || !newPassword)
    throw httpError(400, "Please enter your current and new password.");
  const changePwIssue = passwordIssue(newPassword);
  if (changePwIssue) throw httpError(400, changePwIssue);

  const API_KEY = getFirebaseApiKey(req);
  if (!API_KEY) throw httpError(500, "firebase.apiKey missing from project config");
  const user = req.user;
  if (!user?.email) throw httpError(400, "Password change not available for this account");

  // Re-auth -> get Firebase idToken
  const signInURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  let idToken;

  try {
    const si = await axios.post(
      signInURL,
      { email: asEmail(user.email), password: currentPassword, returnSecureToken: true },
      axiosConfig()
    );
    if (si.status < 200 || si.status >= 300) throw new Error("reauth_failed");
    idToken = si.data?.idToken;
    if (!idToken) throw new Error("reauth_failed");
  } catch (_) {
    throw httpError(401, "Current password is incorrect");
  }

  // Update password via REST
  try {
    const updateURL = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`;
    await firebasePost(
      updateURL,
      { idToken, password: newPassword, returnSecureToken: false },
      "Failed to change password"
    );
  } catch (err) {
    const { status, message, code } = fbErrorToHttp(err, "Failed to change password");
    const e = httpError(status, message, { code });
    e.code = code || e.code;
    throw e;
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        tokenInvalidBefore: new Date(),
        lastAdminAction: "FORCE_LOGOUT",
        lastAdminActionAt: new Date(),
      },
    },
    { timestamps: false }
  );

  return res.status(200).json({
    success: true,
    message: "Password changed successfully. You have been logged out from all devices.",
    data: null,
  });
}

/* ======================================================
   FIREBASE TOKEN-BASED REGISTER/LOGIN (uses verifier)
====================================================== */
async function firebaseRegister(req, res) {
  const firebaseToken = asString(req.body?.token);
  if (!firebaseToken) throw httpError(400, "Please provide a Firebase token");

  const defaultAdmin = require("./firebase/langowords.firebaseAdmin");
  const projectConfig = req.app.locals.projectConfig || { firebase: { projectId: "liiro-ebook" } };
  const firebaseAdmin = req.app.locals.firebaseAdmin || defaultAdmin;

  const decodedToken = await verifyIdToken(firebaseToken, projectConfig.firebase, firebaseAdmin);
  if (!decodedToken.email_verified) throw httpError(400, "Firebase email is not verified");

  const email = asEmail(decodedToken.email);
  if (!email) throw httpError(400, "Firebase token missing email");

  const existingUser = await User.findOne({ email });
  if (existingUser) throw httpError(400, "User already exists");

  const [first = "", ...rest] = (decodedToken.name || "").split(" ");
  const last = rest.join(" ");

  const newUser = new User({
    firebase_uuid: decodedToken.uid,
    email,
    first_name: first,
    last_name: last,
    emailVerified: true,
    username: generateUsername(email),
    password: generateRandomPassword(),
  });

  const {
    defaultLanguage,
    userLanguage,
    languagePackId,
    levelOrProficiency,
    dailyWeeklyLearningGoals,
  } = req.body || {};

  const wantsConfig =
    defaultLanguage ||
    userLanguage ||
    languagePackId ||
    levelOrProficiency ||
    dailyWeeklyLearningGoals;

  if (wantsConfig) {
    if (!LingoCampConfig) {
      throw httpError(
        500,
        "Server misconfigured: LingoCampConfig model not available (fix import path)"
      );
    }
    const lingoCampConfig = new LingoCampConfig({
      defaultLanguage: defaultLanguage || "English",
      userLanguage: userLanguage || "Finnish",
      languagePackId: languagePackId || undefined,
      levelOrProficiency: levelOrProficiency || "",
      dailyWeeklyLearningGoals: dailyWeeklyLearningGoals || "",
    });
    await lingoCampConfig.save();
    newUser.lingoCampConfig = lingoCampConfig._id;
    newUser.onBoarding = true;
  }

  await newUser.save();

  // ✅ Ensure Stripe customer exists (best effort - fire and forget)
  ensureStripeBestEffort(newUser, "firebaseRegister").catch((err) => {
    console.error("[auth] ensureStripeBestEffort uncaught error:", err?.message);
  });

  // ✅ Ensure RevenueCat subscriber exists (best effort - fire and forget)
  ensureRevenueCatBestEffort(newUser, "firebaseRegister").catch((err) => {
    console.error("[auth] ensureRevenueCatBestEffort uncaught error:", err?.message);
  });

  return res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: {
        id: String(newUser._id),
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        onBoarding: newUser.onBoarding,
        lingoCampConfig: newUser.lingoCampConfig,
        stripeCustomerId: newUser.stripeCustomerInfo?.id || null,
        revenueCatAppUserId: String(newUser._id),
      },
    },
  });
}

async function firebaseLogin(req, res) {
  const firebaseToken = asString(req.body?.token);
  if (!firebaseToken) throw httpError(400, "Please provide a Firebase token");

  const defaultAdmin = require("./firebase/langowords.firebaseAdmin");
  const projectConfig = req.app.locals.projectConfig || { firebase: { projectId: "liiro-ebook" } };
  const firebaseAdmin = req.app.locals.firebaseAdmin || defaultAdmin;

  const decodedToken = await verifyIdToken(firebaseToken, projectConfig.firebase, firebaseAdmin);
  if (!decodedToken.email_verified) throw httpError(400, "Firebase email is not verified");

  const email = asEmail(decodedToken.email);
  if (!email) throw httpError(400, "Firebase token missing email");

  let user = await User.findOne({ email });

  if (!user) {
    user = await new User({
      email,
      emailVerified: true,
      username: generateUsername(email),
      password: generateRandomPassword(),
    }).save();
  }

  // ✅ Ensure Stripe customer exists (best effort - fire and forget)
  ensureStripeBestEffort(user, "firebaseLogin").catch((err) => {
    console.error("[auth] ensureStripeBestEffort uncaught error:", err?.message);
  });

  // ✅ Ensure RevenueCat subscriber exists (best effort - fire and forget)
  ensureRevenueCatBestEffort(user, "firebaseLogin").catch((err) => {
    console.error("[auth] ensureRevenueCatBestEffort uncaught error:", err?.message);
  });

  const tokenPair = await user.getSignedJwtToken(res, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      tokens: tokenPair,
      onboardingStatus: user.onBoarding,
      stripeCustomerId: user.stripeCustomerInfo?.id || null,
      revenueCatAppUserId: String(user._id),
    },
  });
}

/* ======================================================
   Refresh token + logout
====================================================== */
async function getRefreshToken(req, res) {
  const RefreshToken = mongoose.model("RefreshToken");
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) throw httpError(401, "No refresh token");

  // Verify JWT signature
  let decoded;
  try {
    decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
  } catch (_) {
    throw httpError(401, "Invalid or expired refresh token");
  }

  // Verify hash exists and not revoked
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const stored = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!stored) throw httpError(401, "Refresh token has been revoked");

  const user = await User.findById(decoded.id).select("_id role emailVerified tokenInvalidBefore");
  if (!user) throw httpError(401, "User not found");

  const tokenIatMs = (decoded.iat || 0) * 1000;
  if (tokenIatMs < new Date(user.tokenInvalidBefore || 0).getTime()) {
    throw httpError(401, "Session invalidated. Please login again.");
  }

  // Rotate: revoke old, issue new pair
  await RefreshToken.updateOne({ _id: stored._id }, { $set: { revokedAt: new Date() } });
  const tokens = await user.getSignedJwtToken(res, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: { accessToken: tokens.accessToken },
  });
}

async function logout(req, res) {
  const RefreshToken = mongoose.model("RefreshToken");
  const rawToken = req.cookies?.refreshToken;
  if (rawToken) await RefreshToken.revokeByRaw(rawToken);
  res.clearCookie("jwt");
  res.clearCookie("refreshToken");
  return res.status(200).json({ success: true, message: "Logged out", data: null });
}

async function logoutAll(req, res) {
  const RefreshToken = mongoose.model("RefreshToken");
  const user = req.user;
  if (!user) throw httpError(401, "Unauthorized");

  // Revoke all stored refresh tokens for this user
  await RefreshToken.revokeAllForUser(user._id || user.id);

  user.tokenInvalidBefore = new Date();
  await user.save({ validateBeforeSave: false });

  res.clearCookie("jwt");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Logged out from all devices",
    data: null,
  });
}

// Resend verification using backend JWT (no Firebase idToken needed)
async function resendVerificationFromJwt(req, res) {
  const user = req.user;
  if (!user?._id) throw httpError(401, "Unauthorized");

  const dbUser = await User.findById(user._id)
    .select("email firebase_uuid emailVerified accountStatus")
    .lean();

  if (!dbUser) throw httpError(404, "User not found");

  if (dbUser.emailVerified) {
    return res.status(200).json({
      success: true,
      message: "Email is already verified.",
      data: { email: dbUser.email, alreadyVerified: true },
    });
  }

  if (!dbUser.email) throw httpError(400, "User has no email");

  if (!dbUser.firebase_uuid) {
    throw httpError(400, "This account is not linked with Firebase (missing firebase_uuid).");
  }

  const { getAuth } = require("firebase-admin/auth");
  const auth = getAuth();

  const actionCodeSettings = {
    url: process.env.FIREBASE_VERIFY_REDIRECT_URL || "https://your-frontend.com/verify-email",
    handleCodeInApp: false,
  };

  const link = await auth.generateEmailVerificationLink(dbUser.email, actionCodeSettings);

  const isProd = process.env.NODE_ENV === "production";

  return res.status(200).json({
    success: true,
    message: "Verification email link generated.",
    data: {
      email: dbUser.email,
      link: isProd ? undefined : link,
    },
  });
}

module.exports = {
  fbEmailRegister,
  fbEmailLogin,
  fbEmailForgotPassword,
  fbEmailResetPasswordWithOobCode,
  fbResendVerification,
  fbChangePassword,
  firebaseRegister,
  firebaseLogin,
  getRefreshToken,
  logout,
  logoutAll,
  resendVerificationFromJwt,
};
