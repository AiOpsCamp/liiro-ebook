import { getCurrentEnvironment, Environment } from "./environments";

export interface AuthTheme {
  /* Backgrounds */
  bg: string;
  bgSubtle: string;
  card: string;
  cardShadow: string;

  /* Borders & Dividers */
  cardBorder: string;
  dividerColor: string;
  inputBorder: string;
  inputBorderFocus: string;

  /* Input */
  inputBg: string;
  inputBgFocus: string;

  /* Accent colors (brand) */
  accent: string;
  accentDark: string;
  accentLight: string;
  accentSoft: string;       // very subtle accent tint for badges/chips

  /**
   * Optional accessible accent variants — introduced for WCAG AA text/border
   * contrast on the `liiro` brand. Falls back to `accentDark` at call sites
   * when omitted, so the other six environments are unaffected.
   */
  accentText?: string;      // darker accent safe for small text/links on light bg (>=4.5:1)
  accentDeep?: string;      // deepest accent, safe as the dark stop of button gradients

  /* Text */
  textPrimary: string;      // main headings & body (dark on light)
  textSecondary: string;    // subtitles, descriptions
  textMuted: string;        // placeholder-level muted text
  textOnAccent: string;     // text on accent-colored buttons

  /* Gradient accents */
  gradientTop: [string, string];
  gradientBottom: [string, string];

  /* Social button */
  socialBtnBg: string;
  socialBtnBorder: string;
  socialBtnText: string;
}

const THEMES: Record<Environment, AuthTheme> = {
  langowords: {
    bg: "#FAFAFF",
    bgSubtle: "#F5F3FF",
    card: "#FFFFFF",
    cardShadow: "rgba(124, 58, 237, 0.06)",
    cardBorder: "rgba(124, 58, 237, 0.06)",
    dividerColor: "#F1F0F7",
    inputBg: "#F8F7FC",
    inputBgFocus: "#FFFFFF",
    inputBorder: "#E8E5F0",
    inputBorderFocus: "#7C3AED",
    accent: "#7C3AED",
    accentDark: "#6D28D9",
    accentLight: "#8B5CF6",
    accentSoft: "rgba(124, 58, 237, 0.06)",
    textPrimary: "#1E1B4B",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    textOnAccent: "#FFFFFF",
    gradientTop: ["rgba(124, 58, 237, 0.04)", "transparent"],
    gradientBottom: ["transparent", "rgba(124, 58, 237, 0.02)"],
    socialBtnBg: "#FFFFFF",
    socialBtnBorder: "#E5E7EB",
    socialBtnText: "#374151",
  },
  langoprep: {
    bg: "#FFFCF8",
    bgSubtle: "#FFF7ED",
    card: "#FFFFFF",
    cardShadow: "rgba(249, 115, 22, 0.06)",
    cardBorder: "rgba(249, 115, 22, 0.06)",
    dividerColor: "#F5F0EB",
    inputBg: "#FAF8F5",
    inputBgFocus: "#FFFFFF",
    inputBorder: "#EDE8E0",
    inputBorderFocus: "#F97316",
    accent: "#F97316",
    accentDark: "#EA580C",
    accentLight: "#FB923C",
    accentSoft: "rgba(249, 115, 22, 0.06)",
    textPrimary: "#1C1917",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    textOnAccent: "#FFFFFF",
    gradientTop: ["rgba(249, 115, 22, 0.04)", "transparent"],
    gradientBottom: ["transparent", "rgba(249, 115, 22, 0.02)"],
    socialBtnBg: "#FFFFFF",
    socialBtnBorder: "#E5E7EB",
    socialBtnText: "#374151",
  },
  ieltscamp: {
    bg: "#F8FCFF",
    bgSubtle: "#EFF8FF",
    card: "#FFFFFF",
    cardShadow: "rgba(0, 191, 255, 0.06)",
    cardBorder: "rgba(0, 191, 255, 0.06)",
    dividerColor: "#EBF2F7",
    inputBg: "#F6FAFD",
    inputBgFocus: "#FFFFFF",
    inputBorder: "#E0EAF0",
    inputBorderFocus: "#00BFFF",
    accent: "#00BFFF",
    accentDark: "#0284C7",
    accentLight: "#38BDF8",
    accentSoft: "rgba(0, 191, 255, 0.06)",
    textPrimary: "#0C1B2A",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    textOnAccent: "#FFFFFF",
    gradientTop: ["rgba(0, 191, 255, 0.04)", "transparent"],
    gradientBottom: ["transparent", "rgba(0, 191, 255, 0.02)"],
    socialBtnBg: "#FFFFFF",
    socialBtnBorder: "#E5E7EB",
    socialBtnText: "#374151",
  },
  mathmaster: {
    bg: "#F4F8F9",
    bgSubtle: "#E3EEF0",
    card: "#FFFFFF",
    cardShadow: "rgba(122, 167, 175, 0.06)",
    cardBorder: "rgba(122, 167, 175, 0.06)",
    dividerColor: "#CDE1E4",
    inputBg: "#F4F8F9",
    inputBgFocus: "#FFFFFF",
    inputBorder: "#CDE1E4",
    inputBorderFocus: "#7AA7AF",
    accent: "#7AA7AF",
    accentDark: "#5F8992",
    accentLight: "#9ABEC5",
    accentSoft: "rgba(122, 167, 175, 0.06)",
    textPrimary: "#33494D",
    textSecondary: "#5F8992",
    textMuted: "#9ABEC5",
    textOnAccent: "#FFFFFF",
    gradientTop: ["rgba(122, 167, 175, 0.04)", "transparent"],
    gradientBottom: ["transparent", "rgba(122, 167, 175, 0.02)"],
    socialBtnBg: "#FFFFFF",
    socialBtnBorder: "#CDE1E4",
    socialBtnText: "#33494D",
  },
  langoread: {
    bg: "#F0FDF4",
    bgSubtle: "#DCFCE7",
    card: "#FFFFFF",
    cardShadow: "rgba(16, 185, 129, 0.06)",
    cardBorder: "rgba(16, 185, 129, 0.06)",
    dividerColor: "#E6F4EA",
    inputBg: "#F4FBF7",
    inputBgFocus: "#FFFFFF",
    inputBorder: "#D1EBE0",
    inputBorderFocus: "#10B981",
    accent: "#10B981",
    accentDark: "#059669",
    accentLight: "#34D399",
    accentSoft: "rgba(16, 185, 129, 0.06)",
    textPrimary: "#064E3B",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",
    textOnAccent: "#FFFFFF",
    gradientTop: ["rgba(16, 185, 129, 0.04)", "transparent"],
    gradientBottom: ["transparent", "rgba(16, 185, 129, 0.02)"],
    socialBtnBg: "#FFFFFF",
    socialBtnBorder: "#E5E7EB",
    socialBtnText: "#374151",
  },
  langoreads: {
    bg: "#F0FDF4",
    bgSubtle: "#DCFCE7",
    card: "#FFFFFF",
    cardShadow: "rgba(16, 185, 129, 0.06)",
    cardBorder: "rgba(16, 185, 129, 0.06)",
    dividerColor: "#E6F4EA",
    inputBg: "#F4FBF7",
    inputBgFocus: "#FFFFFF",
    inputBorder: "#D1EBE0",
    inputBorderFocus: "#10B981",
    accent: "#10B981",
    accentDark: "#059669",
    accentLight: "#34D399",
    accentSoft: "rgba(16, 185, 129, 0.06)",
    textPrimary: "#064E3B",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",
    textOnAccent: "#FFFFFF",
    gradientTop: ["rgba(16, 185, 129, 0.04)", "transparent"],
    gradientBottom: ["transparent", "rgba(16, 185, 129, 0.02)"],
    socialBtnBg: "#FFFFFF",
    socialBtnBorder: "#E5E7EB",
    socialBtnText: "#374151",
  },
  liiro: {
    bg: "#F0FDF4",
    bgSubtle: "#DCFCE7",
    card: "#FFFFFF",
    cardShadow: "rgba(16, 185, 129, 0.06)",
    cardBorder: "rgba(16, 185, 129, 0.06)",
    dividerColor: "#CFE8DC",
    inputBg: "#F4FBF7",
    inputBgFocus: "#FFFFFF",
    // Darkened from #D1EBE0 (1.2:1 — effectively invisible) to meet the ~3:1
    // WCAG 1.4.11 non-text contrast target for default input/button borders.
    inputBorder: "#6E9280",
    inputBorderFocus: "#059669",
    accent: "#10B981",
    accentDark: "#059669",
    accentLight: "#34D399",
    accentSoft: "rgba(16, 185, 129, 0.06)",
    // Text-safe accent variants (see AuthTheme.accentText/accentDeep) — both
    // clear 4.5:1 against the #F0FDF4 background and white cards.
    accentText: "#047857",
    accentDeep: "#065F46",
    textPrimary: "#064E3B",
    textSecondary: "#4B5563",
    // Was #9CA3AF (~2.4:1 on this background — fails AA). Darkened to land
    // at ~5.3:1 while still reading as a lighter/muted tone than textSecondary.
    textMuted: "#5B6B76",
    textOnAccent: "#FFFFFF",
    gradientTop: ["rgba(16, 185, 129, 0.04)", "transparent"],
    gradientBottom: ["transparent", "rgba(16, 185, 129, 0.02)"],
    socialBtnBg: "#FFFFFF",
    socialBtnBorder: "#6E9280",
    socialBtnText: "#374151",
  },
};

export function getAuthTheme(): AuthTheme {
  const env = getCurrentEnvironment();
  return THEMES[env] || THEMES.langoprep;
}
