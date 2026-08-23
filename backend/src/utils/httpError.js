"use strict";

function httpError(statusCode, publicMessage, extra = {}) {
  const err = new Error(publicMessage || "Error");
  err.statusCode = statusCode || 500;

  // Your errorHandler only shows err.message if expose/publicMessage is set
  err.expose = true;
  err.publicMessage = publicMessage;

  if (extra.code) err.code = extra.code;
  if (extra.details) err.details = extra.details;
  if (extra.payload) err.payload = extra.payload;

  return err;
}

module.exports = { httpError };
