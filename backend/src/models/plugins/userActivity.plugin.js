"use strict";

/**
 * Adds:
 * - user.updateLastLoginAndCheckXP()
 * - user.updateLevel()
 * - pre("save") hook to sort/cap recentlyViewedPacks
 */
module.exports = function userActivityPlugin(schema) {
  schema.methods.updateLastLoginAndCheckXP = async function () {
    const User = this.constructor;
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const bump = await User.updateOne(
      { _id: this._id, lastLogin: { $lt: cutoff } },
      { $set: { lastLogin: now }, $inc: { xp_score: 10 } },
      { timestamps: false }
    );
    if (bump.modifiedCount > 0) return;

    await User.updateOne(
      {
        _id: this._id,
        $or: [{ lastLogin: { $exists: false } }, { lastLogin: null }],
      },
      { $set: { lastLogin: now } },
      { timestamps: false }
    );
  };

  schema.methods.updateLevel = function () {
    const calculatedLevel = Math.floor((this.xp_score || 0) / 200);
    if (this.level !== calculatedLevel) this.level = calculatedLevel;
  };

  schema.pre("save", function () {
    if (!this.isModified("recentlyViewedPacks")) return;

    if (Array.isArray(this.recentlyViewedPacks)) {
      this.recentlyViewedPacks.sort(
        (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      );
      this.recentlyViewedPacks = this.recentlyViewedPacks.slice(0, 10);
    }
  });
};
