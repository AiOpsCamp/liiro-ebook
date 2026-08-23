import { Dimensions, useWindowDimensions } from "react-native";

interface ResponsiveConfig {
  small: number; // < 400px
  medium: number; // 400px - 600px
  large: number; // 600px - 800px
  xlarge: number; // > 800px
}

export const createResponsiveValue = (config: ResponsiveConfig): number => {
  const { width } = Dimensions.get("window");

  if (width < 400) return config.small;
  if (width < 600) return config.medium;
  if (width < 800) return config.large;
  return config.xlarge;
};

export const useResponsiveValue = (config: ResponsiveConfig): number => {
  const dimensions = useWindowDimensions();

  if (dimensions.width < 400) return config.small;
  if (dimensions.width < 600) return config.medium;
  if (dimensions.width < 800) return config.large;
  return config.xlarge;
};

export const ResponsiveContainer = {
  // Spacing scale proportional to screen size
  padding: (baseMultiplier = 1) => {
    const base = createResponsiveValue({ small: 12, medium: 16, large: 20, xlarge: 24 });
    return base * baseMultiplier;
  },

  // Typography scaling
  fontSize: (config: Partial<ResponsiveConfig> = {}) => {
    const defaults: ResponsiveConfig = {
      small: 14,
      medium: 16,
      large: 18,
      xlarge: 20,
      ...config,
    };
    return createResponsiveValue(defaults);
  },

  // Image height scaling
  imageHeight: () => {
    return createResponsiveValue({ small: 180, medium: 220, large: 240, xlarge: 280 });
  },

  // Button size scaling
  buttonSize: () => {
    return createResponsiveValue({ small: 44, medium: 48, large: 52, xlarge: 56 });
  },

  // Gap/margin scaling
  gap: (scale: "xs" | "sm" | "md" | "lg" = "md") => {
    const gaps = {
      xs: { small: 4, medium: 6, large: 8, xlarge: 10 },
      sm: { small: 8, medium: 10, large: 12, xlarge: 14 },
      md: { small: 12, medium: 16, large: 20, xlarge: 24 },
      lg: { small: 16, medium: 24, large: 32, xlarge: 40 },
    };
    return createResponsiveValue(gaps[scale]);
  },
};

export const VIOLET_PALETTE = {
  // Deep violet background
  deepViolet: "#5A2412", // deep violet-950
  darkViolet: "#FF5A5A", // violet-900
  mainViolet: "#FF5A5A", // violet-800
  mediumViolet: "#FF8B5A", // violet-700
  accentViolet: "#FF8B5A", // violet-600
  lightViolet: "#FFA95A", // violet-400
  paleLiolet: "#FFD45A", // violet-100

  // Neutrals
  white: "#ffffff",
  black: "#000000",
  gray900: "#111827",
  gray800: "#1f2937",
  gray700: "#374151",
  gray600: "#4b5563",
  gray500: "#6b7280",
  gray400: "#9ca3af",
  gray300: "#d1d5db",
  gray200: "#e5e7eb",
  gray100: "#f3f4f6",
  gray50: "#f9fafb",
};

// Dark mode theme with violet palette
export const getVioletTheme = (dark: boolean) => ({
  bg: dark ? VIOLET_PALETTE.deepViolet : VIOLET_PALETTE.paleLiolet,
  card: dark ? VIOLET_PALETTE.darkViolet : VIOLET_PALETTE.white,
  text: dark ? VIOLET_PALETTE.white : VIOLET_PALETTE.gray900,
  muted: dark ? VIOLET_PALETTE.gray400 : VIOLET_PALETTE.gray500,
  border: dark ? "rgba(168, 85, 247, 0.1)" : "rgba(168, 85, 247, 0.1)",
  subtle: dark ? VIOLET_PALETTE.mainViolet : VIOLET_PALETTE.gray100,
  overlay: dark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
  primary: VIOLET_PALETTE.accentViolet,
  accent: VIOLET_PALETTE.mediumViolet,
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
});

