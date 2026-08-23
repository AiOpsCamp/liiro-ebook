/**
 * platformStyles.ts
 * ─────────────────────────────────────────────────────────
 * Cross-platform consistent font sizing and styling
 * Ensures iOS, Android, and Web render identically
 * 
 * Problem: iOS renders fonts 10-20% larger than Android
 * Solution: Platform-specific font scale adjustments
 */

import { Platform } from "react-native";

/**
 * Platform detection
 */
export const IS_IOS = Platform.OS === "ios";
export const IS_ANDROID = Platform.OS === "android";
export const IS_WEB = Platform.OS === "web";

/**
 * Font size scale factor by platform
 * iOS renders ~1.1x larger, so we reduce iOS font sizes
 * This ensures visual parity across all platforms
 */
const FONT_SCALE_FACTOR = {
  ios: 0.92,      // iOS: reduce by 8% to match Android
  android: 1.0,   // Android: baseline
  web: 1.0,       // Web: baseline
};

/**
 * Get platform-adjusted font size
 * @param baseSize - Base font size (Android/Web reference)
 * @returns Adjusted size for current platform
 * 
 * Example:
 * getFontSize(16) on iOS → 14.7
 * getFontSize(16) on Android → 16
 * getFontSize(16) on Web → 16
 */
export function getFontSize(baseSize: number): number {
  const scale = FONT_SCALE_FACTOR[Platform.OS as keyof typeof FONT_SCALE_FACTOR] || 1.0;
  return baseSize * scale;
}

/**
 * Get platform-adjusted line height
 * Ensures consistent text layout across platforms
 */
export function getLineHeight(fontSize: number, multiplier: number = 1.5): number {
  return getFontSize(fontSize) * multiplier;
}

/**
 * Platform-specific text styles
 */
export const PlatformText = {
  // Display/Hero sizes (largest)
  h1: {
    fontSize: getFontSize(32),
    lineHeight: getLineHeight(32, 1.2),
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: getFontSize(28),
    lineHeight: getLineHeight(28, 1.2),
    fontWeight: "800" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: getFontSize(24),
    lineHeight: getLineHeight(24, 1.25),
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },

  // Body text sizes
  title: {
    fontSize: getFontSize(20),
    lineHeight: getLineHeight(20, 1.3),
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: getFontSize(18),
    lineHeight: getLineHeight(18, 1.35),
    fontWeight: "600" as const,
  },
  body: {
    fontSize: getFontSize(16),
    lineHeight: getLineHeight(16, 1.5),
    fontWeight: "500" as const,
  },
  bodyMedium: {
    fontSize: getFontSize(15),
    lineHeight: getLineHeight(15, 1.5),
    fontWeight: "500" as const,
  },
  bodySmall: {
    fontSize: getFontSize(14),
    lineHeight: getLineHeight(14, 1.5),
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: getFontSize(12),
    lineHeight: getLineHeight(12, 1.4),
    fontWeight: "500" as const,
  },
  captionSmall: {
    fontSize: getFontSize(11),
    lineHeight: getLineHeight(11, 1.4),
    fontWeight: "400" as const,
  },
  label: {
    fontSize: getFontSize(13),
    lineHeight: getLineHeight(13, 1.2),
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
};

/**
 * Platform-specific spacing scales
 * Ensures consistent padding/margins across platforms
 */
export const PlatformSpacing = {
  xs: IS_WEB ? 4 : 4,
  sm: IS_WEB ? 8 : 8,
  md: IS_WEB ? 12 : 12,
  lg: IS_WEB ? 16 : 16,
  xl: IS_WEB ? 24 : 24,
  xxl: IS_WEB ? 32 : 32,
};

/**
 * Platform-specific border radius
 * iOS prefers slightly larger radius
 */
export const PlatformBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

/**
 * Platform-specific shadows
 * Web and iOS support different shadow models
 */
export const PlatformShadow = {
  sm: {
    ...(!IS_WEB && {
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    }),
    ...(IS_WEB && {
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }),
  },
  md: {
    ...(!IS_WEB && {
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    ...(IS_WEB && {
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    }),
  },
  lg: {
    ...(!IS_WEB && {
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    }),
    ...(IS_WEB && {
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    }),
  },
  xl: {
    ...(!IS_WEB && {
      elevation: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }),
    ...(IS_WEB && {
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    }),
  },
};

/**
 * Responsive breakpoints for layout adjustments
 */
export const Breakpoints = {
  mobile: 375,   // iPhone SE
  tablet: 768,   // iPad
  desktop: 1024, // Desktop
  wide: 1440,    // Large desktop
};

/**
 * Get responsive value based on screen width
 * @param width - Current screen width
 * @returns Size category
 */
export function getDeviceSize(width: number) {
  if (width < Breakpoints.tablet) return "mobile";
  if (width < Breakpoints.desktop) return "tablet";
  if (width < Breakpoints.wide) return "desktop";
  return "wide";
}

/**
 * Platform-specific touch targets
 * iOS: 44x44 minimum
 * Android: 48x48 minimum
 * Web: 40x40 (larger click area)
 */
export const TouchTarget = {
  min: IS_IOS ? 44 : IS_ANDROID ? 48 : 40,
  sm: IS_IOS ? 40 : 44,
  md: IS_IOS ? 48 : 52,
  lg: 56,
};

/**
 * Platform-specific font family
 * Ensures consistent typography across platforms
 */
export const FontFamily = {
  // System fonts (fastest, most native)
  system: Platform.select({
    ios: "System",
    android: "Roboto",
    web: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  }),
  // Monospace for code
  mono: Platform.select({
    ios: "Menlo",
    android: "RobotoMono",
    web: "'Monaco', 'Menlo', 'Courier New', monospace",
  }),
};

/**
 * Helper: Create responsive style object
 * @example
 * createResponsiveStyle({
 *   mobile: { fontSize: 14, padding: 8 },
 *   tablet: { fontSize: 16, padding: 12 },
 *   desktop: { fontSize: 18, padding: 16 },
 * })
 */
export function createResponsiveStyle(styles: Record<string, any>) {
  return styles;
}

/**
 * Quick debug: Check platform rendering
 * Call this in a component to verify font sizes
 * @example
 * useEffect(() => {
 *   console.log(debugPlatformStyles());
 * }, []);
 */
export function debugPlatformStyles() {
  return {
    platform: Platform.OS,
    fontScale: FONT_SCALE_FACTOR[Platform.OS as keyof typeof FONT_SCALE_FACTOR],
    baseFontSize16: getFontSize(16),
    baseFontSize18: getFontSize(18),
    baseFontSize20: getFontSize(20),
    lineHeight16: getLineHeight(16),
    lineHeight18: getLineHeight(18),
    lineHeight20: getLineHeight(20),
  };
}
