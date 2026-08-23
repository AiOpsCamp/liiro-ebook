"use strict";

const { httpError } = require("./http");

function getUser(req) {
  return req.user || null;
}

function requireAuth(req) {
  const user = getUser(req);
  if (!user) throw httpError(401, "User not authenticated");
  return user;
}

function requireRole(req, roles) {
  const user = requireAuth(req);
  const role = user.role;
  if (!roles.includes(role)) throw httpError(403, "Forbidden");
  return user;
}

function requireAdmin(req) {
  return requireRole(req, ["admin", "superadmin"]);
}

module.exports = { getUser, requireAuth, requireRole, requireAdmin };
