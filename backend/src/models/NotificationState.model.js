"use strict";

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const NotificationStateSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    // O(1) unread count
    unreadCount: { type: Number, default: 0 },

    // optional: for UI "mark all read" optimizations
    lastReadAt: { type: Date, default: null },
    lastReadNotificationId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = model("NotificationState", NotificationStateSchema);
