import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
  Modal,
  Platform } from "react-native";
import { useSelector } from "react-redux";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  withRepeat,
  withSequence,
  withTiming,
  Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Markdown from "react-native-markdown-display";
import { getLocalizedText } from "@/utils/getLocalizedText";
import { AudioManager } from "@/lib/utils/audioManager";
import { WhispersyncPromptModal } from "../WhispersyncPromptModal";
import { EbookReaderHeader } from "./EbookReaderHeader";
import { EbookReaderFooterPlayer } from "./EbookReaderFooterPlayer";
import { EbookReaderSettingsModal } from "./EbookReaderSettingsModal";
import { EbookReaderTocModal } from "./EbookReaderTocModal";
import { EbookTextSelectionTooltip } from "./EbookTextSelectionTooltip";
import { EbookAmbientSoundscapeModal } from "../EbookAmbientSoundscapeModal";
import {
  useSyncWhispersyncPositionMutation,
  useGetWhispersyncPositionQuery,
} from "@/api/storiesQuery";
import {
  Bookmark,
  Search,
  ArrowLeft,
  Settings2,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  BookOpen,
  Scroll,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Headphones,
  Sparkles,
  Highlighter,
  MessageSquare,
  Trash2,
  AlignLeft,
  AlignJustify,
  AlignCenter,
  Maximize2,
  Minimize2,
  Type,
  Globe,
  SkipBack,
  SkipForward,
  Sun,
  Moon } from "lucide-react-native";

import { AppText } from "@/components/ui/AppText";
import ResponsiveSheet from "@/components/ui/shared/ResponsiveSheet";
import { selectIsDark } from "@/redux/features/themeSlice";
import {
  useGetChapterContentQuery,
  useGetStreamTokenQuery,
  useSyncStoryProgressMutation,
  useToggleStoryBookmarkMutation,
  useAddStoryHighlightMutation,
  useDeleteStoryHighlightMutation
} from "@/api/storiesQuery";
import type { StoryDetail, HighlightItem } from "@/api/storiesQuery";

/* ── Types ───────────────────────────────────────────── */

interface EbookReadContentProps {
  story: StoryDetail;
  startAsAudio?: boolean;
}

export type FontSize = "small" | "medium" | "large";
export type ReadingThemeKey = "light" | "sepia" | "dark" | "oled" | "victorian" | "forest" | "cozy" | "cyber";
export type ReadingMode = "scroll" | "paginate" | "audiobook" | "slideshow";

export interface ReadingTheme {
  name: string;
  bg: string;
  surfaceCard: string;
  textMain: string;
  textSecondary: string;
  accent: string;
  borderSoft: string;
  isDark: boolean;
}

export const READING_THEMES: Record<ReadingThemeKey, ReadingTheme> = {
  light: {
    name: "Pure Light",
    bg: "#FFFFFF",
    surfaceCard: "#F8FAFC",
    textMain: "#0F172A",
    textSecondary: "#64748B",
    accent: "#0EA5E9",
    borderSoft: "#E2E8F0",
    isDark: false },
  sepia: {
    name: "Warm Sepia",
    bg: "#FBF7EE",
    surfaceCard: "#F3EDE0",
    textMain: "#433422",
    textSecondary: "#8C7A6B",
    accent: "#D97706",
    borderSoft: "#E8DEC8",
    isDark: false },
  dark: {
    name: "Midnight Dark",
    bg: "#0F172A",
    surfaceCard: "#1E293B",
    textMain: "#F8FAFC",
    textSecondary: "#94A3B8",
    accent: "#38BDF8",
    borderSoft: "#334155",
    isDark: true },
  oled: {
    name: "Pitch OLED",
    bg: "#000000",
    surfaceCard: "#121212",
    textMain: "#E2E8F0",
    textSecondary: "#64748B",
    accent: "#0EA5E9",
    borderSoft: "#262626",
    isDark: true },
  victorian: {
    name: "Victorian Gothic 🏰",
    bg: "#121016",
    surfaceCard: "#1B1724",
    textMain: "#F1EDF7",
    textSecondary: "#9E95AD",
    accent: "#A855F7",
    borderSoft: "rgba(168, 85, 247, 0.2)",
    isDark: true },
  forest: {
    name: "Mystic Forest 🌲",
    bg: "#0D1813",
    surfaceCard: "#14251D",
    textMain: "#ECFDF5",
    textSecondary: "#6EE7B7",
    accent: "#10B981",
    borderSoft: "rgba(16, 185, 129, 0.2)",
    isDark: true },
  cozy: {
    name: "Cozy Fireside ☕",
    bg: "#1C1410",
    surfaceCard: "#2B1F1A",
    textMain: "#FEF3C7",
    textSecondary: "#D97706",
    accent: "#F59E0B",
    borderSoft: "rgba(245, 158, 11, 0.2)",
    isDark: true },
  cyber: {
    name: "Neon Cyberpunk ⚡",
    bg: "#09090E",
    surfaceCard: "#13131F",
    textMain: "#F4F4F5",
    textSecondary: "#A1A1AA",
    accent: "#EC4899",
    borderSoft: "rgba(236, 72, 153, 0.2)",
    isDark: true } };

export interface ReadingVibe {
  id: string;
  name: string;
  icon: string;
  description: string;
  themeKey: ReadingThemeKey;
  ambientId: string;
  ambientVolume: number;
}

export const READING_VIBES: ReadingVibe[] = [
  {
    id: "cozy_fireside",
    name: "Cozy Fireside ☕",
    icon: "☕",
    description: "Warm amber glow with soft relaxing piano music",
    themeKey: "cozy",
    ambientId: "soft_piano",
    ambientVolume: 0.25 },
  {
    id: "victorian_gothic",
    name: "Victorian Gothic 🏰",
    icon: "🏰",
    description: "Atmospheric dark violet with mystery strings",
    themeKey: "victorian",
    ambientId: "victorian_mystery",
    ambientVolume: 0.25 },
  {
    id: "mystic_forest",
    name: "Mystic Forest 🌲",
    icon: "🌲",
    description: "Earthy deep green dark mode with soothing rain noise",
    themeKey: "forest",
    ambientId: "rain_fireplace",
    ambientVolume: 0.3 },
  {
    id: "midnight_classic",
    name: "Midnight Classic 🌙",
    icon: "🌙",
    description: "Sleek slate dark theme with quiet background strings",
    themeKey: "dark",
    ambientId: "victorian_mystery",
    ambientVolume: 0.2 },
  {
    id: "quiet_study",
    name: "Quiet Library 📜",
    icon: "📜",
    description: "Vintage sepia parchment with gentle piano",
    themeKey: "sepia",
    ambientId: "soft_piano",
    ambientVolume: 0.15 },
];

const FONT_PRESETS: Record<FontSize, { fontSize: number; lineHeight: number; label: string }> = {
  small: { fontSize: 16, lineHeight: 28, label: "A" },
  medium: { fontSize: 19, lineHeight: 34, label: "A" },
  large: { fontSize: 23, lineHeight: 40, label: "A" } };

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5];
const SKIP_INTERVAL_OPTIONS = [5, 10, 15, 30, 45, 60];

const STORAGE_KEY_PREFIX = "ebook_chapter_pos_";
const STORAGE_KEY_THEME = "ebook_reading_theme_choice";
const STORAGE_KEY_MODE = "ebook_reading_mode_choice";

/* ── Helpers ─────────────────────────────────────────── */

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/* ── Paragraph Sync Row ── */
const ParagraphKaraokeRow = React.memo(function ParagraphKaraokeRow({
  paraText,
  start,
  end,
  active,
  highlightColor,
  fontSize,
  lineHeight,
  textMain,
  textSecondary,
  accent,
  currentTheme,
  textAlign = "justify",
  fontFamily = "sans",
  onPressWord,
  onLongPress }: {
  paraText: string;
  start: number;
  end: number;
  wordTimings?: any[];
  active: boolean;
  highlightColor?: string;
  currentPos: number;
  fontSize: number;
  lineHeight: number;
  textMain: string;
  textSecondary: string;
  accent: string;
  currentTheme: ReadingTheme;
  textAlign?: "left" | "justify" | "center";
  fontFamily?: "sans" | "serif" | "mono";
  onPressWord?: (sec: number) => void;
  onLongPress?: () => void;
}) {
  const imgMatch =
    /^\[IMAGE:\s*(https?:\/\/[^\]]+)\]/i.exec(paraText.trim()) ||
    /<img[^>]+src=["']([^"']+)["']/i.exec(paraText.trim());

  if (imgMatch) {
    const imageUrl = imgMatch[1];
    return (
      <View style={{ marginVertical: 28, width: "100%", alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            maxWidth: 580,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: currentTheme.borderSoft,
            backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
            padding: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: currentTheme.isDark ? 0.35 : 0.06,
            shadowRadius: 16 }}
        >
          {Platform.OS === "web" ? (
            <img
              src={imageUrl}
              alt="Chapter Illustration"
              style={{
                maxWidth: "100%",
                maxHeight: 460,
                width: "auto",
                height: "auto",
                borderRadius: 16,
                display: "block",
                objectFit: "contain" }}
            />
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: 360, borderRadius: 16 }}
              resizeMode="contain"
            />
          )}
          <AppText
            weight="Medium"
            style={{ fontSize: 11, color: textSecondary, marginTop: 12, fontStyle: "italic", textAlign: "center" }}
          >
            Classic Illustration • Standard Ebooks Edition
          </AppText>
        </View>
      </View>
    );
  }

  const isHeader = /^#{1,4}\s+/.test(paraText);
  const isQuote = /^>\s+/.test(paraText);

  let cleanText = paraText ? paraText.replace(/\uFFFD+/g, "’").replace(/<[^>]+>/g, "").trim() : "";
  if (!cleanText) return null;
  if (isHeader || isQuote) {
    cleanText = cleanText.replace(/^(#{1,4}|>)\s*/, "");
  }

  if (isHeader) {
    return (
      <View style={{ marginTop: 32, marginBottom: 20, alignItems: "center", width: "100%" }}>
        <AppText
          weight="Bold"
          style={{
            fontSize: Math.round(fontSize * 1.4),
            lineHeight: Math.round(fontSize * 1.8),
            color: textMain,
            letterSpacing: -0.3,
            textAlign: "center" }}
        >
          {cleanText}
        </AppText>
        <View style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: accent, marginTop: 10, opacity: 0.8 }} />
      </View>
    );
  }

  if (isQuote) {
    return (
      <Pressable
        onPress={() => onPressWord?.(start)}
        onLongPress={onLongPress}
        style={({ pressed }) => ({
          marginVertical: 18,
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 16,
          borderLeftWidth: 4,
          borderLeftColor: accent,
          backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
          opacity: pressed ? 0.85 : 1 })}
      >
        <AppText
          weight="Regular"
          style={{
            fontSize: Math.round(fontSize * 0.95),
            lineHeight: Math.round(lineHeight * 1.25),
            color: textMain,
            fontStyle: "italic" }}
        >
          "{cleanText}"
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onPressWord?.(start)}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        marginBottom: 20,
        paddingLeft: (active || highlightColor) ? 14 : 0,
        paddingRight: (active || highlightColor) ? 14 : 0,
        paddingVertical: (active || highlightColor) ? 10 : 2,
        borderRadius: (active || highlightColor) ? 14 : 0,
        borderLeftWidth: active ? 3 : highlightColor ? 3 : 0,
        borderLeftColor: active ? accent : highlightColor || "transparent",
        backgroundColor: active
          ? currentTheme.isDark
            ? "rgba(56, 189, 248, 0.12)"
            : "rgba(14, 165, 233, 0.08)"
          : highlightColor
          ? highlightColor + (currentTheme.isDark ? "35" : "40")
          : pressed
          ? currentTheme.isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.02)"
          : "transparent" })}
    >
      <AppText
        weight={active ? "Medium" : "Regular"}
        style={[
          {
            fontSize,
            lineHeight: Math.round(fontSize * 1.68),
            color: active ? (currentTheme.isDark ? "#F8FAFC" : textMain) : textMain,
            letterSpacing: 0.15,
            textAlign: textAlign as any },
          Platform.OS === "web" && fontFamily === "serif"
            ? ({ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' } as any)
            : Platform.OS === "web" && fontFamily === "mono"
            ? ({ fontFamily: '"Courier New", Courier, monospace' } as any)
            : null,
        ]}
      >
        {cleanText}
      </AppText>
    </Pressable>
  );
});

/* ── Cover Equalizer Bar Subcomponent ─────────────── */
const CoverEqualizerBar = React.memo(
  ({
    maxHeight,
    barAnim }: {
    maxHeight: number;
    barAnim: SharedValue<number>;
  }) => {
    const barStyle = useAnimatedStyle(() => ({
      height: barAnim.value * maxHeight }));

    return (
      <Animated.View
        style={[
          { width: 3, borderRadius: 2, backgroundColor: "#FFFFFF" },
          barStyle,
        ]}
      />
    );
  }
);

const HIGHLIGHT_COLORS = [
  { label: "Yellow", hex: "#FEF08A" },
  { label: "Blue", hex: "#BAE6FD" },
  { label: "Pink", hex: "#FBCFE8" },
  { label: "Green", hex: "#BBF7D0" },
];

/* ── Main Component ─────────────────────────────────── */

const EbookReadContent: React.FC<EbookReadContentProps> = ({ story, startAsAudio = false }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const globalIsDark = useSelector(selectIsDark);
  const { width, height } = useWindowDimensions();
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const chapterStub = story.chapters[currentChapterIdx];
  const totalChapters = story.chapters.length;

  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [fontSizeKey, setFontSizeKey] = useState<FontSize>("medium");
  const [themeKey, setThemeKey] = useState<ReadingThemeKey>(globalIsDark ? "dark" : "light");
  const [textAlign, setTextAlign] = useState<"left" | "justify" | "center">("justify");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("serif");
  const [fontSizeValue, setFontSizeValue] = useState<number>(18);
  const { lang: queryLang } = useLocalSearchParams<{ lang?: string | string[] }>();
  const activeLang = useMemo(() => {
    if (queryLang) return Array.isArray(queryLang) ? queryLang[0] : queryLang;
    if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const windowLang = params.get("lang");
      if (windowLang) return windowLang;
    }
    return "en";
  }, [queryLang]);

  const [desktopWidth, setDesktopWidth] = useState<number>(680);
  const maxW = desktopWidth >= 1400 ? "96%" : Math.min(width, desktopWidth);

  // Audio Playback State (Declared early so Whispersync effect can access state)
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [bookmarkedChapters, setBookmarkedChapters] = useState<number[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("am_adam");
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [isSoundscapeModalOpen, setIsSoundscapeModalOpen] = useState(false);

  // Web Text Selection Listener for Contextual Tooltip
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleSelection = () => {
        const sel = window.getSelection()?.toString();
        if (sel && sel.trim().length > 1) {
          setSelectedText(sel.trim());
        }
      };
      document.addEventListener("selectionchange", handleSelection);
      return () => document.removeEventListener("selectionchange", handleSelection);
    }
  }, []);

  // Whispersync Hooks & Prompt Modal State
  const [showWhispersyncModal, setShowWhispersyncModal] = useState<boolean>(false);
  const [hasPromptedWhispersync, setHasPromptedWhispersync] = useState<boolean>(false);

  const [syncWhispersync] = useSyncWhispersyncPositionMutation();
  const { data: whispersyncRes } = useGetWhispersyncPositionQuery(story?.slug || "", { skip: !story?.slug });

  // Auto-prompt Whispersync Modal when a remote synced position exists
  useEffect(() => {
    if (!hasPromptedWhispersync && whispersyncRes?.hasSyncedPosition && whispersyncRes?.whispersync) {
      const currentDev = Platform.OS === "web" ? "web-desktop" : Platform.OS;
      if (whispersyncRes.whispersync.deviceType !== currentDev) {
        setShowWhispersyncModal(true);
        setHasPromptedWhispersync(true);
      }
    }
  }, [whispersyncRes, hasPromptedWhispersync]);

  // Periodic Whispersync Background Auto-Sync (Every 10 seconds)
  useEffect(() => {
    if (!story?.slug) return;
    const deviceType = Platform.OS === "web" ? "web-desktop" : Platform.OS === "ios" ? "ios-mobile" : "android-mobile";

    const interval = setInterval(() => {
      syncWhispersync({
        storySlug: story.slug,
        chapterIndex: currentChapterIdx + 1,
        audioTimestampSec: audioCurrentTime,
        syncMode: isPlaying ? "listening" : "reading",
        deviceType,
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [story?.slug, currentChapterIdx, audioCurrentTime, isPlaying, syncWhispersync]);

  // Mutations
  const [syncProgress] = useSyncStoryProgressMutation();
  const [toggleBookmark] = useToggleStoryBookmarkMutation();
  const [addHighlight, { isLoading: isSavingHighlight }] = useAddStoryHighlightMutation();
  const [deleteHighlight] = useDeleteStoryHighlightMutation();

  const handleUpdateReaderSettings = useCallback(
    (updates: Partial<{
      theme: string;
      fontFamily: "sans" | "serif" | "mono";
      fontSize: number;
      textAlign: "left" | "justify" | "center";
      containerWidth: number;
    }>) => {
      let newTheme = themeKey;
      let newFont = fontFamily;
      let newSize = fontSizeValue;
      let newAlign = textAlign;
      let newWidth = desktopWidth;

      if (updates.theme) {
        newTheme = updates.theme as ReadingThemeKey;
        setThemeKey(newTheme);
      }
      if (updates.fontFamily) {
        newFont = updates.fontFamily;
        setFontFamily(newFont);
      }
      if (typeof updates.fontSize === "number") {
        newSize = updates.fontSize;
        setFontSizeValue(newSize);
        if (newSize <= 16) setFontSizeKey("small");
        else if (newSize <= 19) setFontSizeKey("medium");
        else setFontSizeKey("large");
      }
      if (updates.textAlign) {
        newAlign = updates.textAlign;
        setTextAlign(newAlign);
      }
      if (typeof updates.containerWidth === "number") {
        newWidth = updates.containerWidth;
        setDesktopWidth(newWidth);
      }

      syncProgress({
        slug: story.slug,
        chapterId: chapterStub?._id,
        readerSettings: {
          theme: newTheme,
          fontFamily: newFont,
          fontSize: newSize,
          textAlign: newAlign,
          containerWidth: newWidth } }).catch(() => {});
    },
    [themeKey, fontFamily, fontSizeValue, textAlign, desktopWidth, syncProgress, story.slug, chapterStub?._id]
  );

  const cycleDesktopWidth = useCallback(() => {
    const widths = [540, 680, 880, 1100, 1400];
    const currIdx = widths.indexOf(desktopWidth);
    const nextIdx = (currIdx + 1) % widths.length;
    handleUpdateReaderSettings({ containerWidth: widths[nextIdx] });
  }, [desktopWidth, handleUpdateReaderSettings]);

  const storyLangs = useMemo(() => story.languages || ["en"], [story.languages]);

  const handleCycleLanguage = useCallback(() => {
    if (storyLangs.length <= 1) return;
    const currIdx = storyLangs.indexOf(activeLang);
    const nextIdx = (currIdx + 1) % storyLangs.length;
    const nextLang = storyLangs[nextIdx];
    router.replace(`/ebook/read/${story.slug}?lang=${nextLang}`);
  }, [activeLang, storyLangs, story.slug, router]);

  const initialMode: ReadingMode = useMemo(() => {
    if (story.contentType === "ebook") return "scroll";
    if (story.contentType === "audiobook" || startAsAudio) return "audiobook";
    return "scroll";
  }, [story.contentType, startAsAudio]);

  const [readingMode, setReadingMode] = useState<ReadingMode>(initialMode);
  const [isChapterSheetOpen, setIsChapterSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  // Ambient Background Music State
  const AMBIENT_TRACKS = useMemo(() => [
    { id: "off", name: "Off", icon: "🚫", url: "", description: "No background ambient music" },
    { id: "soft_piano", name: "Soft Piano", icon: "🎹", url: "http://localhost:8085/audio/ambient/soft_piano.mp3", description: "Calm, relaxing piano chords" },
    { id: "victorian_mystery", name: "Victorian Mystery", icon: "🎻", url: "http://localhost:8085/audio/ambient/victorian_mystery.mp3", description: "Warm atmospheric string pad" },
    { id: "rain_fireplace", name: "Rain & Fireplace", icon: "🌧️", url: "http://localhost:8085/audio/ambient/rain_fireplace.mp3", description: "Soothing natural rain noise" },
  ], []);

  const [selectedAmbientId, setSelectedAmbientId] = useState<string>("off");
  const [ambientVolume, setAmbientVolume] = useState<number>(0.2); // 20% default
  const [isAmbientSheetOpen, setIsAmbientSheetOpen] = useState(false);

  // Vibe & Slideshow State
  const [selectedVibeId, setSelectedVibeId] = useState<string | null>(null);
  const [isVibeSheetOpen, setIsVibeSheetOpen] = useState(false);
  const [isSlideshowMode, setIsSlideshowMode] = useState(false);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Auto-advance background slideshow images with smooth cross-fade
  useEffect(() => {
    if (!isSlideshowMode) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => prev + 1);
    }, 9000);
    return () => clearInterval(interval);
  }, [isSlideshowMode]);

  const handleApplyVibe = useCallback((vibe: ReadingVibe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVibeId(vibe.id);
    setThemeKey(vibe.themeKey);
    setSelectedAmbientId(vibe.ambientId);
    setAmbientVolume(vibe.ambientVolume);
    setIsVibeSheetOpen(false);
  }, []);

  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [miniScrubberWidth, setMiniScrubberWidth] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1.0);
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null); // epoch ms
  const [sleepOnChapterEnd, setSleepOnChapterEnd] = useState(false);
  const [skipInterval, setSkipInterval] = useState(15); // seconds
  const [isCarMode, setIsCarMode] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isFirstLoadRef = useRef(true);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChapterKeyRef = useRef<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      audioElementRef.current = AudioManager.getInstance().getWebAudioElement();
    }
  }, []);
  const bgMusicElementRef = useRef<HTMLAudioElement | null>(null);
  const initialAudioTimestampRef = useRef<number>(0); // for restoring position after load
  const togglePlayPauseRef = useRef<() => void>(() => {});
  const skipIntervalRef = useRef<number>(15);
  const sleepOnChapterEndRef = useRef(false);

  // Animations
  const scrollY = useSharedValue(0);
  const readProgress = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const eq1 = useSharedValue(0.3);
  const eq2 = useSharedValue(0.3);
  const eq3 = useSharedValue(0.3);
  const eq4 = useSharedValue(0.3);
  const eq5 = useSharedValue(0.3);

  // Notes & Highlights State
  const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(false);
  const [highlightModalData, setHighlightModalData] = useState<{ paragraphIdx: number; text: string } | null>(null);
  const [highlightColor, setHighlightColor] = useState("#FEF08A");
  const [highlightNote, setHighlightNote] = useState("");

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Chapter completion tracking (client-side, merged with server data for TOC display)
  const [localCompletedChapterIds, setLocalCompletedChapterIds] = useState<Set<string>>(new Set());
  const [currentScrollProgress, setCurrentScrollProgress] = useState(0);

  // Scroll tracking refs
  const scrollYPxRef = useRef(0); // raw pixel Y for keyboard scroll nav
  const scrollProgressRef = useRef(0); // normalized 0-1 for syncing + restoration
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);
  const chapterCompletionFiredRef = useRef<Set<string>>(new Set());
  const hasUserScrolledRef = useRef(false);
  const isSearchOpenRef = useRef(false);
  const handleNextChapterRef = useRef<() => void>(() => {});
  const handlePrevChapterRef = useRef<() => void>(() => {});

  const backendBookmarks = story.userProgress?.bookmarkedChapterIds || [];
  const backendHighlights = story.userProgress?.highlights || [];

  const isCurrentChapterBookmarked = Boolean(
    chapterStub?._id && backendBookmarks.some((id) => id.toString() === chapterStub._id.toString())
  );

  const handleToggleBookmark = useCallback(async () => {
    if (!chapterStub?._id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleBookmark({ slug: story.slug, chapterId: chapterStub._id }).unwrap();
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  }, [chapterStub?._id, story.slug, toggleBookmark]);

  const handleSaveHighlight = useCallback(async () => {
    if (!chapterStub?._id || !highlightModalData) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addHighlight({
        slug: story.slug,
        chapterId: chapterStub._id,
        paragraphIdx: highlightModalData.paragraphIdx,
        selectedText: highlightModalData.text,
        note: highlightNote,
        color: highlightColor }).unwrap();
      setHighlightModalData(null);
      setHighlightNote("");
    } catch (err) {
      console.error("Failed to save highlight:", err);
    }
  }, [addHighlight, chapterStub?._id, highlightColor, highlightModalData, highlightNote, story.slug]);

  const handleDeleteHighlight = useCallback(async (highlightId?: string) => {
    if (!highlightId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await deleteHighlight({ slug: story.slug, highlightId }).unwrap();
    } catch (err) {
      console.error("Failed to delete highlight:", err);
    }
  }, [deleteHighlight, story.slug]);

  // Restore saved state 100% from MongoDB userProgress
  useEffect(() => {
    let isMounted = true;
    const restoreSavedState = async () => {
      try {
        const [savedTheme, savedMode] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_THEME),
          AsyncStorage.getItem(STORAGE_KEY_MODE),
        ]);

        if (isMounted && savedTheme && savedTheme in READING_THEMES) {
          setThemeKey(savedTheme as ReadingThemeKey);
        }
        if (isMounted && savedMode && (savedMode === "scroll" || savedMode === "paginate" || savedMode === "audiobook")) {
          setReadingMode(savedMode as ReadingMode);
        } else if (story.contentType === "ebook") {
          if (isMounted) setReadingMode("scroll");
        } else if (story.contentType === "audiobook" || startAsAudio) {
          if (isMounted) setReadingMode("audiobook");
        }
      } catch (err) {
        console.error("Failed to restore theme/mode choices:", err);
      }

      // 100% MongoDB-based state restoration from story.userProgress
      if (story.userProgress && isMounted) {
        if (story.userProgress.currentChapterId) {
          const resumeIdx = story.chapters.findIndex(
            (ch) => ch._id.toString() === story.userProgress!.currentChapterId?.toString()
          );
          if (resumeIdx !== -1) {
            setCurrentChapterIdx(resumeIdx);
          }
        }
        if (typeof story.userProgress.currentPageIdx === "number" && story.userProgress.currentPageIdx >= 0) {
          setCurrentPageIdx(story.userProgress.currentPageIdx);
        }
        if (typeof story.userProgress.audioTimestamp === "number" && story.userProgress.audioTimestamp > 0) {
          setAudioCurrentTime(story.userProgress.audioTimestamp);
          initialAudioTimestampRef.current = story.userProgress.audioTimestamp;
        }
        // Restore reader appearance settings saved from last session
        const rs = story.userProgress.readerSettings;
        if (rs) {
          if (rs.theme && rs.theme in READING_THEMES) setThemeKey(rs.theme as ReadingThemeKey);
          if (rs.fontFamily) setFontFamily(rs.fontFamily);
          if (typeof rs.fontSize === "number" && rs.fontSize > 0) {
            setFontSizeValue(rs.fontSize);
            if (rs.fontSize <= 16) setFontSizeKey("small");
            else if (rs.fontSize <= 19) setFontSizeKey("medium");
            else setFontSizeKey("large");
          }
          if (rs.textAlign) setTextAlign(rs.textAlign);
          if (typeof rs.containerWidth === "number" && rs.containerWidth > 0) setDesktopWidth(rs.containerWidth);
        }
      }

      if (isMounted) setIsStateLoaded(true);
    };

    restoreSavedState();
    return () => {
      isMounted = false;
    };
  }, [story.slug, story.chapters, story.userProgress, startAsAudio]);

  // Restore scroll position once content has loaded
  useEffect(() => {
    if (!isStateLoaded || !story.userProgress?.scrollOffset || story.userProgress.scrollOffset <= 0) return;
    const savedProgress = story.userProgress.scrollOffset;
    const tryRestore = () => {
      const contentH = contentHeightRef.current;
      const layoutH = layoutHeightRef.current;
      if (contentH > layoutH) {
        const targetY = savedProgress * (contentH - layoutH);
        scrollViewRef.current?.scrollTo({ y: targetY, animated: false });
      }
    };
    const t1 = setTimeout(tryRestore, 400);
    const t2 = setTimeout(tryRestore, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isStateLoaded, story.userProgress?.scrollOffset]);

  // Keyboard shortcuts (web only)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const hasAudio = !!audioElementRef.current?.src;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (hasAudio) {
            togglePlayPauseRef.current();
          } else {
            scrollViewRef.current?.scrollTo({ y: scrollYPxRef.current + 520, animated: true });
          }
          break;
        case "PageDown":
          e.preventDefault();
          scrollViewRef.current?.scrollTo({ y: scrollYPxRef.current + 520, animated: true });
          break;
        case "PageUp":
          e.preventDefault();
          scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollYPxRef.current - 520), animated: true });
          break;
        case "n":
        case "N":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); handleNextChapterRef.current(); }
          break;
        case "p":
        case "P":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); handlePrevChapterRef.current(); }
          break;
        case "ArrowRight":
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleNextChapterRef.current(); }
          else if (hasAudio && !e.shiftKey) { e.preventDefault(); if (audioElementRef.current) audioElementRef.current.currentTime = Math.min(audioElementRef.current.duration || 0, audioElementRef.current.currentTime + skipIntervalRef.current); }
          break;
        case "ArrowLeft":
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); handlePrevChapterRef.current(); }
          else if (hasAudio && !e.shiftKey) { e.preventDefault(); if (audioElementRef.current) audioElementRef.current.currentTime = Math.max(0, audioElementRef.current.currentTime - skipIntervalRef.current); }
          break;
        case "f":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setAreControlsVisible((v) => !v); }
          break;
        case "m":
        case "M":
          if (!e.ctrlKey && !e.metaKey && hasAudio) { e.preventDefault(); setAudioVolume((v) => v > 0 ? 0 : 1); }
          break;
        case "Escape":
          setAreControlsVisible(true);
          if (isSearchOpenRef.current) { setIsSearchOpen(false); setSearchQuery(""); }
          break;
      }
    };
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, []);

  const { data: chapterDetails, isLoading } = useGetChapterContentQuery(
    { slug: story.slug, chapterId: chapterStub?._id, lang: activeLang },
    { skip: !chapterStub?._id }
  );

  // Multi-Voice Audio Setup
  const availableVoices = useMemo(() => {
    return chapterDetails?.audioVoices?.voices || [];
  }, [chapterDetails]);

  const activeVoiceObj = useMemo(() => {
    if (availableVoices.length === 0) return null;
    return availableVoices.find((v) => v.id === selectedVoiceId) || availableVoices[0];
  }, [availableVoices, selectedVoiceId]);

  const voiceKey = activeVoiceObj?.key || "adam";

  const { data: streamTokenData } = useGetStreamTokenQuery(
    { slug: story.slug, chapterNumber: currentChapterIdx + 1, voice: voiceKey },
    { skip: !story?.slug }
  );

  const audioUrl = streamTokenData?.signedStreamUrl || activeVoiceObj?.url || chapterDetails?.audioUrl || null;

  const togglePlayPause = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const audioMgr = AudioManager.getInstance();

    if (isPlaying) {
      await audioMgr.pauseAudio();
      setIsPlaying(false);
    } else {
      const playUrl = audioUrl || (story?.slug ? `http://localhost:5012/api/v1/stories/slug/${story.slug}/stream?chapterNumber=${currentChapterIdx + 1}&voice=${voiceKey}` : null);

      if (!playUrl) {
        console.warn("No valid audio URL available to play");
        return;
      }

      // Reset seek position if current position is near or past end of track
      const targetSeek = (audioDuration > 0 && audioCurrentTime >= audioDuration - 1) ? 0 : audioCurrentTime;
      if (targetSeek === 0) {
        setAudioCurrentTime(0);
      }

      setIsAudioLoading(true);
      const success = await audioMgr.playAudio(
        playUrl,
        () => {
          setIsPlaying(false);
          if (currentChapterIdx < story.chapters.length - 1) {
            setCurrentChapterIdx((prev) => prev + 1);
          }
        },
        targetSeek
      );
      setIsAudioLoading(false);
      if (success) {
        setIsPlaying(true);
        audioMgr.setRate(playbackSpeed);
        audioMgr.updateCarPlayMediaSessionMetadata({
          title: activeChapter?.title ? (typeof activeChapter.title === "object" ? (activeChapter.title as any).en : activeChapter.title) : `Chapter ${currentChapterIdx + 1}`,
          artist: typeof story?.author === "object" ? (story.author as any).name : (story?.author || "Liiro Author"),
          album: typeof story?.title === "object" ? (story.title as any).en : (story?.title || "Liiro Audiobook"),
          artworkUrl: story?.coverImageUrl || "",
        });
        if (Platform.OS === "web") {
          audioElementRef.current = audioMgr.getWebAudioElement();
        }
      }
    }
  }, [isPlaying, audioUrl, story, currentChapterIdx, voiceKey, audioCurrentTime, audioDuration, playbackSpeed]);

  // Audio Manager Telemetry Status Listener
  useEffect(() => {
    const audioMgr = AudioManager.getInstance();
    const handleStatus = ({ position, duration }: { position: number; duration: number }) => {
      if (typeof position === "number" && !isNaN(position)) {
        setAudioCurrentTime(position);
      }
      if (typeof duration === "number" && !isNaN(duration) && duration > 0) {
        setAudioDuration(duration);
      }
    };

    audioMgr.addStatusListener(handleStatus);
    return () => {
      audioMgr.removeStatusListener(handleStatus);
    };
  }, []);

  // Auto-start audiobook playback when requested via query param or prop
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  useEffect(() => {
    if (!hasAutoStarted && (startAsAudio || readingMode === "audiobook") && story?.slug && !isPlaying) {
      setHasAutoStarted(true);
      const timer = setTimeout(() => {
        togglePlayPause();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [startAsAudio, readingMode, story?.slug, isPlaying, hasAutoStarted, togglePlayPause]);

  // Ambient Background Music Layering Synchronization
  const activeAmbientTrack = useMemo(() => {
    return AMBIENT_TRACKS.find((t) => t.id === selectedAmbientId) || AMBIENT_TRACKS[0];
  }, [AMBIENT_TRACKS, selectedAmbientId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!activeAmbientTrack.url) {
      if (bgMusicElementRef.current) {
        bgMusicElementRef.current.pause();
      }
      return;
    }

    if (!bgMusicElementRef.current) {
      bgMusicElementRef.current = new Audio(activeAmbientTrack.url);
      bgMusicElementRef.current.loop = true;
    } else if (bgMusicElementRef.current.src !== activeAmbientTrack.url) {
      bgMusicElementRef.current.pause();
      bgMusicElementRef.current.src = activeAmbientTrack.url;
      bgMusicElementRef.current.load();
    }

    const bgAudio = bgMusicElementRef.current;
    bgAudio.volume = ambientVolume;

    if (isPlaying && activeAmbientTrack.url) {
      bgAudio.play().catch((err) => console.log("Bg audio play error:", err));
    } else {
      bgAudio.pause();
    }

    return () => {
      bgAudio.pause();
    };
  }, [activeAmbientTrack, ambientVolume, isPlaying]);

  // Frame-accurate 60fps position loop for smooth Karaoke highlighting
  useEffect(() => {
    if (typeof window === "undefined" || !isPlaying) return;

    let animId: number;
    const loop = () => {
      if (audioElementRef.current) {
        setAudioCurrentTime(audioElementRef.current.currentTime || 0);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Equalizer bar + cover pulse animations
  useEffect(() => {
    const eqBars = [eq1, eq2, eq3, eq4, eq5];
    const durations = [320, 480, 260, 400, 340];
    if (isPlaying) {
      eqBars.forEach((bar, i) => {
        bar.value = withRepeat(
          withSequence(
            withTiming(1.0, { duration: durations[i], easing: Easing.inOut(Easing.ease) }),
            withTiming(0.2, { duration: durations[i], easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      });
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      eqBars.forEach((bar) => {
        bar.value = withTiming(0.3, { duration: 300, easing: Easing.inOut(Easing.ease) });
      });
      pulseAnim.value = withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) });
    }
  }, [isPlaying]);

  const seekAudio = useCallback(async (seconds: number) => {
    if (typeof seconds !== "number" || isNaN(seconds) || !isFinite(seconds)) return;
    const maxDur = typeof audioDuration === "number" && isFinite(audioDuration) && audioDuration > 0 ? audioDuration : 0;
    const targetTime = maxDur > 0 ? Math.max(0, Math.min(seconds, maxDur)) : Math.max(0, seconds);
    
    setAudioCurrentTime(targetTime);
    await AudioManager.getInstance().seekTo(targetTime);
    Haptics.selectionAsync();
  }, [audioDuration]);

  const changeSpeed = useCallback(() => {
    const nextIdx = (SPEED_OPTIONS.indexOf(playbackSpeed) + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIdx];
    setPlaybackSpeed(newSpeed);
    AudioManager.getInstance().setRate(newSpeed);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playbackSpeed]);

  // Media Session API — enables OS/browser media controls + lock screen
  useEffect(() => {
    if (Platform.OS !== "web" || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!audioUrl) return;
    const storyTitle = getLocalizedText(story.title, "", activeLang);
    const chapterTitle = getLocalizedText(chapterDetails?.title || chapterStub?.title, "", activeLang);
    try {
      navigator.mediaSession.metadata = new (window as any).MediaMetadata({
        title: chapterTitle || storyTitle,
        artist: (story.author || "LangoRead") as string,
        album: storyTitle,
        artwork: story.coverImageUrl ? [{ src: story.coverImageUrl, sizes: "512x512", type: "image/jpeg" }] : [] });
      navigator.mediaSession.setActionHandler("play", () => { audioElementRef.current?.play(); setIsPlaying(true); });
      navigator.mediaSession.setActionHandler("pause", () => { audioElementRef.current?.pause(); setIsPlaying(false); });
      navigator.mediaSession.setActionHandler("previoustrack", () => handlePrevChapterRef.current());
      navigator.mediaSession.setActionHandler("nexttrack", () => handleNextChapterRef.current());
      navigator.mediaSession.setActionHandler("seekbackward", () => { if (audioElementRef.current) { audioElementRef.current.currentTime = Math.max(0, audioElementRef.current.currentTime - skipIntervalRef.current); } });
      navigator.mediaSession.setActionHandler("seekforward", () => { if (audioElementRef.current) { audioElementRef.current.currentTime = Math.min(audioElementRef.current.duration || 0, audioElementRef.current.currentTime + skipIntervalRef.current); } });
    } catch (_) {}
    return () => {
      try {
        ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward"].forEach((action) => {
          navigator.mediaSession.setActionHandler(action as any, null);
        });
      } catch (_) {}
    };
  }, [audioUrl, story.title, story.author, story.coverImageUrl, chapterDetails?.title, chapterStub?.title, activeLang]);

  // Update mediaSession playback state
  useEffect(() => {
    if (Platform.OS !== "web" || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try { navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"; } catch (_) {}
  }, [isPlaying]);

  // Sleep timer — stop playback when countdown expires + fade volume in last 30s
  useEffect(() => {
    if (!sleepTimerEnd || !isPlaying) {
      // Restore full volume when timer is cancelled
      if (!sleepTimerEnd && audioElementRef.current) audioElementRef.current.volume = audioVolume;
      return;
    }
    const remaining = sleepTimerEnd - Date.now();
    if (remaining <= 0) {
      audioElementRef.current?.pause();
      if (audioElementRef.current) audioElementRef.current.volume = audioVolume;
      setIsPlaying(false);
      setSleepTimerEnd(null);
      return;
    }
    // Volume fade: tick every 500ms, start fading when ≤30s remain
    const fadeTick = setInterval(() => {
      const rem = sleepTimerEnd - Date.now();
      if (!audioElementRef.current) return;
      if (rem <= 30000 && rem > 0) {
        audioElementRef.current.volume = Math.max(0, audioVolume * (rem / 30000));
      } else if (rem <= 0) {
        audioElementRef.current.volume = audioVolume;
      } else {
        audioElementRef.current.volume = audioVolume;
      }
    }, 500);
    const t = setTimeout(() => {
      audioElementRef.current?.pause();
      if (audioElementRef.current) audioElementRef.current.volume = audioVolume;
      setIsPlaying(false);
      setSleepTimerEnd(null);
    }, remaining);
    return () => { clearTimeout(t); clearInterval(fadeTick); };
  }, [sleepTimerEnd, isPlaying, audioVolume]);

  // Clean Payload Text & Strip Redundant Leading Headers
  const paragraphs = useMemo(() => {
    const rawPayload = chapterDetails?.textPayload || chapterDetails?.content;
    const rawText = getLocalizedText(rawPayload, "", activeLang);
    if (!rawText) return [];
    const text = rawText.replace(/(?<!\n)\n(?!\n)/g, " ");
    const rawParas = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    const storyTitleClean = (getLocalizedText(story?.title, "", activeLang) || "").toLowerCase().trim();
    const chTitleClean = (getLocalizedText(chapterStub?.title, "", activeLang) || "").toLowerCase().trim();
    const chNum = chapterStub?.chapterNumber || currentChapterIdx + 1;

    let filtering = true;
    const cleanedParas: string[] = [];

    for (const p of rawParas) {
      const pClean = p.trim();
      const pLower = pClean.toLowerCase();

      if (filtering) {
        // Match Roman numerals (e.g. "I", "II", "III", "IV", etc.)
        const isRoman = /^[IVXLCDM]+\.?$/i.test(pClean);
        // Match Roman numeral with title (e.g. "I: Beautiful as the Day", "I. Beautiful as the Day")
        const isRomanWithTitle = /^[IVXLCDM]+[:.\s-]+/i.test(pClean) && pClean.length < 60;
        // Match Story Title (e.g. "FIVE CHILDREN AND IT")
        const isStoryTitle = Boolean(storyTitleClean && (pLower === storyTitleClean || pLower.includes(storyTitleClean)));
        // Match Chapter Title or Chapter Number duplicates
        const isChapterTitle = Boolean(chTitleClean && (pLower === chTitleClean || (chTitleClean.length > 3 && pLower.includes(chTitleClean))));
        const isChapterHeader = /^(CHAPTER|BOOK|STAVE)\s+([0-9IVXLCDM]+)\b[.\s-]*/i.test(pClean);

        if (isRoman || isRomanWithTitle || isStoryTitle || isChapterTitle || isChapterHeader) {
          continue; // Skip redundant metadata header paragraph
        } else {
          filtering = false; // Reached actual narrative content
        }
      }

      cleanedParas.push(pClean);
    }

    return cleanedParas.length > 0 ? cleanedParas : rawParas;
  }, [chapterDetails?.textPayload, chapterDetails?.content, chapterStub?.title, chapterStub?.chapterNumber, currentChapterIdx, story?.title, activeLang]);

  const processedPayload = useMemo(() => {
    return paragraphs.join("\n\n");
  }, [paragraphs]);

  const displayHeaderSubtitle = useMemo(() => {
    const rawTitle = getLocalizedText(chapterDetails?.title || chapterStub?.title, "", activeLang);
    let titleStr = rawTitle.replace(/^(CHAPTER|BOOK|STAVE)\s+[0-9IVXLCDM\d]+\b[.\s:-]*/i, "").trim();
    if (/^[IVXLCDM]+\.?$/i.test(titleStr)) {
      titleStr = "";
    }
    if (titleStr.includes(":")) {
      const parts = titleStr.split(":");
      if (/^[IVXLCDM\d\s]+$/i.test(parts[0].trim())) {
        titleStr = parts.slice(1).join(":").trim();
      }
    }
    return titleStr || `Chapter ${chapterStub?.chapterNumber || currentChapterIdx + 1}`;
  }, [chapterDetails?.title, chapterStub?.title, chapterStub?.chapterNumber, currentChapterIdx, activeLang]);

  // In-chapter search
  const searchMatches = useMemo(() => {
    const matches: number[] = [];
    if (!searchQuery.trim() || searchQuery.length < 2) return matches;
    const q = searchQuery.toLowerCase();
    paragraphs.forEach((p, i) => { if (p.toLowerCase().includes(q)) matches.push(i); });
    return matches;
  }, [searchQuery, paragraphs]);

  // "Resume from here" paragraph index — only show before user starts scrolling
  const savedScrollProgress = story.userProgress?.scrollOffset || 0;
  const resumeParaIdx = savedScrollProgress > 0.03 && paragraphs.length > 0
    ? Math.min(paragraphs.length - 1, Math.round(savedScrollProgress * paragraphs.length))
    : -1;

  // Determine Active Highlighting Index during Audio Playback
  const activeParagraphIdx = useMemo(() => {
    if (!isPlaying || !audioDuration || paragraphs.length === 0) return -1;
    const ratio = audioCurrentTime / audioDuration;
    return Math.min(Math.floor(ratio * paragraphs.length), paragraphs.length - 1);
  }, [isPlaying, audioCurrentTime, audioDuration, paragraphs.length]);

  const handleSelectTheme = useCallback((theme: ReadingThemeKey) => {
    setThemeKey(theme);
    AsyncStorage.setItem(STORAGE_KEY_THEME, theme).catch(console.error);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSelectReadingMode = useCallback((mode: ReadingMode) => {
    setReadingMode(mode);
    AsyncStorage.setItem(STORAGE_KEY_MODE, mode).catch(console.error);
    if (mode !== "audiobook" && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Chapter navigation
  useEffect(() => {
    const chapterKey = `${currentChapterIdx}-${chapterDetails?._id ?? ""}`;
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevChapterKeyRef.current = chapterKey;
      return;
    }
    if (prevChapterKeyRef.current !== null && prevChapterKeyRef.current !== chapterKey) {
      prevChapterKeyRef.current = chapterKey;
      setCurrentPageIdx(0);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      scrollYPxRef.current = 0;
      scrollProgressRef.current = 0;
      hasUserScrolledRef.current = false;
      readProgress.value = 0;
    }
  }, [currentChapterIdx, chapterDetails?._id]);

  const handleNextChapter = useCallback(() => {
    if (currentChapterIdx < story.chapters.length - 1) {
      const nextIdx = currentChapterIdx + 1;
      const nextCh = story.chapters[nextIdx];
      setCurrentChapterIdx(nextIdx);
      setCurrentPageIdx(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (story.slug && nextCh?._id) {
        syncProgress({
          slug: story.slug,
          chapterId: nextCh._id,
          currentPageIdx: 0,
          activityType: readingMode === "audiobook" ? "listening" : "reading" }).catch(console.error);
      }
    }
  }, [currentChapterIdx, story.chapters, story.slug, syncProgress, readingMode]);

  const handlePrevChapter = useCallback(() => {
    if (currentChapterIdx > 0) {
      const prevIdx = currentChapterIdx - 1;
      const prevCh = story.chapters[prevIdx];
      setCurrentChapterIdx(prevIdx);
      setCurrentPageIdx(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (story.slug && prevCh?._id) {
        syncProgress({
          slug: story.slug,
          chapterId: prevCh._id,
          currentPageIdx: 0,
          activityType: readingMode === "audiobook" ? "listening" : "reading" }).catch(console.error);
      }
    }
  }, [currentChapterIdx, story.chapters, story.slug, syncProgress, readingMode]);

  // ── Sync Activity (Reading vs Listening vs Visited) ──────────────
  // 1) Visit Tracking on Story Load
  useEffect(() => {
    if (story.slug && chapterStub?._id) {
      syncProgress({
        slug: story.slug,
        chapterId: chapterStub._id,
        activityType: "visited" }).catch(() => {});
    }
  }, [story.slug, chapterStub?._id]);

  // 2) Reading Progress Sync (Debounced on Chapter / Page change)
  useEffect(() => {
    if (!isStateLoaded || !story.slug || !chapterStub?._id) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(() => {
      syncProgress({
        slug: story.slug,
        chapterId: chapterStub._id,
        currentPageIdx,
        scrollOffset: scrollProgressRef.current,
        activityType: "reading" }).catch(() => {});
    }, 1500);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [currentChapterIdx, currentPageIdx, story.slug, chapterStub?._id, isStateLoaded]);

  // 3) Listening Progress Sync (Periodic while playing audio)
  useEffect(() => {
    if (!isPlaying || !story.slug || !chapterStub?._id) return;
    const interval = setInterval(() => {
      if (audioElementRef.current) {
        const time = audioElementRef.current.currentTime || 0;
        syncProgress({
          slug: story.slug,
          chapterId: chapterStub._id,
          audioTimestamp: time,
          activityType: "listening" }).catch(() => {});
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, story.slug, chapterStub?._id]);

  // Keep stable refs so keyboard handler doesn't need re-registration
  handleNextChapterRef.current = handleNextChapter;
  handlePrevChapterRef.current = handlePrevChapter;
  isSearchOpenRef.current = isSearchOpen;
  togglePlayPauseRef.current = togglePlayPause;
  skipIntervalRef.current = skipInterval;
  sleepOnChapterEndRef.current = sleepOnChapterEnd;

  const currentTheme = READING_THEMES[themeKey] || READING_THEMES.light;
  const activeFont = FONT_PRESETS[fontSizeKey];

  const bg = currentTheme.bg;
  const surfaceCard = currentTheme.surfaceCard;
  const textMain = currentTheme.textMain;
  const textSecondary = currentTheme.textSecondary;
  const accent = currentTheme.accent;
  const borderSoft = currentTheme.borderSoft;

  const headerBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 50], [0.88, 0.97], Extrapolation.CLAMP);
    return {
      backgroundColor: currentTheme.isDark ? `rgba(15, 23, 42, ${opacity})` : `rgba(250, 251, 253, ${opacity})`,
      borderBottomColor: currentTheme.borderSoft,
      borderBottomWidth: 1 };
  });

  const coverPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }] }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${readProgress.value * 100}%` as any }));

  if (!chapterStub) return null;

  return (
    <View style={{ backgroundColor: bg, flex: 1, width: "100%", height: "100%" }}>
      {/* ── Floating Top Bar Navigation ────────────── */}
      <Animated.View
        className="shadow-sm"
        pointerEvents={areControlsVisible ? "box-none" : "none"}
        style={[ { paddingTop: Math.max(insets.top, 8), paddingBottom: 12 },
 headerBgStyle,
 { opacity: areControlsVisible ? 1 : 0 }, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 } ]}
 >
        <View style={{ maxWidth: maxW, width: "100%", alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, gap: 12 }}>
          {/* Back button & Title block */}
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10, minWidth: 0 }}>
            <Pressable
              onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace("/"); } }}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ArrowLeft size={18} color={textMain} />
            </Pressable>

            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText weight="SemiBold" className="text-sm" style={{ color: textMain }} numberOfLines={1}>
                {getLocalizedText(story.title, "", activeLang)}
              </AppText>
              <AppText weight="Medium" className="text-[11px]" style={{ color: textSecondary }} numberOfLines={1}>
                {displayHeaderSubtitle !== `Chapter ${currentChapterIdx + 1}`
                  ? displayHeaderSubtitle
                  : `Ch. ${currentChapterIdx + 1} / ${totalChapters}`}
              </AppText>
            </View>
          </View>

          {/* Right Action Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Mode Toggle Pill – only for "both" content */}
            {story.contentType === "both" && (
              <View
                style={{
                  flexDirection: "row",
                  borderRadius: 100,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: borderSoft,
                }}
              >
                <Pressable
                  onPress={() => handleSelectReadingMode("scroll")}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: readingMode !== "audiobook" ? accent : "transparent",
                  }}
                  accessibilityLabel="Read as ebook"
                >
                  <BookOpen size={12} color={readingMode !== "audiobook" ? "#FFFFFF" : textSecondary} />
                  <AppText weight="SemiBold" style={{ fontSize: 11, color: readingMode !== "audiobook" ? "#FFFFFF" : textSecondary }}>
                    Read
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => handleSelectReadingMode("audiobook")}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: readingMode === "audiobook" ? accent : "transparent",
                  }}
                  accessibilityLabel="Listen as audiobook"
                >
                  <Headphones size={12} color={readingMode === "audiobook" ? "#FFFFFF" : textSecondary} />
                  <AppText weight="SemiBold" style={{ fontSize: 11, color: readingMode === "audiobook" ? "#FFFFFF" : textSecondary }}>
                    Audio
                  </AppText>
                </Pressable>
              </View>
            )}

            {/* In-chapter Search */}
            <Pressable
              onPress={() => { setIsSearchOpen((v) => !v); setSearchQuery(""); setCurrentMatchIdx(0); }}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSearchOpen ? accent + "30" : currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityLabel="Search in chapter"
            >
              <Search size={16} color={isSearchOpen ? accent : textMain} />
            </Pressable>

            {/* Bookmark Chapter Button */}
            <Pressable
              onPress={handleToggleBookmark}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isCurrentChapterBookmarked
                  ? accent + "25"
                  : currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityLabel="Bookmark chapter"
            >
              <Bookmark
                size={16}
                color={isCurrentChapterBookmarked ? accent : textMain}
                fill={isCurrentChapterBookmarked ? accent : "none"}
              />
            </Pressable>

            {/* Notes & Highlights Button */}
            <Pressable
              onPress={() => setIsNotesSheetOpen(true)}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: backendHighlights.length > 0 ? accent + "25" : currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityLabel="View notes and highlights"
            >
              <Highlighter size={16} color={backendHighlights.length > 0 ? accent : textMain} />
            </Pressable>

            {/* Table of Contents Button */}
            <Pressable
              onPress={() => setIsChapterSheetOpen(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                height: 36,
                borderRadius: 18,
                gap: 5,
                backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <List size={14} color={textMain} />
              <AppText weight="Medium" style={{ fontSize: 12, color: textMain }}>
                {currentChapterIdx + 1} / {totalChapters}
              </AppText>
            </Pressable>

            {/* Language Switcher Pill */}
            {storyLangs.length > 1 && (
              <Pressable
                onPress={handleCycleLanguage}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  height: 36,
                  paddingHorizontal: 10,
                  borderRadius: 18,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: accent + "60",
                  backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  opacity: pressed ? 0.7 : 1,
                })}
                accessibilityLabel="Switch reading language"
              >
                <Globe size={13} color={accent} />
                <AppText weight="Bold" style={{ fontSize: 11, color: accent, textTransform: "uppercase" }}>
                  {activeLang === "es" ? "🇪🇸 ES" : activeLang === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
                </AppText>
              </Pressable>
            )}

            {/* Quick Desktop Width Button */}
            {Platform.OS === "web" && (
              <Pressable
                onPress={cycleDesktopWidth}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  height: 36,
                  paddingHorizontal: 10,
                  borderRadius: 18,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: desktopWidth >= 1400 ? accent : borderSoft,
                  backgroundColor: desktopWidth >= 1400 ? accent + "20" : currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  opacity: pressed ? 0.7 : 1,
                })}
                accessibilityLabel="Toggle reading width"
              >
                {desktopWidth >= 1400 ? (
                  <Maximize2 size={13} color={accent} />
                ) : (
                  <Minimize2 size={13} color={textMain} />
                )}
                <AppText weight="Medium" style={{ fontSize: 11, color: desktopWidth >= 1400 ? accent : textMain }}>
                  {desktopWidth >= 1400 ? "Full" : desktopWidth >= 1100 ? "Wide" : desktopWidth >= 880 ? "Comfy" : desktopWidth >= 680 ? "Cozy" : "Narrow"}
                </AppText>
              </Pressable>
            )}

            {/* Quick Theme Toggle */}
            <Pressable
              onPress={() => handleSelectTheme(currentTheme.isDark ? "light" : "dark")}
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
              style={({ pressed }) => ({
                backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                opacity: pressed ? 0.7 : 1 })}
              accessibilityLabel="Toggle dark/light mode"
            >
              {currentTheme.isDark ? <Sun size={15} color={textMain} /> : <Moon size={15} color={textMain} />}
            </Pressable>

            {/* Ambient Soundscapes Button */}
            <Pressable
              onPress={() => setIsSoundscapeModalOpen(true)}
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
              style={({ pressed }) => ({
                backgroundColor: currentTheme.isDark ? "rgba(56,189,248,0.12)" : "rgba(14,165,233,0.1)",
                opacity: pressed ? 0.7 : 1 })}
            >
              <CloudRain size={16} color="#38BDF8" />
            </Pressable>

            {/* Appearance Settings Button */}
            <Pressable
              onPress={() => setIsSettingsSheetOpen(true)}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={({ pressed }) => ({
                backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                opacity: pressed ? 0.7 : 1 })}
            >
              <Settings2 size={16} color={textMain} />
            </Pressable>
          </View>
        </View>

        {/* In-chapter Search Bar */}
        {isSearchOpen && (
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 8, gap: 8 }}>
            <View style={{
              flex: 1, flexDirection: "row", alignItems: "center",
              backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              borderRadius: 22, paddingHorizontal: 12, height: 36 }}>
              <Search size={14} color={textSecondary} style={{ marginRight: 7 }} />
              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); setCurrentMatchIdx(0); }}
                placeholder="Find in chapter…"
                placeholderTextColor={textSecondary}
                style={{ flex: 1, color: textMain, fontSize: 14, outlineStyle: "none" } as any}
              />
              {searchQuery.length > 0 && (
                <AppText weight="Medium" style={{ fontSize: 11, color: textSecondary, marginLeft: 6 }}>
                  {searchMatches.length > 0 ? `${currentMatchIdx + 1}/${searchMatches.length}` : "0"}
                </AppText>
              )}
            </View>
            {searchMatches.length > 1 && (
              <>
                <Pressable
                  onPress={() => {
                    const prev = (currentMatchIdx - 1 + searchMatches.length) % searchMatches.length;
                    setCurrentMatchIdx(prev);
                    const el = typeof document !== "undefined" ? document.getElementById(`para-${searchMatches[prev]}`) : null;
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
                >
                  <ChevronLeft size={16} color={textMain} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    const next = (currentMatchIdx + 1) % searchMatches.length;
                    setCurrentMatchIdx(next);
                    const el = typeof document !== "undefined" ? document.getElementById(`para-${searchMatches[next]}`) : null;
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
                >
                  <ChevronRight size={16} color={textMain} />
                </Pressable>
              </>
            )}
            <Pressable onPress={() => { setIsSearchOpen(false); setSearchQuery(""); }} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
              <X size={16} color={textSecondary} />
            </Pressable>
          </View>
        )}

        {/* Reading Progress Bar */}
        {readingMode !== "audiobook" && !isSlideshowMode && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
            <Animated.View style={[{ position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: accent, borderRadius: 2 }, progressBarStyle]} />
          </View>
        )}
      </Animated.View>

      {/* ── Main Content Area ──────────────────────── */}
      <View style={{ flex: 1, width: "100%", height: "100%", overflow: "hidden" }}>
        {isLoading ? (
          <Animated.View entering={FadeIn.delay(300)} style={{ maxWidth: maxW, paddingVertical: 96, alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, width: '100%' }}>
            <ActivityIndicator size="large" color={accent} />
            <AppText className="text-sm" style={{ color: textSecondary }}>
              Loading chapter content…
            </AppText>
          </Animated.View>
        ) : isSlideshowMode ? (
          /* ── IMMERSIVE VISUAL SLIDESHOW MODE (Smooth Cross-Fade Background + Clean Unhighlighted Text) ── */
          <Animated.View entering={FadeIn.duration(400)} style={{ width: "100%", height: "100%", minHeight: 600, alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            {/* Smooth Cross-Fade Background Image Layer */}
            {(() => {
              const bgImages = [
                "http://localhost:8085/images/illustrations/jekyll_door_street.png",
                story.coverImageUrl || "http://localhost:8085/images/illustrations/jekyll_door_street.png",
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop"
              ];
              const activeUri = bgImages[currentSlideIdx % bgImages.length];

              return (
                <Animated.Image
                  key={activeUri}
                  entering={FadeIn.duration(1400)}
                  source={{ uri: activeUri }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                    resizeMode: "cover" }}
                />
              );
            })()}

            {/* Dark Ambient Frosted Vignette Overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(8, 8, 16, 0.74)" }}
            />

            {/* Floating Glassmorphic Quote Card (Clean, Unhighlighted Text) */}
            <View
              style={{
                width: "90%",
                maxWidth: 740,
                borderRadius: 28,
                padding: 36,
                backgroundColor: currentTheme.isDark ? "rgba(18, 18, 28, 0.86)" : "rgba(255, 255, 255, 0.92)",
                borderWidth: 1.5,
                borderColor: accent + "50",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 18 },
                shadowOpacity: 0.55,
                shadowRadius: 32,
                alignItems: "center" }}
            >
              <View style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 100, backgroundColor: accent + "25", marginBottom: 18 }}>
                <AppText weight="Bold" style={{ fontSize: 11, color: accent, letterSpacing: 1.2 }}>
                  CHAPTER {currentChapterIdx + 1} • {getLocalizedText(chapterDetails?.title || story.chapters[currentChapterIdx]?.title)}
                </AppText>
              </View>

              <AppText
                weight="Regular"
                style={{
                  fontSize: 18,
                  lineHeight: 32,
                  color: textMain,
                  textAlign: "center",
                  marginBottom: 28 }}
              >
                {getLocalizedText(chapterDetails?.textPayload || story.chapters[currentChapterIdx]?.title).slice(0, 360)}...
              </AppText>

              {/* Slide Navigation & Controls */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentSlideIdx((prev) => Math.max(0, prev - 1));
                  }}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 100,
                    backgroundColor: surfaceCard,
                    borderWidth: 1,
                    borderColor: borderSoft }}
                >
                  <AppText weight="Bold" style={{ fontSize: 13, color: textMain }}>
                    ❮ Prev Slide
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentSlideIdx((prev) => prev + 1);
                  }}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 100,
                    backgroundColor: accent }}
                >
                  <AppText weight="Bold" style={{ fontSize: 13, color: "#FFFFFF" }}>
                    Next Slide ❯
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => setIsSlideshowMode(false)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 100,
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    borderWidth: 1,
                    borderColor: "#EF4444" }}
                >
                  <AppText weight="Bold" style={{ fontSize: 13, color: "#EF4444" }}>
                    Exit Visual Mode
                  </AppText>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : readingMode === "audiobook" ? (
          /* ── AUDIOBOOK PLAYER ── */
          (() => {
            const coverW = Math.min(width - 48, 280);
            const coverH = coverW * 1.33;
            const progress = audioDuration ? audioCurrentTime / audioDuration : 0;
            const shadow = {
              shadowColor: accent,
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.4,
              shadowRadius: 28 };
            const liveText =
              activeParagraphIdx >= 0 && paragraphs.length > 0
                ? paragraphs[activeParagraphIdx].slice(0, 240)
                : paragraphs.length > 0
                ? paragraphs[0].slice(0, 240)
                : getLocalizedText(chapterDetails?.textPayload || chapterStub?.title, "", activeLang).slice(0, 240);

            // ── Car Mode ──
            if (isCarMode) {
              return (
                <View style={{ flex: 1, width: "100%", backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 32 }}>
                  {/* Exit button */}
                  <View style={{ width: "100%", flexDirection: "row", justifyContent: "flex-end" }}>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsCarMode(false); }}
                      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}
                    >
                      <AppText weight="SemiBold" style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Exit Car Mode</AppText>
                    </Pressable>
                  </View>

                  {/* Chapter info */}
                  <View style={{ alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
                    <AppText weight="Bold" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>
                      {getLocalizedText(story.title, "", activeLang)}
                    </AppText>
                    <AppText weight="Bold" style={{ fontSize: 22, color: "#FFFFFF", textAlign: "center" }} numberOfLines={2}>
                      {displayHeaderSubtitle}
                    </AppText>
                    <AppText weight="Regular" style={{ fontSize: 32, color: accent, fontVariant: ["tabular-nums"] as any, marginTop: 8 }}>
                      {formatTime(audioCurrentTime)}
                    </AppText>
                    <AppText weight="Regular" style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
                      / {formatTime(audioDuration)}
                    </AppText>
                    {/* Progress bar */}
                    <View style={{ width: "80%", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)", marginTop: 12 }}>
                      <View style={{ height: "100%", borderRadius: 2, backgroundColor: accent, width: `${(audioDuration ? audioCurrentTime / audioDuration : 0) * 100}%` as any }} />
                    </View>
                  </View>

                  {/* Controls */}
                  <View style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Prev chapter */}
                    <Pressable onPress={handlePrevChapter} disabled={currentChapterIdx === 0}
                      style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", opacity: currentChapterIdx === 0 ? 0.3 : 1 }}>
                      <SkipBack size={28} color="#FFFFFF" />
                    </Pressable>

                    {/* Rewind */}
                    <Pressable onPress={() => seekAudio(audioCurrentTime - skipInterval)}
                      style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <RotateCcw size={28} color="#FFFFFF" />
                      <AppText style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "700", marginTop: 2 }}>{skipInterval}s</AppText>
                    </Pressable>

                    {/* Play/Pause — very large */}
                    <Pressable onPress={togglePlayPause}
                      style={{ width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", backgroundColor: accent }}>
                      {isAudioLoading ? <ActivityIndicator size="large" color="#FFFFFF" /> :
                        isPlaying ? <Pause size={48} color="#FFFFFF" /> : <Play size={48} color="#FFFFFF" style={{ marginLeft: 6 }} />}
                    </Pressable>

                    {/* Forward */}
                    <Pressable onPress={() => seekAudio(audioCurrentTime + skipInterval)}
                      style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <RotateCw size={28} color="#FFFFFF" />
                      <AppText style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "700", marginTop: 2 }}>{skipInterval}s</AppText>
                    </Pressable>

                    {/* Next chapter */}
                    <Pressable onPress={handleNextChapter} disabled={currentChapterIdx >= story.chapters.length - 1}
                      style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", opacity: currentChapterIdx >= story.chapters.length - 1 ? 0.3 : 1 }}>
                      <SkipForward size={28} color="#FFFFFF" />
                    </Pressable>
                  </View>

                  {/* Speed pill */}
                  <Pressable onPress={changeSpeed}
                    style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <AppText weight="Bold" style={{ fontSize: 16, color: accent }}>{playbackSpeed}× Speed</AppText>
                  </Pressable>
                </View>
              );
            }

            return (
              <ScrollView
                style={{ flex: 1, width: "100%", alignSelf: "center" }}
                contentContainerStyle={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  minHeight: "100%",
                  paddingTop: Math.max(insets.top + 68, 76),
                  paddingBottom: Math.max(insets.bottom + 40, 48),
                }}
                showsVerticalScrollIndicator={false}
              >
                <Animated.View
                  entering={FadeInDown.duration(420)}
                  style={{ width: "100%", maxWidth: 540, alignSelf: "center", alignItems: "center", paddingHorizontal: 24 }}
                >
                  {/* ── Cover Art ── */}
                  <Animated.View
                    style={[
                      {
                        width: coverW,
                        height: coverH,
                        borderRadius: 20,
                        overflow: "hidden",
                        marginBottom: 28,
                        marginTop: 8,
                        borderWidth: 1.5,
                        borderColor: accent + "50",
                        ...shadow },
                      coverPulseStyle,
                    ]}
                  >
                    <Image
                      source={{ uri: story.coverImageUrl || "" }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    {/* Dark scrim overlay for equalizer visibility */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 60,
                        backgroundColor: "rgba(0,0,0,0.45)" }}
                    />
                    {/* Equalizer bars — always rendered, animate when playing */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: 0,
                        right: 0,
                        flexDirection: "row",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 4 }}
                    >
                      <CoverEqualizerBar barAnim={eq1} maxHeight={20} />
                      <CoverEqualizerBar barAnim={eq2} maxHeight={32} />
                      <CoverEqualizerBar barAnim={eq3} maxHeight={24} />
                      <CoverEqualizerBar barAnim={eq4} maxHeight={36} />
                      <CoverEqualizerBar barAnim={eq5} maxHeight={20} />
                    </View>
                  </Animated.View>

                  {/* ── Story Title & Chapter Label ── */}
                  <AppText
                    weight="Bold"
                    numberOfLines={2}
                    style={{ fontSize: 22, letterSpacing: -0.4, color: textMain, textAlign: "center", marginBottom: 4 }}
                  >
                    {getLocalizedText(story.title, "", activeLang)}
                  </AppText>
                  <AppText
                    weight="Medium"
                    style={{ fontSize: 13, color: accent, textAlign: "center", marginBottom: 4 }}
                  >
                    Chapter {currentChapterIdx + 1} of {totalChapters}
                  </AppText>
                  <AppText
                    weight="SemiBold"
                    numberOfLines={1}
                    style={{ fontSize: 15, color: textSecondary, textAlign: "center", marginBottom: 16 }}
                  >
                    {getLocalizedText(chapterStub?.title, "", activeLang)}
                  </AppText>

                  {/* ── Live Karaoke Card ── */}
                  <View
                    style={{
                      width: "100%",
                      borderRadius: 16,
                      padding: 20,
                      backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.05)" : surfaceCard,
                      borderWidth: 1.5,
                      borderColor: accent + "30",
                      marginBottom: 20,
                      alignItems: "center" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <Sparkles size={14} color={accent} />
                      <AppText weight="Bold" style={{ fontSize: 11, color: accent, letterSpacing: 0.8 }}>
                        LIVE NARRATION
                      </AppText>
                    </View>
                    <AppText
                      weight="Medium"
                      style={{
                        fontSize: 15,
                        lineHeight: 26,
                        color: textMain,
                        textAlign: "center",
                        fontStyle: "italic" }}
                    >
                      "{liveText}..."
                    </AppText>
                  </View>

                  {/* ── Seek Bar ── */}
                  <View style={{ width: "100%", marginBottom: 4 }}>
                    <Pressable
                      onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                      onPress={(e) => {
                        if (!audioDuration || progressBarWidth === 0) return;
                        const x = e.nativeEvent.locationX;
                        const ratio = Math.max(0, Math.min(1, x / progressBarWidth));
                        seekAudio(ratio * audioDuration);
                      }}
                      style={{ height: 28, justifyContent: "center" }}
                      accessibilityLabel="Seek audio"
                    >
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: borderSoft, position: "relative" }}>
                        {/* Fill */}
                        <View
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            borderRadius: 3,
                            backgroundColor: accent,
                            width: `${progress * 100}%` as any }}
                        />
                        {/* Thumb dot */}
                        <View
                          style={{
                            position: "absolute",
                            top: -5.5,
                            left: `${progress * 100}%` as any,
                            marginLeft: -8,
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: accent,
                            shadowColor: accent,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.5,
                            shadowRadius: 4 }}
                        />
                      </View>
                    </Pressable>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                      <AppText style={{ fontSize: 12, color: textSecondary, fontWeight: "600" }}>
                        {formatTime(audioCurrentTime)}
                      </AppText>
                      <AppText style={{ fontSize: 12, color: textSecondary, fontWeight: "600" }}>
                        {formatTime(audioDuration)}
                      </AppText>
                    </View>
                  </View>

                  {/* ── Playback Controls Row ── */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center",
                      marginTop: 16,
                      marginBottom: 20 }}
                  >
                    {/* Prev Chapter */}
                    <Pressable
                      onPress={handlePrevChapter}
                      disabled={currentChapterIdx === 0}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: surfaceCard,
                        opacity: currentChapterIdx === 0 ? 0.3 : pressed ? 0.7 : 1 })}
                      accessibilityLabel="Previous chapter"
                    >
                      <SkipBack size={22} color={textMain} />
                    </Pressable>

                    {/* Rewind */}
                    <Pressable
                      onPress={() => seekAudio(audioCurrentTime - skipInterval)}
                      style={({ pressed }) => ({
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: surfaceCard,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel={`Rewind ${skipInterval} seconds`}
                    >
                      <View style={{ flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <RotateCcw size={20} color={textMain} />
                        <AppText style={{ fontSize: 9, color: textSecondary, fontWeight: "700" }}>{skipInterval}s</AppText>
                      </View>
                    </Pressable>

                    {/* Play / Pause */}
                    <Pressable
                      onPress={togglePlayPause}
                      style={({ pressed }) => ({
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: accent,
                        opacity: pressed ? 0.88 : 1,
                        shadowColor: accent,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.45,
                        shadowRadius: 14 })}
                      accessibilityLabel={isPlaying ? "Pause" : "Play"}
                    >
                      {isAudioLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : isPlaying ? (
                        <Pause size={32} color="#FFFFFF" />
                      ) : (
                        <Play size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      )}
                    </Pressable>

                    {/* Forward */}
                    <Pressable
                      onPress={() => seekAudio(audioCurrentTime + skipInterval)}
                      style={({ pressed }) => ({
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: surfaceCard,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel={`Forward ${skipInterval} seconds`}
                    >
                      <View style={{ flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <RotateCw size={20} color={textMain} />
                        <AppText style={{ fontSize: 9, color: textSecondary, fontWeight: "700" }}>{skipInterval}s</AppText>
                      </View>
                    </Pressable>

                    {/* Next Chapter */}
                    <Pressable
                      onPress={handleNextChapter}
                      disabled={currentChapterIdx === totalChapters - 1}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: surfaceCard,
                        opacity: currentChapterIdx === totalChapters - 1 ? 0.3 : pressed ? 0.7 : 1 })}
                      accessibilityLabel="Next chapter"
                    >
                      <SkipForward size={22} color={textMain} />
                    </Pressable>
                  </View>

                  {/* ── Control Pills (Centered Wrap) ── */}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 10,
                      marginTop: 4,
                      width: "100%" }}
                  >
                    {/* Speed */}
                    <Pressable
                      onPress={changeSpeed}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 100,
                        backgroundColor: surfaceCard,
                        borderWidth: 1,
                        borderColor: borderSoft,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel="Change playback speed"
                    >
                      <AppText weight="Bold" style={{ fontSize: 13, color: accent }}>
                        {playbackSpeed}× Speed
                      </AppText>
                    </Pressable>

                    {/* Chapter List */}
                    <Pressable
                      onPress={() => setIsChapterSheetOpen(true)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 100,
                        backgroundColor: surfaceCard,
                        borderWidth: 1,
                        borderColor: borderSoft,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel="Open chapter list"
                    >
                      <List size={14} color={textMain} />
                      <AppText weight="Medium" style={{ fontSize: 13, color: textMain }}>
                        Chapters ({currentChapterIdx + 1}/{totalChapters})
                      </AppText>
                    </Pressable>

                    {/* Voice Selector */}
                    {availableVoices.length > 0 && (
                      <Pressable
                        onPress={() => setIsVoiceSheetOpen(true)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 16,
                          paddingVertical: 9,
                          borderRadius: 100,
                          backgroundColor: surfaceCard,
                          borderWidth: 1,
                          borderColor: borderSoft,
                          opacity: pressed ? 0.7 : 1 })}
                        accessibilityLabel="Select Narrator Voice"
                      >
                        <AppText weight="Bold" style={{ fontSize: 13, color: accent }}>
                          🎙️ Voice
                        </AppText>
                      </Pressable>
                    )}

                    {/* Ambient Music */}
                    <Pressable
                      onPress={() => setIsAmbientSheetOpen(true)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 100,
                        backgroundColor: surfaceCard,
                        borderWidth: 1,
                        borderColor: borderSoft,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel="Select Ambient Music"
                    >
                      <AppText weight="Bold" style={{ fontSize: 13, color: selectedAmbientId === "off" ? textSecondary : accent }}>
                        🎵 {activeAmbientTrack.name}
                      </AppText>
                    </Pressable>

                    {/* Vibe Selector */}
                    <Pressable
                      onPress={() => setIsVibeSheetOpen(true)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 100,
                        backgroundColor: selectedVibeId ? accent + "25" : surfaceCard,
                        borderWidth: 1.5,
                        borderColor: selectedVibeId ? accent : borderSoft,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel="Select Reading Vibe"
                    >
                      <AppText weight="Bold" style={{ fontSize: 13, color: selectedVibeId ? accent : textMain }}>
                        ✨ Vibe
                      </AppText>
                    </Pressable>

                    {/* Slideshow Toggle */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setIsSlideshowMode((prev) => !prev);
                      }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 100,
                        backgroundColor: isSlideshowMode ? accent : surfaceCard,
                        borderWidth: 1,
                        borderColor: isSlideshowMode ? accent : borderSoft,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel="Toggle Ambient Visual Slideshow Mode"
                    >
                      <AppText weight="Bold" style={{ fontSize: 13, color: isSlideshowMode ? "#FFFFFF" : textMain }}>
                        🖼️ Slideshow {isSlideshowMode ? "ON" : "OFF"}
                      </AppText>
                    </Pressable>
                  </View>

                  {/* ── Sleep Timer ── */}
                  {(() => {
                    const SLEEP_OPTIONS = [null, 15, 30, 45, 60, "chapter"] as const;
                    const isActive = sleepTimerEnd !== null || sleepOnChapterEnd;
                    const remainingMs = sleepTimerEnd ? Math.max(0, sleepTimerEnd - Date.now()) : null;
                    const remainingMin = remainingMs !== null ? Math.ceil(remainingMs / 60000) : null;
                    let label = "💤 Sleep Timer";
                    if (sleepOnChapterEnd) label = "💤 End of chapter";
                    else if (sleepTimerEnd && remainingMin !== null) label = `💤 ${remainingMin}m left`;
                    return (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          // Determine current slot
                          let currIdx = 0;
                          if (sleepOnChapterEnd) currIdx = SLEEP_OPTIONS.indexOf("chapter");
                          else if (sleepTimerEnd) {
                            const mins = Math.round((sleepTimerEnd - Date.now()) / 60000);
                            const found = SLEEP_OPTIONS.findIndex(o => o === mins);
                            currIdx = found !== -1 ? found : 1;
                          }
                          const next = SLEEP_OPTIONS[(currIdx + 1) % SLEEP_OPTIONS.length];
                          if (next === null) { setSleepTimerEnd(null); setSleepOnChapterEnd(false); }
                          else if (next === "chapter") { setSleepTimerEnd(null); setSleepOnChapterEnd(true); }
                          else { setSleepOnChapterEnd(false); setSleepTimerEnd(Date.now() + (next as number) * 60000); }
                        }}
                        style={({ pressed }) => ({
                          paddingHorizontal: 16,
                          paddingVertical: 9,
                          borderRadius: 100,
                          backgroundColor: isActive ? accent + "25" : surfaceCard,
                          borderWidth: 1.5,
                          borderColor: isActive ? accent : borderSoft,
                          opacity: pressed ? 0.7 : 1 })}
                        accessibilityLabel="Sleep Timer"
                      >
                        <AppText weight="Bold" style={{ fontSize: 13, color: isActive ? accent : textSecondary }}>
                          {label}
                        </AppText>
                      </Pressable>
                    );
                  })()}

                  {/* ── Narration Volume ── */}
                  <View style={{ width: "100%", paddingHorizontal: 4, marginTop: 8 }}>
                    <AppText weight="Medium" style={{ fontSize: 11, color: textSecondary, marginBottom: 6, textAlign: "center" }}>
                      Narration Volume ({Math.round(audioVolume * 100)}%)
                    </AppText>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[0.25, 0.5, 0.75, 1.0].map((vol) => {
                        const isSel = Math.abs(audioVolume - vol) < 0.15;
                        return (
                          <Pressable
                            key={vol}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setAudioVolume(vol);
                              if (audioElementRef.current) audioElementRef.current.volume = vol;
                            }}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: isSel ? accent : currentTheme.isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                              alignItems: "center" }}
                          >
                            <AppText weight="Bold" style={{ fontSize: 12, color: isSel ? "#FFFFFF" : textMain }}>
                              {Math.round(vol * 100)}%
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* ── Skip Interval ── */}
                  <View style={{ width: "100%", paddingHorizontal: 4, marginTop: 12 }}>
                    <AppText weight="Medium" style={{ fontSize: 11, color: textSecondary, marginBottom: 6, textAlign: "center" }}>
                      Skip Interval
                    </AppText>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {SKIP_INTERVAL_OPTIONS.map((secs) => {
                        const isSel = skipInterval === secs;
                        return (
                          <Pressable
                            key={secs}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSkipInterval(secs); }}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: isSel ? accent : currentTheme.isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                              alignItems: "center" }}
                          >
                            <AppText weight="Bold" style={{ fontSize: 11, color: isSel ? "#FFFFFF" : textMain }}>
                              {secs}s
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* ── Speed Fine-Tune ── */}
                  <View style={{ width: "100%", paddingHorizontal: 4, marginTop: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <AppText weight="Medium" style={{ fontSize: 11, color: textSecondary }}>Playback Speed</AppText>
                      <AppText weight="Bold" style={{ fontSize: 13, color: accent }}>{playbackSpeed}×</AppText>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
                          if (idx > 0) {
                            const s = SPEED_OPTIONS[idx - 1];
                            setPlaybackSpeed(s);
                            if (audioElementRef.current) audioElementRef.current.playbackRate = s;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        style={{
                          width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
                          backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                          opacity: playbackSpeed <= SPEED_OPTIONS[0] ? 0.3 : 1 }}
                      >
                        <AppText weight="Bold" style={{ fontSize: 20, color: textMain }}>−</AppText>
                      </Pressable>
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <View style={{ flexDirection: "row", gap: 3 }}>
                          {SPEED_OPTIONS.map((s) => (
                            <Pressable
                              key={s}
                              onPress={() => { setPlaybackSpeed(s); if (audioElementRef.current) audioElementRef.current.playbackRate = s; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s === playbackSpeed ? accent : borderSoft }}
                            />
                          ))}
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
                          if (idx < SPEED_OPTIONS.length - 1) {
                            const s = SPEED_OPTIONS[idx + 1];
                            setPlaybackSpeed(s);
                            if (audioElementRef.current) audioElementRef.current.playbackRate = s;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        style={{
                          width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
                          backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                          opacity: playbackSpeed >= SPEED_OPTIONS[SPEED_OPTIONS.length - 1] ? 0.3 : 1 }}
                      >
                        <AppText weight="Bold" style={{ fontSize: 20, color: textMain }}>+</AppText>
                      </Pressable>
                    </View>
                  </View>

                  {/* ── Car Mode Toggle ── */}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsCarMode(true); }}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16,
                      paddingHorizontal: 22, paddingVertical: 11, borderRadius: 100,
                      borderWidth: 1.5, borderColor: borderSoft, opacity: pressed ? 0.7 : 1 })}
                    accessibilityLabel="Enter car mode"
                  >
                    <AppText style={{ fontSize: 16 }}>🚗</AppText>
                    <AppText weight="SemiBold" style={{ fontSize: 13, color: textSecondary }}>Car Mode</AppText>
                  </Pressable>

                  {/* ── Switch to Ebook (only for "both") ── */}
                  {story.contentType === "both" && (
                    <Pressable
                      onPress={() => handleSelectReadingMode("scroll")}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 24,
                        paddingHorizontal: 22,
                        paddingVertical: 11,
                        borderRadius: 100,
                        borderWidth: 1.5,
                        borderColor: borderSoft,
                        opacity: pressed ? 0.7 : 1 })}
                      accessibilityLabel="Switch to ebook reading mode"
                    >
                      <BookOpen size={15} color={textSecondary} />
                      <AppText weight="SemiBold" style={{ fontSize: 13, color: textSecondary }}>
                        Read as Ebook
                      </AppText>
                    </Pressable>
                  )}
                </Animated.View>
              </ScrollView>
            );
          })()
        ) : (
          /* ── 1. CONTINUOUS VERTICAL SCROLL MODE (With Karaoke Highlighting) ── */
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1, width: "100%", height: "100%" }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: Math.max(insets.top, 8) + 58 + (isSearchOpen ? 52 : 0),
              paddingBottom: Math.max(insets.bottom, 16) + (audioUrl ? 230 : 80),
            }}
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            onLayout={(e) => { layoutHeightRef.current = e.nativeEvent.layout.height; }}
            onContentSizeChange={(_w, h) => { contentHeightRef.current = h; }}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              const contentH = e.nativeEvent.contentSize.height;
              const layoutH = e.nativeEvent.layoutMeasurement.height;
              scrollYPxRef.current = y;
              scrollY.value = y;
              const totalScrollable = contentH - layoutH;
              if (totalScrollable > 0) {
                const progress = Math.min(1, Math.max(0, y / totalScrollable));
                readProgress.value = progress;
                scrollProgressRef.current = progress;
                setCurrentScrollProgress(progress);
                // Mark chapter completed at 95% scroll
                if (progress >= 0.95 && chapterStub?._id && !chapterCompletionFiredRef.current.has(chapterStub._id)) {
                  chapterCompletionFiredRef.current.add(chapterStub._id);
                  setLocalCompletedChapterIds((prev) => new Set([...prev, chapterStub._id]));
                  syncProgress({ slug: story.slug, chapterId: chapterStub._id, scrollOffset: progress, activityType: "reading" }).catch(() => {});
                }
              }
              if (!hasUserScrolledRef.current && y > 10) hasUserScrolledRef.current = true;
            }}
          >
            <Animated.View entering={FadeInDown.duration(400)} style={{ width: "100%", maxWidth: maxW, alignSelf: "center" }}>
              {/* Typographic Chapter Header */}
              {(() => {
                const chNum = chapterStub.chapterNumber || currentChapterIdx + 1;
                const isTrivialTitle = displayHeaderSubtitle === `Chapter ${chNum}`;
                const wordCount = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
                const estMinutes = Math.max(1, Math.ceil(wordCount / 250));
                return (
                  <View style={{ marginBottom: 40, alignItems: "center", paddingTop: 8, paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: borderSoft }}>
                    {/* Chapter badge */}
                    <View style={{ backgroundColor: accent + "18", borderRadius: 100, paddingHorizontal: 16, paddingVertical: 5, marginBottom: 16 }}>
                      <AppText weight="Bold" style={{ fontSize: 11, color: accent, letterSpacing: 1.4 }}>
                        CHAPTER {chNum} OF {totalChapters}
                      </AppText>
                    </View>

                    {/* Chapter title — only when non-trivial */}
                    {!isTrivialTitle && (
                      <AppText weight="Bold" style={{ fontSize: 28, lineHeight: 38, letterSpacing: -0.3, color: textMain, textAlign: "center", marginBottom: 6 }}>
                        {displayHeaderSubtitle}
                      </AppText>
                    )}

                    {/* Ornament divider */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: isTrivialTitle ? 4 : 14, marginBottom: 12 }}>
                      <View style={{ height: 1, width: 28, backgroundColor: accent + "40" }} />
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: accent + "70" }} />
                      <View style={{ height: 1, width: 28, backgroundColor: accent + "40" }} />
                    </View>

                    {/* Estimated read time */}
                    <AppText weight="Medium" style={{ fontSize: 12, color: textSecondary }}>
                      ~{estMinutes} min read
                    </AppText>
                  </View>
                );
              })()}

              {/* Render Paragraphs with Exercise-Style Word-by-Word Karaoke Highlighting */}
              <View style={{ marginBottom: 40, minHeight: 300 }}>
                {chapterDetails?.wordTimestamps && Array.isArray(chapterDetails.wordTimestamps) && chapterDetails.wordTimestamps.length > 0 ? (
                  chapterDetails.wordTimestamps.map((row: any, idx: number) => {
                    const rowStart = row.start ?? 0;
                    const rowEnd = row.end ?? (rowStart + 5);
                    const isActive = isPlaying && audioCurrentTime >= rowStart && audioCurrentTime <= rowEnd;
                    const wordList = row.words || row.wordTimings || (Array.isArray(row) ? row : []);

                    const isSearchMatch = searchMatches.includes(idx);
                    const isCurrentMatch = isSearchMatch && searchMatches[currentMatchIdx] === idx;
                    return (
                      <View key={idx} nativeID={`para-${idx}`} style={isSearchMatch ? { backgroundColor: isCurrentMatch ? accent + "30" : accent + "12", borderRadius: 10, marginHorizontal: -6 } : undefined}>
                        <ParagraphKaraokeRow
                          paraText={row.text || ""}
                          start={rowStart}
                          end={rowEnd}
                          wordTimings={wordList}
                          active={isActive}
                          currentPos={audioCurrentTime}
                          fontSize={activeFont.fontSize}
                          lineHeight={activeFont.lineHeight}
                          textMain={textMain}
                          textSecondary={textSecondary}
                          accent={accent}
                          currentTheme={currentTheme}
                          textAlign={textAlign}
                          fontFamily={fontFamily}
                          onPressWord={audioUrl ? (sec) => seekAudio(sec) : () => setAreControlsVisible((v) => !v)}
                        />
                      </View>
                    );
                  })
                ) : (
                  (() => {
                    const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0) || 1;
                    let currTime = 0;

                    return paragraphs.map((para, idx) => {
                      const paraDur = (para.length / totalChars) * (audioDuration || 1);
                      const paraStart = currTime;
                      const paraEnd = currTime + paraDur;
                      currTime += paraDur;

                      const isActive = isPlaying && audioCurrentTime >= paraStart && audioCurrentTime <= paraEnd;
                      const matchedHighlight = backendHighlights.find(
                        (h) => h.chapterId?.toString() === chapterStub?._id?.toString() && (h.paragraphIdx === idx || h.selectedText === para)
                      );

                      const isSearchMatch = searchMatches.includes(idx);
                      const isCurrentMatch = isSearchMatch && searchMatches[currentMatchIdx] === idx;
                      const showResumeMarker = !hasUserScrolledRef.current && idx === resumeParaIdx && resumeParaIdx > 0;
                      return (
                        <View key={idx} nativeID={`para-${idx}`} style={isSearchMatch ? { backgroundColor: isCurrentMatch ? accent + "30" : accent + "12", borderRadius: 10, marginHorizontal: -6 } : undefined}>
                          {showResumeMarker && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 4 }}>
                              <View style={{ flex: 1, height: 1, backgroundColor: accent + "50" }} />
                              <AppText weight="Medium" style={{ fontSize: 10, color: accent, letterSpacing: 0.5 }}>YOU WERE HERE</AppText>
                              <View style={{ flex: 1, height: 1, backgroundColor: accent + "50" }} />
                            </View>
                          )}
                          <ParagraphKaraokeRow
                            paraText={para}
                            start={paraStart}
                            end={paraEnd}
                            active={isActive}
                            highlightColor={matchedHighlight?.color}
                            currentPos={audioCurrentTime}
                            fontSize={activeFont.fontSize}
                            lineHeight={activeFont.lineHeight}
                            textMain={textMain}
                            textSecondary={textSecondary}
                            accent={accent}
                            currentTheme={currentTheme}
                            textAlign={textAlign}
                            fontFamily={fontFamily}
                            onPressWord={audioUrl ? (sec) => seekAudio(sec) : () => setAreControlsVisible((v) => !v)}
                            onLongPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setHighlightModalData({ paragraphIdx: idx, text: para });
                            }}
                          />
                        </View>
                      );
                    });
                  })()
                )}
              </View>

            </Animated.View>
          </ScrollView>
        )}
      </View>

      {/* ── Sticky Bottom Chapter Navigation (Always Attached to Bottom) ── */}
      {readingMode !== "audiobook" && !audioUrl && !isSlideshowMode && (
        <Animated.View
          entering={FadeInUp.duration(350)}
          pointerEvents={areControlsVisible ? "box-none" : "none"}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 45,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 12) + 2,
            backgroundColor: currentTheme.isDark ? "rgba(15, 23, 42, 0.96)" : "rgba(250, 251, 253, 0.96)",
            borderTopWidth: 1,
            borderTopColor: borderSoft,
            opacity: areControlsVisible ? 1 : 0,
          }}
        >
          {/* Prev chapter */}
          <Pressable
            onPress={handlePrevChapter}
            disabled={currentChapterIdx === 0}
            style={({ pressed }) => ({
              width: 44,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              opacity: currentChapterIdx === 0 ? 0.25 : pressed ? 0.7 : 1,
            })}
            accessibilityLabel="Previous chapter"
          >
            <ChevronLeft size={20} color={textMain} />
          </Pressable>

          {/* Chapter indicator — tappable */}
          <Pressable
            onPress={() => setIsChapterSheetOpen(true)}
            style={({ pressed }) => ({
              flex: 1,
              marginHorizontal: 12,
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              paddingVertical: 6,
              borderRadius: 20,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <AppText weight="SemiBold" style={{ fontSize: 13, color: textMain }}>
                Ch. {currentChapterIdx + 1}
              </AppText>
              <AppText weight="Regular" style={{ fontSize: 13, color: textSecondary }}>
                / {totalChapters}
              </AppText>
              <AppText weight="Bold" style={{ fontSize: 12, color: accent, marginLeft: 6 }}>
                {Math.round(currentScrollProgress * 100)}%
              </AppText>
            </View>
            {displayHeaderSubtitle !== `Chapter ${currentChapterIdx + 1}` && (
              <AppText weight="Regular" numberOfLines={1} style={{ fontSize: 10, color: textSecondary, maxWidth: 220 }}>
                {displayHeaderSubtitle}
              </AppText>
            )}
            <View style={{ height: 4, width: 140, borderRadius: 2, backgroundColor: borderSoft, overflow: "hidden", marginTop: 2 }}>
              <View style={{ height: "100%", borderRadius: 2, backgroundColor: accent, width: `${Math.round(currentScrollProgress * 100)}%` as any }} />
            </View>
          </Pressable>

          {/* Next chapter */}
          <Pressable
            onPress={handleNextChapter}
            disabled={currentChapterIdx === totalChapters - 1}
            style={({ pressed }) => ({
              width: 44,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: accent + "20",
              opacity: currentChapterIdx === totalChapters - 1 ? 0.25 : pressed ? 0.7 : 1,
            })}
            accessibilityLabel="Next chapter"
          >
            <ChevronRight size={20} color={accent} />
          </Pressable>
        </Animated.View>
      )}

      {/* ── Switch to Audiobook banner (for "both" stories in ebook mode) ── */}
      {story.contentType === "both" && readingMode !== "audiobook" && !audioUrl && (
        <Pressable
          onPress={() => handleSelectReadingMode("audiobook")}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: Math.max(insets.bottom, 12) + 64,
            right: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 100,
            backgroundColor: accent,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            opacity: pressed ? 0.85 : 1,
          })}
          accessibilityLabel="Switch to audiobook mode"
        >
          <Headphones size={15} color="#FFFFFF" />
          <AppText weight="SemiBold" style={{ fontSize: 13, color: "#FFFFFF" }}>
            Listen
          </AppText>
        </Pressable>
      )}

      {/* ── 🎧 Floating Audiobook Player Dock (Always Attached to Bottom) ── */}
      {audioUrl && readingMode !== "audiobook" && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            borderTopWidth: 1,
            borderTopColor: borderSoft,
            backgroundColor: currentTheme.isDark ? "rgba(15, 23, 42, 0.96)" : "rgba(255, 251, 254, 0.96)",
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 12),
            paddingHorizontal: 20,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
          }}
        >
          <View style={{ maxWidth: maxW, width: "100%", alignSelf: "center" }}>
            {/* Audio Progress Scrubber Line */}
            <Pressable
              onLayout={(e) => setMiniScrubberWidth(e.nativeEvent.layout.width)}
              onPress={(e) => {
                if (!audioDuration || miniScrubberWidth === 0) return;
                const x = e.nativeEvent.locationX;
                const ratio = Math.max(0, Math.min(1, x / miniScrubberWidth));
                seekAudio(ratio * audioDuration);
              }}
              style={{ height: 16, justifyContent: "center", marginBottom: 6 }}
              accessibilityLabel="Seek audio"
            >
              <View style={{ height: 4, backgroundColor: borderSoft, width: "100%", borderRadius: 2, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    backgroundColor: accent,
                    width: `${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%`,
                  }}
                />
              </View>
            </Pressable>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              {/* Left: Playback Info */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 160 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: accent + "18", alignItems: "center", justifyContent: "center" }}>
                  <Headphones size={16} color={accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText weight="SemiBold" style={{ fontSize: 13, color: textMain }} numberOfLines={1}>
                    {displayHeaderSubtitle}
                  </AppText>
                  <AppText style={{ fontSize: 11, color: textSecondary }}>
                    {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                  </AppText>
                </View>
              </View>

              {/* Center: Chapter Navigation (Prev, Ch. X/Y, Next) */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {/* Prev chapter */}
                <Pressable
                  onPress={handlePrevChapter}
                  disabled={currentChapterIdx === 0}
                  style={({ pressed }) => ({
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    opacity: currentChapterIdx === 0 ? 0.25 : pressed ? 0.7 : 1,
                  })}
                  accessibilityLabel="Previous chapter"
                >
                  <ChevronLeft size={18} color={textMain} />
                </Pressable>

                {/* Chapter indicator pill — tappable */}
                <Pressable
                  onPress={() => setIsChapterSheetOpen(true)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 16,
                    backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText weight="SemiBold" style={{ fontSize: 12, color: textMain }}>
                    Ch. {currentChapterIdx + 1}/{totalChapters}
                  </AppText>
                  <AppText weight="Bold" style={{ fontSize: 11, color: accent }}>
                    {Math.round(currentScrollProgress * 100)}%
                  </AppText>
                </Pressable>

                {/* Next chapter */}
                <Pressable
                  onPress={handleNextChapter}
                  disabled={currentChapterIdx === totalChapters - 1}
                  style={({ pressed }) => ({
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: accent + "20",
                    opacity: currentChapterIdx === totalChapters - 1 ? 0.25 : pressed ? 0.7 : 1,
                  })}
                  accessibilityLabel="Next chapter"
                >
                  <ChevronRight size={18} color={accent} />
                </Pressable>
              </View>

              {/* Right: Player Controls */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {/* Rewind 15s */}
                <Pressable
                  onPress={() => seekAudio(audioCurrentTime - skipInterval)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                  accessibilityLabel={`Rewind ${skipInterval} seconds`}
                >
                  <RotateCcw size={14} color={textMain} />
                  <AppText weight="Bold" style={{ fontSize: 10, color: textMain }}>15s</AppText>
                </Pressable>

                {/* Play / Pause main button */}
                <Pressable
                  onPress={togglePlayPause}
                  style={({ pressed }) => ({
                    backgroundColor: accent,
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: accent,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {isAudioLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isPlaying ? (
                    <Pause size={17} color="#FFFFFF" />
                  ) : (
                    <Play size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  )}
                </Pressable>

                {/* Forward 15s */}
                <Pressable
                  onPress={() => seekAudio(audioCurrentTime + skipInterval)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                  accessibilityLabel={`Forward ${skipInterval} seconds`}
                >
                  <RotateCw size={14} color={textMain} />
                  <AppText weight="Bold" style={{ fontSize: 10, color: textMain }}>15s</AppText>
                </Pressable>

                {/* Speed Button */}
                <Pressable
                  onPress={changeSpeed}
                  style={({ pressed }) => ({
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: accent + "18",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText weight="Bold" style={{ fontSize: 11, color: accent }}>
                    {playbackSpeed}×
                  </AppText>
                </Pressable>

                {/* Audiobook Full Player Mode Switcher */}
                <Pressable
                  onPress={() => handleSelectReadingMode("audiobook")}
                  style={({ pressed }) => ({
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                  accessibilityLabel="Full player"
                >
                  <Maximize2 size={15} color={textMain} />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Table of Contents Sheet ─────────────────── */}
      <ResponsiveSheet
        visible={isChapterSheetOpen}
        onClose={() => setIsChapterSheetOpen(false)}
        snapPoints={["75%"]}
        backgroundColor={surfaceCard}
        isDark={currentTheme.isDark}
        maxWidth={480}
      >
        <View className="border-b" style={{ borderColor: borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <AppText weight="SemiBold" className="text-xl tracking-tight" style={{ color: textMain, marginBottom: 4 }}>
              Table of Contents
            </AppText>
            <AppText className="text-xs" style={{ color: textSecondary }}>
              {totalChapters} chapters · {getLocalizedText(story.title, "", activeLang)}
            </AppText>
          </View>
          <Pressable
            onPress={() => setIsChapterSheetOpen(false)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: pressed ? (currentTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") : currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" })}
          >
            <X size={18} color={textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 60 }} showsVerticalScrollIndicator={true}>
          {(() => {
            const completedIds = new Set([
              ...(story.userProgress?.completedChapterIds || []),
              ...localCompletedChapterIds,
            ]);
            const completedCount = story.chapters.filter((ch) => completedIds.has(ch._id)).length;
            return (
              <>
                {completedCount > 0 && (
                  <View style={{ marginBottom: 12, paddingHorizontal: 4 }}>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: borderSoft, overflow: "hidden" }}>
                      <View style={{ height: "100%", borderRadius: 2, backgroundColor: accent, width: `${(completedCount / totalChapters) * 100}%` as any }} />
                    </View>
                    <AppText weight="Medium" style={{ fontSize: 11, color: textSecondary, marginTop: 5 }}>
                      {completedCount} of {totalChapters} chapters read
                    </AppText>
                  </View>
                )}
                {story.chapters.map((ch, idx) => {
            const isActive = idx === currentChapterIdx;
            const isCompleted = completedIds.has(ch._id);
            return (
              <Pressable
                key={ch._id}
                onPress={() => {
                  setCurrentChapterIdx(idx);
                  setIsChapterSheetOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  marginBottom: 6,
                  minHeight: 60,
                  gap: 14,
                  backgroundColor: isActive
                    ? (accent + "18")
                    : pressed
                    ? (currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")
                    : "transparent",
                })}
              >
                <View
                  style={{
                    backgroundColor: isActive
                      ? accent
                      : isCompleted
                      ? (currentTheme.isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)")
                      : "transparent",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: isCompleted ? "#10B981" : borderSoft,
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isActive ? (
                    <AppText weight="Bold" style={{ fontSize: 13, color: "#FFFFFF" }}>
                      {idx + 1}
                    </AppText>
                  ) : isCompleted ? (
                    <Check size={15} color="#10B981" strokeWidth={2.5} />
                  ) : (
                    <AppText weight="Medium" style={{ fontSize: 13, color: textSecondary }}>
                      {idx + 1}
                    </AppText>
                  )}
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText weight={isActive ? "SemiBold" : "Medium"} style={{ fontSize: 14, color: isActive ? accent : textMain, marginBottom: 2 }} numberOfLines={1}>
                    {getLocalizedText(ch.title, "", activeLang)}
                  </AppText>
                  {ch.durationSeconds ? (
                    <AppText style={{ fontSize: 11, color: textSecondary }}>
                      {Math.ceil(ch.durationSeconds / 60)} min read
                    </AppText>
                  ) : null}
                </View>

                {bookmarkedChapters.includes(idx) && (
                  <View style={{ backgroundColor: accent + "20", padding: 6, borderRadius: 12 }}>
                    <Bookmark size={12} color={accent} fill={accent} />
                  </View>
                )}

                {isActive && (
                  <View style={{ backgroundColor: accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 }}>
                    <AppText weight="Bold" style={{ color: "#FFFFFF", fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase" }}>READING</AppText>
                  </View>
                )}
              </Pressable>
            );
          })}
              </>
            );
          })()}
        </ScrollView>
      </ResponsiveSheet>

      {/* ── Reading Settings Sheet ──────────────────── */}
      <ResponsiveSheet
        visible={isSettingsSheetOpen}
        onClose={() => setIsSettingsSheetOpen(false)}
        snapPoints={["85%"]}
        backgroundColor={surfaceCard}
        isDark={currentTheme.isDark}
        maxWidth={480}
      >
        <View className="border-b" style={{ borderColor: borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, marginBottom: 16 }}>
          <AppText weight="SemiBold" className="text-xl tracking-tight" style={{ color: textMain }}>
            Reading Settings
          </AppText>
          <Pressable
            onPress={() => setIsSettingsSheetOpen(false)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: pressed ? (currentTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") : currentTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" })}
          >
            <X size={18} color={textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          {/* Live Font Preview */}
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: currentTheme.bg, borderWidth: 1, borderColor: borderSoft, marginBottom: 20 }}>
            <AppText
              style={[
                {
                  fontSize: fontSizeValue,
                  lineHeight: Math.round(fontSizeValue * 1.68),
                  color: textMain,
                  textAlign: textAlign as any },
                Platform.OS === "web" && fontFamily === "serif"
                  ? ({ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' } as any)
                  : Platform.OS === "web" && fontFamily === "mono"
                  ? ({ fontFamily: '"Courier New", Courier, monospace' } as any)
                  : null,
              ]}
            >
              "The quick brown fox jumps over the lazy dog."
            </AppText>
            <AppText weight="Medium" style={{ fontSize: 10, color: textSecondary, marginTop: 8 }}>
              {fontSizeValue}px · {fontFamily} · {textAlign}
            </AppText>
          </View>

          {/* 1. Reading Layout Mode Selector */}
          <View style={{ marginBottom: 24 }}>
            <AppText weight="Medium" className="text-[11px] uppercase tracking-widest text-center" style={{ color: textSecondary, marginBottom: 12 }}>
              Reading Mode
            </AppText>
            {story.contentType === "audiobook" ? (
              <View
 className="rounded-[20px] border"
 style={{ borderColor: accent + "40", backgroundColor: accent + "15", flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 }}
 >
                <Headphones size={14} color={accent} />
                <AppText weight="SemiBold" className="text-xs" style={{ color: accent }}>
                  Audio Only
                </AppText>
              </View>
            ) : (
              <View className="border rounded-[20px]" style={{ borderColor: borderSoft, flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4 }}>
                <Pressable
                  onPress={() => handleSelectReadingMode("scroll")}
                  className="flex-1 py-2.5 flex-row items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: readingMode === "scroll" ? accent : "transparent" }}
                >
                  <Scroll size={14} color={readingMode === "scroll" ? "#FFFFFF" : textSecondary} style={{ marginRight: 4 }} />
                  <AppText weight="SemiBold" className="text-xs" style={{ color: readingMode === "scroll" ? "#FFFFFF" : textSecondary }}>
                    Text + Audio
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectReadingMode("audiobook")}
                  className="flex-1 py-2.5 flex-row items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: readingMode === "audiobook" ? accent : "transparent" }}
                >
                  <Headphones size={14} color={readingMode === "audiobook" ? "#FFFFFF" : textSecondary} style={{ marginRight: 4 }} />
                  <AppText weight="SemiBold" className="text-xs" style={{ color: readingMode === "audiobook" ? "#FFFFFF" : textSecondary }}>
                    Audiobook
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectReadingMode("paginate")}
                  className="flex-1 py-2.5 flex-row items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: readingMode === "paginate" ? accent : "transparent" }}
                >
                  <BookOpen size={14} color={readingMode === "paginate" ? "#FFFFFF" : textSecondary} style={{ marginRight: 4 }} />
                  <AppText weight="SemiBold" className="text-xs" style={{ color: readingMode === "paginate" ? "#FFFFFF" : textSecondary }}>
                    Page Cards
                  </AppText>
                </Pressable>
              </View>
            )}
          </View>

          {/* 2. Text Alignment (Microsoft Word Style) */}
          <View style={{ marginBottom: 24 }}>
            <AppText weight="Medium" className="text-[11px] uppercase tracking-widest text-center" style={{ color: textSecondary, marginBottom: 12 }}>
              Text Alignment
            </AppText>
            <View className="border rounded-[20px]" style={{ borderColor: borderSoft, flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4 }}>
              <Pressable
                onPress={() => handleUpdateReaderSettings({ textAlign: "left" })}
                className="flex-1 py-2.5 flex-row items-center justify-center rounded-2xl gap-1.5"
                style={{ backgroundColor: textAlign === "left" ? accent : "transparent" }}
              >
                <AlignLeft size={14} color={textAlign === "left" ? "#FFFFFF" : textSecondary} />
                <AppText weight="SemiBold" className="text-xs" style={{ color: textAlign === "left" ? "#FFFFFF" : textSecondary }}>
                  Left
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => handleUpdateReaderSettings({ textAlign: "justify" })}
                className="flex-1 py-2.5 flex-row items-center justify-center rounded-2xl gap-1.5"
                style={{ backgroundColor: textAlign === "justify" ? accent : "transparent" }}
              >
                <AlignJustify size={14} color={textAlign === "justify" ? "#FFFFFF" : textSecondary} />
                <AppText weight="SemiBold" className="text-xs" style={{ color: textAlign === "justify" ? "#FFFFFF" : textSecondary }}>
                  Justify
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => handleUpdateReaderSettings({ textAlign: "center" })}
                className="flex-1 py-2.5 flex-row items-center justify-center rounded-2xl gap-1.5"
                style={{ backgroundColor: textAlign === "center" ? accent : "transparent" }}
              >
                <AlignCenter size={14} color={textAlign === "center" ? "#FFFFFF" : textSecondary} />
                <AppText weight="SemiBold" className="text-xs" style={{ color: textAlign === "center" ? "#FFFFFF" : textSecondary }}>
                  Center
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* 3. Desktop Column View Width */}
          <View style={{ marginBottom: 24 }}>
            <AppText weight="Medium" className="text-[11px] uppercase tracking-widest text-center" style={{ color: textSecondary, marginBottom: 12 }}>
              Desktop Column Width
            </AppText>
            <View className="border rounded-[20px]" style={{ borderColor: borderSoft, flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4, flexWrap: 'wrap' }}>
              {[
                { label: "540px", val: 540 },
                { label: "680px", val: 680 },
                { label: "880px", val: 880 },
                { label: "1100px", val: 1100 },
                { label: "Full Width", val: 1400 },
              ].map(({ label, val }) => {
                const isSel = desktopWidth === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => handleUpdateReaderSettings({ containerWidth: val })}
                    className="flex-1 py-2 px-1 items-center justify-center rounded-2xl min-w-[62px]"
                    style={{ backgroundColor: isSel ? accent : "transparent" }}
                  >
                    <AppText weight={isSel ? "Bold" : "Medium"} className="text-xs text-center" style={{ color: isSel ? "#FFFFFF" : textSecondary }}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 4. Font Style (Family) */}
          <View style={{ marginBottom: 24 }}>
            <AppText weight="Medium" className="text-[11px] uppercase tracking-widest text-center" style={{ color: textSecondary, marginBottom: 12 }}>
              Font Style
            </AppText>
            <View className="border rounded-[20px]" style={{ borderColor: borderSoft, flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4 }}>
              {[
                { label: "Sans", val: "sans" },
                { label: "Serif (Book)", val: "serif" },
                { label: "Mono", val: "mono" },
              ].map(({ label, val }) => {
                const isSel = fontFamily === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => handleUpdateReaderSettings({ fontFamily: val as any })}
                    className="flex-1 py-2.5 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: isSel ? accent : "transparent" }}
                  >
                    <AppText weight={isSel ? "Bold" : "Medium"} className="text-xs" style={{ color: isSel ? "#FFFFFF" : textSecondary }}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Font Size */}
          <View style={{ marginBottom: 24 }}>
            <AppText weight="Medium" className="text-[11px] uppercase tracking-widest text-center" style={{ color: textSecondary, marginBottom: 12 }}>
              Font Size ({fontSizeValue}px)
            </AppText>
            <View className="border rounded-[20px]" style={{ borderColor: borderSoft, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
              {[15, 18, 21, 24].map((size, index) => {
                const isSelected = fontSizeValue === size;
                const isLast = index === 3;
                return (
                  <Pressable
                    key={size}
                    onPress={() => handleUpdateReaderSettings({ fontSize: size })}
                    className="flex-1 py-3 items-center justify-center border-r"
                    style={{
                      backgroundColor: isSelected ? (currentTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "transparent",
                      borderRightWidth: isLast ? 0 : 1,
                      borderRightColor: borderSoft }}
                  >
                    <AppText
                      weight={isSelected ? "Bold" : "Medium"}
                      style={{
                        fontSize: size,
                        color: isSelected ? textMain : textSecondary }}
                    >
                      A
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6. Themes */}
          <View style={{ marginBottom: 8 }}>
            <AppText weight="Medium" className="text-[11px] uppercase tracking-widest text-center" style={{ color: textSecondary, marginBottom: 12 }}>
              Reading Theme
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              {(Object.keys(READING_THEMES) as ReadingThemeKey[]).map((key) => {
                const theme = READING_THEMES[key];
                const isSelected = themeKey === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleUpdateReaderSettings({ theme: key })}
                    className="flex-1 py-3 rounded-2xl items-center justify-center border"
                    style={{
                      backgroundColor: theme.bg,
                      borderColor: isSelected ? accent : borderSoft,
                      borderWidth: isSelected ? 2 : 1 }}
                  >
                    <AppText weight="Bold" className="text-xs mb-0.5" style={{ color: theme.textMain }}>
                      Aa
                    </AppText>
                    <AppText className="text-[10px]" style={{ color: theme.textSecondary }}>
                      {theme.name.split(" ")[1]}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </ResponsiveSheet>

      {/* ── Notes & Highlights Sheet ── */}
      <ResponsiveSheet
        visible={isNotesSheetOpen}
        onClose={() => setIsNotesSheetOpen(false)}
        snapPoints={["65%"]}
        backgroundColor={surfaceCard}
        isDark={currentTheme.isDark}
        maxWidth={500}
      >
        <ScrollView style={{ maxHeight: 420, paddingHorizontal: 16 }}>
          {/* Bookmarks Section */}
          <View style={{ marginBottom: 20 }}>
            <AppText weight="Bold" style={{ fontSize: 15, color: textMain, marginBottom: 10 }}>
              Bookmarked Chapters ({backendBookmarks.length})
            </AppText>
            {backendBookmarks.length === 0 ? (
              <AppText style={{ fontSize: 13, color: textSecondary, fontStyle: "italic" }}>
                No chapter bookmarks yet. Tap the bookmark icon in the header to bookmark a chapter.
              </AppText>
            ) : (
              backendBookmarks.map((bId) => {
                const bIdx = story.chapters.findIndex((c) => c._id.toString() === bId.toString());
                if (bIdx === -1) return null;
                const chTitle = getLocalizedText(story.chapters[bIdx]?.title, `Chapter ${bIdx + 1}`, activeLang);
                return (
                  <Pressable
                    key={bId.toString()}
                    onPress={() => {
                      setCurrentChapterIdx(bIdx);
                      setIsNotesSheetOpen(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                      marginBottom: 6 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Bookmark size={15} color={accent} fill={accent} />
                      <AppText weight="SemiBold" style={{ fontSize: 13.5, color: textMain }}>
                        {chTitle}
                      </AppText>
                    </View>
                    <AppText weight="Bold" style={{ fontSize: 12, color: accent }}>
                      Go to Chapter
                    </AppText>
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Highlights & Notes Section */}
          <View style={{ marginBottom: 24 }}>
            <AppText weight="Bold" style={{ fontSize: 15, color: textMain, marginBottom: 10 }}>
              Text Highlights & Notes ({backendHighlights.length})
            </AppText>
            {backendHighlights.length === 0 ? (
              <AppText style={{ fontSize: 13, color: textSecondary, fontStyle: "italic" }}>
                No text highlights yet. Press and hold any paragraph to highlight text and add notes.
              </AppText>
            ) : (
              backendHighlights.map((hl) => (
                <View
                  key={hl._id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC",
                    borderLeftWidth: 4,
                    borderLeftColor: hl.color || "#FEF08A",
                    marginBottom: 10 }}
                >
                  <AppText weight="Medium" numberOfLines={3} style={{ fontSize: 13, color: textMain, marginBottom: 4 }}>
                    "{hl.selectedText}"
                  </AppText>
                  {hl.note ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <MessageSquare size={12} color={accent} />
                      <AppText weight="Regular" style={{ fontSize: 12, color: accent }}>
                        {hl.note}
                      </AppText>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <AppText style={{ fontSize: 10.5, color: textSecondary }}>
                      Paragraph #{hl.paragraphIdx + 1}
                    </AppText>
                    <Pressable onPress={() => handleDeleteHighlight(hl._id)}>
                      <Trash2 size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ResponsiveSheet>

      {/* ── Voice Selector Sheet ── */}
      <ResponsiveSheet
        visible={isVoiceSheetOpen}
        onClose={() => setIsVoiceSheetOpen(false)}
        snapPoints={["65%"]}
        backgroundColor={surfaceCard}
        isDark={currentTheme.isDark}
        maxWidth={500}
      >
        <ScrollView style={{ padding: 16 }}>
          <AppText style={{ fontSize: 13, color: textSecondary, marginBottom: 16, lineHeight: 18 }}>
            Choose your preferred AI narrator voice for listening to {getLocalizedText(story.title)} in {activeLang.toUpperCase()}:
          </AppText>

          {availableVoices.map((voice) => {
            const isSelected = voice.id === (activeVoiceObj?.id || selectedVoiceId);
            return (
              <Pressable
                key={voice.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedVoiceId(voice.id);
                  setIsVoiceSheetOpen(false);
                  AudioManager.getInstance().playAudio(voice.url, () => setIsPlaying(false)).then((success) => {
                    if (success) setIsPlaying(true);
                  });
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: isSelected ? accent + "18" : currentTheme.isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
                  borderWidth: 1.5,
                  borderColor: isSelected ? accent : borderSoft,
                  marginBottom: 12,
                  opacity: pressed ? 0.8 : 1 })}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <AppText weight="Bold" style={{ fontSize: 15, color: isSelected ? accent : textMain }}>
                      {voice.name}
                    </AppText>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, backgroundColor: accent + "20" }}>
                      <AppText weight="Bold" style={{ fontSize: 10, color: accent }}>
                        {voice.accent} {voice.gender}
                      </AppText>
                    </View>
                  </View>
                  {voice.description ? (
                    <AppText style={{ fontSize: 12, color: textSecondary, lineHeight: 16 }}>
                      {voice.description}
                    </AppText>
                  ) : null}
                </View>

                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: isSelected ? 6 : 2,
                    borderColor: isSelected ? accent : borderSoft,
                    backgroundColor: surfaceCard }}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </ResponsiveSheet>

      {/* ── Ambient Music Selector Sheet ── */}
      <ResponsiveSheet
        visible={isAmbientSheetOpen}
        onClose={() => setIsAmbientSheetOpen(false)}
        snapPoints={["70%"]}
        backgroundColor={surfaceCard}
        isDark={currentTheme.isDark}
        maxWidth={500}
      >
        <ScrollView style={{ padding: 16 }}>
          <AppText weight="Bold" style={{ fontSize: 16, color: textMain, marginBottom: 4 }}>
            Background Ambient Music 🎵
          </AppText>
          <AppText style={{ fontSize: 13, color: textSecondary, marginBottom: 16, lineHeight: 18 }}>
            Play soothing ambient music layered quietly underneath the AI narrator voice for immersive reading:
          </AppText>

          {/* Volume Presets Bar */}
          <AppText weight="SemiBold" style={{ fontSize: 12, color: textMain, marginBottom: 8 }}>
            Music Volume ({Math.round(ambientVolume * 100)}%):
          </AppText>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {[0.1, 0.2, 0.35, 0.5, 0.7].map((vol) => {
              const isSelected = Math.abs(ambientVolume - vol) < 0.02;
              return (
                <Pressable
                  key={vol}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAmbientVolume(vol);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: isSelected ? accent : currentTheme.isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                    alignItems: "center" }}
                >
                  <AppText weight="Bold" style={{ fontSize: 12, color: isSelected ? "#FFFFFF" : textMain }}>
                    {Math.round(vol * 100)}%
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Ambient Track Choices */}
          {AMBIENT_TRACKS.map((track) => {
            const isSelected = track.id === selectedAmbientId;
            return (
              <Pressable
                key={track.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedAmbientId(track.id);
                  setIsAmbientSheetOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: isSelected ? accent + "18" : currentTheme.isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
                  borderWidth: 1.5,
                  borderColor: isSelected ? accent : borderSoft,
                  marginBottom: 12,
                  opacity: pressed ? 0.8 : 1 })}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <AppText style={{ fontSize: 18 }}>{track.icon}</AppText>
                    <AppText weight="Bold" style={{ fontSize: 15, color: isSelected ? accent : textMain }}>
                      {track.name}
                    </AppText>
                  </View>
                  <AppText style={{ fontSize: 12, color: textSecondary, lineHeight: 16 }}>
                    {track.description}
                  </AppText>
                </View>

                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: isSelected ? 6 : 2,
                    borderColor: isSelected ? accent : borderSoft,
                    backgroundColor: surfaceCard }}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </ResponsiveSheet>

      {/* ── Immersive Vibe Selector Sheet ── */}
      <ResponsiveSheet
        visible={isVibeSheetOpen}
        onClose={() => setIsVibeSheetOpen(false)}
        snapPoints={["75%"]}
        backgroundColor={surfaceCard}
        isDark={currentTheme.isDark}
        maxWidth={500}
      >
        <ScrollView style={{ padding: 16 }}>
          <AppText weight="Bold" style={{ fontSize: 16, color: textMain, marginBottom: 4 }}>
            Immersive Reading Vibes ✨
          </AppText>
          <AppText style={{ fontSize: 13, color: textSecondary, marginBottom: 16, lineHeight: 18 }}>
            Transform your entire reading experience in one tap! Vibes automatically match Theme Palette + Ambient Music:
          </AppText>

          {READING_VIBES.map((vibe) => {
            const isSelected = vibe.id === selectedVibeId;
            return (
              <Pressable
                key={vibe.id}
                onPress={() => handleApplyVibe(vibe)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: isSelected ? accent + "20" : currentTheme.isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
                  borderWidth: 1.5,
                  borderColor: isSelected ? accent : borderSoft,
                  marginBottom: 12,
                  opacity: pressed ? 0.8 : 1 })}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <AppText style={{ fontSize: 20 }}>{vibe.icon}</AppText>
                    <AppText weight="Bold" style={{ fontSize: 15, color: isSelected ? accent : textMain }}>
                      {vibe.name}
                    </AppText>
                  </View>
                  <AppText style={{ fontSize: 12.5, color: textSecondary, lineHeight: 16 }}>
                    {vibe.description}
                  </AppText>
                </View>

                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 100,
                    backgroundColor: isSelected ? accent : currentTheme.isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }}
                >
                  <AppText weight="Bold" style={{ fontSize: 11, color: isSelected ? "#FFFFFF" : textMain }}>
                    {isSelected ? "Active ✨" : "Apply"}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </ResponsiveSheet>

      {/* ── Highlight & Note Creator Modal ── */}
      <Modal visible={highlightModalData !== null} transparent animationType="fade" onRequestClose={() => setHighlightModalData(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 400, borderRadius: 20, backgroundColor: surfaceCard, padding: 20, borderWidth: 1, borderColor: borderSoft }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Highlighter size={18} color={accent} />
                <AppText weight="Bold" style={{ fontSize: 16, color: textMain }}>
                  Highlight & Add Note
                </AppText>
              </View>
              <Pressable onPress={() => setHighlightModalData(null)}>
                <X size={18} color={textSecondary} />
              </Pressable>
            </View>

            {/* Paragraph Preview */}
            <AppText weight="Regular" numberOfLines={3} style={{ fontSize: 13, color: textSecondary, fontStyle: "italic", marginBottom: 14, lineHeight: 18 }}>
              "{highlightModalData?.text}"
            </AppText>

            {/* Color Palette Choice */}
            <AppText weight="Medium" style={{ fontSize: 12, color: textMain, marginBottom: 8 }}>
              Choose Highlight Color:
            </AppText>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              {HIGHLIGHT_COLORS.map((c) => (
                <Pressable
                  key={c.hex}
                  onPress={() => setHighlightColor(c.hex)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: c.hex,
                    borderWidth: highlightColor === c.hex ? 3 : 1,
                    borderColor: highlightColor === c.hex ? accent : borderSoft,
                    alignItems: "center",
                    justifyContent: "center" }}
                >
                  {highlightColor === c.hex && <Check size={14} color="#0F172A" />}
                </Pressable>
              ))}
            </View>

            {/* Note Input */}
            <AppText weight="Medium" style={{ fontSize: 12, color: textMain, marginBottom: 6 }}>
              Note / Vocabulary Definition (Optional):
            </AppText>
            <TextInput
              value={highlightNote}
              onChangeText={setHighlightNote}
              placeholder="Write a thought or vocabulary note..."
              placeholderTextColor={textSecondary}
              multiline
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: borderSoft,
                padding: 10,
                color: textMain,
                fontSize: 13,
                minHeight: 60,
                marginBottom: 18,
                textAlignVertical: "top" }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setHighlightModalData(null)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: currentTheme.isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9", alignItems: "center" }}
              >
                <AppText weight="SemiBold" style={{ color: textMain, fontSize: 13 }}>
                  Cancel
                </AppText>
              </Pressable>

              <Pressable
                onPress={handleSaveHighlight}
                disabled={isSavingHighlight}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: accent, alignItems: "center" }}
              >
                {isSavingHighlight ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText weight="Bold" style={{ color: "#FFFFFF", fontSize: 13 }}>
                    Save Highlight
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Whispersync Auto-Resume Modal */}
      <WhispersyncPromptModal
        visible={showWhispersyncModal}
        onClose={() => setShowWhispersyncModal(false)}
        whispersyncData={whispersyncRes?.whispersync}
        storyTitle={story.title}
        onConfirmResume={(targetPara, targetSec, chapterIdx) => {
          setShowWhispersyncModal(false);
          if (chapterIdx > 0 && chapterIdx <= story.chapters.length) {
            setCurrentChapterIdx(chapterIdx - 1);
          }
          if (targetSec > 0) {
            seekAudio(targetSec);
          }
        }}
      />
      {selectedText && (
        <EbookTextSelectionTooltip
          selectedText={selectedText}
          onClose={() => setSelectedText(null)}
          onHighlight={() => setSelectedText(null)}
        />
      )}
      <EbookAmbientSoundscapeModal
        visible={isSoundscapeModalOpen}
        onClose={() => setIsSoundscapeModalOpen(false)}
      />
    </View>
  );
};

export default EbookReadContent;
