/**
 * Generic Firebase Admin SDK Initializer
 * Dynamically initializes Firebase for any project based on configuration
 *
 * Usage:
 *   const admin = require('./firebaseAdmin')(firebaseConfig);
 *   await admin.auth().verifyIdToken(token);
 */

"use strict";

const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

/**
 * Initialize Firebase Admin SDK with project-specific configuration
 * @param {Object} firebaseConfig - Firebase configuration object
 * @returns {Object} Firebase admin instance
 */
function initFirebaseAdmin(firebaseConfig) {
  // If already initialized, return existing app
  if (admin.apps.length > 0) {
    return admin;
  }

  let serviceAccount = null;

  // Try loading from environment variable first
  if (firebaseConfig.serviceAccount.env && firebaseConfig.serviceAccount.env.trim()) {
    try {
      serviceAccount = JSON.parse(firebaseConfig.serviceAccount.env);

      // Fix escaped newlines in private key
      if (serviceAccount.private_key && serviceAccount.private_key.includes("\\n")) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }
    } catch (err) {
      throw new Error(`Invalid Firebase service account JSON for project: ${err.message}`);
    }
  } else if (firebaseConfig.serviceAccount.filePath) {
    // Try loading from file
    const filePath = firebaseConfig.serviceAccount.filePath;
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    if (fs.existsSync(absolutePath)) {
      try {
        serviceAccount = require(absolutePath);
      } catch (err) {
        throw new Error(
          `Failed to load Firebase service account from ${absolutePath}: ${err.message}`
        );
      }
    } else {
      console.warn(
        `[Firebase] Service account file not found at ${absolutePath}. ` +
          `Using environment variables instead.`
      );
    }
  }

  // If no service account found, throw error
  if (!serviceAccount) {
    throw new Error(
      `Firebase service account not configured. ` +
        `Set FIREBASE_SERVICE_ACCOUNT_JSON env var or provide service account file.`
    );
  }

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId || serviceAccount.project_id,
  });

  console.log(`[Firebase] ✅ Admin SDK initialized for project: ${firebaseConfig.projectId}`);

  return admin;
}

module.exports = initFirebaseAdmin;
