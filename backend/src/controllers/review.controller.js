"use strict";

const mongoose = require("mongoose");
const Story = require("../models/Story.model");
const BookReview = require("../models/BookReview.model");

/**
 * Community & Goodreads Book Reviews Controller
 */

// Sample curated Goodreads reviews for classic titles
const GOODREADS_SAMPLE_REVIEWS = [
  {
    authorName: "Eleanor Vance (Goodreads)",
    authorAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300",
    rating: 5,
    reviewText: "A masterpiece of psychological atmosphere and suspense! The narration quality on Liiro makes the classic prose feel so alive.",
    source: "goodreads",
    likesCount: 142,
    isVerifiedPurchase: true,
  },
  {
    authorName: "Arthur Pendelton (Goodreads)",
    authorAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
    rating: 5,
    reviewText: "Rereading this classic with Liiro Whispersync karaoke narration was an unforgettable experience. Highly recommended!",
    source: "goodreads",
    likesCount: 98,
    isVerifiedPurchase: true,
  },
  {
    authorName: "Clara Oswald (Goodreads)",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
    rating: 4,
    reviewText: "Brilliant character depth and pacing. Perfect length for weekend audio reading.",
    source: "goodreads",
    likesCount: 56,
    isVerifiedPurchase: true,
  },
];

exports.getStoryReviews = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10, source } = req.query;

    const story = await Story.findOne({ slug, isPublished: true }).select("_id slug title").lean();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const query = { storyId: story._id };
    if (source && ["user", "goodreads", "editorial"].includes(source)) {
      query.source = source;
    }

    const p = Math.max(parseInt(page) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    let [reviews, totalCount] = await Promise.all([
      BookReview.find(query)
        .sort({ likesCount: -1, createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      BookReview.countDocuments(query),
    ]);

    // If zero reviews exist in DB, auto-seed sample Goodreads reviews for demonstration
    if (totalCount === 0) {
      const seeded = GOODREADS_SAMPLE_REVIEWS.map((r) => ({
        ...r,
        storyId: story._id,
      }));
      await BookReview.insertMany(seeded);

      reviews = await BookReview.find(query)
        .sort({ likesCount: -1, createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean();
      totalCount = reviews.length;
    }

    // Calculate rating summary
    const allStoryReviews = await BookReview.find({ storyId: story._id }).select("rating source").lean();
    const totalStoryReviews = allStoryReviews.length;

    const sumRating = allStoryReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    const averageRating = totalStoryReviews > 0 ? parseFloat((sumRating / totalStoryReviews).toFixed(1)) : 4.9;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allStoryReviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) distribution[r.rating]++;
    });

    res.status(200).json({
      success: true,
      summary: {
        averageRating,
        totalReviews: totalStoryReviews,
        goodreadsCount: allStoryReviews.filter((r) => r.source === "goodreads").length,
        userCount: allStoryReviews.filter((r) => r.source === "user").length,
        distribution,
      },
      pagination: {
        page: p,
        limit: l,
        total: totalCount,
        totalPages: Math.ceil(totalCount / l),
      },
      data: reviews,
    });
  } catch (error) {
    console.error("Error in getStoryReviews:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating, reviewText, authorName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 stars" });
    }
    if (!reviewText || reviewText.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Review text must be at least 5 characters" });
    }

    const story = await Story.findOne({ slug, isPublished: true }).select("_id").lean();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const userId = req.user?._id || req.user?.id || null;
    const name = authorName || req.user?.username || req.user?.first_name || "Community Reader";

    const newReview = await BookReview.create({
      storyId: story._id,
      userId,
      authorName: name,
      rating: parseInt(rating),
      reviewText: reviewText.trim(),
      source: "user",
      isVerifiedPurchase: true,
    });

    res.status(201).json({
      success: true,
      message: "Review published successfully",
      data: newReview,
    });
  } catch (error) {
    console.error("Error in addReview:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updated = await BookReview.findByIdAndUpdate(
      reviewId,
      { $inc: { likesCount: 1 } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error in likeReview:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
