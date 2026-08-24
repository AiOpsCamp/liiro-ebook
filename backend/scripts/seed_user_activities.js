"use strict";

require("dotenv").config();
const connectDB = require("../src/db/connect");
const UserActivity = require("../src/models/UserActivity.model");
const UserNotification = require("../src/models/UserNotification.model");

async function seedUserActivities() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for User Activities Seeding...");

    // Clean old guest_user activities
    await UserActivity.deleteMany({ userId: "guest_user" });
    await UserNotification.deleteMany({ userId: "guest_user" });

    const sampleActivities = [
      {
        userId: "guest_user",
        activityType: "started_reading",
        storySlug: "alices-adventures-in-wonderland",
        storyTitle: "Alice's Adventures in Wonderland",
        chapterNumber: 1,
        chapterTitle: "Down the Rabbit-Hole",
        activeLang: "en",
        readingMode: "text",
        progressPercent: 10,
        deviceType: "web",
      },
      {
        userId: "guest_user",
        activityType: "started_listening",
        storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde",
        storyTitle: "The Strange Case of Dr. Jekyll and Mr. Hyde",
        chapterNumber: 1,
        chapterTitle: "Story of the Door",
        activeLang: "en",
        readingMode: "audiobook",
        positionSec: 240,
        progressPercent: 35,
        deviceType: "ios",
      },
      {
        userId: "guest_user",
        activityType: "changed_language",
        storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde",
        storyTitle: "El extraño caso del Dr. Jekyll y el señor Hyde",
        chapterNumber: 1,
        chapterTitle: "Historia de la Puerta",
        activeLang: "es",
        readingMode: "text",
        progressPercent: 40,
        deviceType: "web",
      },
      {
        userId: "guest_user",
        activityType: "completed_chapter",
        storySlug: "alices-adventures-in-wonderland",
        storyTitle: "Alice's Adventures in Wonderland",
        chapterNumber: 1,
        chapterTitle: "Down the Rabbit-Hole",
        activeLang: "en",
        readingMode: "text",
        progressPercent: 100,
        deviceType: "web",
      },
      {
        userId: "guest_user",
        activityType: "paused_listening",
        storySlug: "frankenstein-or-the-modern-prometheus",
        storyTitle: "Frankenstein",
        chapterNumber: 2,
        chapterTitle: "Chapter II",
        activeLang: "fr",
        readingMode: "audiobook",
        positionSec: 860,
        progressPercent: 65,
        deviceType: "android",
      },
    ];

    for (const act of sampleActivities) {
      const createdAct = await UserActivity.create(act);
      await UserNotification.create({
        userId: "guest_user",
        title: `📖 ${act.activityType.replace("_", " ").toUpperCase()}`,
        body: `Logged activity for "${act.storyTitle}" in ${act.activeLang.toUpperCase()}.`,
        icon: "📖",
        type: "activity",
        storySlug: act.storySlug,
        activityId: createdAct._id,
      });
    }

    console.log("✅ Successfully seeded 5 sample User Activities & Notifications!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding user activities:", error);
    process.exit(1);
  }
}

seedUserActivities();
