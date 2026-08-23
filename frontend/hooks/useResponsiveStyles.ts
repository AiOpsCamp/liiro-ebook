/**
 * useResponsiveStyles.ts
 * ─────────────────────────────────────────────────────────
 * Hook for consistent responsive styling across all platforms
 * 
 * Usage:
 * const styles = useResponsiveStyles();
 * <Text style={styles.body}>Consistent text</Text>
 */

import { useMemo } from "react";
import { useWindowDimensions, Platform, StyleSheet } from "react-native";
import {
  PlatformText,
  PlatformSpacing,
  PlatformBorderRadius,
  PlatformShadow,
  getDeviceSize,
  TouchTarget,
} from "@/lib/platformStyles";

export function useResponsiveStyles() {
  const { width } = useWindowDimensions();
  const deviceSize = getDeviceSize(width);

  return useMemo(
    () => ({
      // Text styles - platform consistent
      text: {
        h1: PlatformText.h1,
        h2: PlatformText.h2,
        h3: PlatformText.h3,
        title: PlatformText.title,
        subtitle: PlatformText.subtitle,
        body: PlatformText.body,
        bodyMedium: PlatformText.bodyMedium,
        bodySmall: PlatformText.bodySmall,
        caption: PlatformText.caption,
        captionSmall: PlatformText.captionSmall,
        label: PlatformText.label,
      },

      // Spacing - responsive to device size
      spacing: {
        xs: PlatformSpacing.xs,
        sm: PlatformSpacing.sm,
        md: PlatformSpacing.md,
        lg: PlatformSpacing.lg,
        xl: PlatformSpacing.xl,
        xxl: PlatformSpacing.xxl,
      },

      // Border radius
      radius: {
        xs: PlatformBorderRadius.xs,
        sm: PlatformBorderRadius.sm,
        md: PlatformBorderRadius.md,
        lg: PlatformBorderRadius.lg,
        xl: PlatformBorderRadius.xl,
        full: PlatformBorderRadius.full,
      },

      // Shadows - platform aware
      shadow: PlatformShadow,

      // Touch target sizes (HIG compliant)
      touch: {
        min: TouchTarget.min,
        sm: TouchTarget.sm,
        md: TouchTarget.md,
        lg: TouchTarget.lg,
      },

      // Device size info
      device: {
        size: deviceSize,
        width,
        isMobile: deviceSize === "mobile",
        isTablet: deviceSize === "tablet",
        isDesktop: deviceSize === "desktop",
        isWide: deviceSize === "wide",
      },

      // Common component styles
      container: {
        paddingHorizontal: deviceSize === "mobile" ? PlatformSpacing.md : PlatformSpacing.lg,
        paddingVertical: PlatformSpacing.md,
      },

      button: {
        minHeight: TouchTarget.md,
        paddingHorizontal: PlatformSpacing.lg,
        paddingVertical: PlatformSpacing.md,
        borderRadius: PlatformBorderRadius.lg,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },

      card: {
        padding: PlatformSpacing.lg,
        borderRadius: PlatformBorderRadius.md,
        ...PlatformShadow.md,
      },

      input: {
        minHeight: TouchTarget.md,
        paddingHorizontal: PlatformSpacing.md,
        paddingVertical: PlatformSpacing.sm,
        borderRadius: PlatformBorderRadius.sm,
      },
    }),
    [deviceSize, width]
  );
}

/**
 * Global responsive styles for common layouts
 */
export const ResponsiveStyleSheet = StyleSheet.create({
  // Flex layouts
  flexCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  flexBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flexStart: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },

  // Safe areas
  safeHorizontal: {
    paddingHorizontal: Platform.select({ web: 16, default: 12 }),
  },
  safeVertical: {
    paddingVertical: Platform.select({ web: 16, default: 12 }),
  },

  // Overflow
  noOverflow: {
    overflow: "hidden" as const,
  },

  // Opacity/visibility
  hidden: {
    opacity: 0,
    pointerEvents: "none" as const,
  },
  visible: {
    opacity: 1,
    pointerEvents: "auto" as const,
  },
});

/**
 * Hook to detect platform for conditional rendering
 */
export function usePlatform() {
  return useMemo(
    () => ({
      isIOS: Platform.OS === "ios",
      isAndroid: Platform.OS === "android",
      isWeb: Platform.OS === "web",
      isNative: Platform.OS !== "web",
    }),
    []
  );
}
