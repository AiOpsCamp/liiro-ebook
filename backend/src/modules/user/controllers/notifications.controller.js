"use strict";

/**
 * Controller: src/controllers/notifications/notifications.controller.js
 * Base: /api/v1/notifications
 */

const { httpError } = require("../../../shared/helpers/http"); // adjust path if needed
const notificationService = require("../../../services/notification.service");

function requireUserId(req) {
  const userId = req.user?._id || req.user?.id;
  if (!userId) throw httpError(401, "Unauthorized");
  return userId;
}

function parseLimit(v) {
  const n = parseInt(v, 10);
  const x = Number.isFinite(n) ? n : 50;
  return Math.min(Math.max(x, 1), 200);
}

async function list(req, res) {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(200).json({
      success: true,
      message: "Guest notifications",
      data: {
        items: [
          {
            _id: "notif_welcome",
            title: "👋 Welcome to Liiro Ebook & Audiobooks!",
            body: "Explore over 800+ world classics with Whispersync text-to-speech karaoke alignment.",
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
    });
  }

  const limit = parseLimit(req.query.limit);
  const before = req.query.before ? String(req.query.before) : null;
  const unreadOnly = String(req.query.unreadOnly || "false").toLowerCase() === "true";

  const items = await notificationService.listNotifications({
    userId,
    limit,
    beforeId: before,
    unreadOnly,
  });

  return res.status(200).json({
    success: true,
    message: "Notifications fetched",
    data: {
      items,
      nextCursor: items.length ? String(items[items.length - 1]._id) : null,
    },
  });
}

async function unreadCount(req, res) {
  const userId = requireUserId(req);

  const count = await notificationService.getUnreadCount(userId);

  return res.status(200).json({
    success: true,
    message: "Unread count fetched",
    data: { unreadCount: count },
  });
}

async function markRead(req, res) {
  const userId = requireUserId(req);
  const id = req.params.id;

  const r = await notificationService.markOneAsRead({ userId, notificationId: id });

  return res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: r,
  });
}

async function markReadMany(req, res) {
  const userId = requireUserId(req);
  const ids = req.body?.ids;

  const r = await notificationService.markManyAsRead({ userId, ids });

  return res.status(200).json({
    success: true,
    message: "Notifications marked as read",
    data: r,
  });
}

async function markReadAll(req, res) {
  const userId = requireUserId(req);

  const r = await notificationService.markAllAsRead({ userId });

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read",
    data: r,
  });
}

async function archive(req, res) {
  const userId = requireUserId(req);
  const id = req.params.id;

  const r = await notificationService.archiveOne({ userId, notificationId: id });

  return res.status(200).json({
    success: true,
    message: "Notification archived",
    data: r,
  });
}

module.exports = {
  list,
  unreadCount,
  markRead,
  markReadMany,
  markReadAll,
  archive,
};
