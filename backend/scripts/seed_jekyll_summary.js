"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/db/connect");
const Story = require("../src/models/Story.model");
const BookSummary = require("../src/models/BookSummary.model");

async function seedJekyllSummary() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Jekyll Summary Seeding...");

    const slug = "the-strange-case-of-dr-jekyll-and-mr-hyde";
    const story = await Story.findOne({ slug });

    if (!story) {
      console.error("Story not found for slug:", slug);
      process.exit(1);
    }

    // Delete old summary if exists
    await BookSummary.deleteMany({ storyId: story._id });

    const summaryData = {
      storyId: story._id,
      slug: story.slug,
      overview: "Explore Robert Louis Stevenson's Gothic masterpiece on the dual nature of man, Victorian repression, and the terrifying consequences of trying to isolate one's dark desires.",
      estimatedReadMinutes: 6,
      estimatedAudioMinutes: 14,
      summaryAudioUrl: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/the-strange-case-of-dr-jekyll-and-mr-hyde/voices/adam/chapter_1.mp3",
      keyTakeaways: [
        {
          takeawayNumber: 1,
          title: "The Dual Nature of Humanity",
          content: "Man is not truly one, but truly two. Every human harbors both noble virtues and dark impulses. Denying our shadow self only gives it destructive power.",
          quote: "Man is not truly one, but truly two.",
          audioUrl: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/the-strange-case-of-dr-jekyll-and-mr-hyde/voices/adam/chapter_1.mp3",
        },
        {
          takeawayNumber: 2,
          title: "The Danger of Extreme Social Repression",
          content: "Victorian moral perfectionism forced Dr. Jekyll to hide his minor vices, creating the intense pressure that eventually birthed Mr. Hyde.",
          quote: "My devil had been long caged, he came out roaring.",
        },
        {
          takeawayNumber: 3,
          title: "Addiction and Loss of Self-Control",
          content: "What began as a controlled scientific experiment quickly morphed into an uncontrollable chemical addiction where Hyde dominated Jekyll's body.",
          quote: "I was slowly losing hold of my original and better self.",
        },
        {
          takeawayNumber: 4,
          title: "Public Reputation vs. Private Reality",
          content: "Dr. Jekyll prioritized his public image as a respectable physician above authentic self-acceptance, leading to a profound duplicity of life.",
          quote: "I stood committed to a profound duplicity of life.",
        },
        {
          takeawayNumber: 5,
          title: "Science Without Ethical Boundaries",
          content: "Scientific curiosity untethered from moral responsibility leads to self-destruction and collateral harm to innocent lives.",
          quote: "I knew myself to be more wicked, tenfold more wicked.",
        },
        {
          takeawayNumber: 6,
          title: "The Illusion of Separating Good from Evil",
          content: "Attempting to purge oneself of darkness by isolating it into another persona only amplifies its malice until it consumes the host.",
          quote: "Edward Hyde, alone in the ranks of mankind, was pure evil.",
        },
      ],
    };

    const created = await BookSummary.create(summaryData);
    console.log("✅ Successfully seeded 15-Minute Key Takeaways & Audio Summary for Dr. Jekyll and Mr. Hyde!");
    console.log("Summary ID:", created._id);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding Jekyll summary:", error);
    process.exit(1);
  }
}

seedJekyllSummary();
