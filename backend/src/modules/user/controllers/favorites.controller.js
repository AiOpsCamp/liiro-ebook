"use strict";

const User = require("../../../models/User.model");
const LexiconPack = require("../../../models/lexicon/LexiconPack.model");
const Dialogue = require("../../../models/lingoCamp/dialogue/DialogueModel");
const Exercise = require("../../../models/lingoCamp/ExerciseModel");
const mongoose = require("mongoose");

const { getUserIdFromReq, handleError } = require("../../../modules/dialogue/controllers/exerciseCommonHelpers");

const {
  _getUserLexiconLanguages,
  _createLexiconScope,
} = require("../../../shared/helpers/lexiconLanguageService");

/**
 * Helper: Validate item exists and get its type
 */
async function validateAndGetItemInfo(itemId, itemSlug, contentType) {
  let item = null;
  let actualType = contentType;

  if (contentType === "LexiconPack") {
    item = await LexiconPack.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(itemId) ? itemId : null }, { slug: itemSlug }],
    })
      .select("_id slug")
      .lean();
    actualType = "LexiconPack";
  } else if (contentType === "Dialogue") {
    item = await Dialogue.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(itemId) ? itemId : null }, { slug: itemSlug }],
    })
      .select("_id slug")
      .lean();
    actualType = "Dialogue";
  } else if (contentType === "Exercise") {
    item = await Exercise.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(itemId) ? itemId : null }, { slug: itemSlug }],
    })
      .select("_id slug")
      .lean();
    actualType = "Exercise";
  }

  return { item, actualType };
}

/**
 * PUT /lexicon/:idOrSlug/favorite/add
 * PUT /dialogues/:slug/favorite/add
 * PUT /reading-exercises/:slug/favorite/add
 * PUT /writing-exercises/:slug/favorite/add
 * PUT /listening-exercises/:slug/favorite/add
 * Add item to user's favorites
 */
exports.addToFavorites = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const { idOrSlug, slug, exerciseSlug } = req.params;
    const itemIdOrSlug = idOrSlug || slug || exerciseSlug;
    const contentType = req.query.type || req.body?.type;

    if (!itemIdOrSlug) return res.status(400).json({ error: "Item ID or slug is required" });
    if (!contentType || !["LexiconPack", "Dialogue", "Exercise"].includes(contentType)) {
      return res
        .status(400)
        .json({ error: "Invalid content type (must be LexiconPack, Dialogue, or Exercise)" });
    }

    // Validate item exists
    const { item, actualType } = await validateAndGetItemInfo(
      itemIdOrSlug,
      itemIdOrSlug,
      contentType
    );
    if (!item) return res.status(404).json({ error: `${contentType} not found` });

    const itemId = item._id;

    // Add to favorites (upsert - won't create duplicate if already exists)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          favoriteItems: {
            itemId,
            itemType: actualType,
            addedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    )
      .select("favoriteItems")
      .lean();

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    const favItem = updatedUser.favoriteItems.find(
      (f) => f.itemId.toString() === itemId.toString() && f.itemType === actualType
    );

    return res.status(200).json({
      message: `${actualType} added to favorites`,
      favoriteItem: favItem,
      totalFavorites: updatedUser.favoriteItems.length,
    });
  } catch (err) {
    return handleError(res, err, "addToFavorites failed");
  }
};

/**
 * PUT /lexicon/:idOrSlug/favorite/remove
 * PUT /dialogues/:slug/favorite/remove
 * PUT /reading-exercises/:slug/favorite/remove
 * PUT /writing-exercises/:slug/favorite/remove
 * PUT /listening-exercises/:slug/favorite/remove
 * Remove item from user's favorites
 */
exports.removeFromFavorites = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const { idOrSlug, slug, exerciseSlug } = req.params;
    const itemIdOrSlug = idOrSlug || slug || exerciseSlug;
    const contentType = req.query.type || req.body?.type;

    if (!itemIdOrSlug) return res.status(400).json({ error: "Item ID or slug is required" });
    if (!contentType || !["LexiconPack", "Dialogue", "Exercise"].includes(contentType)) {
      return res
        .status(400)
        .json({ error: "Invalid content type (must be LexiconPack, Dialogue, or Exercise)" });
    }

    // Validate item exists
    const { item, actualType } = await validateAndGetItemInfo(
      itemIdOrSlug,
      itemIdOrSlug,
      contentType
    );
    if (!item) return res.status(404).json({ error: `${contentType} not found` });

    const itemId = item._id;

    // Remove from favorites
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          favoriteItems: {
            itemId,
            itemType: actualType,
          },
        },
      },
      { new: true, runValidators: true }
    )
      .select("favoriteItems")
      .lean();

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      message: `${actualType} removed from favorites`,
      totalFavorites: updatedUser.favoriteItems.length,
    });
  } catch (err) {
    return handleError(res, err, "removeFromFavorites failed");
  }
};

/**
 * GET /user/favorites
 * Get all user's favorited items (packs, exercises, dialogues)
 */
exports.getUserFavorites = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const user = await User.findById(userId).select("favoriteItems").lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    // Handle case where favoriteItems is undefined (for users created before this field was added)
    const favoriteItems = user.favoriteItems || [];

    // Group by content type
    const packIds = [];
    const dialogueIds = [];
    const exerciseIds = [];

    favoriteItems.forEach((item) => {
      if (item.itemType === "LexiconPack") packIds.push(item.itemId);
      else if (item.itemType === "Dialogue") dialogueIds.push(item.itemId);
      else if (item.itemType === "Exercise") exerciseIds.push(item.itemId);
    });

    // Fetch all items in parallel
    const [packs, dialogues, exercises] = await Promise.all([
      packIds.length
        ? LexiconPack.find({ _id: { $in: packIds } })
            .select("_id slug name category level image_url cover_image description free_access access difficulty tags")
            .lean()
        : [],
      dialogueIds.length
        ? Dialogue.find({ _id: { $in: dialogueIds } })
            .select("_id slug title category level image_url cover_image description difficulty type")
            .lean()
        : [],
      exerciseIds.length
        ? Exercise.find({ _id: { $in: exerciseIds } })
            .select("_id slug title type category level image_url cover_image description difficulty")
            .lean()
        : [],
    ]);

    // Map back to include addedAt timestamps
    const packMap = new Map(packs.map((p) => [p._id.toString(), p]));
    const dialogueMap = new Map(dialogues.map((d) => [d._id.toString(), d]));
    const exerciseMap = new Map(exercises.map((e) => [e._id.toString(), e]));

    const favorites = {
      lexiconPacks: favoriteItems
        .filter((f) => f.itemType === "LexiconPack")
        .map((f) => {
          const item = packMap.get(f.itemId.toString());
          return item ? { ...item, addedAt: f.addedAt } : null;
        })
        .filter(Boolean),
      dialogues: favoriteItems
        .filter((f) => f.itemType === "Dialogue")
        .map((f) => {
          const item = dialogueMap.get(f.itemId.toString());
          return item ? { ...item, addedAt: f.addedAt } : null;
        })
        .filter(Boolean),
      exercises: favoriteItems
        .filter((f) => f.itemType === "Exercise")
        .map((f) => {
          const item = exerciseMap.get(f.itemId.toString());
          return item ? { ...item, addedAt: f.addedAt } : null;
        })
        .filter(Boolean),
    };

    return res.status(200).json({
      message: "User favorites retrieved successfully",
      favorites,
      totalFavorites: favoriteItems.length,
    });
  } catch (err) {
    return handleError(res, err, "getUserFavorites failed");
  }
};
