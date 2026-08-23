const User = require("../../models/User.model");
const badgeConditions = require("./badgesConfig");
const { createNotification } = require("./notification.controller");

async function checkAndAwardBadges(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    console.log(`Checking badges for user: ${user.username}, ID: ${user._id}`);

    const badgesToRemove = [];

    // Iterate over user's current badges to check if they should be removed
    for (const badge of user.badges) {
      const condition = badgeConditions.find((c) => c.id === badge.badgeId);

      if (condition) {
        if (condition.criteria.includes("streak")) {
          const days = parseInt(condition.criteria.split("-")[0]);
          if (user.loginStreak < days) {
            badgesToRemove.push(badge);
          }
        }

        if (condition.criteria.includes("Level")) {
          const level = parseInt(condition.criteria.split(" ")[1]);
          if (user.level < level) {
            badgesToRemove.push(badge);
          }
        }

        if (condition.criteria.includes("XP")) {
          const xp = parseInt(condition.criteria.split(" ")[0]);
          if (user.xp_score < xp) {
            badgesToRemove.push(badge);
          }
        }

        if (condition.criteria.includes("completed courses")) {
          const courses = parseInt(condition.criteria.split(" ")[0]);
          if (user.completedCourses.length < courses) {
            badgesToRemove.push(badge);
          }
        }
      }
    }

    // Remove badges that no longer meet the criteria
    if (badgesToRemove.length > 0) {
      user.badges = user.badges.filter(
        (badge) => !badgesToRemove.some((badgeToRemove) => badge.badgeId === badgeToRemove.badgeId)
      );

      for (const badge of badgesToRemove) {
        console.log(`Removing badge: ${badge.name} from user: ${user.username}`);
        await createNotification(user._id, "badge-removed", `You have lost a badge: ${badge.name}`);
      }
    }

    // Iterate over badge conditions to check if new badges should be awarded
    for (const condition of badgeConditions) {
      if (condition.criteria.includes("streak")) {
        const days = parseInt(condition.criteria.split("-")[0]);
        if (user.loginStreak >= days) {
          await awardBadge(user, condition);
        }
      }

      if (condition.criteria.includes("Level")) {
        const level = parseInt(condition.criteria.split(" ")[1]);
        if (user.level >= level) {
          await awardBadge(user, condition);
        }
      }

      if (condition.criteria.includes("XP")) {
        const xp = parseInt(condition.criteria.split(" ")[0]);
        if (user.xp_score >= xp) {
          await awardBadge(user, condition);
        }
      }

      if (condition.criteria.includes("completed courses")) {
        const courses = parseInt(condition.criteria.split(" ")[0]);
        if (user.completedCourses.length >= courses) {
          await awardBadge(user, condition);
        }
      }
    }

    await user.save();
  } catch (error) {
    console.error("Error checking and awarding badges:", error);
    throw error;
  }
}

async function awardBadge(user, badgeCondition) {
  const alreadyHasBadge = user.badges.some((badge) => badge.badgeId === badgeCondition.id);

  if (!alreadyHasBadge) {
    console.log(`Awarding badge: ${badgeCondition.name} to user: ${user.username}`);
    user.badges.push({
      badgeId: badgeCondition.id,
      name: badgeCondition.name,
      earnedDate: new Date(),
    });

    // Create a notification for the new badge
    await createNotification(
      user._id,
      "badge-awarded",
      `You have earned a new badge: ${badgeCondition.name}`
    );
  } else {
    console.log(`User: ${user.username} already has badge: ${badgeCondition.name}`);
  }
}

async function getAllBadges(req, res) {
  try {
    const badges = badgeConditions;
    res.send({
      message: "All badges fetched successfully.",
      success: true,
      data: badges,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
}

module.exports = {
  checkAndAwardBadges,
  getAllBadges,
};
