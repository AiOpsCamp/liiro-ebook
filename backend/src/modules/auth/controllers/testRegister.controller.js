"use strict";

const _path = require("path");
const mongoose = require("mongoose");
const User = require("../../../models/User.model");
const { genUsernameFromEmail, genRandomPasswordHex } = require("../../../utils/helpers");
const { callFirebaseApi } = require("./firebase/firebaseApi");

/**
 * Test/Simplified Registration Controller
 * Replicates fbEmailRegister functionality but with cleaner error handling
 * for debugging and testing purposes
 */

/**
 * POST /api/v1/auth/test/simple-register
 * Simplified registration endpoint for testing
 */
const simpleRegister = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`[TEST-REGISTER] Starting registration for ${email}`);

    // 2. Create Firebase account
    console.log(`[TEST-REGISTER] Creating Firebase account...`);
    const firebaseResponse = await callFirebaseApi("accounts:signUp", {
      email,
      password,
      returnSecureToken: true,
    });

    const { idToken, localId: firebaseUid } = firebaseResponse;
    console.log(`[TEST-REGISTER] ✅ Firebase account created: ${firebaseUid}`);

    // 3. Check if user already exists in MongoDB
    console.log(`[TEST-REGISTER] Checking if user exists in MongoDB...`);
    let user = await User.findOne({ email });

    if (user) {
      console.log(`[TEST-REGISTER] User already exists: ${user._id}`);
      return res.status(200).json({
        success: true,
        message: "User already registered",
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          firebase_uuid: user.firebase_uuid,
        },
      });
    }

    // 4. Create new user in MongoDB (WITHOUT session to avoid transaction issues)
    console.log(`[TEST-REGISTER] Creating user in MongoDB...`);
    const userData = {
      username: genUsernameFromEmail(email),
      email,
      password: genRandomPasswordHex(12),
      firebase_uuid: firebaseUid,
      emailVerified: false,
      accountStatus: "pending_verification",
      authProviders: { firebasePassword: true },
    };

    // Use explicit session: null to avoid implicit transaction
    user = await User.create([userData], { session: null });
    console.log(`[TEST-REGISTER] ✅ User created in MongoDB: ${user[0]._id}`);

    // 5. Verify user was persisted
    console.log(`[TEST-REGISTER] Verifying user persistence...`);
    const verifyUser = await User.findOne({ email });
    if (!verifyUser) {
      console.error(`[TEST-REGISTER] ❌ CRITICAL: User not found after creation!`);
      return res.status(500).json({
        success: false,
        message: "User creation failed - persistence verification failed",
      });
    }
    console.log(`[TEST-REGISTER] ✅ User verified in database`);

    // 6. Return success with user data
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user[0]._id,
        email: user[0].email,
        username: user[0].username,
        firebase_uuid: user[0].firebase_uuid,
        emailVerified: user[0].emailVerified,
        accountStatus: user[0].accountStatus,
      },
      idToken,
    });
  } catch (error) {
    console.error(`[TEST-REGISTER] ❌ Error:`, error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * POST /api/v1/auth/test/register-with-logging
 * Registration with detailed logging at each step
 */
const registerWithLogging = async (req, res) => {
  try {
    const { email, password } = req.body;
    const startTime = Date.now();

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[REGISTER-DEBUG] Starting registration for: ${email}`);
    console.log(`[REGISTER-DEBUG] Current DB: ${mongoose.connection.db.databaseName}`);
    console.log(`[REGISTER-DEBUG] Connection ID: ${mongoose.connection.id}`);
    console.log(`${"=".repeat(60)}\n`);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing email or password" });
    }

    // Step 1: Firebase
    console.log(`[REGISTER-DEBUG] STEP 1: Creating Firebase account...`);
    const firebaseResponse = await callFirebaseApi("accounts:signUp", {
      email,
      password,
      returnSecureToken: true,
    });
    const { _idToken, localId: firebaseUid } = firebaseResponse;
    console.log(`[REGISTER-DEBUG] ✅ Firebase created with UID: ${firebaseUid}`);

    // Step 2: MongoDB User Create
    console.log(`[REGISTER-DEBUG] STEP 2: Creating MongoDB user...`);
    const userData = {
      username: genUsernameFromEmail(email),
      email,
      password: genRandomPasswordHex(12),
      firebase_uuid: firebaseUid,
      emailVerified: false,
      accountStatus: "pending_verification",
      authProviders: { firebasePassword: true },
    };

    const createdUsers = await User.create([userData], { session: null });
    const user = createdUsers[0];
    console.log(`[REGISTER-DEBUG] ✅ MongoDB user created: ${user._id}`);

    // Step 3: Immediate verification (same connection)
    console.log(`[REGISTER-DEBUG] STEP 3: Immediate verification (same connection)...`);
    const immediateVerify = await User.findOne({ email });
    console.log(
      immediateVerify
        ? `[REGISTER-DEBUG] ✅ Found: ${immediateVerify._id}`
        : `[REGISTER-DEBUG] ❌ NOT FOUND`
    );

    // Step 4: Fresh connection verification
    console.log(`[REGISTER-DEBUG] STEP 4: Fresh connection verification...`);
    const freshConn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
    const FreshUser = freshConn.model("User", User.schema);
    const freshVerify = await FreshUser.findOne({ email });
    await freshConn.close();
    console.log(
      freshVerify
        ? `[REGISTER-DEBUG] ✅ Found on fresh connection: ${freshVerify._id}`
        : `[REGISTER-DEBUG] ❌ NOT FOUND on fresh connection`
    );

    const duration = Date.now() - startTime;
    console.log(`[REGISTER-DEBUG] Completed in ${duration}ms\n`);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
      },
      debug: {
        immediateVerify: !!immediateVerify,
        freshConnectionVerify: !!freshVerify,
        duration,
      },
    });
  } catch (error) {
    console.error(`[REGISTER-DEBUG] ❌ Error:`, error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  simpleRegister,
  registerWithLogging,
};
