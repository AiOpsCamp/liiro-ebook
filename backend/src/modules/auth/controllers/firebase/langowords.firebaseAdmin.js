"use strict";
const path = require("path");
const admin = require("firebase-admin");

function initFirebaseAdmin() {
  const apps = typeof admin.getApps === "function" ? admin.getApps() : admin.apps || [];
  if (apps.length) return admin;

  const raw = process.env.LANGOWORDS_FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim()) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
      if (serviceAccount.private_key && serviceAccount.private_key.includes("\\n")) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }
    } catch (__err) {
      throw new Error("LANGOWORDS_FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    return admin;
  }

  const serviceAccountPath = path.join(
    __dirname,
    "langowords-firebase-adminsdk-fbsvc-265d7836ba.json"
  );

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || "langowords",
  });

  return admin;
}

module.exports = initFirebaseAdmin();
