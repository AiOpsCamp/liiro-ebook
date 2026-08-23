// "use strict";

// const mongoose = require("mongoose");
// const User = require("../../models/User.model");

// // ✅ single source of truth for language mapping + catalog info
// const { mapLanguageToISO, mapLanguageToStored } = require("./lexiconLanguageService");

// /**
//  * NOTE (deprecation):
//  * - SRS + Lexicon controllers have moved to lexiconLanguageService.js (getUserLexiconLanguages/createLexiconScope)
//  * - Keep this file ONLY if other non-lexicon parts of the app still import it.
//  * - If nothing imports mapLanguageInput/getUserRuntimeContext anymore, you can delete this whole file.
//  */

// /**
//  * Compatibility function to mimic your old mapLanguageInput().
//  * Returns: { iso, name } or null
//  *
//  * ✅ iso  = canonical ISO (Map keys), e.g. "sv" or "zh-CN"
//  * ✅ name = the input as provided (for legacy callers)
//  *
//  * If no longer used anywhere, safe to remove.
//  */
// function mapLanguageInput(language) {
//   if (!language || typeof language !== "string") return null;
//   const normalized = language.trim();
//   const iso = mapLanguageToISO(normalized);
//   if (!iso) return null;

//   // Legacy: keep "name" as user input (do not force lowercase)
//   const name = normalized;
//   return { iso, name };
// }

// /**
//  * Internal helper: build the same object shape as getUserLexiconLanguages()
//  * but WITHOUT querying User again. Prevents double DB hits.
//  *
//  * If getUserRuntimeContext() is no longer used, this can be removed too.
//  */
// function buildUserLexiconLanguagesFromUserDoc(userDoc) {
//   const userLanguageRaw = userDoc?.lingoCampConfig?.userLanguage || "en";
//   const defaultLanguageRaw = userDoc?.lingoCampConfig?.defaultLanguage || "en";

//   const uiISO = mapLanguageToISO(userLanguageRaw) || "en";
//   const targetISO = mapLanguageToISO(defaultLanguageRaw) || "en";

//   const storedUI = mapLanguageToStored(uiISO) || "en";
//   const storedTarget = mapLanguageToStored(targetISO) || "en";

//   return {
//     userLanguageRaw,
//     defaultLanguageRaw,
//     uiISO,
//     targetISO,
//     storedUI,
//     storedTarget,

//     // These candidates are not used by current lexicon flow anymore.
//     // Kept only to preserve the historical shape described in comments.
//     storedUICandidates: [storedUI],
//     storedTargetCandidates: [storedTarget],
//   };
// }

// /**
//  * Request-scoped user context (read-only)
//  * Preserves return shape:
//  * {
//  *   userId,
//  *   languages: { default: {name, iso}, ui: {name, iso} },
//  *   languagePackId,
//  *   hasActiveSubscription
//  * }
//  *
//  * ⚠️ Lexicon/SRS should prefer:
//  * - getUserLexiconLanguages() + createLexiconScope() from lexiconLanguageService.js
//  *
//  * Keep this ONLY if other parts of the app still use it.
//  */
// async function getUserRuntimeContext(userId) {
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     throw new Error("Invalid user ID");
//   }

//   // Single query: lingoCampConfig + subscriptions
//   const user = await User.findById(userId)
//     .select("lingoCampConfig languagePackSubscriptions")
//     .populate({
//       path: "lingoCampConfig",
//       select: "defaultLanguage userLanguage languagePackId",
//       options: { lean: true },
//     })
//     .lean();

//   if (!user) throw new Error("User not found");

//   // ✅ build languages from the already-loaded user doc
//   const langs = buildUserLexiconLanguagesFromUserDoc(user);

//   const languagePackId = user?.lingoCampConfig?.languagePackId?.toString() || null;

//   // Subscription status based on languagePackSubscriptions.subscriptionEnd (unchanged)
//   let hasActiveSubscription = false;
//   if (languagePackId && Array.isArray(user.languagePackSubscriptions)) {
//     const now = Date.now();
//     hasActiveSubscription = user.languagePackSubscriptions.some((sub) => {
//       const subPackId = sub.languagePackId?.toString();
//       const end = sub.subscriptionEnd ? new Date(sub.subscriptionEnd).getTime() : 0;
//       return subPackId === languagePackId && end > now;
//     });
//   }

//   return {
//     userId: String(user._id),
//     languages: {
//       // Keep same semantics: "default" is target course language; "ui" is UI language
//       default: { name: langs.defaultLanguageRaw, iso: langs.targetISO },
//       ui: { name: langs.userLanguageRaw, iso: langs.uiISO },
//     },
//     languagePackId,
//     hasActiveSubscription,
//   };
// }

// module.exports = {
//   // If unused now, you can comment these out and remove all imports in codebase.
//   mapLanguageInput,
//   getUserRuntimeContext,

//   // If you want to keep the module but ensure nobody uses it accidentally,
//   // comment out exports above and export nothing:
//   // module.exports = {};
// };
