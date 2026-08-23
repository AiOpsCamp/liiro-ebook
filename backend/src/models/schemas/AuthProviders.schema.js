"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    firebasePassword: { type: Boolean, default: false },
    firebaseGoogle: { type: Boolean, default: false },
    googleOAuth: { type: Boolean, default: false },
    emailPassword: { type: Boolean, default: false },
  },
  { _id: false }
);
