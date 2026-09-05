/**
 * Safely resolves localized strings or objects into a display string.
 * Handles strings, objects with language keys like `{ en: "..." }`, or fallbacks.
 */
export function getLocalizedText(val: any, fallback: string = "", targetLang: string = "en"): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    const s = val.trim();
    if (/^[0-9a-fA-F]{24}$/.test(s)) return fallback;
    return s;
  }
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (val.name && typeof val.name === "string" && !/^[0-9a-fA-F]{24}$/.test(val.name.trim())) return val.name.trim();
    if (val.title && typeof val.title === "string" && !/^[0-9a-fA-F]{24}$/.test(val.title.trim())) return val.title.trim();
    if (targetLang && typeof val[targetLang] === "string" && !/^[0-9a-fA-F]{24}$/.test(val[targetLang].trim())) return val[targetLang].trim();
    if (typeof val.en === "string" && !/^[0-9a-fA-F]{24}$/.test(val.en.trim())) return val.en.trim();
    const values = Object.values(val);
    for (const v of values) {
      if (typeof v === "string" && !/^[0-9a-fA-F]{24}$/.test(v.trim())) return v.trim();
    }
  }
  return fallback;
}
