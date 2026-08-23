export function getGlobalModeTitle(mode?: string): string {
  if (!mode) return "Smart Review";
  const m = mode.toLowerCase();
  switch (m) {
    case "mix":
      return "Smart Review";
    case "hard":
      return "Challenge Mode";
    case "medium":
      return "Building Fluency";
    case "easy":
      return "Confidence Boost";
    case "favorites":
      return "Your Favorites";
    case "due":
      return "Due for Review";
    case "marked":
      return "Marked Terms";
    case "new":
      return "New Terms";
    case "learned":
      return "Learned Terms";
    case "partial":
      return "In Progress";
    case "recent_mistakes":
      return "Fix Mistakes";
    case "focus_reset":
      return "Catch Up";
    default:
      return mode
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
