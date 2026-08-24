"use strict";
/**
 * lexiconService.js (refined, drop-ready)
 *
 * UPDATE:
 * - Adds mapLanguageToNameKey(input) => canonical lowercase name (e.g., "finnish", "english")
 * - Adds uiNameKey + targetNameKey to createLexiconScope(langs)
 *
 * Backwards compatibility:
 * - NO existing export removed/renamed
 * - NO existing return shapes changed (only additive fields)
 * - Existing behavior preserved
 */

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const User = require("../../models/User.model");
const LexiconPack = require("../../models/lexicon/LexiconPack.model");
const LexiconTerm = require("../../models/lexicon/LexiconTerm.model");
const LexiconProgress = require("../../models/lexicon/LexiconProgress.model");
const RevenueCatAccount = require("../../models/RevenueCatAccount.model");
const { escapeRegex, getLocalizedField } = require("./pack.helpers");

/* ───────────────────────── Catalog loading (no redis cache) ───────────────────────── */
const CATALOG_PATH = path.join(__dirname, "languageCatalog.json");

function loadLanguageCatalogFromDisk() {
  let raw;
  try {
    raw = fs.readFileSync(CATALOG_PATH, "utf8");
  } catch (e) {
    throw new Error(`Failed to read languageCatalog.json at ${CATALOG_PATH}: ${e.message}`);
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(`languageCatalog.json is not valid JSON: ${e.message}`);
  }

  if (!json || !Array.isArray(json.languages)) {
    throw new Error("languageCatalog.json is invalid: missing 'languages' array");
  }

  return json.languages;
}

let _CATALOG = null;
let _INDEX = null;

function normalizeToken(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/_/g, "-");
}
function normalizeLookupKey(input) {
  return normalizeToken(input).toLowerCase();
}
function normalizeLang(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

/* ───────────────────────── Helpers: IDs ───────────────────────── */
function extractUserIdLike(input) {
  if (!input) return null;

  if (typeof input === "object") {
    const cand = input._id ?? input.id ?? null;
    if (cand && mongoose.isValidObjectId(cand)) return String(cand);
  }

  if (typeof input === "string" && mongoose.isValidObjectId(input)) {
    return input;
  }

  try {
    const s = String(input);
    if (mongoose.isValidObjectId(s)) return s;
  } catch {
    // ignore
  }
  return null;
}

/* ───────────────────────── Language index ───────────────────────── */
function buildIndex(catalog) {
  const byKey = new Map();

  for (const lang of catalog) {
    if (!lang?.iso) continue;

    const iso = String(lang.iso); // canonical ISO key for multilingual maps
    const stored = String(lang.stored || iso).toLowerCase(); // stored in languages/progress.language
    const name = String(lang.name || iso); // display name, e.g. "Finnish"
    const aliases = Array.isArray(lang.aliases) ? lang.aliases : [];

    const entry = {
      iso,
      stored,
      name,
      aliases: aliases.map((a) => String(a)),
    };

    // index: iso + stored + aliases + name
    byKey.set(normalizeLookupKey(iso), entry);
    byKey.set(normalizeLookupKey(stored), entry);

    // ✅ NEW: index by name as well (helps resolving "Finnish" / "English")
    byKey.set(normalizeLookupKey(name), entry);

    for (const a of aliases) {
      const k = normalizeLookupKey(a);
      if (k) byKey.set(k, entry);
    }
  }

  return { byKey };
}

function ensureCatalogLoaded() {
  if (_CATALOG && _INDEX) return;
  const catalog = loadLanguageCatalogFromDisk();
  _CATALOG = catalog;
  _INDEX = buildIndex(catalog);
}

function getCatalog() {
  ensureCatalogLoaded();
  return _CATALOG;
}

function getIndex() {
  ensureCatalogLoaded();
  return _INDEX;
}

/**
 * Map input (name/code/alias) -> canonical ISO (for multilingual Map keys)
 * Returns undefined if unknown.
 */
function mapLanguageToISO(input) {
  const k = normalizeLookupKey(input);
  if (!k) return undefined;
  return getIndex().byKey.get(k)?.iso;
}

/**
 * Map input (name/code/alias) -> stored lowercase code for DB fields like languages/progress.language
 * Returns undefined if unknown.
 */
function mapLanguageToStored(input) {
  const k = normalizeLookupKey(input);
  if (!k) return undefined;
  return getIndex().byKey.get(k)?.stored;
}

/**
 * ✅ NEW (additive): Map input (name/code/alias) -> canonical lowercase name key.
 * Example:
 *   "Finnish" -> "finnish"
 *   "fi" -> "finnish"
 *   "english" -> "english"
 *
 * Returns undefined if unknown.
 */
function mapLanguageToNameKey(input) {
  const k = normalizeLookupKey(input);
  if (!k) return undefined;
  const hit = getIndex().byKey.get(k);
  if (!hit?.name) return undefined;
  return String(hit.name).trim().toLowerCase();
}

/**
 * Candidates for matching stored languages (supports aliases).
 */
function storedLanguageCandidates(input) {
  const k = normalizeLookupKey(input);
  if (!k) return [];
  const hit = getIndex().byKey.get(k);
  if (!hit) return [];
  const out = new Set([hit.stored]);
  for (const a of hit.aliases || []) {
    const ak = normalizeLookupKey(a);
    if (ak) out.add(ak);
  }
  return Array.from(out);
}

async function getUserLexiconLanguages(reqOrUserId, preFetchedUser = null) {
  let user = preFetchedUser;
  let req = null;
  let userId = reqOrUserId;

  if (reqOrUserId && typeof reqOrUserId === "object") {
    if (reqOrUserId.headers || reqOrUserId.query || reqOrUserId.user) {
      req = reqOrUserId;
      userId = req.user?._id || req.user?.id || req.userId || reqOrUserId;
    }
  }

  if (!user && userId && typeof userId === "object" && userId.lingoCampConfig) {
    user = userId;
  }

  if (!user && userId) {
    const id = extractUserIdLike(userId);
    if (id) {
      user = await User.findById(id)
        .select("lingoCampConfig")
        .populate({
          path: "lingoCampConfig",
          select: "defaultLanguage userLanguage",
          options: { lean: true },
        })
        .lean();
    }
  }

  // Allow explicit query parameter or header overrides (e.g. ?userLanguage=bn or ?lang=bn or Header x-user-language: bn)
  const queryUserLang =
    req?.query?.userLanguage ||
    req?.query?.user_language ||
    req?.query?.lang ||
    req?.headers?.["x-user-language"];

  const queryTargetLang =
    req?.query?.targetLanguage ||
    req?.query?.default_language ||
    req?.query?.target ||
    req?.headers?.["x-target-language"];

  const userLanguageRaw = queryUserLang || user?.lingoCampConfig?.userLanguage || "en";
  const defaultLanguageRaw = queryTargetLang || user?.lingoCampConfig?.defaultLanguage || "fi";

  // Map with fallback to English if language not found
  let uiISO = mapLanguageToISO(userLanguageRaw);
  if (!uiISO) {
    console.warn(`[LANGUAGE_MAP] Unknown userLanguage: ${userLanguageRaw}, defaulting to en`);
    uiISO = "en";
  }

  let targetISO = mapLanguageToISO(defaultLanguageRaw);
  if (!targetISO) {
    console.warn(`[LANGUAGE_MAP] Unknown defaultLanguage: ${defaultLanguageRaw}, defaulting to en`);
    targetISO = "en";
  }

  // Map stored values with fallback
  let storedUI = mapLanguageToStored(uiISO);
  if (!storedUI) {
    console.warn(`[LANGUAGE_MAP] Cannot map UI language ${uiISO} to stored, using en`);
    storedUI = "en";
  }

  let storedTarget = mapLanguageToStored(targetISO);
  if (!storedTarget) {
    console.warn(`[LANGUAGE_MAP] Cannot map target language ${targetISO} to stored, using en`);
    storedTarget = "en";
  }

  return {
    userLanguageRaw,
    defaultLanguageRaw,
    uiISO,
    targetISO,
    storedUI,
    storedTarget,
    storedUICandidates: storedLanguageCandidates(uiISO),
    storedTargetCandidates: storedLanguageCandidates(targetISO),
  };
}

// Backwards compatible wrappers (unchanged)
async function getUserLanguage(userId) {
  const langs = await getUserLexiconLanguages(userId);
  return langs.userLanguageRaw || "en";
}
async function getUserDefaultLanguage(userId) {
  const langs = await getUserLexiconLanguages(userId);
  return langs.defaultLanguageRaw || "en";
}

/* ───────────────────────── Lexicon Scope (MERGED) ───────────────────────── */
function createLexiconScope(langs) {
  const uiISO = langs?.uiISO || "en";
  const targetISO = langs?.targetISO || "en";
  let storedUI = normalizeLang(langs?.storedUI) || "en";
  let storedTarget = normalizeLang(langs?.storedTarget) || "en";

  // Final validation: if still null/undefined, use "en" as absolute fallback
  if (!storedUI) {
    console.warn("[LEXICON_SCOPE] storedUI missing or invalid, defaulting to en");
    storedUI = "en";
  }
  if (!storedTarget) {
    console.warn("[LEXICON_SCOPE] storedTarget missing or invalid, defaulting to en");
    storedTarget = "en";
  }

  const langKeys = [targetISO, uiISO, "en", "english"].filter(Boolean);

  const packPairMatch = { languages: { $all: [storedTarget, storedUI] } };

  const enrollmentBase = (userId) => ({ user: userId, language: storedTarget });
  const progressBase = (userId) => ({ user: userId, language: storedTarget });
  const termProgressBase = (userId) => ({ user: userId, language: storedTarget });

  const localizeField = (mapOrObj, defaultValue = null) =>
    getLocalizedField(mapOrObj, uiISO, targetISO, defaultValue);

  const localizeMaybeMap = (v, defaultValue = null) => {
    if (!v) return defaultValue;
    if (typeof v === "string") return v;
    return localizeField(v, defaultValue);
  };

  // ✅ NEW additive fields (safe): used by exercises to pick name-keyed maps (audio_url)
  const uiNameKey =
    mapLanguageToNameKey(uiISO) || mapLanguageToNameKey(langs?.userLanguageRaw) || null;

  const targetNameKey =
    mapLanguageToNameKey(targetISO) || mapLanguageToNameKey(langs?.defaultLanguageRaw) || null;

  return {
    uiISO,
    targetISO,
    storedUI,
    storedTarget,
    langKeys,
    packPairMatch,
    enrollmentBase,
    progressBase,
    termProgressBase,
    localizeField,
    localizeMaybeMap,

    // ✅ additive
    uiNameKey,
    targetNameKey,
  };
}

/* ───────────────────────── Access helper ───────────────────────── */
async function determineAccessForUser(userId, lexiconPack) {
  const free = !!lexiconPack?.free_access;
  const normalizedUserId = extractUserIdLike(userId);
  if (!normalizedUserId) return { free, premium: false };

  try {
    const user = await User.findById(normalizedUserId)
      .select("role isPremium hasYearlySubscription subscriptionExpirationDate subscription revenueCat")
      .populate([{ path: "revenueCat", select: "langowordSubscription", options: { lean: true } }])
      .lean();

    // 1. Direct user model indicators (Admin / Premium user role / Stripe / Manual override / Legacy)
    if (
      user?.role === "admin" ||
      user?.role === "premiumUser" ||
      user?.isPremium === true ||
      (user?.subscription && (user.subscription.isPremium || user.subscription.isActive)) ||
      (user?.hasYearlySubscription && user?.subscriptionExpirationDate && new Date(user.subscriptionExpirationDate) > new Date())
    ) {
      return { free, premium: true };
    }

    // 2. Active Stripe LanguagePackSubscription check
    try {
      const LanguagePackSubscription = require("../../models/LanguagePackSubscription");
      const activeStripeSub = await LanguagePackSubscription.findOne({
        userId: normalizedUserId,
        status: { $in: ["active", "trialing"] },
      }).lean();

      if (activeStripeSub) {
        return { free, premium: true };
      }
    } catch {}

    // 3. RevenueCat Subscription check (Mobile IAP)
    let snapshot = user?.revenueCat?.langowordSubscription;

    if (!snapshot) {
      const rcAcc = await RevenueCatAccount.findOne(
        { mongo_user_id: String(normalizedUserId) },
        { langowordSubscription: 1 }
      ).lean();
      snapshot = rcAcc?.langowordSubscription || null;
    }

    if (!snapshot) return { free, premium: false };

    // Enforce expiry alongside the stored `active` flag — a missed webhook
    // (or a not-yet-synced lapse) must not keep a lapsed subscription premium.
    // Null expiresDate = lifetime/non-expiring entitlement.
    const notExpired =
      !snapshot.expiresDate || new Date(snapshot.expiresDate).getTime() > Date.now();
    let premium = !!snapshot.active && notExpired;

    if (
      premium &&
      Array.isArray(lexiconPack?.requiredEntitlementIds) &&
      lexiconPack.requiredEntitlementIds.length
    ) {
      const entSet = new Set(snapshot.entitlementIds || []);
      premium = lexiconPack.requiredEntitlementIds.every((id) => entSet.has(id));
    }

    if (
      premium &&
      Array.isArray(lexiconPack?.allowedProductIdentifiers) &&
      lexiconPack.allowedProductIdentifiers.length
    ) {
      premium =
        !!snapshot.productIdentifier &&
        lexiconPack.allowedProductIdentifiers.includes(snapshot.productIdentifier);
    }

    return { free, premium };
  } catch (err) {
    console.error("determineAccessForUser error:", err);
    return { free, premium: false };
  }
}

/* ───────────────────────── Term helpers ───────────────────────── */
async function getTermObjectId(termIdentifier) {
  if (mongoose.Types.ObjectId.isValid(termIdentifier)) return termIdentifier;

  const termString = String(termIdentifier || "")
    .trim()
    .toLowerCase();
  const termDoc = await LexiconTerm.findOne({
    "term.en": new RegExp(`^${escapeRegex(termString)}$`, "i"),
  }).lean();

  if (!termDoc) throw new Error(`Term '${termString}' not found in LexiconTerm collection.`);
  return termDoc._id.toString();
}

function generateSlug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

function constructUrl(base, p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  return `${base}${encodeURIComponent(String(p).replace(/\s+/g, "-"))}`;
}

/* ───────────────────────── Translation updaters ───────────────────────── */
function updateFieldWithTranslations(fieldObject, translations, allLanguages, mapLanguageFn) {
  if (!translations || typeof translations !== "object") return;
  for (const [lang, value] of Object.entries(translations)) {
    const iso = (mapLanguageFn || mapLanguageToISO)(lang);
    const v = typeof value === "string" ? value.trim() : "";
    if (!iso || !v) continue;
    fieldObject.set(iso, v);
    if (allLanguages) {
      const stored = mapLanguageToStored(iso);
      if (stored) allLanguages.add(stored);
    }
  }
}

function updateFieldWithTranslationsInPack(fieldObject, translations, allLanguages, mapLanguageFn) {
  if (!translations || typeof translations !== "object") return;
  for (const [lang, value] of Object.entries(translations)) {
    const iso = (mapLanguageFn || mapLanguageToISO)(lang);
    const v = typeof value === "string" ? value.trim() : "";
    if (!iso || !v) continue;
    const prev = fieldObject.get(iso) || "";
    if (prev !== v) fieldObject.set(iso, v);
    if (allLanguages) {
      const stored = mapLanguageToStored(iso);
      if (stored) allLanguages.add(stored);
    }
  }
}

/* ───────────────────────── Progress updater ───────────────────────── */
async function updateTermProgressField(req, res, fieldName, fieldValue) {
  try {
    const { idOrSlug, term } = req.params;
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const languageInput = req.body.language || (await getUserDefaultLanguage(userId));
    const iso = mapLanguageToISO(languageInput);
    if (!iso) return res.status(400).json({ error: "Language is not supported" });

    const language = mapLanguageToStored(iso);
    if (!language) return res.status(400).json({ error: "Language is not supported" });

    let lexiconPack;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      lexiconPack = await LexiconPack.findById(idOrSlug).lean();
    } else {
      lexiconPack = await LexiconPack.findOne({
        slug: new RegExp(`^${escapeRegex(idOrSlug)}$`, "i"),
      }).lean();
    }
    if (!lexiconPack) return res.status(404).json({ error: "Lexicon pack not found" });

    let termObjectId;
    try {
      termObjectId = await getTermObjectId(term);
    } catch {
      return res.status(404).json({ error: "Term not found" });
    }

    const termExists = (lexiconPack.terms || []).some((t) => String(t) === String(termObjectId));
    if (!termExists) {
      return res.status(404).json({ error: "Term not found in the specified lexicon pack" });
    }

    const lexiconProgress = await LexiconProgress.findOne({
      user: userId,
      lexiconPack: lexiconPack._id,
      language,
    });

    if (!lexiconProgress) {
      return res.status(404).json({
        error: "Lexicon progress not found. Please enroll in the lexicon pack first.",
      });
    }

    const idx = (lexiconProgress.terms || []).findIndex(
      (p) => String(p.term) === String(termObjectId)
    );
    if (idx === -1) return res.status(404).json({ error: "Term progress not found" });

    const current = lexiconProgress.terms[idx];

    if (typeof fieldValue === "function") {
      const newValue = fieldValue(current[fieldName]);
      if (fieldName === "confidence" && typeof newValue !== "number") {
        return res.status(400).json({ error: "Invalid operation for confidence field." });
      }
      current[fieldName] = newValue;
    } else {
      current[fieldName] = fieldValue;
    }

    lexiconProgress.terms[idx] = current;
    await lexiconProgress.save();

    return res.status(200).json({ message: `Term ${fieldName} updated`, termProgress: current });
  } catch (error) {
    console.error(`Error updating term ${fieldName}:`, error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}

/* ───────────────────────── Exports ───────────────────────── */
module.exports = {
  // Recommended API
  getUserLexiconLanguages,
  createLexiconScope,

  // Compatibility
  getUserDefaultLanguage,
  getUserLanguage,

  // Language mapping
  mapLanguageToISO,
  mapLanguageToStored,
  storedLanguageCandidates,

  // ✅ NEW additive export (safe)
  mapLanguageToNameKey,

  // Access helper
  determineAccessForUser,
  extractUserIdLike,

  // Term helpers
  getTermObjectId,
  generateSlug,
  constructUrl,

  // Translation updaters
  updateFieldWithTranslations,
  updateFieldWithTranslationsInPack,

  // Progress updater
  updateTermProgressField,

  // Diagnostics
  _LANGUAGE_CATALOG_COUNT: (() => {
    try {
      return getCatalog().length;
    } catch {
      return 0;
    }
  })(),
};
