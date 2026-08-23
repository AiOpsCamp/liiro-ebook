const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(stripeKey);
const { httpError } = require("../../../shared/helpers/http");

function asEmail(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function normalizeStripeCustomerInfo(customer) {
  return {
    id: customer.id,
    email: customer.email || null,
    name: customer.name || null,
    invoicePrefix: customer.invoice_prefix || null,
    livemode: !!customer.livemode,
    hasProfile: true,
  };
}

async function persistStripeInfo(user, stripeCustomer) {
  user.stripeCustomerInfo = normalizeStripeCustomerInfo(stripeCustomer);
  user.markModified("stripeCustomerInfo");
  await user.save({ validateBeforeSave: false });
  return user.stripeCustomerInfo.id;
}

async function clearStripeInfo(user) {
  user.stripeCustomerInfo = undefined; // matches schema default
  user.markModified("stripeCustomerInfo");
  await user.save({ validateBeforeSave: false });
}

async function retrieveStripeCustomerSafe(customerId) {
  try {
    const c = await stripe.customers.retrieve(customerId);
    if (!c || c.deleted) return null;
    return c;
  } catch (err) {
    // Stripe uses code=resource_missing when ID not found
    const code = err?.code || err?.raw?.code;
    if (code === "resource_missing") return null;
    throw err;
  }
}

async function createStripeCustomerForUser(user) {
  const email = asEmail(user.email);

  const created = await stripe.customers.create({
    email,
    name:
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      user.username ||
      undefined,
    metadata: {
      userId: String(user._id),
      mongoUserId: String(user._id), // redundant but convenient
    },
  });

  return persistStripeInfo(user, created);
}

/**
 * Ensure the Mongo user is linked to a Stripe customer.
 * Cross-check logic:
 * - If Mongo has stripeCustomerInfo.id:
 *    - retrieve from Stripe
 *    - if missing/deleted -> clear + create new
 *    - if email mismatch -> clear + create new
 *    - (optional) if metadata.userId mismatch -> clear + create new
 *    - else sync Mongo stripeCustomerInfo from Stripe
 * - else:
 *    - try list by email
 *      - if found but metadata mismatch (optional) -> create new
 *      - else attach found
 *    - else create new
 *
 * Options:
 * - enforceMetadataUserIdMatch: boolean (default false)
 */
async function ensureStripeCustomerForUser(user, opts = {}) {
  const { enforceMetadataUserIdMatch = false } = opts;

  if (!process.env.STRIPE_SECRET_KEY) throw httpError(500, "STRIPE_SECRET_KEY missing");
  if (!user?._id) throw httpError(500, "ensureStripeCustomerForUser: user missing");
  if (!user.email) throw httpError(400, "User email missing (cannot create Stripe customer)");

  const userEmail = asEmail(user.email);
  const existingId = user.stripeCustomerInfo?.id;

  // 1) If we have an ID stored, validate it
  if (existingId) {
    const stripeCustomer = await retrieveStripeCustomerSafe(existingId);

    if (!stripeCustomer) {
      await clearStripeInfo(user);
      return createStripeCustomerForUser(user);
    }

    const stripeEmail = asEmail(stripeCustomer.email);

    // If Stripe has no email set, treat as mismatch and recreate (safer)
    if (!stripeEmail || stripeEmail !== userEmail) {
      await clearStripeInfo(user);
      return createStripeCustomerForUser(user);
    }

    if (enforceMetadataUserIdMatch) {
      const metaUserId =
        stripeCustomer.metadata?.userId || stripeCustomer.metadata?.mongoUserId || null;
      if (metaUserId && String(metaUserId) !== String(user._id)) {
        await clearStripeInfo(user);
        return createStripeCustomerForUser(user);
      }
    }

    // Valid -> sync Mongo from Stripe (keeps invoicePrefix/livemode fresh)
    return persistStripeInfo(user, stripeCustomer);
  }

  // 2) No stored ID -> try to find by email
  const list = await stripe.customers.list({ email: userEmail, limit: 1 });
  const found = list.data?.[0] || null;

  if (found && !found.deleted) {
    // Optional metadata enforcement
    if (enforceMetadataUserIdMatch) {
      const metaUserId = found.metadata?.userId || found.metadata?.mongoUserId || null;
      if (metaUserId && String(metaUserId) !== String(user._id)) {
        // Found a Stripe customer with same email but linked to another user => create fresh
        return createStripeCustomerForUser(user);
      }
    }

    return persistStripeInfo(user, found);
  }

  // 3) Create new
  return createStripeCustomerForUser(user);
}

module.exports = { ensureStripeCustomerForUser };
