"use strict";

const User = require("../../../models/User.model");
const { getAllBadges } = require("../../../shared/helpers/badgeService");

// Your existing "aggregate all badges from users" behavior:
async function getUserBadges(req, res) {
  try {
    const users = await User.find({}, "badges").lean();
    const allBadges = users.reduce((acc, user) => {
      acc.push(...(user.badges || []));
      return acc;
    }, []);

    return res.send({
      message: "All badges fetched successfully.",
      success: true,
      data: allBadges,
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
}

// Pass-through to your existing service (keeps functionality)
async function getAllBadgesHandler(req, res) {
  try {
    const data = await getAllBadges(req.user?._id); // if your service ignores arg, fine
    return res.send({
      message: "Badges fetched successfully.",
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
}

module.exports = {
  getUserBadges,
  getAllBadges: getAllBadgesHandler,
};
