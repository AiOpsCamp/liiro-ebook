/**
 * Helper functions for app-specific branding colors.
 *
 * Usage:
 *   import { getAppColors, createAppTheme } from '@/constants/branding-colors';
 *
 *   const colors = getAppColors();
 *   const theme = createAppTheme(isDark);
 */

import { BRANDING_COLORS } from '@/config/branding';

export interface AppColorsType {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Get current app's colors.
 */
export function getAppColors(): AppColorsType {
  return BRANDING_COLORS as AppColorsType;
}

/**
 * Create a theme object with app-specific colors.
 * Use this in component getTheme() functions.
 */
export function createAppTheme(isDark: boolean) {
  const colors = getAppColors();

  return {
    // App-specific colors
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,

    // Theme-aware colors (can be extended)
    bg: isDark ? '#0F172A' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    border: isDark ? '#1E293B' : '#E2E8F0',
  };
}

// Legacy export for backward compatibility
export const appColors = getAppColors();