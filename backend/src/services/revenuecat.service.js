"use strict";

const axios = require("axios");

const AXIOS_TIMEOUT_MS = 10_000;

function rcAxiosConfig() {
  const key = process.env.REVENUECAT_API_KEY;
  if (!key) {
    const e = new Error("REVENUECAT_API_KEY missing");
    e.status = 500;
    throw e;
  }
  return {
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    timeout: AXIOS_TIMEOUT_MS,
    validateStatus: () => true,
  };
}

function rcAppUserIdFromUser(user) {
  if (!user?._id) {
    const e = new Error("rcAppUserIdFromUser: user._id is required");
    e.status = 500;
    throw e;
  }
  return String(user._id);
}

function normalizeEmail(email) {
  const v = String(email || "")
    .trim()
    .toLowerCase();
  return v || null;
}

async function fetchSubscriber(app_user_id) {
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(app_user_id)}`;
  const resp = await axios.get(url, rcAxiosConfig());

  if (resp.status < 200 || resp.status >= 300) {
    const err = new Error(`RevenueCat fetch subscriber failed (${resp.status})`);
    err.status = resp.status;
    err.payload = resp.data;
    throw err;
  }

  if (!resp.data || typeof resp.data !== "object" || !resp.data.subscriber) {
    const err = new Error("Invalid RevenueCat response (no subscriber).");
    err.status = 502;
    err.payload = resp.data;
    throw err;
  }

  return resp.data;
}

/**
 * CREATE/ENSURE subscriber exists
 * POST /v1/subscribers/{app_user_id}
 */
async function createSubscriber(app_user_id) {
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(app_user_id)}`;
  const resp = await axios.post(url, {}, rcAxiosConfig());

  if (resp.status < 200 || resp.status >= 300) {
    const err = new Error(`RevenueCat create subscriber failed (${resp.status})`);
    err.status = resp.status;
    err.payload = resp.data;
    throw err;
  }

  console.log(
    `[RevenueCat] ✅ Subscriber created/ensured app_user_id=${app_user_id} status=${resp.status}`
  );
  return resp.data;
}

/**
 * Set attributes after subscriber exists.
 * POST /v1/subscribers/{app_user_id}/attributes
 */
async function setSubscriberAttributes(
  app_user_id,
  subscriber_attributes,
  { retries = 2, delayMs = 800 } = {}
) {
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(
    app_user_id
  )}/attributes`;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await axios.post(
        url,
        { attributes: subscriber_attributes },
        rcAxiosConfig()
      );
      if (resp.status < 200 || resp.status >= 300) {
        const err = new Error(`RevenueCat set attributes failed (${resp.status})`);
        err.status = resp.status;
        err.payload = resp.data;
        throw err;
      }
      console.log(`[RevenueCat] ✅ Attributes updated app_user_id=${app_user_id}`);
      return resp.data;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

/**
 * Grant or update a promotional entitlement in RevenueCat.
 * Used when a Stripe subscription is created/renewed so mobile RC SDK sees it.
 * https://www.revenuecat.com/docs/api-v1#tag/Entitlements/operation/grant-a-promotional-entitlement
 */
async function grantRevenueCatEntitlement(appUserId, entitlementIdentifier, { expires_at = null } = {}) {
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementIdentifier)}/promotional`;
  const body = {
    duration: "custom",
    start_time_ms: Date.now(),
  };
  if (expires_at !== null) {
    body.end_time_ms = expires_at * 1000;
  }
  const resp = await axios.post(url, body, rcAxiosConfig());
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`RC grant entitlement failed (${resp.status})`);
  }
  return resp.data;
}

async function revokeRevenueCatEntitlement(appUserId, entitlementIdentifier) {
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementIdentifier)}/revoke_promotionals`;
  const resp = await axios.post(url, {}, rcAxiosConfig());
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`RC revoke entitlement failed (${resp.status})`);
  }
  return resp.data;
}

/**
 * Ensures RC subscriber exists and keeps email updated.
 * Returns { app_user_id, rcData }
 */
async function ensureRevenueCatCustomerForUser(user) {
  const app_user_id = rcAppUserIdFromUser(user);
  const email = normalizeEmail(user.email);

  const attributes = {
    mongo_user_id: { value: String(user._id) },

    // ✅ RevenueCat reserved attribute (official)
    $email: email ? { value: email } : undefined,

    // ✅ ALSO store as a normal attribute for easier visibility/search in dashboard
    email: email ? { value: email } : undefined,

    firebase_uuid: user.firebase_uuid ? { value: String(user.firebase_uuid) } : undefined,
    username: user.username ? { value: String(user.username) } : undefined,
  };

  // Remove undefined keys
  Object.keys(attributes).forEach((k) => attributes[k] === undefined && delete attributes[k]);

  // 1) Ensure subscriber exists
  await createSubscriber(app_user_id);

  // 2) Update attributes (including email)
  await setSubscriberAttributes(app_user_id, attributes);

  // 3) Fetch snapshot
  const rcData = await fetchSubscriber(app_user_id);

  console.log(
    `[RevenueCat] ✅ Subscriber ready app_user_id=${app_user_id} email=${email || "null"} request_date_ms=${
      rcData?.request_date_ms
    }`
  );

  return { app_user_id, rcData };
}

/**
 * Best-effort wrapper for login/register (won't break auth).
 */
async function ensureRevenueCatCustomerBestEffort(user, context = "unknown") {
  try {
    const { app_user_id } = await ensureRevenueCatCustomerForUser(user);
    console.log(`[RevenueCat] ✅ ensured app_user_id=${app_user_id} (${context})`);
    return { ok: true, app_user_id };
  } catch (err) {
    console.error(
      `[RevenueCat] ❌ ensure failed (${context}) status=${err?.status || "?"} message=${err?.message || err}`
    );
    if (err?.payload) {
      console.error("[RevenueCat] payload:", JSON.stringify(err.payload));
    }
    return { ok: false, error: err?.message || String(err) };
  }
}

module.exports = {
  ensureRevenueCatCustomerForUser,
  ensureRevenueCatCustomerBestEffort, // ✅ add this export
  createSubscriber,
  setSubscriberAttributes,
  fetchSubscriber,
  rcAppUserIdFromUser,
  grantRevenueCatEntitlement,
  revokeRevenueCatEntitlement,
};
