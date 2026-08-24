"use strict";

const Story = require("../models/Story.model");
const BookSummary = require("../models/BookSummary.model");

/**
 * Blinkist-Style 15-Minute Key Takeaways Summary Controller
 */

// Sample curated 15-minute Blinks summary data for demonstration
const SAMPLE_BLINKS = {
  overview: "Discover how curiosity, imagination, and surreal logic challenge rigid adult conventions in Lewis Carroll's timeless masterpiece.",
  estimatedReadMinutes: 5,
  estimatedAudioMinutes: 12,
  summaryAudioUrl: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/alices-adventures-in-wonderland/voices/adam/chapter_1.mp3",
  keyTakeaways: [
    {
      takeawayNumber: 1,
      title: "Embrace Curiosity and Open-Minded Exploration",
      content: "Alice's journey down the rabbit hole begins with uninhibited curiosity. By questioning the mundane world, she opens herself to extraordinary growth and creative problem-solving.",
      quote: "Curiouser and curiouser!",
    },
    {
      takeawayNumber: 2,
      title: "Challenge Absurd Authority and Unjust Rules",
      content: "The Queen of Hearts and the Mad Hatter represent dogmatic, arbitrary authority. Alice learns to assert logic and moral courage when faced with nonsensical tyranny.",
      quote: "Off with their heads! ... Nonsense, said Alice.",
    },
    {
      takeawayNumber: 3,
      title: "Identity is Fluid and Constantly Evolving",
      content: "Alice frequently changes size and struggles to answer the Caterpillar's question, 'Who are you?' Growth requires shedding rigid self-definitions and adapting to new environments.",
      quote: "I can't go back to yesterday because I was a different person then.",
    },
    {
      takeawayNumber: 4,
      title: "Language and Logic depend on Perspective",
      content: "Wordplay and riddles in Wonderland show that meaning is constructed socially. True wisdom requires looking past surface words to grasp underlying intent.",
      quote: "Take care of the sense, and the sounds will take care of themselves.",
    },
    {
      takeawayNumber: 5,
      title: "Playfulness is Essential for Adult Resilience",
      content: "Carroll reminds readers that keeping a childlike sense of wonder and humor helps navigate the chaotic absurdities of adult existence.",
      quote: "Why, sometimes I've believed as many as six impossible things before breakfast.",
    },
  ],
};

exports.getBookSummary = async (req, res) => {
  try {
    const { slug } = req.params;
    const story = await Story.findOne({ slug, isPublished: true }).select("_id slug title author coverImageUrl").lean();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    let summary = await BookSummary.findOne({ storyId: story._id }).lean();

    if (!summary) {
      summary = await BookSummary.create({
        storyId: story._id,
        slug: story.slug,
        ...SAMPLE_BLINKS,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        story,
        summary,
      },
    });
  } catch (error) {
    console.error("Error in getBookSummary:", error);
    res.status(500).json({ success: false, message: "Server error fetching book summary" });
  }
};
