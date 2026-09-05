import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AudioManager } from "@/lib/utils/audioManager";
import { offlineManager } from "@/services/offlineManager";
import { EbookReviewsSection } from "@/components/ebook/EbookReviewsSection";
import { SocialQuoteCardModal } from "@/components/ebook/social/SocialQuoteCardModal";
import { AddToShelfModal } from "@/components/ebook/collections/AddToShelfModal";
import {
  ArrowLeft,
  ChevronLeft,
  BookOpen,
  Headphones,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  FolderPlus,
  Layers,
  Play,
  X,
  Globe,
  Check,
  ExternalLink,
  Tag,
  ChevronRight,
  Bookmark,
  Download,
  Pause,
  Volume2,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Hash,
  BarChart2,
} from "lucide-react-native";

import { AppText as Text } from "@/components/ui/AppText";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import {
  useGetStoryBySlugQuery,
  useSyncStoryProgressMutation,
  useResetStoryProgressMutation,
  useMarkStoryCompletedMutation,
} from "@/api/storiesQuery";
import { getLocalizedText } from "@/utils/getLocalizedText";

const MASTER_VOICE_CATALOG: Record<
  string,
  { key: string; name: string; avatar: string; desc: string }
> = {
  michael: { key: "michael", name: "Michael", avatar: "🎙️", desc: "US Male Studio" },
  heart: { key: "heart", name: "Heart", avatar: "👩", desc: "US Female" },
  adam: { key: "adam", name: "Adam", avatar: "👨", desc: "US Male" },
  emma: { key: "emma", name: "Emma", avatar: "🇬🇧", desc: "UK Female" },
  george: { key: "george", name: "George", avatar: "🎙️", desc: "UK Male" },
  bella: { key: "bella", name: "Bella", avatar: "👩", desc: "US Female" },
  sarah: { key: "sarah", name: "Sarah", avatar: "👩", desc: "US Female" },
  nicole: { key: "nicole", name: "Nicole", avatar: "👩", desc: "US Female" },
  sky: { key: "sky", name: "Sky", avatar: "👩", desc: "US Female" },
  alice: { key: "alice", name: "Alice", avatar: "🇬🇧", desc: "UK Female" },
  daniel: { key: "daniel", name: "Daniel", avatar: "🇬🇧", desc: "UK Male" },
  lewis: { key: "lewis", name: "Lewis", avatar: "🇬🇧", desc: "UK Male" },
};

const ALL_LANGUAGE_META: Record<string, { name: string; flag: string; nativeName: string }> = {
  en: { name: "English", flag: "🇬🇧", nativeName: "English" },
  es: { name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  fr: { name: "French", flag: "🇫🇷", nativeName: "Français" },
  de: { name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  bn: { name: "Bengali", flag: "🇧🇩", nativeName: "বাংলা" },
  it: { name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  pt: { name: "Portuguese", flag: "🇵🇹", nativeName: "Português" },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function SectionHeader({ title, textColor }: { title: string; textColor: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Text
        weight="Bold"
        style={{
          fontSize: 18,
          color: textColor,
          letterSpacing: -0.4,
          fontFamily: Platform.OS === "web" ? "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, sans-serif" : undefined,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

export default function BookDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useSelector(selectIsDark);
  const tokens = useSelector(selectThemeTokens);
  const { width = 1200 } = useWindowDimensions() || {};
  const maxW = Math.min(width || 1200, 1000);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<string>("michael");

  const { data: story, isLoading, error, refetch } = useGetStoryBySlugQuery(
    { slug: slug as string, lang: selectedLang },
    { skip: !slug }
  );

  const [syncProgress] = useSyncStoryProgressMutation();
  const [resetProgress, { isLoading: isResetting }] = useResetStoryProgressMutation();
  const [markCompleted, { isLoading: isCompleting }] = useMarkStoryCompletedMutation();

  const dbLangs = useMemo(() => story?.languages || ["en"], [story?.languages]);

  const supportedLanguagesList = useMemo(() => {
    const list = dbLangs.map((code) => ({
      code,
      name: ALL_LANGUAGE_META[code]?.name || code.toUpperCase(),
      flag: ALL_LANGUAGE_META[code]?.flag || "🌐",
      nativeName: ALL_LANGUAGE_META[code]?.nativeName || code.toUpperCase(),
      isAvailable: true,
    }));
    ["fr", "bn", "es"].forEach((code) => {
      if (!dbLangs.includes(code)) {
        list.push({
          code,
          name: ALL_LANGUAGE_META[code]?.name || code.toUpperCase(),
          flag: ALL_LANGUAGE_META[code]?.flag || "🌐",
          nativeName: ALL_LANGUAGE_META[code]?.nativeName || code.toUpperCase(),
          isAvailable: false,
        });
      }
    });
    return list;
  }, [dbLangs]);

  React.useEffect(() => {
    if (slug) {
      syncProgress({ slug: slug as string, activityType: "visited" }).catch(() => {});
    }
  }, [slug, syncProgress]);

  const titleStr = getLocalizedText(story?.title, "Untitled Story");
  const synopsisStr = getLocalizedText(story?.synopsis, "No synopsis available.");
  const coverUrl = story?.coverImageUrl?.replace(/^http:\/\//, "https://");

  const chapters = story?.chapters || [];
  const totalChapters = chapters.length;
  const progress = story?.userProgress;
  const completedChapterIds = progress?.completedChapterIds || [];
  const completedCount = completedChapterIds.length;
  const isCompleted = progress?.isCompleted || (totalChapters > 0 && completedCount >= totalChapters);
  const progressPercent = totalChapters > 0 ? Math.min(100, Math.round((completedCount / totalChapters) * 100)) : 0;

  const firstChapterWithAudio = useMemo(() => story?.chapters?.find((ch) => ch.audioUrl), [story?.chapters]);

  const availableVoiceKeys = useMemo(() => {
    const keysSet = new Set<string>();
    if (Array.isArray((story as any)?.audioVoices?.availableVoices)) {
      (story as any).audioVoices.availableVoices.forEach((v: string) => keysSet.add(v.toLowerCase()));
    }

    if (Array.isArray((story as any)?.availableVoices) && (story as any).availableVoices.length > 0) {
      (story as any).availableVoices.forEach((v: string) => {
        if (v && typeof v === "string") keysSet.add(v.toLowerCase());
      });
    }

    chapters.forEach((ch: any) => {
      if (ch.audioVersions && typeof ch.audioVersions === "object") {
        Object.keys(ch.audioVersions).forEach((vKey) => {
          if (ch.audioVersions[vKey] && String(ch.audioVersions[vKey]).trim().length > 0) {
            keysSet.add(vKey.toLowerCase());
          }
        });
      }
      if (ch.audioUrl && String(ch.audioUrl).trim().length > 0) {
        const match = ch.audioUrl.match(/\/voices\/([^\/]+)\//);
        if (match) {
          keysSet.add(match[1].toLowerCase());
        }
      }
    });
    return Array.from(keysSet);
  }, [story, chapters]);

  const voiceListForUI = useMemo(() => {
    const list: Array<{ key: string; name: string; avatar: string; desc: string; isAvailable: boolean }> = [];
    
    availableVoiceKeys.forEach((key) => {
      const meta = MASTER_VOICE_CATALOG[key] || {
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        avatar: "🎙️",
        desc: "Neural Voice",
      };
      list.push({ ...meta, isAvailable: true });
    });

    ["michael", "heart", "adam", "emma", "george"].forEach((key) => {
      if (!availableVoiceKeys.includes(key)) {
        const meta = MASTER_VOICE_CATALOG[key];
        if (meta) list.push({ ...meta, isAvailable: false });
      }
    });

    return list;
  }, [availableVoiceKeys]);

  const hasAudioAvailable = useMemo(() => {
    return Boolean(story?.hasAudio && availableVoiceKeys.length > 0 && chapters.some((ch: any) => !!ch.audioUrl));
  }, [chapters, story, availableVoiceKeys]);

  React.useEffect(() => {
    if (availableVoiceKeys.length > 0 && !availableVoiceKeys.includes(selectedVoiceKey)) {
      setSelectedVoiceKey(availableVoiceKeys[0]);
    }
  }, [availableVoiceKeys]);

  const totalAudioDurationSec = useMemo(
    () => (story as any)?.totalAudioDurationSec || story?.chapters?.reduce((acc, ch) => acc + (ch.durationSeconds || 0), 0) || 0,
    [story]
  );

  const readTimeMinutes = Math.max(15, totalChapters * 12);
  const readTimeDisplay = formatDuration(readTimeMinutes);

  const currentChapter = useMemo(
    () => chapters.find((c) => c._id?.toString() === progress?.currentChapterId?.toString()),
    [chapters, progress]
  );

  const hasActiveProgress = useMemo(() => {
    if (!progress) return false;
    if (progress.isCompleted) return true;
    if (Array.isArray(progress.completedChapterIds) && progress.completedChapterIds.length > 0) return true;
    if (progress.currentChapterId && (progress.scrollOffset > 0 || progress.audioTimestamp > 0 || progress.lastReadAt || progress.lastListenedAt)) return true;
    return false;
  }, [progress]);

  const resumeLabel = !hasActiveProgress
    ? "Start Reading"
    : isCompleted
    ? "Read Again"
    : currentChapter
    ? `Resume ${getLocalizedText(currentChapter.title, "Reading", selectedLang)}`
    : completedCount > 0
    ? "Continue Reading"
    : "Start Reading";

  const CHAPTERS_PREVIEW = 8;
  const visibleChapters = chaptersExpanded ? chapters : chapters.slice(0, CHAPTERS_PREVIEW);

  const toggleSampleAudio = async () => {
    const audioMgr = AudioManager.getInstance();
    let audioUrl = firstChapterWithAudio?.audioUrl;
    if (!audioUrl && typeof slug === "string") {
      audioUrl = await audioMgr.resolveDrmStreamUrl(slug, 1);
    }
    if (!audioUrl) return;

    if (isPlayingSample) {
      await audioMgr.stopAudio();
      setIsPlayingSample(false);
    } else {
      setIsPlayingSample(true);
      const success = await audioMgr.playAudio(audioUrl, () => {
        setIsPlayingSample(false);
      });
      if (!success) setIsPlayingSample(false);
    }
  };

  React.useEffect(() => {
    if (typeof slug === "string") {
      offlineManager.isBookDownloaded(slug).then(setIsDownloaded);
    }
  }, [slug]);

  const handleToggleDownload = async () => {
    if (!slug || typeof slug !== "string") return;

    if (isDownloaded) {
      await offlineManager.removeDownloadedBook(slug);
      setIsDownloaded(false);
    } else {
      setIsDownloading(true);
      const success = await offlineManager.downloadBook(slug, (pct) => {
        setDownloadProgressPct(Math.round(pct * 100));
      });
      setIsDownloading(false);
      if (success) {
        setIsDownloaded(true);
      }
    }
  };

  const handleStartReading = () => {
    syncProgress({ slug: slug as string, activityType: "reading" }).catch(() => {});
    router.push(`/read/${slug}?lang=${selectedLang}&voice=${selectedVoiceKey}`);
  };

  const handleStartAudio = () => {
    syncProgress({ slug: slug as string, activityType: "listening" }).catch(() => {});
    router.push(`/read/${slug}?audio=true&lang=${selectedLang}&voice=${selectedVoiceKey}`);
  };

  const handleChapterPress = (chapterId: string) => {
    router.push(`/read/${slug}?chapter=${chapterId}&lang=${selectedLang}&voice=${selectedVoiceKey}`);
  };

  const handleConfirmReset = async () => {
    try {
      await resetProgress({ slug: slug as string }).unwrap();
      setIsResetModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Failed to reset progress:", err);
    }
  };

  const handleToggleComplete = async () => {
    try {
      await markCompleted({ slug: slug as string, isCompleted: !isCompleted }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  /* ── Dark Glassmorphic Theme Tokens ──────── */
  const bgColor = "#020617";
  const surfaceColor = "rgba(15, 23, 42, 0.95)";
  const textColor = "#F8FAFC";
  const textSubColor = "#94A3B8";
  const borderColor = "rgba(255,255,255,0.1)";
  const accentColor = tokens?.accentPrimary || "#0EA5E9";

  /* ── Loading / Error states ─────────────────────── */
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: "center", alignItems: "center" }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: "#EF4444", fontSize: 16, textAlign: "center", marginBottom: 16 }}>
          Failed to load book details.
        </Text>
        <Pressable onPress={() => refetch()} style={{ backgroundColor: accentColor, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 }}>
          <Text weight="Bold" style={{ color: "#FFFFFF" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const HERO_HEIGHT = Math.min(460, width * 0.92);

  return (
    <View style={{ flex: 1, width: "100%", height: "100%", backgroundColor: bgColor }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1, width: "100%", height: "100%" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      >
        <View style={{ width: "100%", maxWidth: maxW, alignSelf: "center" }}>
          {/* ── APPLE MINIMALIST HERO STAGE ───────────────────────────── */}
          <View style={{ height: HERO_HEIGHT, overflow: "hidden", position: "relative", justifyContent: "flex-end", paddingBottom: 28 }}>
            {/* Subtle frosted backdrop wallpaper */}
            {coverUrl ? (
              <ExpoImage
                source={{ uri: coverUrl }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.22 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                blurRadius={28}
              />
            ) : (
              <LinearGradient colors={["#0B132B", "#1C2541"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
            )}

            {/* Apple vignette gradient overlay */}
            <LinearGradient
              colors={["rgba(9,13,22,0.65)", "rgba(9,13,22,0.25)", bgColor]}
              locations={[0, 0.45, 1]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Floating Apple Glass Top Navigation Bar */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                flexDirection: "row",
                alignItems: "center",
                justify: "space-between",
                paddingTop: Math.max(insets.top + 8, 16),
                paddingHorizontal: 20,
                paddingBottom: 8,
                zIndex: 50,
              }}
            >
              <Pressable
                onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace("/"); } }}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 21,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                  backdropFilter: "blur(12px)",
                  borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <ChevronLeft size={22} color={textColor} />
              </Pressable>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setIsBookmarked(!isBookmarked)}
                  style={({ pressed }) => ({
                    width: 42, height: 42, borderRadius: 21,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: isBookmarked ? "rgba(239,68,68,0.85)" : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                    borderWidth: 1, borderColor: isBookmarked ? "rgba(239,68,68,0.9)" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
                    opacity: pressed ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  {isBookmarked ? <BookMarked size={18} color="#FFFFFF" /> : <Bookmark size={18} color={textColor} />}
                </Pressable>

                <Pressable
                  onPress={handleToggleDownload}
                  disabled={isDownloading}
                  style={({ pressed }) => ({
                    width: 42, height: 42, borderRadius: 21,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: isDownloaded ? "rgba(16,185,129,0.85)" : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                    borderWidth: 1, borderColor: isDownloaded ? "rgba(16,185,129,0.9)" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
                    opacity: pressed ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isDownloaded ? (
                    <CheckCircle2 size={18} color="#FFFFFF" />
                  ) : (
                    <Download size={18} color={textColor} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* ── RESPONSIVE 2-COLUMN DESKTOP / 1-COLUMN MOBILE HERO SHOWCASE ──── */}
            <View
              style={{
                width: "100%",
                maxWidth: 1000,
                alignSelf: "center",
                paddingHorizontal: 20,
                marginBottom: 28,
                flexDirection: width >= 900 ? "row" : "column",
                alignItems: width >= 900 ? "center" : "center",
                gap: width >= 900 ? 44 : 20,
              }}
            >
              {/* Left Column: 3D Artwork Showcase with Glowing Radial Halo */}
              <View style={{ alignItems: "center", position: "relative" }}>
                {/* Glowing Backlight Halo */}
                <View
                  style={{
                    position: "absolute",
                    top: -15, left: -15, right: -15, bottom: -15,
                    borderRadius: 30,
                    backgroundColor: "rgba(139, 92, 246, 0.3)",
                    opacity: 0.8,
                    ...Platform.select({
                      web: { filter: "blur(35px)" },
                    }),
                  }}
                />

                {/* 3D Artwork Cover Frame */}
                <View
                  style={{
                    width: width >= 900 ? 220 : width >= 768 ? 180 : 145,
                    aspectRatio: 2 / 3,
                    borderRadius: 22,
                    position: "relative",
                    ...Platform.select({
                      ios: {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 18 },
                        shadowOpacity: 0.5,
                        shadowRadius: 28,
                      },
                      android: { elevation: 20 },
                      web: {
                        boxShadow: "0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.15)",
                      },
                    }),
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 22,
                      overflow: "hidden",
                      borderWidth: 1.5,
                      borderColor: "rgba(255,255,255,0.25)",
                      backgroundColor: "#0F172A",
                    }}
                  >
                    {coverUrl ? (
                      <ExpoImage
                        source={{ uri: coverUrl }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={48} color={accentColor} />
                      </View>
                    )}
                  </View>

                  {/* Cover Progress Pill Overlay */}
                  {progressPercent > 0 ? (
                    <View
                      style={{
                        position: "absolute", bottom: -12, alignSelf: "center",
                        paddingHorizontal: 14, paddingVertical: 5, borderRadius: 100,
                        backgroundColor: isCompleted ? "#10B981" : "#0EA5E9",
                        borderWidth: 2, borderColor: "#020617",
                        flexDirection: "row", alignItems: "center", gap: 5,
                        ...Platform.select({ web: { boxShadow: "0 6px 16px rgba(0,0,0,0.4)" } })
                      }}
                    >
                      {isCompleted ? <CheckCircle2 size={13} color="#FFFFFF" /> : <BarChart2 size={13} color="#FFFFFF" />}
                      <Text weight="Bold" style={{ fontSize: 11, color: "#FFFFFF" }}>
                        {isCompleted ? "Completed" : `${progressPercent}% Read`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Right Column: Book Metadata, Title, Ratings & Progress */}
              <View style={{ flex: 1, alignItems: width >= 900 ? "flex-start" : "center", width: "100%" }}>
                {/* Category Pill Badge */}
                {story.category ? (
                  <Pressable
                    onPress={() => router.push(`/category/${story.category.slug}`)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 100,
                      backgroundColor: "rgba(139, 92, 246, 0.2)",
                      borderWidth: 1,
                      borderColor: "rgba(139, 92, 246, 0.4)",
                      marginBottom: 10,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Tag size={12} color="#C084FC" />
                    <Text weight="Bold" style={{ fontSize: 12, color: "#C084FC" }}>
                      {typeof story.category.name === "object" ? getLocalizedText(story.category.name) : (story.category.name || "Category")}
                    </Text>
                    <ChevronRight size={12} color="#C084FC" />
                  </Pressable>
                ) : null}

                {/* Master Book Title */}
                <Text
                  weight="Bold"
                  style={{
                    fontSize: width >= 900 ? 34 : 26,
                    color: "#F8FAFC",
                    textAlign: width >= 900 ? "left" : "center",
                    letterSpacing: -0.8,
                    lineHeight: width >= 900 ? 42 : 32,
                    marginBottom: 6,
                  }}
                >
                  {titleStr}
                </Text>

                {/* Author & Verified Badge */}
                {story.author ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
                    <Text weight="Medium" style={{ fontSize: 15, color: "#CBD5E1" }}>
                      by <Text weight="Bold" style={{ color: "#38BDF8" }}>{story.author}</Text>
                    </Text>
                    <Sparkles size={14} color="#38BDF8" />
                  </View>
                ) : null}

                {/* User Reading Progress Banner */}
                <View
                  style={{
                    width: "100%",
                    marginBottom: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 18,
                    backgroundColor: isCompleted
                      ? "rgba(16, 185, 129, 0.18)"
                      : progressPercent > 0
                      ? "rgba(14, 165, 233, 0.18)"
                      : "rgba(15, 23, 42, 0.8)",
                    borderWidth: 1,
                    borderColor: isCompleted
                      ? "rgba(16, 185, 129, 0.35)"
                      : progressPercent > 0
                      ? "rgba(14, 165, 233, 0.35)"
                      : "rgba(255, 255, 255, 0.1)",
                    alignItems: width >= 900 ? "flex-start" : "center",
                  }}
                >
                  {isCompleted ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <Text weight="Bold" style={{ fontSize: 13, color: "#10B981" }}>
                        🏆 Story Completed • 100% Read ({totalChapters}/{totalChapters} Chapters)
                      </Text>
                    </View>
                  ) : progressPercent > 0 ? (
                    <View style={{ width: "100%" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <BarChart2 size={14} color="#38BDF8" />
                          <Text weight="Bold" style={{ fontSize: 13, color: "#38BDF8" }}>
                            Reading in Progress ({progressPercent}%)
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: "#94A3B8" }}>
                          {completedCount}/{totalChapters} Chapters
                        </Text>
                      </View>
                      <View style={{ height: 6, borderRadius: 100, backgroundColor: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                        <LinearGradient
                          colors={["#38BDF8", "#0284C7"]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ width: `${progressPercent}%`, height: "100%", borderRadius: 100 }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 14 }}>🌱</Text>
                      <Text weight="SemiBold" style={{ fontSize: 13, color: "#94A3B8" }}>
                        Not started reading yet • <Text style={{ color: "#F8FAFC", fontWeight: "700" }}>{totalChapters} Chapters Ready</Text>
                      </Text>
                    </View>
                  )}
                </View>

                {/* High-Contrast Tags Pill Row */}
                {story.tags && story.tags.length > 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: width >= 900 ? "flex-start" : "center", gap: 6, marginBottom: 14 }}>
                    {story.tags.slice(0, 5).map((t: any, idx: number) => {
                      const tagObj = typeof t === "object" ? t : { name: t, slug: String(t).toLowerCase().replace(/\s+/g, "-") };
                      const tagName = typeof tagObj.name === "object" ? getLocalizedText(tagObj.name) : String(tagObj.name);
                      const tagSlug = tagObj.slug || String(tagName).toLowerCase().replace(/\s+/g, "-");
                      return (
                        <Pressable
                          key={tagSlug || idx}
                          onPress={() => router.push(`/tag/${tagSlug}`)}
                          style={({ pressed }) => ({
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 100,
                            backgroundColor: "rgba(56, 189, 248, 0.12)",
                            borderWidth: 1,
                            borderColor: "rgba(56, 189, 248, 0.3)",
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Text weight="SemiBold" style={{ fontSize: 11.5, color: "#38BDF8" }}>
                            #{tagName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {/* Feature Micro Badges (CEFR, Formats, Languages) */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: width >= 900 ? "flex-start" : "center", gap: 8 }}>
                  {story.difficultyLevel && (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: "rgba(16, 185, 129, 0.15)", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.3)" }}>
                      <Text weight="Bold" style={{ color: "#10B981", fontSize: 11.5 }}>🎯 {story.difficultyLevel}</Text>
                    </View>
                  )}

                  {story.hasIllustrations ? (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: "rgba(245, 158, 11, 0.15)", borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.3)" }}>
                      <Text weight="Bold" style={{ color: "#F59E0B", fontSize: 11.5 }}>🖼️ Illustrated Classic</Text>
                    </View>
                  ) : null}

                  <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: "rgba(139, 92, 246, 0.15)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.3)" }}>
                    <Text weight="Bold" style={{ color: "#C084FC", fontSize: 11.5 }}>
                      🎧 Ebook + Studio Audio + Reel
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── MASTER GLASSMOPHIC BODY CONTENT ─────────────────────────────── */}
          <View style={{ maxWidth: 1000, width: "100%", alignSelf: "center", paddingHorizontal: 20 }}>

            {/* Sleek Horizontal Key Metrics Glass Capsule */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 20,
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                marginBottom: 24,
              }}
            >
              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Layers size={14} color="#0EA5E9" />
                  <Text weight="Bold" style={{ fontSize: 16, color: "#F8FAFC" }}>{totalChapters}</Text>
                </View>
                <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Chapters</Text>
              </View>

              <View style={{ width: 1, height: 24, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Clock size={14} color="#8B5CF6" />
                  <Text weight="Bold" style={{ fontSize: 16, color: "#F8FAFC" }}>{readTimeDisplay}</Text>
                </View>
                <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Est. Read Time</Text>
              </View>

              <View style={{ width: 1, height: 24, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Award size={14} color="#10B981" />
                  <Text weight="Bold" style={{ fontSize: 16, color: "#F8FAFC" }}>
                    {story.difficultyLevel || (totalAudioDurationSec > 0 ? formatDuration(Math.round(totalAudioDurationSec / 60)) : "Standard")}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {story.difficultyLevel ? "CEFR Level" : totalAudioDurationSec > 0 ? "Audio Length" : "Edition"}
                </Text>
              </View>
            </View>

            {/* ── UNIFIED MEDIA COMMAND CAPSULE ────────────────────────── */}
            <View style={{ gap: 12, marginBottom: 28 }}>
              {/* Primary Dual Pill Bar: [Start/Resume Reading] + [Listen/Resume Audio] + [Watch Reel] */}
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {/* 1. Ebook Reading Pill */}
                <Pressable
                  onPress={handleStartReading}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: 200,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <LinearGradient
                    colors={["#0EA5E9", "#0284C7"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 100, gap: 8 }}
                  >
                    <BookOpen size={18} color="#FFFFFF" />
                    <Text weight="Bold" numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 14.5, letterSpacing: -0.2 }}>
                      {resumeLabel}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* 2. Audiobook Listening Pill */}
                <Pressable
                  onPress={() => {
                    if (hasAudioAvailable) {
                      handleStartAudio();
                    } else {
                      alert("Audiobook narration is currently being synthesized for this classic title. Check back soon!");
                    }
                  }}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: 200,
                    opacity: !hasAudioAvailable ? 0.6 : pressed ? 0.9 : 1,
                  })}
                >
                  <LinearGradient
                    colors={hasAudioAvailable ? ["#8B5CF6", "#7C3AED"] : ["#334155", "#1E293B"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 100, gap: 8 }}
                  >
                    <Headphones size={18} color="#FFFFFF" />
                    <Text weight="Bold" numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 14.5, letterSpacing: -0.2 }}>
                      {!hasAudioAvailable
                        ? "Audio Coming Soon"
                        : progress?.audioTimestamp
                        ? "Resume Audio"
                        : "Listen Audiobook"}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* 3. Watch Book Reel Pill */}
                {(story?.hasReels || story?.reel) && (
                  <Pressable
                    onPress={() => router.push(`/reels?reelId=${story.reel?._id || ""}`)}
                    style={({ pressed }) => ({
                      flex: 1, minWidth: 200,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <LinearGradient
                      colors={["#F43F5E", "#E11D48"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 100, gap: 8 }}
                    >
                      <Play size={18} color="#FFFFFF" />
                      <Text weight="Bold" numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 14.5, letterSpacing: -0.2 }}>
                        Watch Story Reel 🎬
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>

              {/* Secondary Glass Action Pill Bar: [Preview 30s Sample] + [Studio Narrator Selection] */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 22,
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  gap: 14,
                }}
              >
                {/* Header row: Sample Preview button & Studio Voice status */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  {firstChapterWithAudio?.audioUrl ? (
                    <Pressable
                      onPress={toggleSampleAudio}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
                        backgroundColor: isPlayingSample ? "#8B5CF6" : "rgba(139,92,246,0.18)",
                        borderWidth: 1, borderColor: isPlayingSample ? "#8B5CF6" : "rgba(139,92,246,0.35)",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      {isPlayingSample ? <Pause size={14} color="#FFFFFF" /> : <Play size={14} color="#8B5CF6" />}
                      <Text weight="Bold" style={{ color: isPlayingSample ? "#FFFFFF" : "#C084FC", fontSize: 12.5 }}>
                        {isPlayingSample ? "Playing Sample (30s)…" : "Preview 30s Sample"}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Volume2 size={16} color={hasAudioAvailable ? "#8B5CF6" : "#64748B"} />
                      <Text weight="Bold" style={{ fontSize: 14, color: "#F8FAFC" }}>Studio Voice Narrator</Text>
                    </View>
                  )}

                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: hasAudioAvailable ? "rgba(139,92,246,0.14)" : "rgba(148,163,184,0.12)" }}>
                    <Text weight="Bold" style={{ fontSize: 11, color: hasAudioAvailable ? "#8B5CF6" : "#94A3B8" }}>
                      {hasAudioAvailable ? `${availableVoiceKeys.length} ${availableVoiceKeys.length === 1 ? "Voice Ready" : "Voices Ready"}` : "Audio Coming Soon"}
                    </Text>
                  </View>
                </View>

                {/* Sleek Horizontal Scrollable Voice Selector Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
                  {voiceListForUI.map((v) => {
                    const isSelected = selectedVoiceKey === v.key;
                    return (
                      <Pressable
                        key={v.key}
                        onPress={() => {
                          if (v.isAvailable) {
                            setSelectedVoiceKey(v.key);
                          } else {
                            const fallbackName = availableVoiceKeys[0] ? (availableVoiceKeys[0].charAt(0).toUpperCase() + availableVoiceKeys[0].slice(1)) : "Michael";
                            alert(`The ${v.name} voice is currently being synthesized for this title! Defaulting to ${fallbackName}.`);
                          }
                        }}
                        style={{
                          width: 115,
                          alignItems: "center",
                          paddingVertical: 10,
                          paddingHorizontal: 8,
                          borderRadius: 16,
                          backgroundColor: isSelected
                            ? "rgba(139, 92, 246, 0.25)"
                            : v.isAvailable
                            ? "rgba(30, 41, 59, 0.85)"
                            : "rgba(15, 23, 42, 0.6)",
                          borderWidth: 1.5,
                          borderColor: isSelected ? "#8B5CF6" : v.isAvailable ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                          opacity: v.isAvailable ? 1 : 0.45,
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{v.avatar}</Text>
                        <Text weight="Bold" style={{ fontSize: 12, color: isSelected ? "#C084FC" : v.isAvailable ? "#F8FAFC" : "#64748B", marginTop: 4 }}>
                          {v.name}
                        </Text>
                        <View style={{ marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: v.isAvailable ? "rgba(16,185,129,0.2)" : "rgba(148,163,184,0.12)" }}>
                          <Text weight="Bold" style={{ fontSize: 9, color: v.isAvailable ? "#10B981" : "#94A3B8" }}>
                            {v.isAvailable ? "✓ Ready" : "Soon"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Minimalist Secondary Shortcuts (Start Over, Goodreads, Sparks, Share) */}
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Pressable
                  onPress={() => setIsResetModalOpen(true)}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", justifyContent: "center",
                    paddingVertical: 11, borderRadius: 14,
                    backgroundColor: "rgba(15, 23, 42, 0.95)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.12)", gap: 6, opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <RotateCcw size={13} color="#94A3B8" />
                  <Text weight="SemiBold" style={{ color: "#CBD5E1", fontSize: 12.5 }}>Start Over</Text>
                </Pressable>

                <Pressable
                  onPress={handleToggleComplete}
                  disabled={isCompleting}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", justifyContent: "center",
                    paddingVertical: 11, borderRadius: 14,
                    backgroundColor: isCompleted ? "rgba(16,185,129,0.18)" : "rgba(15, 23, 42, 0.95)",
                    borderWidth: 1, borderColor: isCompleted ? "#10B981" : "rgba(255, 255, 255, 0.12)",
                    gap: 6, opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <CheckCircle2 size={13} color={isCompleted ? "#10B981" : "#94A3B8"} />
                  <Text weight="SemiBold" style={{ color: isCompleted ? "#10B981" : "#CBD5E1", fontSize: 12.5 }}>
                    {isCompleted ? "Mark Unread" : "Mark Read"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const q = encodeURIComponent(`${titleStr} ${story?.author || ""}`.trim());
                    Linking.openURL(`https://www.goodreads.com/search?q=${q}`);
                  }}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", justifyContent: "center",
                    paddingVertical: 11, borderRadius: 14,
                    backgroundColor: "rgba(15, 23, 42, 0.95)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.12)", gap: 6, opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <ExternalLink size={13} color="#94A3B8" />
                  <Text weight="SemiBold" style={{ color: "#CBD5E1", fontSize: 12.5 }}>Goodreads ⭐</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (story?.hasSparks) {
                      router.push(`/summary/${slug}`);
                    } else {
                      alert("Liiro Sparks ⚡ key takeaways are coming soon for this classic!");
                    }
                  }}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", justifyContent: "center",
                    paddingVertical: 11, borderRadius: 14,
                    backgroundColor: story?.hasSparks ? "rgba(168,85,247,0.18)" : "rgba(15, 23, 42, 0.95)",
                    borderWidth: 1, borderColor: story?.hasSparks ? "rgba(168,85,247,0.35)" : "rgba(255, 255, 255, 0.12)",
                    gap: 6, opacity: story?.hasSparks ? (pressed ? 0.75 : 1) : 0.5,
                  })}
                >
                  <Sparkles size={13} color={story?.hasSparks ? "#C084FC" : "#94A3B8"} />
                  <Text weight="SemiBold" style={{ color: story?.hasSparks ? "#C084FC" : "#CBD5E1", fontSize: 12.5 }}>
                    {story?.hasSparks ? "Liiro Sparks ⚡" : "Sparks (Soon)"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setIsShelfModalOpen(true)}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", justifyContent: "center",
                    paddingVertical: 11, borderRadius: 14,
                    backgroundColor: "rgba(56, 189, 248, 0.14)",
                    borderWidth: 1, borderColor: "rgba(56, 189, 248, 0.35)",
                    gap: 6, opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <FolderPlus size={13} color="#38BDF8" />
                  <Text weight="SemiBold" style={{ color: "#38BDF8", fontSize: 12.5 }}>
                    Add to Bookshelf 📚
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Apple Multilingual Language Selector */}
            <View style={{ marginBottom: 28, padding: 18, borderRadius: 20, backgroundColor: "rgba(15, 23, 42, 0.95)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Globe size={16} color={accentColor} />
                  <Text weight="Bold" style={{ fontSize: 14, color: textColor }}>Reading Language</Text>
                </View>
                <Text style={{ fontSize: 11, color: textSubColor }}>
                  {dbLangs.length} {dbLangs.length === 1 ? "Language" : "Languages"} Ready
                </Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {supportedLanguagesList.map((lang) => {
                  const isSel = selectedLang === lang.code;
                  return (
                    <Pressable
                      key={lang.code}
                      onPress={() => lang.isAvailable && setSelectedLang(lang.code)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
                        backgroundColor: isSel ? accentColor : lang.isAvailable ? (isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9") : (isDark ? "rgba(255,255,255,0.01)" : "#F8FAFC"),
                        borderWidth: 1, borderColor: isSel ? accentColor : lang.isAvailable ? borderColor : "transparent",
                        opacity: !lang.isAvailable ? 0.35 : pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 14 }}>{lang.flag}</Text>
                      <Text weight={isSel ? "Bold" : "Medium"} style={{ fontSize: 12.5, color: isSel ? "#FFFFFF" : lang.isAvailable ? textColor : textSubColor }}>
                        {lang.nativeName}
                      </Text>
                      {isSel && <Check size={12} color="#FFFFFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── DEDICATED BOOK REEL STORY STAGE ───────────────────────────── */}
            {(story?.reel || story?.hasReels) ? (
              <View
                style={{
                  marginBottom: 28,
                  padding: 18,
                  borderRadius: 22,
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderWidth: 1.5,
                  borderColor: "rgba(244, 63, 94, 0.4)",
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(244, 63, 94, 0.2)", justifyContent: "center", alignItems: "center" }}>
                      <Play size={18} color="#F43F5E" />
                    </View>
                    <View>
                      <Text weight="Bold" style={{ fontSize: 16, color: textColor }}>
                        Book Reel Story 🎬
                      </Text>
                      <Text style={{ fontSize: 11.5, color: textSubColor }}>
                        Visual Animated Book Highlight
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => router.push(`/reels?reelId=${story.reel?._id || ""}`)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(244, 63, 94, 0.15)", borderWidth: 1, borderColor: "rgba(244, 63, 94, 0.3)" }}
                  >
                    <Text weight="Bold" style={{ fontSize: 12, color: "#F43F5E" }}>
                      Watch Reel
                    </Text>
                    <ChevronRight size={14} color="#F43F5E" />
                  </Pressable>
                </View>

                {/* Reel Glass Banner Content */}
                <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                  <View style={{ width: 85, height: 120, borderRadius: 14, overflow: "hidden", position: "relative" }}>
                    <ExpoImage source={{ uri: story.reel?.coverImageUrl || coverUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#F43F5E", justifyContent: "center", alignItems: "center" }}>
                        <Play size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text weight="Bold" style={{ fontSize: 15, color: textColor, marginBottom: 4 }}>
                      {story.reel?.title || `${titleStr} Reel`}
                    </Text>
                    <Text numberOfLines={2} style={{ fontSize: 12.5, color: textSubColor, lineHeight: 18, marginBottom: 10 }}>
                      {story.reel?.textOverlay || story.reel?.description || synopsisStr}
                    </Text>

                    <Pressable
                      onPress={() => router.push(`/reels?reelId=${story.reel?._id || ""}`)}
                      style={({ pressed }) => ({
                        alignSelf: "flex-start",
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
                        backgroundColor: "#F43F5E", opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Play size={13} color="#FFFFFF" />
                      <Text weight="Bold" style={{ fontSize: 12, color: "#FFFFFF" }}>
                        Play Story Reel Video
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Synopsis */}
            <View style={{ marginBottom: 28 }}>
              <SectionHeader title="Synopsis" textColor={textColor} />
              <Text style={{ fontSize: 15, color: textSubColor, lineHeight: 24, letterSpacing: -0.1 }}>{synopsisStr}</Text>
            </View>

            {/* Categories & Tags Stage */}
            {(story?.category || (story?.tags && story.tags.length > 0)) ? (
              <View style={{ marginBottom: 28 }}>
                <SectionHeader title="Categories & Tags" textColor={textColor} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {/* Primary Master Category Badge */}
                  {story?.category ? (
                    <Pressable
                      onPress={() => router.push(`/category/${story.category.slug}`)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
                        backgroundColor: "rgba(14,165,233,0.12)",
                        borderWidth: 1, borderColor: "rgba(14,165,233,0.3)",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Sparkles size={12} color="#0EA5E9" />
                      <Text weight="Bold" style={{ fontSize: 12, color: "#0EA5E9" }}>
                        {story.category.name || "Category"}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Tag Badges */}
                  {(story?.tags || []).map((tagItem: any, tagIdx: number) => {
                    const tagName = typeof tagItem === "object" ? tagItem?.name : typeof tagItem === "string" ? tagItem : "Tag";
                    const tagSlug = typeof tagItem === "object" ? tagItem?.slug || tagItem?.name?.toLowerCase().replace(/\s+/g, "-") : String(tagItem).toLowerCase().replace(/\s+/g, "-");
                    return (
                      <Pressable
                        key={tagIdx}
                        onPress={() => router.push(`/tag/${tagSlug}`)}
                        style={({ pressed }) => ({
                          flexDirection: "row", alignItems: "center", gap: 5,
                          paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        <Tag size={11} color="#94A3B8" />
                        <Text weight="Medium" style={{ fontSize: 12, color: "#CBD5E1" }}>
                          {tagName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* ── BOOK SERIES INTERCONNECTION CAROUSEL STAGE ────────────────── */}
            {((story?.seriesInfo && story.seriesInfo.totalInSeries > 1) || (story?.seriesBooks && story.seriesBooks.length > 1)) ? (
              <View style={{ marginBottom: 32, padding: 20, borderRadius: 24, backgroundColor: "rgba(15, 23, 42, 0.95)", borderWidth: 1.5, borderColor: "rgba(139, 92, 246, 0.4)" }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(139, 92, 246, 0.2)", justifyContent: "center", alignItems: "center" }}>
                      <Layers size={20} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text weight="Bold" style={{ fontSize: 18, color: "#F8FAFC" }}>
                        {story.seriesInfo?.seriesName || "Book Series Saga"} 📚
                      </Text>
                      <Text style={{ fontSize: 12, color: "#94A3B8" }}>
                        Sequential Reading Order ({story.seriesInfo?.totalInSeries || story.seriesBooks?.length || 2} Books Saga)
                      </Text>
                    </View>
                  </View>

                  {story.seriesInfo?.seriesSlug ? (
                    <Pressable
                      onPress={() => router.push(`/series/${story.seriesInfo.seriesSlug}`)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(139, 92, 246, 0.15)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.3)" }}
                    >
                      <Text weight="Bold" style={{ fontSize: 12, color: "#8B5CF6" }}>
                        View Full Saga
                      </Text>
                      <ChevronRight size={14} color="#8B5CF6" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Horizontal Reading Order Carousel */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
                  {(story.seriesInfo?.seriesBooks || story.seriesBooks || []).map((sBook: any, sIdx: number) => {
                    const isCurrentBook = sBook.slug === slug;
                    return (
                      <Pressable
                        key={sBook._id || sIdx}
                        onPress={() => !isCurrentBook && router.push(`/details/${sBook.slug}`)}
                        style={({ pressed }) => ({
                          width: 145,
                          padding: 12,
                          borderRadius: 18,
                          backgroundColor: isCurrentBook ? "rgba(139, 92, 246, 0.22)" : "rgba(30, 41, 59, 0.85)",
                          borderWidth: 2,
                          borderColor: isCurrentBook ? "#8B5CF6" : "rgba(255, 255, 255, 0.12)",
                          opacity: isCurrentBook ? 1 : pressed ? 0.8 : 0.95,
                        })}
                      >
                        <View style={{ width: "100%", height: 180, borderRadius: 14, overflow: "hidden", marginBottom: 10, position: "relative" }}>
                          {sBook.coverImageUrl ? (
                            <ExpoImage source={{ uri: sBook.coverImageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
                          ) : (
                            <View style={{ flex: 1, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" }}>
                              <BookOpen size={28} color="#8B5CF6" />
                            </View>
                          )}
                          {/* Top-Left BOOK # Order Pill */}
                          <View style={{ position: "absolute", top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.5)" }}>
                            <Text weight="Bold" style={{ fontSize: 9.5, color: "#8B5CF6" }}>
                              BOOK #{sBook.seriesOrder || sIdx + 1}
                            </Text>
                          </View>

                          {/* Top-Right Format Badges: [📖 Ebook] + [🎧 Audio] */}
                          <View style={{ position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 3, zIndex: 10 }}>
                            <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.6)" }}>
                              <Text weight="Bold" style={{ color: "#38BDF8", fontSize: 8 }}>Ebook</Text>
                            </View>
                            {(sBook.hasAudio || sBook.isAudiobook || (sBook.totalDurationSeconds && sBook.totalDurationSeconds > 0)) ? (
                              <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.6)" }}>
                                <Text weight="Bold" style={{ color: "#C084FC", fontSize: 8 }}>Audio</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <Text weight="Bold" numberOfLines={2} style={{ fontSize: 13, color: isCurrentBook ? "#C084FC" : "#F8FAFC", lineHeight: 17, marginBottom: 6 }}>
                          {typeof sBook.title === "object" ? getLocalizedText(sBook.title) : sBook.title}
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text weight="Bold" style={{ fontSize: 11, color: isCurrentBook ? "#A855F7" : "#8B5CF6" }}>
                            {isCurrentBook ? "✓ Current Book" : "Read Saga ➔"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Chapters List */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <SectionHeader title="Chapters" textColor={textColor} />
                <Text style={{ fontSize: 12, color: textSubColor }}>{totalChapters} total</Text>
              </View>

              <View style={{ gap: 8 }}>
                {visibleChapters.map((ch, idx) => {
                  const isChCompleted = completedChapterIds.includes(ch._id);
                  const isCurrent = ch._id?.toString() === progress?.currentChapterId?.toString();
                  const chTitle = getLocalizedText(ch.title, `Chapter ${ch.chapterNumber}`);
                  return (
                    <Pressable
                      key={ch._id || idx}
                      onPress={() => handleChapterPress(ch._id)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center",
                        paddingVertical: 14, paddingHorizontal: 16,
                        borderRadius: 16,
                        backgroundColor: isCurrent
                          ? (isDark ? "rgba(14,165,233,0.12)" : "#EFF6FF")
                          : surfaceColor,
                        borderWidth: 1,
                        borderColor: isCurrent ? accentColor + "50" : isChCompleted ? "#10B98130" : borderColor,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isChCompleted ? "#10B98118" : isCurrent ? accentColor + "20" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                        {isChCompleted ? (
                          <CheckCircle2 size={16} color="#10B981" />
                        ) : (
                          <Text weight="Bold" style={{ fontSize: 12, color: isCurrent ? accentColor : textSubColor }}>{ch.chapterNumber}</Text>
                        )}
                      </View>

                      <Text weight={isCurrent ? "Bold" : "Medium"} numberOfLines={1} style={{ fontSize: 14, color: isCurrent ? accentColor : textColor, flex: 1 }}>
                        {chTitle}
                      </Text>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                        {ch.durationSeconds ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Clock size={11} color={textSubColor} />
                            <Text style={{ fontSize: 11, color: textSubColor }}>{Math.round(ch.durationSeconds / 60)}m</Text>
                          </View>
                        ) : null}
                        <ChevronRight size={14} color={textSubColor} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {totalChapters > CHAPTERS_PREVIEW && (
                <Pressable
                  onPress={() => setChaptersExpanded(!chaptersExpanded)}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    paddingVertical: 14, marginTop: 10, borderRadius: 16,
                    backgroundColor: surfaceColor,
                    borderWidth: 1, borderColor,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  {chaptersExpanded ? <ChevronUp size={16} color={accentColor} /> : <ChevronDown size={16} color={accentColor} />}
                  <Text weight="Bold" style={{ fontSize: 13, color: accentColor }}>
                    {chaptersExpanded ? "Show less" : `Show all ${totalChapters} chapters`}
                  </Text>
                </Pressable>
              )}

              {/* Community & Goodreads Book Reviews Section */}
              <EbookReviewsSection storySlug={String(slug)} isDark={isDark} />

              {/* ── RELATED BOOKS FROM SAME CATEGORY STAGE ────────────────────── */}
              {story?.relatedBooks && story.relatedBooks.length > 0 ? (
                <View style={{ marginTop: 32, marginBottom: 24 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <SectionHeader title={`More in ${story.category?.name || "Category"}`} textColor={textColor} />
                    {story.category?.slug ? (
                      <Pressable
                        onPress={() => router.push(`/category/${story.category.slug}`)}
                        style={({ pressed }) => ({
                          flexDirection: "row", alignItems: "center", gap: 4,
                          paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
                          backgroundColor: "rgba(14,165,233,0.1)",
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text weight="Bold" style={{ fontSize: 12, color: "#0EA5E9" }}>
                          View All
                        </Text>
                        <ChevronRight size={13} color="#0EA5E9" />
                      </Pressable>
                    ) : null}
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
                    {story.relatedBooks.map((relBook: any, relIdx: number) => {
                      const relTitle = getLocalizedText(relBook.title);
                      return (
                        <Pressable
                          key={relBook._id || relIdx}
                          onPress={() => router.push(`/details/${relBook.slug}`)}
                          style={({ pressed }) => ({
                            width: 140,
                            padding: 10,
                            borderRadius: 18,
                            backgroundColor: surfaceColor,
                            borderWidth: 1,
                            borderColor,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <View style={{ width: "100%", height: 175, borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
                            {relBook.coverImageUrl ? (
                              <ExpoImage source={{ uri: relBook.coverImageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
                            ) : (
                              <View style={{ flex: 1, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" }}>
                                <BookOpen size={28} color="#0EA5E9" />
                              </View>
                            )}
                            {relBook.difficultyLevel ? (
                              <View style={{ position: "absolute", top: 6, left: 6, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "rgba(14,165,233,0.9)" }}>
                                <Text weight="Bold" style={{ fontSize: 9.5, color: "#FFFFFF" }}>
                                  {relBook.difficultyLevel}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text weight="Bold" numberOfLines={2} style={{ fontSize: 12.5, color: textColor, lineHeight: 16, marginBottom: 2 }}>
                            {relTitle}
                          </Text>

                          <Text weight="Medium" numberOfLines={1} style={{ fontSize: 11, color: textSubColor }}>
                            {relBook.author || "Classic Masterwork"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* ── MORE BOOKS BY SAME AUTHOR STAGE ───────────────────────────── */}
              {story?.authorBooks && story.authorBooks.length > 0 ? (
                <View style={{ marginTop: 24, marginBottom: 28 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <SectionHeader title={`More Books by ${story.author}`} textColor={textColor} />
                    <Pressable
                      onPress={() => {
                        const authorSlug = story.author ? story.author.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "") : "author";
                        router.push(`/author/${authorSlug}`);
                      }}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 4,
                        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
                        backgroundColor: "rgba(139,92,246,0.1)",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text weight="Bold" style={{ fontSize: 12, color: "#8B5CF6" }}>
                        View Author
                      </Text>
                      <ChevronRight size={13} color="#8B5CF6" />
                    </Pressable>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
                    {story.authorBooks.map((abBook: any, abIdx: number) => {
                      const abTitle = getLocalizedText(abBook.title);
                      return (
                        <Pressable
                          key={abBook._id || abIdx}
                          onPress={() => router.push(`/details/${abBook.slug}`)}
                          style={({ pressed }) => ({
                            width: 140,
                            padding: 10,
                            borderRadius: 18,
                            backgroundColor: surfaceColor,
                            borderWidth: 1,
                            borderColor,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <View style={{ width: "100%", height: 175, borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
                            {abBook.coverImageUrl ? (
                              <ExpoImage source={{ uri: abBook.coverImageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
                            ) : (
                              <View style={{ flex: 1, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" }}>
                                <BookOpen size={28} color="#8B5CF6" />
                              </View>
                            )}
                            {abBook.difficultyLevel ? (
                              <View style={{ position: "absolute", top: 6, left: 6, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "rgba(139,92,246,0.9)" }}>
                                <Text weight="Bold" style={{ fontSize: 9.5, color: "#FFFFFF" }}>
                                  {abBook.difficultyLevel}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text weight="Bold" numberOfLines={2} style={{ fontSize: 12.5, color: textColor, lineHeight: 16, marginBottom: 2 }}>
                            {abTitle}
                          </Text>

                          <Text weight="Medium" numberOfLines={1} style={{ fontSize: 11, color: textSubColor }}>
                            {abBook.author || story.author}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Reset Progress Modal */}
      <Modal visible={isResetModalOpen} transparent animationType="fade" onRequestClose={() => setIsResetModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 360, borderRadius: 24, backgroundColor: surfaceColor, padding: 24, borderWidth: 1, borderColor }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text weight="Bold" style={{ fontSize: 18, color: textColor }}>Reset Progress?</Text>
              <Pressable onPress={() => setIsResetModalOpen(false)}>
                <X size={20} color={textSubColor} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, color: textSubColor, lineHeight: 20, marginBottom: 20 }}>
              This will reset your reading and listening progress for "{titleStr}" back to 0%.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setIsResetModalOpen(false)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9", alignItems: "center" }}>
                <Text weight="SemiBold" style={{ color: textColor, fontSize: 14 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmReset} disabled={isResetting} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#EF4444", alignItems: "center" }}>
                {isResetting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 14 }}>Yes, Reset</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Social Quote Card Generator Modal */}
      <SocialQuoteCardModal
        visible={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        storyTitle={titleStr}
        author={story?.author || "Classic Masterwork"}
        quoteText={story?.synopsis?.en || synopsisStr || "Man is not truly one, but truly two."}
        coverImageUrl={coverUrl}
      />

      {/* Add To Bookshelf Modal */}
      <AddToShelfModal
        visible={isShelfModalOpen}
        onClose={() => setIsShelfModalOpen(false)}
        storyId={story?._id}
        storySlug={slug as string}
        storyTitle={titleStr}
      />
    </View>
  );
}
