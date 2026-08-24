"use strict";

const UserStreak = require("../models/UserStreak.model");
const UserAchievement = require("../models/UserAchievement.model");
const UserActivity = require("../models/UserActivity.model");

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getYesterdayDateString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

function getEffectiveUserId(req) {
  if (req.user && (req.user._id || req.user.id)) {
    return (req.user._id || req.user.id).toString();
  }
  const headers = req.headers || {};
  const query = req.query || {};
  const guestId = headers["x-guest-id"] || query.guestId;
  if (guestId && typeof guestId === "string" && guestId.startsWith("guest_")) {
    return guestId;
  }
  return "guest_default_user";
}

/**
 * GET /api/v1/user/streaks
 */
exports.getUserStreak = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const today = getTodayDateString();

    let streak = await UserStreak.findOne({ userId });

    if (!streak) {
      streak = await UserStreak.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        lastActiveDate: today,
        dailyGoalMinutes: 15,
        todayMinutesRead: 5,
        unlockedAchievements: ["first_page"],
      });
    } else if (streak.lastActiveDate !== today && streak.lastActiveDate !== getYesterdayDateString()) {
      // Streak broken, reset current streak to 1
      streak.currentStreak = 1;
      streak.todayMinutesRead = 0;
      streak.lastActiveDate = today;
      await streak.save();
    }

    const allAchievements = UserAchievement.GLOBAL_ACHIEVEMENTS.map((ach) => ({
      ...ach,
      isUnlocked: streak.unlockedAchievements.includes(ach.key),
    }));

    res.status(200).json({
      success: true,
      data: {
        userId: streak.userId,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalActiveDays: streak.totalActiveDays,
        dailyGoalMinutes: streak.dailyGoalMinutes,
        todayMinutesRead: streak.todayMinutesRead,
        goalPercent: Math.min(100, Math.round((streak.todayMinutesRead / streak.dailyGoalMinutes) * 100)),
        lastActiveDate: streak.lastActiveDate,
        achievements: allAchievements,
      },
    });
  } catch (error) {
    console.error("Error in getUserStreak:", error);
    res.status(500).json({ success: false, message: "Server error fetching streaks" });
  }
};

/**
 * POST /api/v1/user/streaks/ping
 * Increments daily reading minutes and updates streak continuity
 */
exports.pingDailyStreak = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const { minutesRead = 5 } = req.body;
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    let streak = await UserStreak.findOne({ userId });

    if (!streak) {
      streak = await UserStreak.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        lastActiveDate: today,
        dailyGoalMinutes: 15,
        todayMinutesRead: Math.max(1, parseInt(minutesRead)),
        unlockedAchievements: ["first_page"],
      });
    } else {
      if (streak.lastActiveDate === today) {
        streak.todayMinutesRead += parseInt(minutesRead);
      } else if (streak.lastActiveDate === yesterday) {
        streak.currentStreak += 1;
        streak.totalActiveDays += 1;
        streak.todayMinutesRead = parseInt(minutesRead);
        streak.lastActiveDate = today;
      } else {
        streak.currentStreak = 1;
        streak.totalActiveDays += 1;
        streak.todayMinutesRead = parseInt(minutesRead);
        streak.lastActiveDate = today;
      }

      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }

      // Check achievement unlocks
      if (streak.currentStreak >= 7 && !streak.unlockedAchievements.includes("streak_titan")) {
        streak.unlockedAchievements.push("streak_titan");
      }

      await streak.save();
    }

    res.status(200).json({
      success: true,
      message: "Daily streak updated!",
      data: {
        currentStreak: streak.currentStreak,
        todayMinutesRead: streak.todayMinutesRead,
        dailyGoalMinutes: streak.dailyGoalMinutes,
        unlockedAchievements: streak.unlockedAchievements,
      },
    });
  } catch (error) {
    console.error("Error in pingDailyStreak:", error);
    res.status(500).json({ success: false, message: "Server error pinging streak" });
  }
};

/**
 * GET /api/v1/user/achievements
 */
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const streak = await UserStreak.findOne({ userId });
    const unlocked = streak ? streak.unlockedAchievements : ["first_page"];

    const data = UserAchievement.GLOBAL_ACHIEVEMENTS.map((ach) => ({
      ...ach,
      isUnlocked: unlocked.includes(ach.key),
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getUserAchievements:", error);
    res.status(500).json({ success: false, message: "Server error fetching achievements" });
  }
};

/**
 * POST /api/v1/user/share-status
 * Generates social quote sharing payload metadata
 */
exports.generateSocialQuoteCard = async (req, res) => {
  try {
    const { storySlug, storyTitle, quoteText, author, styleTemplate = "dark_gold" } = req.body;

    res.status(200).json({
      success: true,
      data: {
        quoteText: quoteText || "Man is not truly one, but truly two.",
        storyTitle: storyTitle || "Dr. Jekyll and Mr. Hyde",
        author: author || "Robert Louis Stevenson",
        styleTemplate,
        shareTagline: "Currently reading on Liiro Ebook & Audiobooks 🚀",
        shareUrl: `http://localhost:8086/details/${storySlug || "the-strange-case-of-dr-jekyll-and-mr-hyde"}`,
      },
    });
  } catch (error) {
    console.error("Error generating quote card:", error);
    res.status(500).json({ success: false, message: "Server error generating quote card" });
  }
};
