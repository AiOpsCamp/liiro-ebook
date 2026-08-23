"use strict";

const { initializeApp, getApps, cert } = require("firebase-admin/app");

function initLiiroFirebaseAdmin() {
  if (getApps().length > 0) return true;

  const raw = process.env.LIIRO_FIREBASE_SERVICE_ACCOUNT_JSON || process.env.LANGOWORDS_FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim()) {
    try {
      const serviceAccount = JSON.parse(raw);
      if (serviceAccount.private_key && serviceAccount.private_key.includes("\\n")) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }
      initializeApp({
        credential: cert(serviceAccount),
        projectId: "liiro-ebook",
      });
      return true;
    } catch (_) {
      // Fall through to project-only initialization
    }
  }

  initializeApp({
    projectId: "liiro-ebook",
  });

  return true;
}

module.exports = initLiiroFirebaseAdmin();
