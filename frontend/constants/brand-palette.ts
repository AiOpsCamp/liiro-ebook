export const BRAND_HEX = {
  primary: "#7C4DFF",
  secondary: "#9C8DFF",
  accent: "#FF8B5A",
  highlight: "#FFD45A",
  danger: "#FF5A5A",
  ink: "#1B0E2B",
  surface: "#FFFFFF",
} as const;

export const BRAND_NATIVEWIND = {
  bg: {
    primary: "bg-brand-primary",
    secondary: "bg-brand-secondary",
    accent: "bg-brand-accent",
    highlight: "bg-brand-highlight",
    danger: "bg-brand-danger",
    ink: "bg-brand-ink",
    surface: "bg-brand-surface",
  },
  text: {
    primary: "text-brand-primary",
    secondary: "text-brand-secondary",
    accent: "text-brand-accent",
    highlight: "text-brand-highlight",
    danger: "text-brand-danger",
    ink: "text-brand-ink",
    surface: "text-brand-surface",
  },
  border: {
    primary: "border-brand-primary",
    secondary: "border-brand-secondary",
    accent: "border-brand-accent",
    highlight: "border-brand-highlight",
    danger: "border-brand-danger",
    ink: "border-brand-ink",
    surface: "border-brand-surface",
  },
} as const;

export type BrandColorName = keyof typeof BRAND_HEX;
