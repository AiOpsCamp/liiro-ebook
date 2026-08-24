"use strict";

const mongoose = require("mongoose");
const User = require("../models/User.model");

/**
 * Family Profiles & PIN-Protected Kids Mode Controller (BookBeat Parity)
 * Manages up to 5 family sub-accounts per subscription.
 */

// Default avatars for family profiles
const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300", // Main / Reader
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=300", // Kid 1
  "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=300", // Kid 2
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300", // Mom / Teen
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300", // Dad / Adult
];

exports.getProfiles = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      // Default guest profile
      return res.status(200).json({
        success: true,
        data: {
          activeProfileId: "guest_main",
          profiles: [
            {
              _id: "guest_main",
              name: "Reader",
              avatarUrl: DEFAULT_AVATARS[0],
              isKidsMode: false,
              ageTier: "all",
              parentalPin: null,
            },
          ],
        },
      });
    }

    let user = await User.findById(userId).select("profiles activeProfileId username").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Auto-initialize default main profile if empty
    if (!user.profiles || user.profiles.length === 0) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            profiles: [
              {
                name: user.username || "Main Profile",
                avatarUrl: DEFAULT_AVATARS[0],
                isKidsMode: false,
                ageTier: "all",
                parentalPin: null,
              },
            ],
          },
        },
        { new: true }
      ).select("profiles activeProfileId").lean();

      const mainProfileId = updatedUser.profiles[0]._id;
      await User.findByIdAndUpdate(userId, { activeProfileId: mainProfileId });

      user = { ...updatedUser, activeProfileId: mainProfileId };
    }

    res.status(200).json({
      success: true,
      data: {
        activeProfileId: user.activeProfileId || user.profiles[0]._id,
        profiles: user.profiles,
      },
    });
  } catch (error) {
    console.error("Error in getProfiles:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, isKidsMode = false, ageTier = "all", parentalPin = null, avatarUrl } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Profile name is required" });
    }

    if (!userId) {
      return res.status(201).json({
        success: true,
        message: "Family profile created (guest mode)",
        data: {
          _id: `guest_prof_${Date.now()}`,
          name: name.trim(),
          avatarUrl: avatarUrl || DEFAULT_AVATARS[1],
          isKidsMode: !!isKidsMode,
          ageTier: isKidsMode ? ageTier : "all",
          parentalPin: parentalPin || null,
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.profiles && user.profiles.length >= 5) {
      return res.status(400).json({ success: false, message: "Maximum limit of 5 family profiles reached" });
    }

    const avatar = avatarUrl || DEFAULT_AVATARS[user.profiles ? user.profiles.length % DEFAULT_AVATARS.length : 0];
    const newProfile = {
      name: name.trim(),
      avatarUrl: avatar,
      isKidsMode: !!isKidsMode,
      ageTier: isKidsMode ? (["0-3", "3-6", "6-9", "9-12"].includes(ageTier) ? ageTier : "6-9") : "all",
      parentalPin: parentalPin && /^[0-9]{4}$/.test(parentalPin) ? parentalPin : null,
    };

    user.profiles.push(newProfile);
    await user.save();

    const created = user.profiles[user.profiles.length - 1];

    res.status(201).json({
      success: true,
      message: "Family profile created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error in createProfile:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.switchProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { profileId, pin } = req.body;

    if (!userId) {
      return res.status(200).json({ success: true, message: "Switched guest profile" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const targetProfile = user.profiles.id(profileId);
    if (!targetProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Check PIN if target profile or active profile has a parental PIN requirement
    if (targetProfile.parentalPin) {
      if (!pin || pin !== targetProfile.parentalPin) {
        return res.status(403).json({ success: false, message: "Invalid 4-digit Parental PIN" });
      }
    }

    user.activeProfileId = targetProfile._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Switched active profile to '${targetProfile.name}'`,
      data: targetProfile,
    });
  } catch (error) {
    console.error("Error in switchProfile:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.verifyParentalPin = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { pin, profileId } = req.body;

    if (!pin || !/^[0-9]{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: "4-digit PIN is required" });
    }

    if (!userId) {
      return res.status(200).json({ success: true, verified: pin === "1234" });
    }

    const user = await User.findById(userId).select("profiles activeProfileId").lean();
    const targetId = profileId || user?.activeProfileId;
    const profile = user?.profiles?.find((p) => String(p._id) === String(targetId));

    if (!profile || !profile.parentalPin) {
      // Default fallback PIN check for test mode
      return res.status(200).json({ success: true, verified: pin === "1234" });
    }

    const isVerified = profile.parentalPin === pin;
    res.status(200).json({
      success: isVerified,
      verified: isVerified,
      message: isVerified ? "PIN verified" : "Incorrect 4-digit PIN",
    });
  } catch (error) {
    console.error("Error in verifyParentalPin:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { profileId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.profiles.length <= 1) {
      return res.status(400).json({ success: false, message: "Cannot delete primary profile" });
    }

    user.profiles = user.profiles.filter((p) => String(p._id) !== String(profileId));
    if (String(user.activeProfileId) === String(profileId)) {
      user.activeProfileId = user.profiles[0]._id;
    }

    await user.save();
    res.status(200).json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProfile:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
