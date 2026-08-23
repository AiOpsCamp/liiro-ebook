"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    badgeId: { type: String },
    name: { type: String },
    earnedDate: { type: Date, default: Date.now },
  },
  { _id: false }
);
