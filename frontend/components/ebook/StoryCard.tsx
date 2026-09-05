import React, { useState } from "react";
import { View, Pressable, Image, Platform } from "react-native";
import { useSelector } from "react-redux";
import { BookOpen, Play, Lock, Sparkles, Star, Headphones } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppText as Text } from "@/components/ui/AppText";
import { Story } from "@/api/storiesQuery";
import { selectIsDark } from "@/redux/features/themeSlice";
import { getLocalizedText } from "@/utils/getLocalizedText";

interface StoryCardProps {
  story: Story;
  onPress: (slug: string) => void;
  variant?: "standard" | "continue";
}

/* ── Helpers ─────────────────────────── */

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#10B981", a1: "#10B981", a2: "#10B981",
  intermediate: "#3B82F6", b1: "#3B82F6", b2: "#3B82F6",
  advanced: "#F43F5E", c1: "#F43F5E", c2: "#F43F5E",
};

const getLevelColor = (level?: string): string => {
  if (!level) return "#94A3B8";
  const n = level.toLowerCase();
  for (const [key, color] of Object.entries(LEVEL_COLORS)) {
    if (n.includes(key)) return color;
  }
  return "#0EA5E9";
};

const getLevelLabel = (level?: string): string => {
  if (!level) return "";
  const n = level.toLowerCase();
  if (n.includes("beginner") || n.includes("a1") || n.includes("a2")) return "Beginner";
  if (n.includes("intermediate") || n.includes("b1") || n.includes("b2")) return "Intermediate";
  if (n.includes("advanced") || n.includes("c1") || n.includes("c2")) return "Advanced";
  return level;
};

const httpsUrl = (url?: string) => url?.replace(/^http:\/\//, "https://") || undefined;

const getProgressPercent = (story: Story): number => {
  if (!story.userProgress) return 0;
  const completed = story.userProgress.completedChapterIds?.length ?? 0;
  return completed === 0 ? 8 : Math.min(Math.max(completed * 18, 10), 92);
};

/* ── Continue Reading Card ────────────── */

const ContinueReadingCard: React.FC<Omit<StoryCardProps, "variant">> = ({ story, onPress }) => {
  const isDark = useSelector(selectIsDark);
  const cover = httpsUrl(story.coverImageUrl);
  const progress = getProgressPercent(story);
  const levelColor = getLevelColor(story.difficultyLevel);
  const authorName = getLocalizedText(story.author) || (story as any).authorName || (story as any).authorDetails?.name || "";

  return (
    <Pressable
      onPress={() => onPress(story.slug)}
      style={({ pressed }) => ({ opacity: pressed ? 0.93 : 1 })}
      accessibilityLabel={`Continue reading ${getLocalizedText(story.title)}`}
    >
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          flexDirection: "row",
          backgroundColor: isDark ? "#141E33" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        {/* Cover */}
        <View style={{ width: 100, height: 136 }}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0F172A" : "#F1F5F9" }}>
              <BookOpen size={32} color={levelColor} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14, justifyContent: "space-between" }}>
          {/* Label */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#38BDF8", marginRight: 6 }} />
              <Text weight="Bold" style={{ color: "#38BDF8", fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase" }}>
                Continue Reading
              </Text>
            </View>
            <Text weight="Bold" numberOfLines={2} style={{ color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 15, lineHeight: 21, marginBottom: 3 }}>
              {getLocalizedText(story.title)}
            </Text>
            {authorName ? (
              <Text weight="Regular" numberOfLines={1} style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 12 }}>
                {authorName}
              </Text>
            ) : null}
          </View>

          {/* Progress + Resume */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <Text weight="Medium" style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11 }}>Progress</Text>
              <Text weight="SemiBold" style={{ color: "#38BDF8", fontSize: 11 }}>{progress}%</Text>
            </View>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? "rgba(56,189,248,0.12)" : "rgba(56,189,248,0.18)", marginBottom: 12 }}>
              <View style={{ height: "100%", borderRadius: 2, backgroundColor: "#38BDF8", width: `${progress}%` }} />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#38BDF8", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, gap: 5 }}>
                <Play size={11} color="#0B1628" fill="#0B1628" />
                <Text weight="Bold" style={{ color: "#0B1628", fontSize: 12, letterSpacing: 0.3 }}>Resume</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

/* ── Standard Card ────────────────────── */

const StandardCard: React.FC<Omit<StoryCardProps, "variant">> = ({ story, onPress }) => {
  const isDark = useSelector(selectIsDark);
  const [imageError, setImageError] = useState(false);
  const cover = httpsUrl(story.coverImageUrl);
  const levelLabel = getLevelLabel(story.difficultyLevel);

  const authorName = getLocalizedText(story.author) || (story as any).authorName || (story as any).authorDetails?.name || "";
  const isAudioAvailable = !!(story.hasAudio === true || story.isAudiobook === true || story.contentType === "audiobook" || story.contentType === "both");

  return (
    <Pressable
      onPress={() => onPress(story.slug)}
      style={({ pressed, hovered }: any) => ({
        width: "100%",
        backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.85)",
        borderWidth: 1,
        borderColor: hovered ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.08)",
        borderRadius: 18,
        padding: 12,
        transform: [{ translateY: hovered ? -4 : 0 }, { scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.88 : 1,
        boxShadow: hovered ? "0 10px 25px rgba(0,0,0,0.4)" : "none",
      })}
      accessibilityLabel={`Read ${getLocalizedText(story.title)}`}
    >
      {/* Cover Image Container Box */}
      <View
        style={{
          width: "100%",
          aspectRatio: 2 / 3,
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: isDark ? "#1E293B" : "#CBD5E1",
          position: "relative",
          marginBottom: 10,
        }}
      >
        {cover && !imageError ? (
          <Image
            source={{ uri: cover }}
            onError={() => setImageError(true)}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#334155"]}
            style={{ width: "100%", height: "100%", padding: 14, justifyContent: "center", alignItems: "center" }}
          >
            <BookOpen size={32} color="#38BDF8" style={{ marginBottom: 8 }} />
            <Text weight="Bold" numberOfLines={3} style={{ color: "#FFFFFF", fontSize: 13, textAlign: "center", lineHeight: 17 }}>
              {getLocalizedText(story.title)}
            </Text>
          </LinearGradient>
        )}

        {/* Top-Left Format Badges: [📖 Ebook] + [🎧 Audio] */}
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            zIndex: 10,
          }}
        >
          {/* Default Ebook Pill */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 6,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: "rgba(2, 6, 23, 0.85)",
              borderWidth: 1,
              borderColor: "rgba(14, 165, 233, 0.6)",
            }}
          >
            <BookOpen size={9} color="#38BDF8" />
            <Text weight="Bold" style={{ color: "#38BDF8", fontSize: 8.5, letterSpacing: 0.2 }}>
              Ebook
            </Text>
          </View>

          {/* Audio Pill */}
          {isAudioAvailable ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                paddingHorizontal: 6,
                paddingVertical: 2.5,
                borderRadius: 6,
                backgroundColor: "rgba(2, 6, 23, 0.85)",
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.6)",
              }}
            >
              <Headphones size={9} color="#C084FC" />
              <Text weight="Bold" style={{ color: "#C084FC", fontSize: 8.5, letterSpacing: 0.2 }}>
                Audio
              </Text>
            </View>
          ) : null}
        </View>

        {/* Top-Right Badge: TOP 100 or CEFR Level */}
        {story.isFeatured ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 6,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: "rgba(245, 158, 11, 0.95)",
              borderWidth: 1,
              borderColor: "#FDE68A",
              zIndex: 10,
            }}
          >
            <Sparkles size={8.5} color="#FFFFFF" />
            <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 8, letterSpacing: 0.3 }}>
              TOP 100
            </Text>
          </View>
        ) : levelLabel ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              paddingHorizontal: 6,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: "rgba(2, 6, 23, 0.85)",
              borderWidth: 1,
              borderColor: "rgba(16, 185, 129, 0.5)",
              zIndex: 10,
            }}
          >
            <Text weight="Bold" style={{ color: "#10B981", fontSize: 8.5, letterSpacing: 0.3 }}>
              {levelLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Book Title & Author */}
      <Text
        weight="Bold"
        numberOfLines={2}
        style={{
          color: "#FFFFFF",
          fontSize: 13.5,
          fontWeight: "700",
          lineHeight: 18,
          marginBottom: 4,
          fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
        }}
      >
        {getLocalizedText(story.title)}
      </Text>

      {authorName ? (
        <Text weight="Medium" numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: "500" }}>
          {authorName}
        </Text>
      ) : null}
    </Pressable>
  );
};

/* ── Export ────────────────────────────── */

const StoryCard: React.FC<StoryCardProps> = ({ story, onPress, variant = "standard" }) => {
  if (variant === "continue") return <ContinueReadingCard story={story} onPress={onPress} />;
  return <StandardCard story={story} onPress={onPress} />;
};

export default React.memo(StoryCard);
