"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { httpError } = require("../utils/httpError");

function getAccessToken(req) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  if (req.cookies?.jwt) return String(req.cookies.jwt);
  return null;
}

async function protect(req, _res, next) {
  try {
    const token = getAccessToken(req);
    if (!token) throw httpError(401, "Unauthorized", { code: "unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      throw httpError(401, "Invalid or expired token", { code: "invalid_token" });
    }

    const user = await User.findById(decoded.id).select(
      "_id role emailVerified tokenInvalidBefore accountStatus isSuspended deletedAt"
    );
    if (!user) throw httpError(401, "Unauthorized", { code: "unauthorized" });

    if (user.accountStatus === "deleted" || user.deletedAt) {
      throw httpError(403, "Account has been deleted", { code: "account_deleted" });
    }
    if (user.accountStatus === "suspended" || user.isSuspended) {
      throw httpError(403, "Account is suspended", { code: "account_suspended" });
    }

    // logout-all enforcement
    if (user.tokenInvalidBefore) {
      const tokenIatMs = (decoded.iat || 0) * 1000;
      if (tokenIatMs < new Date(user.tokenInvalidBefore).getTime()) {
        throw httpError(401, "Session invalidated. Please login again.", {
          code: "session_invalidated",
        });
      }
    }

    req.user = {
      id: String(user._id),
      _id: user._id,
      role: user.role,
      emailVerified: user.emailVerified,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { protect };
