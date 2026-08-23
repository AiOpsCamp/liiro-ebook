/**
 * config/navigationRoutes.ts
 *
 * Single centralized configuration for Navbar/TabBar rendering visibility.
 * Add any route path or prefix here to cleanly hide or show the top/bottom navigation bar across the entire application.
 */

/**
 * Hub routes where the Navigation Bar MUST ALWAYS BE VISIBLE.
 */
export const ALWAYS_SHOW_NAVBAR_ROUTES: string[] = [
  "/",
  "/home",
  "/dashboard/main",
  "/exercises",
  "/exercises/all",
  "/lessons",
  "/explore",
  "/favorites",
  "/activity",
  "/groups",
  "/ebook",
  "/ebook/explore",
];

/**
 * List of deep practice/flow screen routes where the Navigation Bar should be HIDDEN.
 */
export const HIDDEN_NAVBAR_ROUTES: string[] = [
  "/exercises/reading-listening",
  "/exercises/writing",
  "/exercises/section",
  "/exercises/browse",
  "/exercises/module",
  "/modules/learning-modules",
  "/explore-by-query",
  "/category-view-all",
  "/terms-learned",
  "/dialogue/practice",
  "/checkout-verify",
  "/module-test",
  "/smart-learn",
  "/words/daily-challenge",
  "/words/start",
  "/words/modes",
  "/vocab/learn-mode",
  "/vocab/quick-review",
  "/vocab/game",
  "/onboarding",
  "/auth",
  "/login",
  "/register",
  "/pricing",
  "/paywall",
];

/**
 * Single helper function to determine whether the Navigation Bar (Desktop Top Navbar & Mobile Bottom TabBar)
 * should be SHOWN.
 * @param pathname Current path string (e.g., "/exercises", "/exercises/all", "/dashboard/main")
 * @returns boolean - true if Navbar should render, false if it should be hidden
 */
export function shouldShowNavbar(pathname: string): boolean {
  if (!pathname) return true;

  const path = String(pathname).toLowerCase().trim();

  // 1. Explicitly check if route is a main hub route that must always show the navbar
  const isAlwaysShown = ALWAYS_SHOW_NAVBAR_ROUTES.some((routePattern) => {
    const pattern = routePattern.toLowerCase().trim();
    if (pattern === "/" || pattern === "/home") {
      return path === "/" || path === "/home" || path === "";
    }
    return path === pattern || path === `${pattern}/`;
  });

  if (isAlwaysShown) {
    return true;
  }

  // 2. Match against explicit deep hidden route patterns
  const isHidden = HIDDEN_NAVBAR_ROUTES.some((routePattern) => {
    const pattern = routePattern.toLowerCase().trim();
    return (
      path === pattern ||
      path.startsWith(`${pattern}/`)
    );
  });

  return !isHidden;
}

export default shouldShowNavbar;
