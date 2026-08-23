"use strict";

const mongoose = require("mongoose");

// LexiconProgress/UserTermProgress pre-save hooks need the user's current
// streak on every save to feed spaced-repetition scoring. Streak only
// changes at most once a day, so re-querying UserEngagement on every single
// term save (which can fire many times per session) is wasted load — cache
// it briefly instead.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // userId (string) -> { streak, expiresAt }

async function getCachedUserStreak(userId) {
  const key = String(userId);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.streak;
  }

  let streak = 0;
  try {
    const UserEngagement = mongoose.model("UserEngagement");
    const engagement = await UserEngagement.findOne({ user: userId }).select("currentStreak").lean();
    if (engagement) {
      streak = engagement.currentStreak || 0;
    }
  } catch (err) {
    console.error("Error fetching user streak:", err);
  }

  cache.set(key, { streak, expiresAt: now + CACHE_TTL_MS });
  return streak;
}

module.exports = { getCachedUserStreak };
