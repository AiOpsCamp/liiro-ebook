"use strict";

const UserActivity = require("../models/UserActivity.model");
const UserNotification = require("../models/UserNotification.model");

/**
 * User Activity Tracking & Real-Time Notification Controller
 */

// Helper to generate notification text for activities
function generateNotificationContent(activity) {
  const langName = activity.activeLang === "es" ? "Spanish 🇪🇸" : activity.activeLang === "fr" ? "French 🇫🇷" : "English 🇬🇧";
  const posMin = Math.floor((activity.positionSec || 0) / 60);

  switch (activity.activityType) {
    case "started_reading":
      return {
        title: `📖 Reading Started`,
        body: `You started reading "${activity.storyTitle}" in ${langName}.`,
        icon: "📖",
      };
    case "paused_reading":
      return {
        title: `⏸️ Reading Paused`,
        body: `Paused "${activity.storyTitle}" Chapter ${activity.chapterNumber} at ${activity.progressPercent}% progress.`,
        icon: "⏸️",
      };
    case "started_listening":
      return {
        title: `🎧 Listening Started`,
        body: `Started listening to "${activity.storyTitle}" Chapter ${activity.chapterNumber} in ${langName}.`,
        icon: "🎧",
      };
    case "paused_listening":
      return {
        title: `⏸️ Audio Paused`,
        body: `Paused audiobook "${activity.storyTitle}" at ${posMin}m timestamp.`,
        icon: "🎧",
      };
    case "completed_chapter":
      return {
        title: `🎉 Chapter ${activity.chapterNumber} Complete!`,
        body: `Finished Chapter ${activity.chapterNumber} of "${activity.storyTitle}". +25 XP earned!`,
        icon: "🏆",
      };
    case "changed_language":
      return {
        title: `🌐 Language Switched`,
        body: `Switched reading language to ${langName} for "${activity.storyTitle}".`,
        icon: "🌐",
      };
    default:
      return null;
  }
}

exports.logActivity = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || "guest_user";
    const {
      activityType,
      storyId,
      storySlug,
      storyTitle,
      chapterNumber,
      chapterTitle,
      activeLang,
      readingMode,
      positionSec,
      progressPercent,
      deviceType,
    } = req.body;

    if (!activityType || !storySlug) {
      return res.status(400).json({ success: false, message: "activityType and storySlug are required" });
    }

    const activity = await UserActivity.create({
      userId,
      activityType,
      storyId,
      storySlug,
      storyTitle: storyTitle || storySlug,
      chapterNumber: chapterNumber || 1,
      chapterTitle: chapterTitle || "",
      activeLang: activeLang || "en",
      readingMode: readingMode || "text",
      positionSec: positionSec || 0,
      progressPercent: progressPercent || 0,
      deviceType: deviceType || "web",
    });

    // Check if notification should be triggered
    const notifInfo = generateNotificationContent(activity);
    if (notifInfo) {
      await UserNotification.create({
        userId,
        title: notifInfo.title,
        body: notifInfo.body,
        icon: notifInfo.icon,
        type: "activity",
        storySlug,
        activityId: activity._id,
      });
      activity.triggeredNotification = true;
      await activity.save();
    }

    res.status(201).json({
      success: true,
      message: "Activity logged successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Error in logActivity:", error);
    res.status(500).json({ success: false, message: "Server error logging activity" });
  }
};

exports.getUserActivities = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || "guest_user";
    const limit = parseInt(req.query.limit) || 30;

    const activities = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Error in getUserActivities:", error);
    res.status(500).json({ success: false, message: "Server error fetching activities" });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || "guest_user";
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await UserNotification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await UserNotification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    res.status(500).json({ success: false, message: "Server error fetching notifications" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await UserNotification.findByIdAndUpdate(notificationId, { isRead: true });
    res.status(200).json({ success: true, message: "Notification marked read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error marking notification read" });
  }
};
