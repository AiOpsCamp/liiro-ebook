/**
 * ⚠️  DEPRECATED — Use `@/constants/Colors` instead.
 *
 * This file exists only for backward compatibility.
 * All values now come from the centralized Colors module.
 */
import {
  AppColors,
  grayScale,
  royalViolet,
} from "@/constants/Colors";

/**
 * Backward-compat COLORS object.
 * Maps old key names (e.g., `darkGreen`, `yellow`, `lightGreen`) to centralized AppColors.
 */
const COLORS = {
  ...AppColors,

  // Legacy aliases (old lib/colors.ts keys → new AppColors keys)
  yellow: AppColors.sunbeam,
  lightGreen: AppColors.lemonLeaf,
  sageGreen: AppColors.meadowGreen,
  forestGreen: AppColors.forestCore,
  mediumGreen: AppColors.meadowGreen,
  darkGreen: AppColors.forestCore,
  text: AppColors.textDark,
  tertiary: AppColors.lemonLeaf,
  textLight: AppColors.slate500,
  lightGray: AppColors.slate50,
  darkGray: "#757575",
  black: AppColors.softBlack,
  primary: AppColors.forestCore,
  secondary: AppColors.meadowGreen,
  accent: AppColors.lemonLeaf,
  highlight: AppColors.sunbeam,
  textDark: AppColors.softBlack,
  mediumGray: "#E0E0E0",
  darkTextGray: "#9E9E9E",
  gray: grayScale,
  royalViolet: royalViolet,
};

export { COLORS, grayScale, royalViolet };
