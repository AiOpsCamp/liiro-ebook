"use strict";

const crypto = require("crypto");

function genUsernameFromEmail(email) {
  return String(email).split("@")[0].replace(/\./g, "_");
}

function genRandomPasswordHex(len = 12) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len);
}

// Kept from your code
function generateUsername(email) {
  return String(email).split("@")[0].replace(".", "_");
}

function generateRandomPassword() {
  return crypto.randomBytes(5).toString("hex");
}

/**
 * Maps a raw Firebase Identity Toolkit error into a clean, safe HTTP
 * status/message pair AND a stable machine-readable `code`.
 *
 * IMPORTANT: callers must expose ONLY { status, message, code } to the client —
 * never the raw Firebase payload (that leaks internals and enables enumeration).
 */
function fbErrorToHttp(err, fallback = "Something went wrong. Please try again.") {
  // Network / connectivity failure to Firebase (axios): no structured error body.
  const isNetworkError =
    err?.code === "ECONNABORTED" ||
    err?.code === "ECONNREFUSED" ||
    err?.code === "ETIMEDOUT" ||
    (typeof err?.message === "string" &&
      /timeout|network|ECONN|socket hang up/i.test(err.message) &&
      !err?.response &&
      !err?.payload);
  if (isNetworkError) {
    return {
      status: 503,
      message: "Authentication service is temporarily unavailable. Please try again shortly.",
      code: "AUTH_SERVICE_UNAVAILABLE",
    };
  }

  // Handle both error structures: err.payload (from firebasePost) and err.response.data (from axios)
  const errorData = err?.payload?.error || err?.response?.data?.error || {};
  // Firebase puts the code in `message` (e.g. "EMAIL_EXISTS"); strip any detail suffix.
  const rawCode = errorData?.message || "";
  const code = String(rawCode).split(":")[0].split(" ")[0].trim().toUpperCase() || "UNKNOWN";

  let status = 400;
  let message = fallback;

  if (code === "EMAIL_EXISTS") {
    status = 409;
    message = "An account with this email already exists. Please log in instead.";
  } else if (code === "INVALID_EMAIL") {
    status = 400;
    message = "Please enter a valid email address.";
  } else if (code === "WEAK_PASSWORD") {
    status = 400;
    message = "Please choose a stronger password (at least 8 characters).";
  } else if (code === "OPERATION_NOT_ALLOWED" || code === "PASSWORD_LOGIN_DISABLED") {
    status = 503;
    message = "This sign-in method is not available right now. Please contact support.";
  } else if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
    status = 429;
    message = "Too many attempts. Please wait a few minutes and try again.";
  } else if (code === "EMAIL_NOT_FOUND") {
    status = 404;
    message = "No account found with this email address.";
  } else if (code === "INVALID_PASSWORD") {
    status = 401;
    message = "Incorrect password.";
  } else if (code === "INVALID_LOGIN_CREDENTIALS") {
    status = 401;
    message = "Incorrect email or password.";
  } else if (code === "USER_DISABLED") {
    status = 403;
    message = "This account has been disabled. Please contact support.";
  } else if (code === "INVALID_OOB_CODE") {
    status = 400;
    message = "This reset link is invalid or has already been used.";
  } else if (code === "EXPIRED_OOB_CODE") {
    status = 400;
    message = "This reset link has expired. Please request a new one.";
  } else if (code === "MISSING_REQUEST_URI" || code === "MISSING_EMAIL") {
    status = 400;
    message = "Please enter a valid email address.";
  } else if (code === "MISSING_PASSWORD") {
    status = 400;
    message = "Please enter your password.";
  }

  return { status, message, code };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Basic, safe email format check (defense-in-depth before hitting Firebase). */
function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

/**
 * Returns a user-friendly reason string if the password is invalid, or null if OK.
 * Kept intentionally light (min 8) — Firebase enforces its own rules too.
 */
function passwordIssue(password) {
  if (!password || typeof password !== "string") return "Please enter a password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  return null;
}

module.exports = {
  genUsernameFromEmail,
  genRandomPasswordHex,
  generateUsername,
  generateRandomPassword,
  fbErrorToHttp,
  isValidEmail,
  passwordIssue,
};
