"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    id: { type: String },
    email: { type: String },
    name: { type: String },
    invoicePrefix: { type: String },
    livemode: { type: Boolean },
    hasProfile: { type: Boolean, default: false },
  },
  { _id: false }
);
