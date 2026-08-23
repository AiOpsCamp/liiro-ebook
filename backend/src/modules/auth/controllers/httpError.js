"use strict";

function httpError(statusCode, message, meta) {
  const err = new Error(message || "Error");
  err.statusCode = statusCode || 500;
  if (meta) err.meta = meta;
  return err;
}

module.exports = { httpError };
