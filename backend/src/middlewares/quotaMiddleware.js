const { logger } = require('../utils/logger');
const UserActivity = require('../models/UserActivity.model');

const TIER_LIMITS = {
  free: {
    monthlyAudioHours: 20,
    maxOfflineBooks: 5
  },
  basic: {
    monthlyAudioHours: 60,
    maxOfflineBooks: 20
  },
  premium: {
    monthlyAudioHours: Infinity,
    maxOfflineBooks: Infinity
  }
};

/**
 * Middleware to enforce listening/reading quotas.
 * Returns HTTP 402 Payment Required when limits are exceeded.
 */
const enforceStreamingQuota = async (req, res, next) => {
  try {
    const user = req.user;
    // If not authenticated or guest, allow fair-use trial access
    if (!user) {
      return next();
    }

    const tier = user.subscriptionTier || 'free';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    if (limits.monthlyAudioHours === Infinity) {
      return next();
    }

    // Calculate current month's listening time in hours from UserActivity
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const activities = await UserActivity.find({
      userId: user._id || user.id,
      activityType: 'AUDIO_PLAY',
      timestamp: { $gte: startOfMonth }
    }).select('durationSeconds').lean();

    const totalSeconds = activities.reduce((sum, act) => sum + (act.durationSeconds || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    if (totalHours >= limits.monthlyAudioHours) {
      logger.warn({
        userId: user._id || user.id,
        tier,
        totalHours,
        limit: limits.monthlyAudioHours
      }, 'User quota exceeded');

      return res.status(402).json({
        success: false,
        code: 'QUOTA_EXCEEDED',
        message: `You have reached your ${limits.monthlyAudioHours}h monthly streaming limit for the ${tier.toUpperCase()} plan. Upgrade to Liiro Premium for unlimited access.`,
        data: {
          currentUsageHours: totalHours,
          quotaLimitHours: limits.monthlyAudioHours,
          plan: tier,
          upgradeUrl: '/billing'
        }
      });
    }

    // Attach usage metadata to request
    req.quotaUsage = {
      usedHours: totalHours,
      limitHours: limits.monthlyAudioHours,
      remainingHours: Math.max(0, limits.monthlyAudioHours - totalHours)
    };

    next();
  } catch (error) {
    logger.error({ err: error }, 'Error checking streaming quota');
    // Fail-open for user experience if check fails
    next();
  }
};

module.exports = {
  enforceStreamingQuota,
  TIER_LIMITS
};
