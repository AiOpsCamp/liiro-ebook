// middlewares/authMiddleware.js
"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

/* ---------------------------------
   Token extraction helper
---------------------------------- */
function extractToken(req) {
  // Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  // Legacy / fallback headers
  if (req.headers["x-access-token"]) return req.headers["x-access-token"];

  // Cookie fallback
  if (req.cookies && typeof req.cookies.jwt === "string") {
    return req.cookies.jwt;
  }

  return null;
}

/* ---------------------------------
   Auth middleware
---------------------------------- */
module.exports = async function authMiddleware(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized to access this route, please login",
    });
  }

  try {
    /* -----------------------------
       Verify JWT
    ------------------------------ */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* -----------------------------
       Load user
    ------------------------------ */
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* -----------------------------
       Hard blocks (GLOBAL)
    ------------------------------ */

    // ⛔ Soft-deleted users
    if (user.deletedAt || user.accountStatus === "deleted") {
      return res.status(403).json({
        success: false,
        message: "Account has been deleted",
      });
    }

    // ⛔ Suspended users
    if (user.isSuspended || user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: user.suspensionReason || "Your account has been suspended",
      });
    }

    /* -----------------------------
       Force logout / token invalidation
    ------------------------------ */
    if (user.tokenInvalidBefore) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      if (tokenIssuedAtMs < user.tokenInvalidBefore.getTime()) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again.",
        });
      }
    }

    /* -----------------------------
       Best-effort activity updates
    ------------------------------ */
    try {
      await user.updateLastLoginAndCheckXP();
    } catch (_) {
      // Best-effort XP update
    }

    /* -----------------------------
       Track last known IP & UA (best-effort)
    ------------------------------ */
    try {
      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
      const ua = req.headers["user-agent"];

      if (ip !== user.lastKnownIp || ua !== user.lastKnownUserAgent) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              lastKnownIp: ip,
              lastKnownUserAgent: ua,
            },
          },
          { timestamps: false }
        );
      }
    } catch (_) {
      // Best-effort IP tracking
    }

    /* -----------------------------
       Attach helpers to request
    ------------------------------ */
    req.user = user;

    // Keep backward compatibility with existing controllers
    req.body = req.body || {};
    req.body.userId = user._id;
    req.body.role = user.role;
    req.body.emailVerified = !!user.emailVerified;

    // Convenience helpers
    req.isAdmin = user.role === "admin";
    req.isModerator = user.role === "moderator";

    // Route-level enforcement helper
    req.requireVerifiedEmail = function () {
      if (!user.emailVerified) {
        return {
          ok: false,
          res: res.status(403).json({
            success: false,
            message: "Email not verified. Please verify your email to continue.",
          }),
        };
      }
      return { ok: true };
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error instanceof Error ? error.message : "Authentication error",
    });
  }
};

module.exports.optionalAuth = async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (
      user &&
      !user.deletedAt &&
      user.accountStatus !== "deleted" &&
      !user.isSuspended &&
      user.accountStatus !== "suspended"
    ) {
      req.user = user;
    }
  } catch (_) {
    // Optional auth fallback
  }

  next();
};
