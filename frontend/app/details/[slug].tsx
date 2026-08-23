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

function SectionHeader({ title, color = "#0EA5E9", textColor }: { title: string; color?: string; textColor: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <View style={{ width: 3, height: 20, borderRadius: 2, backgroundColor: color }} />
      <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
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
  const maxW = Math.min(width || 1200, 1200);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const audioSampleRef = React.useRef<any>(null);

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
    ["de", "bn"].forEach((code) => {
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
  const hasAudio = story?.contentType === "audiobook" || story?.contentType === "both";

  const firstChapterWithAudio = useMemo(() => story?.chapters?.find((ch) => ch.audioUrl), [story?.chapters]);

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

  const resumeLabel = isCompleted
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

  const handleToggleDownload = () => {
    if (isDownloaded) {
      setIsDownloaded(false);
    } else {
      setIsDownloading(true);
      setTimeout(() => { setIsDownloading(false); setIsDownloaded(true); }, 1200);
    }
  };

  const handleStartReading = () => {
    syncProgress({ slug: slug as string, activityType: "reading" }).catch(() => {});
    router.push(`/read/${slug}?lang=${selectedLang}`);
  };

  const handleStartAudio = () => {
    syncProgress({ slug: slug as string, activityType: "listening" }).catch(() => {});
    router.push(`/read/${slug}?audio=true&lang=${selectedLang}`);
  };

  const handleChapterPress = (chapterId: string) => {
    router.push(`/read/${slug}?chapter=${chapterId}&lang=${selectedLang}`);
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

  /* ── Theme ─────────────────────────────────────── */
  const bgColor = isDark ? "#080E1A" : "#F5F6FA";
  const surfaceColor = isDark ? "#111827" : "#FFFFFF";
  const textColor = isDark ? "#F1F5F9" : "#0F172A";
  const textSubColor = isDark ? "#64748B" : "#94A3B8";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
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
        <Pressable onPress={() => refetch()} style={{ backgroundColor: accentColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 }}>
          <Text weight="Bold" style={{ color: "#FFFFFF" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const HERO_HEIGHT = Math.min(420, width * 0.95);

  return (
    <View style={{ flex: 1, width: "100%", height: "100%", backgroundColor: bgColor }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1, width: "100%", height: "100%" }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      >
        <View style={{ width: "100%", maxWidth: maxW, alignSelf: "center" }}>
        {/* ── CINEMATIC HERO ───────────────────────────── */}
        <View style={{ height: HERO_HEIGHT, overflow: "hidden", position: "relative" }}>
          {/* Blurred backdrop */}
          {coverUrl ? (
            <ExpoImage
              source={{ uri: coverUrl }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.35 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              blurRadius={18}
            />
          ) : (
            <LinearGradient colors={["#0A1628", "#162B4E"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          )}

          {/* Dark vignette gradient */}
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.1)", bgColor]}
            locations={[0, 0.5, 1]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Floating Glass Top Navigation Bar */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: Math.max(insets.top + 8, 16),
              paddingHorizontal: 16,
              paddingBottom: 8,
              zIndex: 50,
            }}
          >
            <Pressable
              onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace("/"); } }}
              style={({ pressed }) => ({
                width: 40, height: 40, borderRadius: 20,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.40)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.20)",
                opacity: pressed ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <ChevronLeft size={22} color="#FFFFFF" />
            </Pressable>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setIsBookmarked(!isBookmarked)}
                style={({ pressed }) => ({
                  width: 40, height: 40, borderRadius: 20,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: isBookmarked ? "rgba(239,68,68,0.80)" : "rgba(0,0,0,0.40)",
                  borderWidth: 1, borderColor: isBookmarked ? "rgba(239,68,68,0.90)" : "rgba(255,255,255,0.20)",
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                {isBookmarked ? <BookMarked size={18} color="#FFFFFF" /> : <Bookmark size={18} color="#FFFFFF" />}
              </Pressable>

              <Pressable
                onPress={handleToggleDownload}
                disabled={isDownloading}
                style={({ pressed }) => ({
                  width: 40, height: 40, borderRadius: 20,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: isDownloaded ? "rgba(16,185,129,0.80)" : "rgba(0,0,0,0.40)",
                  borderWidth: 1, borderColor: isDownloaded ? "rgba(16,185,129,0.90)" : "rgba(255,255,255,0.20)",
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : isDownloaded ? (
                  <CheckCircle2 size={18} color="#FFFFFF" />
                ) : (
                  <Download size={18} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Cover art + metadata centered in hero */}
          <View style={{ position: "absolute", bottom: 24, left: 0, right: 0, alignItems: "center", paddingHorizontal: 20 }}>
            {/* Cover Image */}
            <View
              style={{
                width: 130, height: 185, borderRadius: 16,
                marginBottom: 16,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.6,
                    shadowRadius: 24,
                  },
                  android: { elevation: 16 },
                }),
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.18)",
                }}
              >
                {coverUrl ? (
                  <ExpoImage source={{ uri: coverUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                ) : (
                  <View style={{ flex: 1, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={40} color="#0EA5E9" />
                  </View>
                )}
              </View>
            </View>

            {/* Series badge */}
            {story.seriesName ? (
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, backgroundColor: "rgba(245,158,11,0.25)", borderWidth: 1, borderColor: "rgba(245,158,11,0.5)", marginBottom: 8 }}>
                <Text weight="Bold" style={{ fontSize: 11, color: "#FBBF24" }}>
                  Book #{story.seriesOrder || 1} of {story.seriesName}
                </Text>
              </View>
            ) : null}

            <Text weight="Bold" style={{ fontSize: 24, color: "#FFFFFF", textAlign: "center", letterSpacing: -0.4, lineHeight: 30, marginBottom: 5, textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}>
              {titleStr}
            </Text>

            {story.author ? (
              <Text weight="Medium" style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", textAlign: "center", marginBottom: 12 }}>
                by {story.author}
              </Text>
            ) : null}

            {/* Badge pills */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 7 }}>
              {story.difficultyLevel && (
                <View style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: 100, backgroundColor: "rgba(14,165,233,0.3)", borderWidth: 1, borderColor: "rgba(14,165,233,0.5)" }}>
                  <Text weight="Bold" style={{ color: "#7DD3FC", fontSize: 11.5 }}>{story.difficultyLevel}</Text>
                </View>
              )}

              {story.isAiEnhanced || story.aiEnhancements?.illustrations ? (
                <View style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: 100, backgroundColor: "rgba(236,72,153,0.35)", borderWidth: 1, borderColor: "rgba(236,72,153,0.6)" }}>
                  <Text weight="Bold" style={{ color: "#F472B6", fontSize: 11.5 }}>✨ AI Visual Masterwork</Text>
                </View>
              ) : null}

              {story.hasIllustrations ? (
                <View style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: 100, backgroundColor: "rgba(16,185,129,0.3)", borderWidth: 1, borderColor: "rgba(16,185,129,0.5)" }}>
                  <Text weight="Bold" style={{ color: "#6EE7B7", fontSize: 11.5 }}>🖼️ {story.aiEnhancements?.sceneCount || 7} Scene Artworks</Text>
                </View>
              ) : null}

              {story.isFeatured ? (
                <View style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: 100, backgroundColor: "rgba(245,158,11,0.3)", borderWidth: 1, borderColor: "rgba(245,158,11,0.5)" }}>
                  <Text weight="Bold" style={{ color: "#FCD34D", fontSize: 11.5 }}>⭐ Top 100</Text>
                </View>
              ) : null}

              <View style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: 100, backgroundColor: "rgba(139,92,246,0.3)", borderWidth: 1, borderColor: "rgba(139,92,246,0.5)" }}>
                <Text weight="Bold" style={{ color: "#C4B5FD", fontSize: 11.5 }}>
                  {story.contentType === "both" ? "Read & Listen" : story.contentType === "audiobook" ? "Audiobook" : "Ebook"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── CONTENT BODY ─────────────────────────────── */}
        <View style={{ maxWidth: 860, width: "100%", alignSelf: "center", paddingHorizontal: 16 }}>

          {/* Quick Stats 2×2 Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24, marginTop: 8 }}>
            {[
              { icon: Hash, label: "Chapters", value: String(totalChapters), color: accentColor },
              { icon: Clock, label: "Est. Read Time", value: readTimeDisplay, color: "#F59E0B" },
              { icon: Award, label: "Reading Level", value: story.difficultyLevel || "—", color: "#10B981" },
              {
                icon: totalAudioDurationSec > 0 ? Volume2 : BookOpen,
                label: totalAudioDurationSec > 0 ? "Audio Duration" : "Format",
                value: totalAudioDurationSec > 0 ? formatDuration(Math.round(totalAudioDurationSec / 60)) : (story.contentType === "both" ? "Read & Audio" : story.contentType === "audiobook" ? "Audiobook" : "Ebook"),
                color: "#8B5CF6",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <View
                  key={stat.label}
                  style={{
                    flex: 1,
                    minWidth: "44%",
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: surfaceColor,
                    borderWidth: 1,
                    borderColor,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: stat.color + "20", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} color={stat.color} />
                  </View>
                  <View>
                    <Text weight="Bold" style={{ fontSize: 15, color: textColor }}>{stat.value}</Text>
                    <Text style={{ fontSize: 11, color: textSubColor, marginTop: 1 }}>{stat.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* CTA Buttons */}
          <View style={{ gap: 10, marginBottom: 24 }}>
            <Pressable onPress={handleStartReading} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
              <LinearGradient
                colors={["#0EA5E9", "#0284C7"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 18, gap: 10 }}
              >
                <BookOpen size={20} color="#FFFFFF" />
                <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 16 }}>{resumeLabel}</Text>
              </LinearGradient>
            </Pressable>

            {hasAudio && (
              <Pressable onPress={handleStartAudio} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 18, gap: 10 }}
                >
                  <Headphones size={20} color="#FFFFFF" />
                  <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 16 }}>
                    {progress?.audioTimestamp ? "Resume Audiobook" : "Listen to Audiobook"}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}

            {/* Audio Sample */}
            {firstChapterWithAudio?.audioUrl ? (
              <Pressable
                onPress={toggleSampleAudio}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  paddingVertical: 12, borderRadius: 14,
                  backgroundColor: isPlayingSample ? "#8B5CF6" : isDark ? "rgba(139,92,246,0.12)" : "#F3E8FF",
                  borderWidth: 1, borderColor: isPlayingSample ? "#8B5CF6" : "rgba(139,92,246,0.3)",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {isPlayingSample ? <Pause size={15} color="#FFFFFF" /> : <Play size={15} color="#8B5CF6" />}
                <Text weight="SemiBold" style={{ color: isPlayingSample ? "#FFFFFF" : "#8B5CF6", fontSize: 13 }}>
                  {isPlayingSample ? "Playing Sample (30s)…" : "Preview a 30-second Sample"}
                </Text>
              </Pressable>
            ) : null}

            {/* Secondary: Start Over / Mark Complete / Goodreads */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setIsResetModalOpen(true)}
                style={({ pressed }) => ({
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  paddingVertical: 11, borderRadius: 12,
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                  borderWidth: 1, borderColor, gap: 5, opacity: pressed ? 0.7 : 1,
                })}
              >
                <RotateCcw size={14} color={textSubColor} />
                <Text weight="SemiBold" style={{ color: textSubColor, fontSize: 12.5 }}>Start Over</Text>
              </Pressable>

              <Pressable
                onPress={handleToggleComplete}
                disabled={isCompleting}
                style={({ pressed }) => ({
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  paddingVertical: 11, borderRadius: 12,
                  backgroundColor: isCompleted ? (isDark ? "rgba(16,185,129,0.12)" : "#ECFDF5") : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                  borderWidth: 1, borderColor: isCompleted ? "#10B981" : borderColor,
                  gap: 5, opacity: pressed ? 0.7 : 1,
                })}
              >
                <CheckCircle2 size={14} color={isCompleted ? "#10B981" : textSubColor} />
                <Text weight="SemiBold" style={{ color: isCompleted ? "#10B981" : textSubColor, fontSize: 12.5 }}>
                  {isCompleted ? "Mark Unread" : "Mark Read"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const q = encodeURIComponent(`${titleStr} ${story?.author || ""}`.trim());
                  Linking.openURL(`https://www.goodreads.com/search?q=${q}`);
                }}
                style={({ pressed }) => ({
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  paddingVertical: 11, borderRadius: 12,
                  backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
                  borderWidth: 1, borderColor: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
                  gap: 5, opacity: pressed ? 0.7 : 1,
                })}
              >
                <ExternalLink size={13} color={isDark ? "#FBBF24" : "#D97706"} />
                <Text weight="Bold" style={{ color: isDark ? "#FBBF24" : "#D97706", fontSize: 12.5 }}>Goodreads</Text>
              </Pressable>
            </View>
          </View>

          {/* Reading Progress Card */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                padding: 20, borderRadius: 20, backgroundColor: surfaceColor,
                borderWidth: 1, borderColor,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <BarChart2 size={18} color={accentColor} />
                  <Text weight="Bold" style={{ fontSize: 16, color: textColor }}>Reading Progress</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: isCompleted ? "#10B98118" : progressPercent > 0 ? accentColor + "18" : isDark ? "rgba(255,255,255,0.07)" : "#F1F5F9" }}>
                  <Text weight="Bold" style={{ color: isCompleted ? "#10B981" : progressPercent > 0 ? accentColor : textSubColor, fontSize: 11 }}>
                    {isCompleted ? "✓ Completed" : progressPercent > 0 ? "In Progress" : "Not Started"}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ height: 8, borderRadius: 100, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0", overflow: "hidden", marginBottom: 14 }}>
                <LinearGradient
                  colors={isCompleted ? ["#10B981", "#059669"] : [accentColor, "#0284C7"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: `${progressPercent}%`, height: "100%", borderRadius: 100 }}
                />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                <View style={{ alignItems: "center" }}>
                  <Text weight="Bold" style={{ fontSize: 22, color: textColor }}>{progressPercent}%</Text>
                  <Text style={{ fontSize: 11, color: textSubColor, marginTop: 2 }}>Completed</Text>
                </View>
                <View style={{ width: 1, backgroundColor: borderColor }} />
                <View style={{ alignItems: "center" }}>
                  <Text weight="Bold" style={{ fontSize: 22, color: textColor }}>{completedCount}</Text>
                  <Text style={{ fontSize: 11, color: textSubColor, marginTop: 2 }}>/ {totalChapters} Chapters</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Language Selector Card */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ padding: 20, borderRadius: 20, backgroundColor: surfaceColor, borderWidth: 1, borderColor: isDark ? "rgba(14,165,233,0.25)" : "rgba(14,165,233,0.18)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Globe size={18} color={accentColor} />
                  <Text weight="Bold" style={{ fontSize: 16, color: textColor }}>Reading Language</Text>
                </View>
                <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100, backgroundColor: accentColor + "18" }}>
                  <Text weight="Bold" style={{ color: accentColor, fontSize: 11 }}>
                    {dbLangs.length} {dbLangs.length === 1 ? "Language" : "Languages"} Ready
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: textSubColor, marginBottom: 14, lineHeight: 18 }}>
                Select a language to switch content and start reading.
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {supportedLanguagesList.map((lang) => {
                  const isSel = selectedLang === lang.code;
                  return (
                    <Pressable
                      key={lang.code}
                      onPress={() => lang.isAvailable && setSelectedLang(lang.code)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
                        backgroundColor: isSel ? accentColor : lang.isAvailable ? isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9" : isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                        borderWidth: 1, borderColor: isSel ? accentColor : lang.isAvailable ? borderColor : "transparent",
                        opacity: !lang.isAvailable ? 0.4 : pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 15 }}>{lang.flag}</Text>
                      <Text weight={isSel ? "Bold" : "Medium"} style={{ fontSize: 13, color: isSel ? "#FFFFFF" : lang.isAvailable ? textColor : textSubColor }}>
                        {lang.nativeName} ({lang.name})
                      </Text>
                      {isSel && <Check size={13} color="#FFFFFF" />}
                      {!lang.isAvailable && <Text weight="SemiBold" style={{ fontSize: 10, color: textSubColor }}>(Soon)</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Synopsis */}
          <View style={{ marginBottom: 28 }}>
            <SectionHeader title="Synopsis" color={accentColor} textColor={textColor} />
            <Text style={{ fontSize: 15, color: textSubColor, lineHeight: 23 }}>{synopsisStr}</Text>
          </View>

          {/* Tags */}
          {story?.tags && story.tags.length > 0 ? (
            <View style={{ marginBottom: 28 }}>
              <SectionHeader title="Categories & Tags" color="#8B5CF6" textColor={textColor} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {story.tags.map((tag, tagIdx) => (
                  <Pressable
                    key={tagIdx}
                    onPress={() => router.push(`/explore?search=${encodeURIComponent(String(tag))}`)}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 6,
                      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
                      backgroundColor: isDark ? "rgba(139,92,246,0.1)" : "#F3E8FF",
                      borderWidth: 1, borderColor: isDark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.25)",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Tag size={11} color="#8B5CF6" />
                    <Text weight="SemiBold" style={{ fontSize: 12.5, color: isDark ? "#C4B5FD" : "#6D28D9" }}>
                      {getLocalizedText(tag, String(tag))}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Chapters List (collapsible) */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 3, height: 20, borderRadius: 2, backgroundColor: accentColor }} />
                <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
                  Chapters
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, backgroundColor: accentColor + "18" }}>
                <Text weight="Bold" style={{ fontSize: 12, color: accentColor }}>{totalChapters} total</Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
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
                      paddingVertical: 13, paddingHorizontal: 14,
                      borderRadius: 14,
                      backgroundColor: isCurrent
                        ? (isDark ? "rgba(14,165,233,0.12)" : "#EFF6FF")
                        : surfaceColor,
                      borderWidth: 1,
                      borderColor: isCurrent ? accentColor + "50" : isChCompleted ? "#10B98130" : borderColor,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    {/* Chapter number / check */}
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: isChCompleted ? "#10B98118" : isCurrent ? accentColor + "20" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      {isChCompleted ? (
                        <CheckCircle2 size={16} color="#10B981" />
                      ) : (
                        <Text weight="Bold" style={{ fontSize: 12, color: isCurrent ? accentColor : textSubColor }}>{ch.chapterNumber}</Text>
                      )}
                    </View>

                    <Text weight={isCurrent ? "Bold" : "SemiBold"} numberOfLines={1} style={{ fontSize: 14, color: isCurrent ? accentColor : textColor, flex: 1 }}>
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

            {/* Expand/Collapse button */}
            {totalChapters > CHAPTERS_PREVIEW && (
              <Pressable
                onPress={() => setChaptersExpanded(!chaptersExpanded)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  paddingVertical: 14, marginTop: 8, borderRadius: 14,
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
                  borderWidth: 1, borderColor,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {chaptersExpanded ? <ChevronUp size={16} color={accentColor} /> : <ChevronDown size={16} color={accentColor} />}
                <Text weight="Bold" style={{ fontSize: 13.5, color: accentColor }}>
                  {chaptersExpanded ? "Show less" : `Show all ${totalChapters} chapters`}
                </Text>
              </Pressable>
            )}
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
    </View>
  );
}
