"use strict";

const jwt = require("jsonwebtoken");

/**
 * Optional authentication middleware: Extracts user payload if JWT token is provided.
 * Does not block anonymous guests from browsing stories or public chapters.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "liiro_ebook_super_secret_jwt_key_2026");
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
}

/**
 * Require authentication middleware: Rejects request if valid JWT token is missing.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication token is required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "liiro_ebook_super_secret_jwt_key_2026");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
  }
}

module.exports = { optionalAuth, requireAuth };
