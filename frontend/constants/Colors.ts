/**
 * ──────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH — All app colors flow from here.
 *
 *  Raw values live in  ./theme-colors.json
 *  This module re-exports them with typed, camelCase helpers
 *  and light/dark theme objects.
 *
 *  ✅  Change a color here → it updates everywhere.
 *  ❌  Never add a bare hex string (#ABCDEF) in a component.
 * ──────────────────────────────────────────────────────────────
 */
import { useColorScheme } from "react-native";

import baseColors from "./theme-colors.json";
import langowordsColors from "./colors/langowords.json";
import langoprepColors from "./colors/langoprep.json";
import ieltscampColors from "./colors/ieltscamp.json";
import mathmasterColors from "./colors/mathmaster.json";
import { getCurrentEnvironment } from "@/config/environments";

const environment = getCurrentEnvironment();
let overrides = langoprepColors; // fallback
if (environment === "langowords") {
  overrides = langowordsColors;
} else if (environment === "ieltscamp") {
  overrides = ieltscampColors;
} else if (environment === "mathmaster") {
  overrides = mathmasterColors;
} else if (environment === "langoread" || environment === "langoreads" || environment === "liiro") {
  overrides = langoprepColors; // use langoprep base or colors
}

export const themeColors = {
  ...baseColors,
  ...overrides,
} as Record<string, string>;


/* ────────────────────────────  RAW RE-EXPORT  ──────────────── */
/** Use this when you need a raw JSON key: `tc["forest-core"]` */
export { themeColors as tc };
export default themeColors;

/* ───────────────────────────  BRAND TOKENS  ────────────────── */
export const brand = {
  sunbeam: themeColors["sunbeam"],
  sunbeamDark: themeColors["sunbeam-dark"],
  lemonLeaf: themeColors["lemon-leaf"],
  lemonLeafDark: themeColors["lemon-leaf-dark"],
  meadowGreen: themeColors["meadow-green"],
  meadowGreenDark: themeColors["meadow-green-dark"],
  forestCore: themeColors["forest-core"],
  forestCoreDark: themeColors["forest-core-dark"],
  accentStrong: themeColors["accent-strong"],
} as const;

/* ───────────────────────────  FLAT COLORS  ─────────────────── */
/**
 * Flat camelCase color map — use `AppColors.gray500`, `AppColors.error`, etc.
 * Great for StyleSheet & inline styles.
 */
export const AppColors = {
  /* ── Brand ── */
  ...brand,

  /* ── Dynamic Brand Customizations ── */
  brandInk: themeColors["brand-ink"],
  brandSecondary: themeColors["brand-secondary"],
  brandHighlight: themeColors["brand-highlight"],
  brandSurface: themeColors["brand-surface"],

  /* ── Neutrals ── */

  white: themeColors["white"],
  black: themeColors["black"],
  softBlack: themeColors["soft-black"],

  /* ── Grays ── */
  gray50: themeColors["gray-50"],
  gray100: themeColors["gray-100"],
  gray200: themeColors["gray-200"],
  gray300: themeColors["gray-300"],
  gray400: themeColors["gray-400"],
  gray500: themeColors["gray-500"],
  gray600: themeColors["gray-600"],
  gray700: themeColors["gray-700"],
  gray800: themeColors["gray-800"],
  gray900: themeColors["gray-900"],

  /* ── Slate ── */
  slate50: themeColors["slate-50"],
  slate100: themeColors["slate-100"],
  slate200: themeColors["slate-200"],
  slate300: themeColors["slate-300"],
  slate400: themeColors["slate-400"],
  slate500: themeColors["slate-500"],
  slate600: themeColors["slate-600"],
  slate700: themeColors["slate-700"],
  slate800: themeColors["slate-800"],
  slate900: themeColors["slate-900"],

  /* ── Zinc ── */
  zinc50: themeColors["zinc-50"],
  zinc100: themeColors["zinc-100"],
  zinc200: themeColors["zinc-200"],
  zinc300: themeColors["zinc-300"],
  zinc400: themeColors["zinc-400"],
  zinc500: themeColors["zinc-500"],
  zinc600: themeColors["zinc-600"],
  zinc700: themeColors["zinc-700"],
  zinc800: themeColors["zinc-800"],
  zinc900: themeColors["zinc-900"],
  zinc950: themeColors["zinc-950"],

  /* ── Status ── */
  success: themeColors["success"],
  successDark: themeColors["success-dark"],
  successDeeper: themeColors["success-deeper"],
  successTextLight: themeColors["success-text-light"],
  successTextDark: themeColors["success-text-dark"],
  successBgLight: themeColors["success-bg-light"],
  successBgDark: themeColors["success-bg-dark"],
  successBorder: themeColors["success-border"],

  error: themeColors["error"],
  errorDark: themeColors["error-dark"],
  errorDeeper: themeColors["error-deeper"],
  errorTextLight: themeColors["error-text-light"],
  errorBgLight: themeColors["error-bg-light"],
  errorBgDark: themeColors["error-bg-dark"],
  errorBorderLight: themeColors["error-border-light"],
  errorBorderDark: themeColors["error-border-dark"],
  errorSoft: themeColors["error-soft"],

  warning: themeColors["warning"],
  warningDark: themeColors["warning-dark"],
  warningDeeper: themeColors["warning-deeper"],
  warningTextLight: themeColors["warning-text-light"],
  warningBgLight: themeColors["warning-bg-light"],
  warningBgDark: themeColors["warning-bg-dark"],
  warningSoft: themeColors["warning-soft"],

  info: themeColors["info"],
  infoDark: themeColors["info-dark"],

  /* ── Blue ── */
  blue: themeColors["blue"],
  blueDark: themeColors["blue-dark"],
  blueDeeper: themeColors["blue-deeper"],
  blueDeepest: themeColors["blue-deepest"],
  blue50: themeColors["blue-50"],
  blue100: themeColors["blue-100"],
  blue200: themeColors["blue-200"],
  blue300: themeColors["blue-300"],
  blue400: themeColors["blue-400"],
  blue500: themeColors["blue-500"],
  blue600: themeColors["blue-600"],
  blue700: themeColors["blue-700"],
  blue800: themeColors["blue-800"],

  /* ── Purple ── */
  purple: themeColors["purple"],
  purpleDark: themeColors["purple-dark"],
  purpleDeeper: themeColors["purple-deeper"],
  purpleDeepest: themeColors["purple-deepest"],
  purple50: themeColors["purple-50"],
  purple100: themeColors["purple-100"],
  purple200: themeColors["purple-200"],
  purple300: themeColors["purple-300"],
  purple400: themeColors["purple-400"],
  purple500: themeColors["purple-500"],
  purple600: themeColors["purple-600"],
  purple700: themeColors["purple-700"],
  purple800: themeColors["purple-800"],
  purple900: themeColors["purple-900"],

  /* ── Violet ── */
  violet50: themeColors["violet-50"],
  violet100: themeColors["violet-100"],
  violet200: themeColors["violet-200"],
  violet300: themeColors["violet-300"],
  violet400: themeColors["violet-400"],
  violet500: themeColors["violet-500"],
  violet600: themeColors["violet-600"],
  violet700: themeColors["violet-700"],
  violet800: themeColors["violet-800"],
  violet900: themeColors["violet-900"],
  violet950: themeColors["violet-950"],

  /* ── Indigo ── */
  indigo50: themeColors["indigo-50"],
  indigo100: themeColors["indigo-100"],
  indigo200: themeColors["indigo-200"],
  indigo300: themeColors["indigo-300"],
  indigo400: themeColors["indigo-400"],
  indigo500: themeColors["indigo-500"],
  indigo600: themeColors["indigo-600"],
  indigo700: themeColors["indigo-700"],
  indigo800: themeColors["indigo-800"],
  indigo900: themeColors["indigo-900"],
  indigo950: themeColors["indigo-950"],

  /* ── Orange ── */
  orange: themeColors["orange"],
  orangeDark: themeColors["orange-dark"],
  orangeDeeper: themeColors["orange-deeper"],
  orange50: themeColors["orange-50"],
  orange100: themeColors["orange-100"],
  orange200: themeColors["orange-200"],
  orange300: themeColors["orange-300"],
  orange400: themeColors["orange-400"],
  orange500: themeColors["orange-500"],

  /* ── Teal ── */
  teal: themeColors["teal"],
  tealDark: themeColors["teal-dark"],
  tealDeeper: themeColors["teal-deeper"],
  teal50: themeColors["teal-50"],
  teal100: themeColors["teal-100"],
  teal200: themeColors["teal-200"],
  teal300: themeColors["teal-300"],
  teal400: themeColors["teal-400"],

  /* ── Red ── */
  red: themeColors["red"],
  redDark: themeColors["red-dark"],
  red50: themeColors["red-50"],
  red100: themeColors["red-100"],
  red200: themeColors["red-200"],
  red300: themeColors["red-300"],
  red400: themeColors["red-400"],
  red500: themeColors["red-500"],
  red600: themeColors["red-600"],
  red700: themeColors["red-700"],
  red800: themeColors["red-800"],
  red900: themeColors["red-900"],

  /* ── Green ── */
  green50: themeColors["green-50"],
  green100: themeColors["green-100"],
  green200: themeColors["green-200"],
  green300: themeColors["green-300"],
  green400: themeColors["green-400"],
  green500: themeColors["green-500"],
  green600: themeColors["green-600"],
  green700: themeColors["green-700"],
  green800: themeColors["green-800"],
  green900: themeColors["green-900"],

  /* ── Rose ── */
  rose50: themeColors["rose-50"],
  rose100: themeColors["rose-100"],
  rose200: themeColors["rose-200"],
  rose300: themeColors["rose-300"],
  rose400: themeColors["rose-400"],
  rose500: themeColors["rose-500"],
  rose600: themeColors["rose-600"],
  rose700: themeColors["rose-700"],
  rose800: themeColors["rose-800"],
  rose900: themeColors["rose-900"],

  /* ── Pink ── */
  pink50: themeColors["pink-50"],
  pink100: themeColors["pink-100"],
  pink200: themeColors["pink-200"],
  pink300: themeColors["pink-300"],
  pink400: themeColors["pink-400"],
  pink500: themeColors["pink-500"],
  pink600: themeColors["pink-600"],
  pink700: themeColors["pink-700"],
  pink800: themeColors["pink-800"],

  /* ── Amber ── */
  amber50: themeColors["amber-50"],
  amber100: themeColors["amber-100"],
  amber200: themeColors["amber-200"],
  amber300: themeColors["amber-300"],
  amber400: themeColors["amber-400"],
  amber500: themeColors["amber-500"],
  amber600: themeColors["amber-600"],
  amber700: themeColors["amber-700"],
  amber800: themeColors["amber-800"],
  amber900: themeColors["amber-900"],
  amber950: themeColors["amber-950"],

  /* ── Yellow ── */
  yellow300: themeColors["yellow-300"],
  yellow400: themeColors["yellow-400"],
  yellow500: themeColors["yellow-500"],
  yellow600: themeColors["yellow-600"],
  gold: themeColors["gold"],

  /* ── Emerald ── */
  emerald50: themeColors["emerald-50"],
  emerald100: themeColors["emerald-100"],
  emerald200: themeColors["emerald-200"],
  emerald300: themeColors["emerald-300"],
  emerald400: themeColors["emerald-400"],
  emerald500: themeColors["emerald-500"],
  emerald600: themeColors["emerald-600"],
  emerald700: themeColors["emerald-700"],
  emerald800: themeColors["emerald-800"],
  emerald900: themeColors["emerald-900"],

  /* ── Cyan / Sky ── */
  cyan400: themeColors["cyan-400"],
  cyan500: themeColors["cyan-500"],
  cyan600: themeColors["cyan-600"],
  cyan700: themeColors["cyan-700"],
  cyan800: themeColors["cyan-800"],
  sky300: themeColors["sky-300"],
  sky400: themeColors["sky-400"],
  sky500: themeColors["sky-500"],
  sky600: themeColors["sky-600"],
  sky700: themeColors["sky-700"],
  sky800: themeColors["sky-800"],

  /* ── Fuchsia── */
  fuchsia300: themeColors["fuchsia-300"],
  fuchsia400: themeColors["fuchsia-400"],
  fuchsia500: themeColors["fuchsia-500"],

  /* ── Light tints ── */
  lightYellow: themeColors["light-yellow"],
  lightPurple: themeColors["light-purple"],
  lightBlue: themeColors["light-blue"],
  lightOrange: themeColors["light-orange"],
  lightTeal: themeColors["light-teal"],
  lightGreen: themeColors["light-green"],
  lightRose: themeColors["light-rose"],
  lightPink: themeColors["light-pink"],
  lightIndigo: themeColors["light-indigo"],

  /* ── Smart Learn ── */
  slLearn: themeColors["sl-learn"],
  slMcq: themeColors["sl-mcq"],
  slTrueFalse: themeColors["sl-true-false"],
  slAudio: themeColors["sl-audio"],
  slImageSelect: themeColors["sl-image-select"],
  slSummary: themeColors["sl-summary"],
  slFinished: themeColors["sl-finished"],
  slSheetBg: themeColors["sl-sheet-bg"],
  slSuccess: themeColors["sl-success"],

  /* ── Accent extras ── */
  accentCoral: themeColors["accent-coral"],
  accentAmber: themeColors["accent-amber"],
  accentTealBright: themeColors["accent-teal-bright"],
  accentSky: themeColors["accent-sky"],
  accentRose: themeColors["accent-rose"],
  accentIndigo: themeColors["accent-indigo"],

  /* ── Dark-mode surfaces ── */
  darkBg: themeColors["dark-bg"],
  darkBgAlt: themeColors["dark-bg-alt"],
  darkSurface: themeColors["dark-surface"],
  darkCard: themeColors["dark-card"],
  darkElevated: themeColors["dark-elevated"],
  darkBorder: themeColors["dark-border"],
  darkVioletBg: themeColors["dark-violet-bg"],
  darkVioletSurface: themeColors["dark-violet-surface"],
  darkDeepPurple: themeColors["dark-deep-purple"],

  /* ── Text ── */
  textPrimaryLight: themeColors["text-primary-light"],
  textSecondaryLight: themeColors["text-secondary-light"],
  textMutedLight: themeColors["text-muted-light"],
  textDark: themeColors["text-dark"],
  textPrimaryDark: themeColors["text-primary-dark"],
  textSecondaryDark: themeColors["text-secondary-dark"],
  textMutedDark: themeColors["text-muted-dark"],
  textOnDark: themeColors["text-on-dark"],

  /* ── Profile ── */
  profileInk: themeColors["profile-ink"],
  profileSheet: themeColors["profile-sheet"],
  profileMuted: themeColors["profile-muted"],
  profileBorder: themeColors["profile-border"],
  profileChip: themeColors["profile-chip"],

  /* ── iOS / Material ── */
  iosBlue: themeColors["ios-blue"],
  tintLight: themeColors["tint-light"],

  /* ── Brand Main ── */
  primary: themeColors["primary"],
  buttonPrimary: themeColors["button-primary"],
  buttonSecondary: themeColors["button-secondary"],
  primaryText: themeColors["primary-text"],

  /* ── Extended palette (Phase 3) ── */
  brownDeep: themeColors["brown-deep"],
  indigoDeep: themeColors["indigo-deep"],
  slate950: themeColors["slate-950"],
  coralSoft: themeColors["coral-soft"],
  forestInk: themeColors["forest-ink"],
  greenMid: themeColors["green-mid"],
  darkNavy: themeColors["dark-navy"],
  ghostWhite: themeColors["ghost-white"],
  violetTint: themeColors["violet-tint"],
  darkVioletDeep: themeColors["dark-violet-deep"],
  limeGreen: themeColors["lime-green"],
  darkVioletInk: themeColors["dark-violet-ink"],
  mutedPurple: themeColors["muted-purple"],
  purpleDeepBg: themeColors["purple-deep-bg"],
  bootstrapSuccess: themeColors["bootstrap-success"],
  mutedLavender: themeColors["muted-lavender"],
  bootstrapDanger: themeColors["bootstrap-danger"],
  darkPlum: themeColors["dark-plum"],
  darkBgAlt2: themeColors["dark-bg-alt2"],
  violetWhisper: themeColors["violet-whisper"],
  darkGrape: themeColors["dark-grape"],
  darkAubergine: themeColors["dark-aubergine"],
  darkMauve: themeColors["dark-mauve"],
  emeraldDeepest: themeColors["emerald-deepest"],
  darkPlumSurface: themeColors["dark-plum-surface"],
  surfaceMist: themeColors["surface-mist"],
  lavenderMist: themeColors["lavender-mist"],
  nearWhite: themeColors["near-white"],
  violetGhost: themeColors["violet-ghost"],
  surfaceSoft: themeColors["surface-soft"],
} as const;

/* ─────────────────────  LIGHT / DARK THEME  ────────────────── */

const tintLightVal = themeColors["tint-light"];
const tintDarkVal = themeColors["white"];

export const Colors = {
  light: {
    text: themeColors["text-primary-light"],
    background: themeColors["white"],
    tint: tintLightVal,
    icon: themeColors["gray-500"],
    tabIconDefault: themeColors["gray-500"],
    tabIconSelected: tintLightVal,
  },
  dark: {
    text: themeColors["text-on-dark"],
    background: themeColors["dark-bg"],
    tint: tintDarkVal,
    icon: themeColors["slate-400"],
    tabIconDefault: themeColors["slate-400"],
    tabIconSelected: tintDarkVal,
  },
} as const;

/* ──────────────────────────  HOOKS  ────────────────────────── */

/** Component-level hook — returns theme-dependent colors + brand */
export const useThemeColors = () => {
  const scheme = (useColorScheme() ?? "light") === "dark" ? "dark" : "light";
  return { c: Colors[scheme], brand, AppColors };
};

/* ──────────────────────────  PROFILE THEME  ────────────────── */
export const PROFILE_THEME = {
  primary: themeColors["forest-core"],
  secondary: themeColors["meadow-green"],
  tertiary: themeColors["lemon-leaf"],
  accent: themeColors["sunbeam"],
  accentStrong: themeColors["accent-strong"],
  ink: themeColors["profile-ink"],
  white: themeColors["white"],
  sheet: themeColors["profile-sheet"],
  muted: themeColors["profile-muted"],
  border: themeColors["profile-border"],
  hint: themeColors["gray-500"],
  chip: themeColors["profile-chip"],
  gray: { 50: themeColors["gray-50"] },
} as const;

/* ──────────────────────────  SMART LEARN  ──────────────────── */
export const SMART_LEARN_COLORS = {
  learn: themeColors["sl-learn"],
  mcq: themeColors["sl-mcq"],
  true_false: themeColors["sl-true-false"],
  audio: themeColors["sl-audio"],
  image_select: themeColors["sl-image-select"],
  summary: themeColors["sl-summary"],
  finished: themeColors["sl-finished"],
  success: themeColors["sl-success"],
  error: themeColors["error"],
  default: themeColors["sl-learn"],
  sheet_bg: themeColors["sl-sheet-bg"],
  sheet_handle: "rgba(255,255,255,0.2)",
} as const;

/* ──────────────────────────  MODULE THEME  ─────────────────── */
export const MODULE_THEME = {
  primary: themeColors["violet-700"],
  primaryDark: themeColors["violet-900"],
  accent: themeColors["purple"],
  allGold: themeColors["warning"],
} as const;

export const TRACK_COLORS: Record<
  string,
  { bg: string; text: string; label: string; dot: string; tint: string; deep: string }
> = {
  starter: { bg: themeColors["track-starter-bg"], text: themeColors["track-starter-text"], label: "Starter", dot: themeColors["track-starter-dot"], tint: "rgba(34,197,94,0.10)", deep: themeColors["track-starter-deep"] },
  beginner: { bg: themeColors["track-beginner-bg"], text: themeColors["track-beginner-text"], label: "Beginner", dot: themeColors["track-beginner-dot"], tint: "rgba(59,130,246,0.10)", deep: themeColors["track-beginner-deep"] },
  elementary: { bg: themeColors["track-elementary-bg"], text: themeColors["track-elementary-text"], label: "Elementary", dot: themeColors["track-elementary-dot"], tint: "rgba(99,102,241,0.10)", deep: themeColors["track-elementary-deep"] },
  intermediate: { bg: themeColors["track-intermediate-bg"], text: themeColors["track-intermediate-text"], label: "Intermediate", dot: themeColors["track-intermediate-dot"], tint: "rgba(245,158,11,0.12)", deep: themeColors["track-intermediate-deep"] },
  advanced: { bg: themeColors["track-advanced-bg"], text: themeColors["track-advanced-text"], label: "Advanced", dot: themeColors["track-advanced-dot"], tint: "rgba(239,68,68,0.10)", deep: themeColors["track-advanced-deep"] },
  proficient: { bg: themeColors["track-proficient-bg"], text: themeColors["track-proficient-text"], label: "Proficient", dot: themeColors["track-proficient-dot"], tint: "rgba(255,139,90,0.12)", deep: themeColors["track-proficient-deep"] },
  archive: { bg: themeColors["track-archive-bg"], text: themeColors["track-archive-text"], label: "Archive", dot: themeColors["track-archive-dot"], tint: "rgba(148,163,184,0.12)", deep: themeColors["track-archive-deep"] },
};

/* ──────────────────────────  LEARN MODE  ──────────────────── */
export const LEARN_MODE_COLORS = {
  primary: themeColors["forest-core"],
  primaryDark: themeColors["accent-strong"],
  success: themeColors["success"],
  danger: themeColors["error"],
  warn: themeColors["sunbeam"],
  grayDark: themeColors["gray-800"],
  grayMid: themeColors["gray-500"],
} as const;

/* ──────────────────────────  ONBOARDING  ──────────────────── */
export const ONBOARDING_THEME_COLOR = themeColors["violet-700"];

export const ONBOARDING_VIOLET = {
  deep: themeColors["violet-900"],
  primary: themeColors["violet-700"],
  accent: themeColors["purple-dark"],
  light: themeColors["light-purple"],
  tint: themeColors["violet-50"],
  bg: "#FFD45A",
  glow: "rgba(255,139,90,0.24)",
  border: themeColors["violet-200"],
} as const;

export const ONBOARDING_ACCENTS = {
  coral: themeColors["accent-coral"],
  amber: themeColors["accent-amber"],
  teal: themeColors["accent-teal-bright"],
  sky: themeColors["accent-sky"],
  rose: themeColors["accent-rose"],
  indigo: themeColors["accent-indigo"],
} as const;

/* ──────────────────────────  MODULE PALETTES  ──────────────── */
export const MODULE_PALETTES = [
  { accent: themeColors["indigo-500"] },
  { accent: themeColors["pink-400"] },
  { accent: themeColors["success"] },
  { accent: themeColors["orange"] },
  { accent: themeColors["sky-500"] },
  { accent: themeColors["purple-500"] },
  { accent: themeColors["yellow-600"] },
  { accent: themeColors["teal"] },
];

/* ──────────────────────────  GRAY SCALE OBJECT  ──────────── */
/** Convenience nested gray object for components that iterate grays */
export const grayScale = {
  50: themeColors["gray-50"],
  100: themeColors["gray-100"],
  200: themeColors["gray-200"],
  300: themeColors["gray-300"],
  400: themeColors["gray-400"],
  500: themeColors["gray-500"],
  600: themeColors["gray-600"],
  700: themeColors["gray-700"],
  800: themeColors["gray-800"],
  900: themeColors["gray-900"],
} as const;

/* ──────────────────────  ROYAL VIOLET  ─────────────────────── */
/** Premium/paywall violet scale */
export const royalViolet = {
  50: themeColors["violet-50"],
  100: themeColors["violet-100"],
  200: themeColors["violet-200"],
  300: themeColors["violet-300"],
  400: themeColors["violet-400"],
  500: themeColors["violet-500"],
  600: themeColors["violet-600"],
  700: themeColors["violet-700"],
  800: themeColors["violet-800"],
  900: themeColors["violet-900"],
} as const;

/* ─────────────────────  LEGACY COMPAT  ─────────────────────── */
/**
 * ⚠️ Legacy default — keeps old `import { colors } from "@/constants/Colors"` working.
 * Exposes the light palette merged with brand + common aliases.
 * Move new code over to `AppColors` when convenient.
 */
export const colors = {
  ...brand,
  ...Colors.light,
  A2CA71: themeColors["meadow-green"],
  A2CA71Dark: themeColors["meadow-green-dark"],
  red: themeColors["error"],
  redDark: themeColors["error-dark"],
  red500: themeColors["error"],
  gray50: themeColors["gray-50"],
  gray100: themeColors["gray-100"],
  gray200: themeColors["gray-200"],
  gray300: themeColors["gray-300"],
  gray400: themeColors["gray-400"],
  gray500: themeColors["gray-500"],
  gray600: themeColors["gray-600"],
  gray700: themeColors["gray-700"],
  gray800: themeColors["gray-800"],
  gray900: themeColors["gray-900"],
  blue: themeColors["blue"],
  blueDark: themeColors["blue-dark"],
  black: themeColors["black"],
  white: themeColors["white"],
  success: themeColors["success"],
  successDark: themeColors["success-dark"],
  warning: themeColors["warning"],
  warningDark: themeColors["warning-dark"],
  purple: themeColors["purple"],
  purpleDark: themeColors["purple-dark"],
  orange: themeColors["orange"],
  orangeDark: themeColors["orange-dark"],
} as const;
