/**
 * platformTextProps.ts
 * ─────────────────────────────────────────────────────────
 * Enhanced AppText component helper for platform consistency
 * Ensures all text components render identically across platforms
 */

import { Platform, TextProps } from "react-native";
import { PlatformText, getFontSize, IS_IOS } from "@/lib/platformStyles";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "title"
  | "subtitle"
  | "body"
  | "bodyMedium"
  | "bodySmall"
  | "caption"
  | "captionSmall"
  | "label";

/**
 * Get text style for AppText component
 * @param variant - Text style variant
 * @returns Style object with platform-adjusted fonts
 * 
 * Usage:
 * <AppText variant="body" style={getTextStyle("body")}>
 *   My text
 * </AppText>
 */
export function getTextStyle(variant: TextVariant = "body") {
  return PlatformText[variant] || PlatformText.body;
}

/**
 * Text component configuration by variant
 */
export const TextConfig: Record<TextVariant, TextProps> = {
  h1: {
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  },
  h2: {
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  },
  h3: {
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  },
  title: {
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  },
  subtitle: {
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  },
  body: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.1,
  },
  bodyMedium: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.1,
  },
  bodySmall: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.1,
  },
  caption: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1,
  },
  captionSmall: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1,
  },
  label: {
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  },
};

/**
 * Platform-specific text rendering properties
 * Ensures consistent text rendering across all platforms
 */
export const PlatformTextProps = {
  // Disable font scaling to maintain consistency
  noScale: {
    allowFontScaling: false as const,
    maxFontSizeMultiplier: 1,
  },
  
  // Allow controlled scaling for accessibility
  withScale: {
    allowFontScaling: true as const,
    maxFontSizeMultiplier: 1.2,
  },
  
  // iOS-specific adjustments
  ios: {
    allowFontScaling: false as const,
    adjustsFontSizeToFit: false,
    // iOS tends to render fonts slightly bolder
    fontWeight: IS_IOS ? ("500" as const) : ("400" as const),
  },
  
  // Android-specific adjustments
  android: {
    allowFontScaling: false as const,
    // Android needs slightly more letter spacing sometimes
    letterSpacing: 0,
  },
};

/**
 * Common text style presets for quick usage
 */
export const TextPresets = {
  // Headings - no scaling
  heading: {
    allowFontScaling: false as const,
    maxFontSizeMultiplier: 1,
  },
  
  // Body text - with accessibility scaling
  body: {
    allowFontScaling: true as const,
    maxFontSizeMultiplier: 1.15,
  },
  
  // Small text - no scaling
  small: {
    allowFontScaling: false as const,
    maxFontSizeMultiplier: 1,
  },
  
  // Labels - no scaling
  label: {
    allowFontScaling: false as const,
    maxFontSizeMultiplier: 1,
  },
};

/**
 * Helper to combine text styles safely
 * Prevents font size conflicts
 * 
 * @example
 * combineTextStyles(styles.body, { fontWeight: "bold" })
 */
export function combineTextStyles(base: any, override: any) {
  const combined = { ...base, ...override };
  
  // Prevent conflicting font settings
  if (override.fontSize !== undefined) {
    // If custom fontSize, recalculate line height
    combined.lineHeight = override.fontSize * 1.5;
  }
  
  return combined;
}

/**
 * Responsive text size based on screen width
 * @param baseWidth - Base screen width (375 - iPhone SE)
 * @param currentWidth - Current screen width
 * @param baseSize - Base font size
 * @returns Adjusted font size
 */
export function getResponsiveTextSize(
  currentWidth: number,
  baseSize: number,
  baseWidth: number = 375
) {
  const scale = Math.min(currentWidth / baseWidth, 1.2); // Max 20% increase
  return getFontSize(baseSize) * scale;
}

/**
 * Font family detection for platform
 */
export const PlatformFontFamily = {
  default: Platform.select({
    ios: "System",
    android: "Roboto",
    web: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "RobotoMono",
    web: "'Monaco', 'Courier New', monospace",
  }),
  serif: Platform.select({
    ios: "Georgia",
    android: "Georgia",
    web: "'Georgia', serif",
  }),
};

/**
 * Check if font scaling is enabled (iOS accessibility setting)
 * Should be checked to adjust spacing dynamically
 */
export function shouldAllowFontScaling(variant: TextVariant): boolean {
  return variant !== "h1" && variant !== "h2" && variant !== "h3" && variant !== "label";
}

/**
 * Get adjusted line height for text
 * Ensures readability on all platforms
 */
export function getAdjustedLineHeight(fontSize: number, tight = false): number {
  // Tighter line height for headings, looser for body
  const multiplier = tight ? 1.2 : 1.5;
  return Math.ceil(fontSize * multiplier);
}
