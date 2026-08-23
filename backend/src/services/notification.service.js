"use strict";

const mongoose = require("mongoose");
const Notification = require("../models/Notification.model");
const NotificationState = require("../models/NotificationState.model");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function ensureState(userId) {
  return NotificationState.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, unreadCount: 0 } },
    { upsert: true, new: true }
  ).lean();
}

/**
 * Create notification + increment unreadCount transactionally.
 * If dedupeKey is used and duplicate happens, we return existing.
 */
async function createNotification({
  userId,
  type,
  title = "",
  body,
  data,
  link = "",
  source = "system",
  campaignId = null,
  dedupeKey = null,
}) {
  if (!isValidObjectId(userId)) {
    const e = new Error("Invalid userId");
    e.statusCode = 400;
    e.expose = true;
    throw e;
  }
  if (!type) {
    const e = new Error("Notification type is required");
    e.statusCode = 400;
    e.expose = true;
    throw e;
  }
  if (!body) {
    const e = new Error("Notification body is required");
    e.statusCode = 400;
    e.expose = true;
    throw e;
  }

  const session = await mongoose.startSession();
  try {
    let created = null;

    await session.withTransaction(async () => {
      await NotificationState.updateOne(
        { user: userId },
        { $setOnInsert: { user: userId, unreadCount: 0 } },
        { upsert: true, session }
      );

      try {
        created = await Notification.create(
          [
            {
              user: userId,
              type,
              title,
              body,
              data,
              link,
              source,
              campaignId: campaignId && isValidObjectId(campaignId) ? campaignId : null,
              dedupeKey: dedupeKey ? String(dedupeKey) : null,
              readAt: null,
              archivedAt: null,
            },
          ],
          { session }
        );
      } catch (err) {
        // Duplicate dedupeKey -> return existing doc, do not increment unreadCount
        if (err?.code === 11000 && dedupeKey) {
          created = null;
          return;
        }
        throw err;
      }

      if (created && created[0]) {
        await NotificationState.updateOne(
          { user: userId },
          { $inc: { unreadCount: 1 } },
          { session }
        );
      }
    });

    if (created && created[0]) return created[0].toObject();

    // Dedupe path: find existing
    if (dedupeKey) {
      return Notification.findOne({ user: userId, dedupeKey: String(dedupeKey) }).lean();
    }

    return null;
  } finally {
    await session.endSession();
  }
}

async function listNotifications({ userId, limit = 50, beforeId = null, unreadOnly = false }) {
  const q = { user: userId, archivedAt: null };
  if (unreadOnly) q.readAt = null;

  if (beforeId) {
    if (!isValidObjectId(beforeId)) {
      const e = new Error("Invalid cursor");
      e.statusCode = 400;
      e.expose = true;
      throw e;
    }
    q._id = { $lt: new mongoose.Types.ObjectId(beforeId) };
  }

  const docs = await Notification.find(q).sort({ _id: -1 }).limit(limit).lean();
  return docs;
}

async function getUnreadCount(userId) {
  const st = await ensureState(userId);
  return st.unreadCount || 0;
}

async function markOneAsRead({ userId, notificationId }) {
  if (!isValidObjectId(notificationId)) {
    const e = new Error("Invalid notification id");
    e.statusCode = 400;
    e.expose = true;
    throw e;
  }

  const session = await mongoose.startSession();
  try {
    let changed = 0;

    await session.withTransaction(async () => {
      const r = await Notification.updateOne(
        { _id: notificationId, user: userId, archivedAt: null, readAt: null },
        { $set: { readAt: new Date() } },
        { session }
      );

      changed = r.modifiedCount || 0;

      if (changed) {
        await NotificationState.updateOne(
          { user: userId },
          { $inc: { unreadCount: -1 } },
          { session }
        );
      }
    });

    return { modifiedCount: changed };
  } finally {
    await session.endSession();
  }
}

async function markManyAsRead({ userId, ids }) {
  const cleanIds = (Array.isArray(ids) ? ids : [])
    .map((x) => String(x))
    .filter((x) => isValidObjectId(x))
    .map((x) => new mongoose.Types.ObjectId(x));

  if (!cleanIds.length) {
    const e = new Error("ids must be a non-empty array of valid ids");
    e.statusCode = 400;
    e.expose = true;
    throw e;
  }

  const session = await mongoose.startSession();
  try {
    let modified = 0;

    await session.withTransaction(async () => {
      const r = await Notification.updateMany(
        { _id: { $in: cleanIds }, user: userId, archivedAt: null, readAt: null },
        { $set: { readAt: new Date() } },
        { session }
      );

      modified = r.modifiedCount || 0;

      if (modified) {
        await NotificationState.updateOne(
          { user: userId },
          { $inc: { unreadCount: -modified } },
          { session }
        );
      }
    });

    return { modifiedCount: modified };
  } finally {
    await session.endSession();
  }
}

async function markAllAsRead({ userId }) {
  const session = await mongoose.startSession();
  try {
    let modified = 0;

    await session.withTransaction(async () => {
      const r = await Notification.updateMany(
        { user: userId, archivedAt: null, readAt: null },
        { $set: { readAt: new Date() } },
        { session }
      );

      modified = r.modifiedCount || 0;

      await NotificationState.updateOne(
        { user: userId },
        { $set: { unreadCount: 0, lastReadAt: new Date() } },
        { upsert: true, session }
      );
    });

    return { modifiedCount: modified };
  } finally {
    await session.endSession();
  }
}

async function archiveOne({ userId, notificationId }) {
  if (!isValidObjectId(notificationId)) {
    const e = new Error("Invalid notification id");
    e.statusCode = 400;
    e.expose = true;
    throw e;
  }

  const session = await mongoose.startSession();
  try {
    let modified = 0;
    let wasUnread = false;

    await session.withTransaction(async () => {
      const doc = await Notification.findOne(
        { _id: notificationId, user: userId, archivedAt: null },
        { readAt: 1 }
      ).session(session);

      if (!doc) return;

      wasUnread = !doc.readAt;

      const r = await Notification.updateOne(
        { _id: notificationId, user: userId, archivedAt: null },
        { $set: { archivedAt: new Date() } },
        { session }
      );

      modified = r.modifiedCount || 0;

      if (modified && wasUnread) {
        await NotificationState.updateOne(
          { user: userId },
          { $inc: { unreadCount: -1 } },
          { session }
        );
      }
    });

    return { modifiedCount: modified };
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createNotification,
  listNotifications,
  getUnreadCount,
  markOneAsRead,
  markManyAsRead,
  markAllAsRead,
  archiveOne,
};
