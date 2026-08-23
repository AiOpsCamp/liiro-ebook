"use strict";

const axios = require("axios");
const User = require("../../../models/User.model");
const { httpError } = require("../../../shared/helpers/http");
const { genUsernameFromEmail, genRandomPasswordHex, fbErrorToHttp } = require("./helpers");

const AXIOS_TIMEOUT_MS = 10_000;

function asEmail(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function asString(v) {
  return String(v || "").trim();
}

function axiosConfig() {
  return { timeout: AXIOS_TIMEOUT_MS, validateStatus: () => true };
}

/**
 * SIMPLIFIED REGISTER - Test version
 * Same logic but without session=null
 */
async function fbEmailRegisterV2(req, res) {
  const email = asEmail(req.body?.email);
  const password = asString(req.body?.password);
  if (!email || !password) throw httpError(400, "email and password are required");

  const API_KEY = req.app.locals.projectConfig?.firebase?.apiKey;
  if (!API_KEY) throw httpError(500, "firebase.apiKey missing from project config");

  try {
    console.log(`[AUTH-TEST-V2] Starting registration for ${email}`);

    // 1. Create Firebase account
    const signUpURL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const su = await axios.post(
      signUpURL,
      { email, password, returnSecureToken: true },
      axiosConfig()
    );

    if (su.status < 200 || su.status >= 300) {
      const err = new Error("Failed to create Firebase user");
      err.statusCode = su.status;
      err.payload = su.data;
      throw err;
    }

    const { localId: firebaseUid, idToken } = su.data || {};
    if (!firebaseUid || !idToken) throw httpError(502, "Invalid Firebase response");
    console.log(`[AUTH-TEST-V2] Firebase account created: ${firebaseUid}`);

    // 2. Send verification email (best effort - no await)
    const oobURL = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`;
    axios.post(oobURL, { requestType: "VERIFY_EMAIL", idToken }, axiosConfig()).catch(() => {});

    // 3. Create user in MongoDB
    const userData = {
      username: genUsernameFromEmail(email),
      email,
      password: genRandomPasswordHex(12),
      firebase_uuid: firebaseUid,
      emailVerified: false,
      accountStatus: "pending_verification",
      authProviders: { firebasePassword: true },
    };

    console.log(`[AUTH-TEST-V2] Creating user document...`);
    const user = await User.create(userData);
    console.log(`[AUTH-TEST-V2] User created with _id: ${user._id}`);

    // 4. Verify it was created
    const verifyFind = await User.findOne({ email });
    if (verifyFind) {
      console.log(`[AUTH-TEST-V2] ✅ Verified: user found in DB right after creation`);
    } else {
      console.log(`[AUTH-TEST-V2] ❌ ERROR: user NOT found after creation!`);
    }

    // 5. Return success
    return res.status(201).json({
      success: true,
      message: "User registered successfully (V2)",
      data: {
        user: {
          id: String(user._id),
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          firebase_uuid: user.firebase_uuid,
        },
      },
    });
  } catch (err) {
    const { status, message, code } = fbErrorToHttp(err, "Failed to create Firebase user");
    const e = httpError(status, message, {
      code,
      firebase: err?.payload || err?.response?.data || null,
    });
    e.code = code || e.code;
    throw e;
  }
}

/**
 * ULTRA-SIMPLIFIED REGISTER - No Firebase, pure MongoDB test
 */
async function simpleRegister(req, res) {
  const email = asEmail(req.body?.email);
  const password = asString(req.body?.password);
  if (!email || !password) throw httpError(400, "email and password are required");

  try {
    const mongoose = require("mongoose");
    const dbName = mongoose.connection.db.databaseName;
    const connState = mongoose.connection.readyState;

    console.log(`[SIMPLE-REGISTER] Database: ${dbName}, Connection state: ${connState}`);
    console.log(`[SIMPLE-REGISTER] Creating user for ${email}...`);

    const userData = {
      username: genUsernameFromEmail(email),
      email,
      password: genRandomPasswordHex(12),
      firebase_uuid: `simple-${Date.now()}`,
      emailVerified: false,
      accountStatus: "pending_verification",
      authProviders: { simple: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try direct MongoDB insert instead of Mongoose
    console.log(`[SIMPLE-REGISTER] Using direct MongoDB insertOne()...`);
    const db = mongoose.connection.db;
    const result = await db.collection("users").insertOne(userData);
    console.log(`[SIMPLE-REGISTER] ✅ Direct insert successful, insertedId: ${result.insertedId}`);

    // Verify with direct query
    const doc = await db.collection("users").findOne({ email });
    if (doc) {
      console.log(`[SIMPLE-REGISTER] ✅ Verified with direct find`);
    } else {
      console.log(`[SIMPLE-REGISTER] ❌ Direct find returned nothing`);
    }

    return res.status(201).json({
      success: true,
      message: "User registered (direct insert)",
      data: {
        user: {
          id: String(result.insertedId),
          email: email,
        },
      },
    });
  } catch (err) {
    console.error(`[SIMPLE-REGISTER] ERROR:`, err.message);
    throw httpError(500, err.message || "Registration failed", { error: err });
  }
}

module.exports = {
  fbEmailRegisterV2,
  simpleRegister,
};
