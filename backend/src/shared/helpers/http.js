"use strict";

/**
 * Create an operational (expected) error with statusCode and optional details.
 * - err.expose=true means it's safe to show the message to clients.
 */
function httpError(statusCode, message, details) {
  const e = new Error(message);
  e.statusCode = statusCode;
  e.expose = true;
  if (details !== undefined) e.details = details;
  return e;
}

module.exports = { httpError };
