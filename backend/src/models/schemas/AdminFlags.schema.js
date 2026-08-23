"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    isTestUser: { type: Boolean, default: false },
    isInternal: { type: Boolean, default: false },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
  },
  { _id: false }
);
