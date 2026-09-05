"use strict";

const BookQuote = require("../models/BookQuote.model");
const Story = require("../models/Story.model");

/**
 * GET /api/v1/quotes
 * Retrieve paginated quotes with category / slug / featured filters
 */
exports.getQuotes = async (req, res) => {
  try {
    const { category, slug, featured, page = 1, limit = 20, sort = "featured" } = req.query;
    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }
    if (slug) {
      query.storySlug = slug;
    }
    if (featured === "true") {
      query.isFeatured = true;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let sortObj = { isFeatured: -1, likesCount: -1 };
    if (sort === "latest") {
      sortObj = { createdAt: -1 };
    } else if (sort === "popular") {
      sortObj = { likesCount: -1, sharesCount: -1 };
    }

    const [quotes, total] = await Promise.all([
      BookQuote.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      BookQuote.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error("Error in getQuotes:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch quotes", error: err.message });
  }
};

/**
 * GET /api/v1/quotes/:id
 */
exports.getQuoteById = async (req, res) => {
  try {
    const quote = await BookQuote.findById(req.params.id).lean();
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }
    return res.status(200).json({ success: true, data: quote });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching quote", error: err.message });
  }
};

/**
 * POST /api/v1/quotes/:id/like
 */
exports.likeQuote = async (req, res) => {
  try {
    const quote = await BookQuote.findByIdAndUpdate(
      req.params.id,
      { $inc: { likesCount: 1 } },
      { new: true }
    );
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }
    return res.status(200).json({ success: true, data: quote });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error liking quote", error: err.message });
  }
};

/**
 * POST /api/v1/quotes/:id/share
 */
exports.shareQuote = async (req, res) => {
  try {
    const quote = await BookQuote.findByIdAndUpdate(
      req.params.id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }
    return res.status(200).json({ success: true, data: quote });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error sharing quote", error: err.message });
  }
};

/**
 * POST /api/v1/quotes/seed
 * Seed curated quotes into MongoDB
 */
exports.seedCuratedQuotes = async (req, res) => {
  try {
    const count = await BookQuote.countDocuments();
    if (count >= 15 && !req.query.force) {
      const existing = await BookQuote.find().limit(20).lean();
      return res.status(200).json({ success: true, message: `Quotes already seeded (${count} quotes exist)`, data: existing });
    }

    const curatedSeeds = [
      {
        quoteText: "To live will be an awfully big adventure.",
        storySlug: "peter-and-wendy",
        storyTitle: "Peter and Wendy",
        authorName: "J. M. Barrie",
        category: "Adventure",
        themeTag: "courage",
        likesCount: 1420,
        sharesCount: 384,
        isFeatured: true
      },
      {
        quoteText: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        storySlug: "pride-and-prejudice",
        storyTitle: "Pride and Prejudice",
        authorName: "Jane Austen",
        category: "Love & Romance",
        themeTag: "romance",
        likesCount: 2890,
        sharesCount: 750,
        isFeatured: true
      },
      {
        quoteText: "When you have eliminated the impossible, whatever remains, however improbable, must be the truth.",
        storySlug: "the-sign-of-the-four",
        storyTitle: "The Sign of the Four",
        authorName: "Arthur Conan Doyle",
        category: "Mystery",
        themeTag: "logic",
        likesCount: 3105,
        sharesCount: 920,
        isFeatured: true
      },
      {
        quoteText: "Why, sometimes I've believed as many as six impossible things before breakfast.",
        storySlug: "through-the-looking-glass",
        storyTitle: "Through the Looking-Glass",
        authorName: "Lewis Carroll",
        category: "Wisdom",
        themeTag: "imagination",
        likesCount: 1980,
        sharesCount: 540,
        isFeatured: true
      },
      {
        quoteText: "You have power over your mind - not outside events. Realize this, and you will find strength.",
        storySlug: "meditations",
        storyTitle: "Meditations",
        authorName: "Marcus Aurelius",
        category: "Philosophy",
        themeTag: "stoicism",
        likesCount: 4520,
        sharesCount: 1340,
        isFeatured: true
      },
      {
        quoteText: "I am no bird; and no net ensnares me; I am a free human being with an independent will.",
        storySlug: "jane-eyre",
        storyTitle: "Jane Eyre",
        authorName: "Charlotte Brontë",
        category: "Courage",
        themeTag: "freedom",
        likesCount: 2150,
        sharesCount: 610,
        isFeatured: true
      },
      {
        quoteText: "Beware; for I am fearless, and therefore powerful.",
        storySlug: "frankenstein",
        storyTitle: "Frankenstein",
        authorName: "Mary Shelley",
        category: "Courage",
        themeTag: "power",
        likesCount: 1840,
        sharesCount: 490,
        isFeatured: true
      },
      {
        quoteText: "Listen to them, the children of the night. What music they make!",
        storySlug: "dracula",
        storyTitle: "Dracula",
        authorName: "Bram Stoker",
        category: "Mystery",
        themeTag: "gothic",
        likesCount: 1670,
        sharesCount: 410,
        isFeatured: true
      },
      {
        quoteText: "If you look the right way, you can see that the whole world is a garden.",
        storySlug: "the-secret-garden",
        storyTitle: "The Secret Garden",
        authorName: "Frances Hodgson Burnett",
        category: "Life & Hope",
        themeTag: "nature",
        likesCount: 2430,
        sharesCount: 680,
        isFeatured: true
      },
      {
        quoteText: "There is no place like home.",
        storySlug: "the-wonderful-wizard-of-oz",
        storyTitle: "The Wonderful Wizard of Oz",
        authorName: "L. Frank Baum",
        category: "Life & Hope",
        themeTag: "home",
        likesCount: 3200,
        sharesCount: 890,
        isFeatured: true
      },
      {
        quoteText: "The criminal is the creative artist; the detective only the critic.",
        storySlug: "the-innocence-of-father-brown",
        storyTitle: "The Innocence of Father Brown",
        authorName: "G. K. Chesterton",
        category: "Mystery",
        themeTag: "intellect",
        likesCount: 1540,
        sharesCount: 370,
        isFeatured: true
      },
      {
        quoteText: "You are braver than you believe, stronger than you seem, and smarter than you think.",
        storySlug: "winnie-the-pooh",
        storyTitle: "Winnie-the-Pooh",
        authorName: "A. A. Milne",
        category: "Wisdom",
        themeTag: "encouragement",
        likesCount: 4100,
        sharesCount: 1250,
        isFeatured: true
      }
    ];

    // Populate storyId and coverUrl from actual Story documents
    for (const item of curatedSeeds) {
      const story = await Story.findOne({ slug: item.storySlug });
      if (story) {
        item.storyId = story._id;
        item.coverUrl = story.coverUrl || story.coverImage;
        if (!item.coverUrl && story.cover) item.coverUrl = story.cover;
      }
    }

    if (req.query.force) {
      await BookQuote.deleteMany({});
    }

    const inserted = await BookQuote.insertMany(curatedSeeds);
    return res.status(201).json({ success: true, message: `Successfully seeded ${inserted.length} curated quotes`, data: inserted });
  } catch (err) {
    console.error("Error in seedCuratedQuotes:", err);
    return res.status(500).json({ success: false, message: "Failed to seed quotes", error: err.message });
  }
};
