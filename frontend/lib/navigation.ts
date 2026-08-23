import { router } from "expo-router";
import { Platform } from "react-native";

/**
 * Safely navigates back to the previous screen.
 * If no history stack exists (e.g., direct link, page refresh, external bookmark),
 * falls back cleanly to the provided fallbackUrl or a smart contextual default route.
 */
export function safeGoBack(fallbackUrl?: string, customRouter?: any) {
  const r = customRouter || router;

  let canGo = false;
  try {
    canGo = Boolean(r.canGoBack && r.canGoBack());
  } catch (_) {}

  if (canGo) {
    try {
      r.back();
      return;
    } catch (_) {}
  }

  // Contextual default fallback if no explicit fallback URL was passed
  let targetFallback = fallbackUrl;
  if (!targetFallback) {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const pathname = window.location.pathname || "";
      if (pathname.includes("/exercises")) {
        targetFallback = "/exercises/all";
      } else if (pathname.includes("/lessons")) {
        targetFallback = "/lessons/level/A1";
      } else if (pathname.includes("/courses")) {
        targetFallback = "/courses";
      } else if (pathname.includes("/words")) {
        targetFallback = "/dashboard/main";
      } else {
        targetFallback = "/dashboard/main";
      }
    } else {
      targetFallback = "/dashboard/main";
    }
  }

  try {
    r.push(targetFallback);
  } catch (_) {
    try {
      r.replace(targetFallback);
    } catch (_) {}
  }
}
