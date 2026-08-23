"use strict";

const User = require("../../../models/User.model");
const { generateUsername, generateRandomPassword } = require("./helpers");
const { verifyIdToken } = require("./firebase/verifyIdToken");

/* ======================================================
   GOOGLE AUTH (Firebase ID token from client)  ✅ PRIMARY
   Endpoint: POST /api/v1/auth/google-auth
   Body: { token: <firebaseIdToken> }
====================================================== */
async function googleAuth(req, res) {
  const firebaseToken = req.body?.token;

  if (!firebaseToken) {
    return res.status(400).json({
      success: false,
      message: "Please provide a Firebase token",
    });
  }

  try {
    const defaultAdmin = require("./firebase/liiro.firebaseAdmin");
    const projectConfig = req.app.locals.projectConfig || { firebase: { projectId: "liiro-ebook" } };
    const firebaseAdmin = req.app.locals.firebaseAdmin || defaultAdmin;

    // Verify token with project-specific Firebase config
    const decodedToken = await verifyIdToken(firebaseToken, projectConfig.firebase, firebaseAdmin);

    let isNewUser = false;

    let user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      isNewUser = true;

      const [first = "", ...rest] = (decodedToken.name || "").split(" ");
      const last = rest.join(" ");

      user = await new User({
        email: decodedToken.email,
        emailVerified: true,
        first_name: first,
        last_name: last,
        firebase_uuid: decodedToken.uid,
        picture: decodedToken.picture || "",
        username: generateUsername(decodedToken.email),
        password: generateRandomPassword(),
        authProviders: { google: true },
        accountStatus: "active",
      }).save();
      // Gate deleted/suspended accounts BEFORE issuing tokens (parity with
      // firebaseExchange). Otherwise a banned user could log back in via Google.
      if (user.accountStatus === "deleted" || user.deletedAt) {
        return res.status(403).json({
          success: false,
          message: "This account has been deleted.",
          code: "account_deleted",
        });
      }
      if (user.accountStatus === "suspended" || user.isSuspended) {
        return res.status(403).json({
          success: false,
          message: "This account has been suspended. Please contact support.",
          code: "account_suspended",
        });
      }

      // keep minimal sync without overwriting user profile fields
      const updates = {};
      if (!user.firebase_uuid) updates.firebase_uuid = decodedToken.uid;
      if (!user.emailVerified) updates.emailVerified = true;
      updates["authProviders.google"] = true;

      if (user.accountStatus && user.accountStatus !== "active") {
        updates.accountStatus = "active";
      }

      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }

    // getSignedJwtToken is async (stores refresh-token hash) — must be awaited.
    const tokenPair = await user.getSignedJwtToken(res, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const userInfo = {
      id: user._id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      firebase_uuid: user.firebase_uuid,
      picture: user.picture,
      role: user.role,
      emailVerified: user.emailVerified,
      onBoarding: user.onBoarding,
      accountStatus: user.accountStatus,
    };

    // Normalized shape — tokens under data.tokens, matching fbEmailLogin/firebaseExchange.
    return res.json({
      success: true,
      message: isNewUser
        ? "User created and logged in successfully"
        : "User logged in successfully",
      data: {
        tokens: tokenPair,
        onboardingStatus: user.onBoarding ?? false,
        isNewUser,
        user: userInfo,
      },
    });
  } catch (err) {
    console.error("[googleAuth ERROR]:", err);
    return res.status(401).json({
      success: false,
      message: err?.message || "Google sign-in could not be completed. Please try again.",
      code: err?.code || "google_auth_failed",
    });
  }
}

module.exports = { googleAuth };
