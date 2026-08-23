/**
 * ⚠️  DEPRECATED — Use `@/constants/Colors` instead.
 *
 * The LIGHT/DARK palettes here were for a specific component set.
 * They are now maintained inline in the components that use them.
 * The `useTheme()` helper can be replaced with the global theme system.
 */
import { AppColors } from "./Colors";

export const LIGHT = {
  primary: "#FF8B5A",
  secondary: AppColors.purple,
  tertiary: AppColors.violet300,
  accent: AppColors.purple200,
  text: AppColors.slate900,
  subtle: AppColors.slate600,
  bg: AppColors.slate50,
  surface: AppColors.white,
  surfaceAlt: AppColors.slate100,
  border: "rgba(2, 6, 23, 0.08)",
  errBg: AppColors.red50,
  errBorder: AppColors.errorSoft,
  errText: AppColors.errorDark,
} as const;

export const DARK = {
  primary: "#FF5A5A",
  secondary: AppColors.violet400,
  tertiary: AppColors.indigo200,
  accent: AppColors.violet200,
  text: AppColors.gray200,
  subtle: AppColors.slate400,
  bg: "#1A0C06",
  surface: "#2A140B",
  surfaceAlt: "#3A160C",
  border: "rgba(255,255,255,0.12)",
  errBg: "#2A1214",
  errBorder: AppColors.red400,
  errText: AppColors.errorSoft,
} as const;

export const useTheme = (dark: boolean) => {
  const C = dark ? DARK : LIGHT;
  return {
    primary: C.primary,
    secondary: C.secondary,
    tertiary: C.tertiary,
    accent: C.accent,
    text: C.text,
    subtle: C.subtle,
    border: C.border,
  };
};
