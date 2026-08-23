"use strict";
const mongoose = require("mongoose");
const Notification = require("../../models/Notification.model");
const notificationService = require("../../services/notification.service");

const { Expo } = require("expo-server-sdk");
const User = require("../../models/User.model");
const expo = new Expo();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function dispatchPushNotification(userId, title, body, data, link) {
  try {
    if (!isValidObjectId(userId)) return;
    const user = await User.findById(userId).select("pushTokens").lean();
    if (!user || !Array.isArray(user.pushTokens) || user.pushTokens.length === 0) return;

    const messages = [];
    for (const pt of user.pushTokens) {
      const token = typeof pt === "string" ? pt : pt?.token;
      if (token && Expo.isExpoPushToken(token)) {
        messages.push({
          to: token,
          sound: "default",
          title: title || "LangoWords Update",
          body,
          data: { ...data, link },
        });
      }
    }

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    }
  } catch (err) {
    console.warn("Failed to dispatch push notification:", err?.message || err);
  }
}

exports.createNotification = async (firstArg, typeArg, bodyArg, dataArg) => {
  let userId, type, title, body, data, link, source, campaignId;

  if (typeof firstArg === "object" && firstArg !== null && !firstArg._id) {
    userId = firstArg.userId || firstArg.user;
    type = firstArg.type;
    title = firstArg.title || "";
    body = firstArg.body;
    data = firstArg.data;
    link = firstArg.link || "";
    source = firstArg.source || "system";
    campaignId = firstArg.campaignId || null;
  } else {
    userId = firstArg;
    type = typeArg;
    body = bodyArg;
    data = dataArg;
    title = "";
    link = "";
    source = "system";
  }

  if (!isValidObjectId(userId)) throw new Error("Invalid userId");
  if (!type) throw new Error("Notification type is required");
  if (!body) throw new Error("Notification body is required");

  const created = await notificationService.createNotification({
    userId,
    type,
    title,
    body,
    data,
    link,
    source,
    campaignId: campaignId && isValidObjectId(campaignId) ? campaignId : null,
  });

  // Async dispatch push notification to mobile devices
  dispatchPushNotification(userId, title, body, data, link).catch(() => {});

  return created;
};

exports.getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.user?._id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    const r = await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return res.status(200).json({ success: true, modifiedCount: r.modifiedCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
