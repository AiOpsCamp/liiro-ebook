const UserCollection = require("../models/UserCollection.model");
const Story = require("../models/Story.model");
const mongoose = require("mongoose");

const DEFAULT_SYSTEM_SHELVES = [
  {
    name: "Currently Reading",
    slug: "currently-reading",
    systemType: "currently-reading",
    isSystem: true,
    icon: "book-open",
    color: "#38BDF8",
    description: "Books and audiobooks you are actively reading right now"
  },
  {
    name: "Want to Read",
    slug: "want-to-read",
    systemType: "want-to-read",
    isSystem: true,
    icon: "bookmark",
    color: "#F59E0B",
    description: "Your wishlist of classics and sagas for later"
  },
  {
    name: "Favorites",
    slug: "favorites",
    systemType: "favorites",
    isSystem: true,
    icon: "heart",
    color: "#EC4899",
    description: "Your all-time favorite literary masterpieces"
  }
];

const getUserId = (req) => {
  return req.user?.id || req.user?._id || req.headers["x-guest-id"] || "guest-default-user";
};

/**
 * Ensures system collections exist for the user
 */
async function ensureSystemCollections(userId) {
  for (const shelf of DEFAULT_SYSTEM_SHELVES) {
    const exists = await UserCollection.findOne({ userId, slug: shelf.slug });
    if (!exists) {
      await UserCollection.create({
        userId,
        ...shelf,
        stories: []
      });
    }
  }
}

/**
 * GET /api/v1/collections
 * List all collections/shelves for the authenticated user
 */
exports.getCollections = async (req, res) => {
  try {
    const userId = getUserId(req);
    await ensureSystemCollections(userId);

    const collections = await UserCollection.find({ userId })
      .populate({
        path: "stories",
        select: "title slug authorName category coverImageUrl hasAudio totalChapters"
      })
      .sort({ isSystem: -1, createdAt: 1 })
      .lean();

    const formatted = collections.map((col) => ({
      _id: col._id,
      name: col.name,
      slug: col.slug,
      description: col.description,
      isSystem: col.isSystem,
      systemType: col.systemType,
      isPublic: col.isPublic,
      icon: col.icon,
      color: col.color,
      totalBooks: col.stories?.length || 0,
      stories: col.stories || [],
      updatedAt: col.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch bookshelves." });
  }
};

/**
 * GET /api/v1/collections/slug/:slug
 * Retrieve a specific collection by slug with populated books
 */
exports.getCollectionBySlug = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { slug } = req.params;

    let collection = await UserCollection.findOne({ userId, slug })
      .populate({
        path: "stories",
        select: "title slug authorName category coverImageUrl hasAudio totalChapters publishedAt"
      })
      .lean();

    if (!collection) {
      await ensureSystemCollections(userId);
      collection = await UserCollection.findOne({ userId, slug })
        .populate({
          path: "stories",
          select: "title slug authorName category coverImageUrl hasAudio totalChapters publishedAt"
        })
        .lean();
    }

    if (!collection) {
      return res.status(404).json({ success: false, error: "Bookshelf not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: collection._id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        isSystem: collection.isSystem,
        systemType: collection.systemType,
        isPublic: collection.isPublic,
        icon: collection.icon,
        color: collection.color,
        totalBooks: collection.stories?.length || 0,
        stories: collection.stories || [],
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching collection details:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch bookshelf details." });
  }
};

/**
 * POST /api/v1/collections
 * Create a new custom collection
 */
exports.createCollection = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, description, icon, color, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Bookshelf name is required." });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await UserCollection.findOne({ userId, slug });
    if (existing) {
      return res.status(400).json({ success: false, error: "A bookshelf with this name already exists." });
    }

    const created = await UserCollection.create({
      userId,
      name: name.trim(),
      slug,
      description: description ? description.trim() : "",
      icon: icon || "folder",
      color: color || "#38BDF8",
      isPublic: Boolean(isPublic),
      isSystem: false,
      systemType: "custom",
      stories: []
    });

    return res.status(201).json({
      success: true,
      message: "Bookshelf created successfully.",
      data: created
    });
  } catch (error) {
    console.error("Error creating collection:", error);
    return res.status(500).json({ success: false, error: "Failed to create bookshelf." });
  }
};

/**
 * PATCH /api/v1/collections/:id
 * Update custom collection metadata
 */
exports.updateCollection = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, description, icon, color, isPublic } = req.body;

    const collection = await UserCollection.findOne({ _id: id, userId });
    if (!collection) {
      return res.status(404).json({ success: false, error: "Bookshelf not found." });
    }

    if (name && !collection.isSystem) {
      collection.name = name.trim();
      collection.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (description !== undefined) collection.description = description.trim();
    if (icon) collection.icon = icon;
    if (color) collection.color = color;
    if (isPublic !== undefined) collection.isPublic = Boolean(isPublic);

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Bookshelf updated successfully.",
      data: collection
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return res.status(500).json({ success: false, error: "Failed to update bookshelf." });
  }
};

/**
 * DELETE /api/v1/collections/:id
 * Delete a custom collection (system collections are protected)
 */
exports.deleteCollection = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const collection = await UserCollection.findOne({ _id: id, userId });
    if (!collection) {
      return res.status(404).json({ success: false, error: "Bookshelf not found." });
    }

    if (collection.isSystem) {
      return res.status(400).json({ success: false, error: "Built-in system bookshelves cannot be deleted." });
    }

    await UserCollection.deleteOne({ _id: id, userId });

    return res.status(200).json({
      success: true,
      message: "Bookshelf deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return res.status(500).json({ success: false, error: "Failed to delete bookshelf." });
  }
};

/**
 * POST /api/v1/collections/:id/stories
 * Add or toggle story in a collection
 */
exports.addStoryToCollection = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { storyId, storySlug } = req.body;

    let targetStoryId = storyId;
    if (!targetStoryId && storySlug) {
      const story = await Story.findOne({ slug: storySlug }).select("_id");
      if (story) targetStoryId = story._id;
    }

    if (!targetStoryId) {
      return res.status(400).json({ success: false, error: "Valid storyId or storySlug is required." });
    }

    const collection = await UserCollection.findOne({ _id: id, userId });
    if (!collection) {
      return res.status(404).json({ success: false, error: "Bookshelf not found." });
    }

    const alreadyExists = collection.stories.some((s) => s.toString() === targetStoryId.toString());
    if (!alreadyExists) {
      collection.stories.push(targetStoryId);
      await collection.save();
    }

    return res.status(200).json({
      success: true,
      message: `Book added to "${collection.name}".`,
      data: {
        collectionId: collection._id,
        totalBooks: collection.stories.length
      }
    });
  } catch (error) {
    console.error("Error adding story to collection:", error);
    return res.status(500).json({ success: false, error: "Failed to add book to bookshelf." });
  }
};

/**
 * DELETE /api/v1/collections/:id/stories/:storyId
 * Remove story from a collection
 */
exports.removeStoryFromCollection = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id, storyId } = req.params;

    const collection = await UserCollection.findOne({ _id: id, userId });
    if (!collection) {
      return res.status(404).json({ success: false, error: "Bookshelf not found." });
    }

    collection.stories = collection.stories.filter((s) => s.toString() !== storyId.toString());
    await collection.save();

    return res.status(200).json({
      success: true,
      message: `Book removed from "${collection.name}".`,
      data: {
        collectionId: collection._id,
        totalBooks: collection.stories.length
      }
    });
  } catch (error) {
    console.error("Error removing story from collection:", error);
    return res.status(500).json({ success: false, error: "Failed to remove book from bookshelf." });
  }
};

/**
 * GET /api/v1/collections/story/:storyIdentifier
 * Returns which collections a specific story is in
 */
exports.getStoryCollections = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { storyIdentifier } = req.params;

    let storyId = storyIdentifier;
    if (!mongoose.Types.ObjectId.isValid(storyIdentifier)) {
      const story = await Story.findOne({ slug: storyIdentifier }).select("_id");
      if (story) storyId = story._id;
    }

    await ensureSystemCollections(userId);

    const collections = await UserCollection.find({ userId }).select("name slug icon color systemType stories isSystem").lean();

    const result = collections.map((col) => ({
      _id: col._id,
      name: col.name,
      slug: col.slug,
      icon: col.icon,
      color: col.color,
      systemType: col.systemType,
      isSystem: col.isSystem,
      isInShelf: col.stories?.some((s) => s.toString() === storyId?.toString()) || false
    }));

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error checking story collections:", error);
    return res.status(500).json({ success: false, error: "Failed to check story bookshelves." });
  }
};
