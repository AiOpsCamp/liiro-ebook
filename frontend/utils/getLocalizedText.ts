/**
 * Safely resolves localized strings or objects into a display string.
 * Handles strings, objects with language keys like `{ en: "..." }`, or fallbacks.
 */
export function getLocalizedText(val: any, fallback: string = "", targetLang: string = "en"): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (targetLang && typeof val[targetLang] === "string") return val[targetLang];
    if (typeof val.en === "string") return val.en;
    const values = Object.values(val);
    if (values.length > 0 && typeof values[0] === "string") {
      return values[0];
    }
  }
  return fallback;
}
