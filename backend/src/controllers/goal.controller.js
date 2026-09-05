const ReadingGoal = require("../models/ReadingGoal.model");
const Story = require("../models/Story.model");
const UserStoryProgress = require("../models/UserStoryProgress.model");

const getUserId = (req) => {
  return req.user?.id || req.user?._id || req.headers["x-guest-id"] || "guest-default-user";
};

/**
 * GET /api/v1/goals/current
 * Returns annual reading challenge goal for the current year
 */
exports.getCurrentGoal = async (req, res) => {
  try {
    const userId = getUserId(req);
    const currentYear = new Date().getFullYear();

    let goal = await ReadingGoal.findOne({ userId, year: currentYear }).lean();

    if (!goal) {
      // Find completed stories from user progress if any
      const completedProgresses = await UserStoryProgress.find({
        userId,
        isCompleted: true
      })
        .populate("storyId", "title slug authorName coverImageUrl")
        .lean();

      let initialCompleted = [];
      const formatTitle = (t) => {
        if (!t) return "Classic Book";
        if (typeof t === "string") return t;
        return t.en || Object.values(t)[0] || "Classic Book";
      };

      if (completedProgresses && completedProgresses.length > 0) {
        initialCompleted = completedProgresses.map((p) => ({
          storyId: p.storyId?._id,
          slug: p.storyId?.slug || "classic",
          title: formatTitle(p.storyId?.title),
          coverImageUrl: p.storyId?.coverImageUrl || "",
          authorName: p.storyId?.authorName || "Classic Author",
          completedAt: p.updatedAt || new Date()
        }));
      } else {
        // Seed default 3 completed books for rich initial display
        const demoStories = await Story.find({
          slug: { $in: ["peter-and-wendy", "alices-adventures-in-wonderland", "the-story-of-the-amulet"] }
        })
          .select("title slug authorName coverImageUrl")
          .lean();

        if (demoStories && demoStories.length > 0) {
          initialCompleted = demoStories.map((st) => ({
            storyId: st._id,
            slug: st.slug,
            title: formatTitle(st.title),
            coverImageUrl: st.coverImageUrl,
            authorName: st.authorName || "Classic Author",
            completedAt: new Date()
          }));
        }
      }

      goal = await ReadingGoal.create({
        userId,
        year: currentYear,
        targetBooks: 25,
        completedBooks: initialCompleted,
        completedMinutes: initialCompleted.length * 180
      });
      goal = goal.toObject();
    }

    const completedCount = goal.completedBooks?.length || 0;
    const targetCount = goal.targetBooks || 25;
    const percent = Math.min(100, Math.round((completedCount / targetCount) * 100));
    const booksRemaining = Math.max(0, targetCount - completedCount);

    // Compute annual reading pace
    const dayOfYear = Math.floor((new Date().getTime() - new Date(currentYear, 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const expectedBooks = Math.round((dayOfYear / 365) * targetCount);
    const booksAhead = completedCount - expectedBooks;

    let paceStatus = "on-track";
    let paceMessage = "🎯 You are right on track to achieve your reading goal!";

    if (booksAhead > 0) {
      paceStatus = "ahead";
      paceMessage = `🔥 You're ${booksAhead} ${booksAhead === 1 ? "book" : "books"} ahead of schedule!`;
    } else if (booksAhead < 0) {
      paceStatus = "behind";
      paceMessage = `⏳ Read ${Math.abs(booksAhead)} more to get back on schedule!`;
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: goal._id,
        year: goal.year,
        targetBooks: targetCount,
        completedCount,
        percent,
        booksRemaining,
        paceStatus,
        paceMessage,
        booksAhead,
        completedMinutes: goal.completedMinutes || completedCount * 180,
        completedBooks: goal.completedBooks || []
      }
    });
  } catch (error) {
    console.error("Error fetching reading goal:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch reading goal." });
  }
};

/**
 * PATCH /api/v1/goals/target
 * Update the annual target book count
 */
exports.updateTarget = async (req, res) => {
  try {
    const userId = getUserId(req);
    const currentYear = new Date().getFullYear();
    const { targetBooks } = req.body;

    const targetNum = parseInt(targetBooks, 10);
    if (isNaN(targetNum) || targetNum < 1 || targetNum > 1000) {
      return res.status(400).json({ success: false, error: "Target books must be between 1 and 1000." });
    }

    let goal = await ReadingGoal.findOne({ userId, year: currentYear });
    if (!goal) {
      goal = await ReadingGoal.create({
        userId,
        year: currentYear,
        targetBooks: targetNum,
        completedBooks: []
      });
    } else {
      goal.targetBooks = targetNum;
      await goal.save();
    }

    const completedCount = goal.completedBooks?.length || 0;
    const percent = Math.min(100, Math.round((completedCount / targetNum) * 100));

    return res.status(200).json({
      success: true,
      message: `Reading challenge updated to ${targetNum} books!`,
      data: {
        year: goal.year,
        targetBooks: targetNum,
        completedCount,
        percent,
        booksRemaining: Math.max(0, targetNum - completedCount)
      }
    });
  } catch (error) {
    console.error("Error updating reading goal target:", error);
    return res.status(500).json({ success: false, error: "Failed to update reading goal." });
  }
};

/**
 * POST /api/v1/goals/log-completed
 * Log a completed book into the annual challenge
 */
exports.logCompletedBook = async (req, res) => {
  try {
    const userId = getUserId(req);
    const currentYear = new Date().getFullYear();
    const { storyId, slug, title, coverImageUrl, authorName } = req.body;

    let targetStory = null;
    if (storyId) {
      targetStory = await Story.findById(storyId).select("title slug coverImageUrl authorName");
    } else if (slug) {
      targetStory = await Story.findOne({ slug }).select("title slug coverImageUrl authorName");
    }

    let goal = await ReadingGoal.findOne({ userId, year: currentYear });
    if (!goal) {
      goal = await ReadingGoal.create({
        userId,
        year: currentYear,
        targetBooks: 25,
        completedBooks: []
      });
    }

    const entryId = targetStory ? targetStory._id.toString() : storyId;
    const alreadyLogged = goal.completedBooks.some((b) => b.storyId?.toString() === entryId || b.slug === slug);

    const formatTitle = (t) => {
      if (!t) return "Classic Book";
      if (typeof t === "string") return t;
      return t.en || Object.values(t)[0] || "Classic Book";
    };

    if (!alreadyLogged) {
      goal.completedBooks.unshift({
        storyId: targetStory?._id || storyId,
        slug: targetStory?.slug || slug,
        title: formatTitle(targetStory?.title || title),
        coverImageUrl: targetStory?.coverImageUrl || coverImageUrl || "",
        authorName: targetStory?.authorName || authorName || "Author",
        completedAt: new Date()
      });
      goal.completedMinutes = (goal.completedMinutes || 0) + 180;
      await goal.save();
    }

    return res.status(200).json({
      success: true,
      message: "Book logged to annual reading goal!",
      data: {
        completedCount: goal.completedBooks.length,
        targetBooks: goal.targetBooks,
        percent: Math.min(100, Math.round((goal.completedBooks.length / goal.targetBooks) * 100))
      }
    });
  } catch (error) {
    console.error("Error logging completed book:", error);
    return res.status(500).json({ success: false, error: "Failed to log completed book." });
  }
};
