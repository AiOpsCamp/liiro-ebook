import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark" | "system";
export type ReaderTheme = "light" | "sepia" | "dark" | "pitch" | "gothic" | "forest" | "fireside" | "cyberpunk";

interface ThemeState {
  mode: ThemeMode;
  readerTheme: ReaderTheme;
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono";
}

const initialState: ThemeState = {
  mode: "dark",
  readerTheme: "dark",
  fontSize: 16,
  fontFamily: "serif",
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    setReaderTheme: (state, action: PayloadAction<ReaderTheme>) => {
      state.readerTheme = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
    setFontFamily: (state, action: PayloadAction<"sans" | "serif" | "mono">) => {
      state.fontFamily = action.payload;
    },
  },
});

export const { setThemeMode, setReaderTheme, setFontSize, setFontFamily } = themeSlice.actions;

export const selectIsDark = (state: any) => {
  const mode = state?.theme?.mode || "dark";
  return mode === "dark";
};

const DARK_TOKENS = {
  background: "#080E1A",
  backgroundSoft: "#0F172A",
  surface: "#111827",
  card: "#1E293B",
  border: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  accentPrimary: "#0EA5E9",
  accentPrimarySoft: "rgba(14, 165, 233, 0.15)",
  onAccentPrimary: "#FFFFFF",
  bg: "#080E1A",
  text: "#F1F5F9",
  subtext: "#94A3B8",
  cardBg: "#111827",
};

const LIGHT_TOKENS = {
  background: "#F8FAFC",
  backgroundSoft: "#F1F5F9",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "rgba(0, 0, 0, 0.08)",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  accentPrimary: "#0EA5E9",
  accentPrimarySoft: "rgba(14, 165, 233, 0.12)",
  onAccentPrimary: "#FFFFFF",
  bg: "#F8FAFC",
  text: "#0F172A",
  subtext: "#64748B",
  cardBg: "#FFFFFF",
};

export const selectThemeTokens = (state: any) => {
  const mode = state?.theme?.mode || "dark";
  return mode === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
};

export default themeSlice.reducer;
