import React, { useState } from "react";
import { View, Pressable, Image } from "react-native";
import { useSelector } from "react-redux";
import { BookOpen, Play, Lock, Sparkles } from "lucide-react-native";
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
            {story.author ? (
              <Text weight="Regular" numberOfLines={1} style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 12 }}>
                {story.author}
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
  const levelColor = getLevelColor(story.difficultyLevel);
  const levelLabel = getLevelLabel(story.difficultyLevel);
  const hasProgress = !!story.userProgress;
  const progress = getProgressPercent(story);

  return (
    <Pressable
      onPress={() => onPress(story.slug)}
      style={({ pressed }) => ({ width: "100%", opacity: pressed ? 0.88 : 1 })}
      accessibilityLabel={`Read ${getLocalizedText(story.title)}`}
    >
      <View
        style={{
          width: "100%",
          aspectRatio: 2 / 3,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: isDark ? "#1E293B" : "#CBD5E1",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.14,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {/* Cover */}
        {cover && !imageError ? (
          <Image
            source={{ uri: cover }}
            onError={() => setImageError(true)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={isDark ? ["#0F172A", "#1E293B", "#334155"] : ["#334155", "#475569", "#64748B"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: 14, justifyContent: "center", alignItems: "center" }}
          >
            <BookOpen size={32} color="#38BDF8" style={{ marginBottom: 8 }} />
            <Text weight="Bold" numberOfLines={3} style={{ color: "#FFFFFF", fontSize: 13, textAlign: "center", lineHeight: 17 }}>
              {getLocalizedText(story.title)}
            </Text>
            {story.author ? (
              <Text weight="Medium" numberOfLines={1} style={{ color: "#94A3B8", fontSize: 10, textAlign: "center", marginTop: 4 }}>
                {story.author}
              </Text>
            ) : null}
          </LinearGradient>
        )}

        {/* Top sheen */}
        <LinearGradient
          colors={["rgba(255,255,255,0.1)", "transparent"]}
          locations={[0, 0.5]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%" }}
        />

        {/* Bottom overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.92)"]}
          locations={[0, 0.38, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, top: "28%" }}
        />

        {/* Top 100 Featured Badge — top right */}
        {story.isFeatured ? (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: "rgba(245, 158, 11, 0.95)",
              borderWidth: 1,
              borderColor: "#FDE68A",
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          >
            <Sparkles size={9} color="#FFFFFF" />
            <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 8.5, letterSpacing: 0.4 }}>
              TOP 100
            </Text>
          </View>
        ) : levelLabel ? (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 5,
              backgroundColor: levelColor,
            }}
          >
            <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 8.5, letterSpacing: 0.6, textTransform: "uppercase" }}>
              {levelLabel}
            </Text>
          </View>
        ) : null}

        {/* Genre tag — top left */}
        {story.tags && story.tags.length > 0 ? (
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 5,
              backgroundColor: "rgba(10,18,36,0.72)",
            }}
          >
            <Text weight="SemiBold" style={{ color: "#7DD3FC", fontSize: 9.5 }}>
              {getLocalizedText(story.tags[0])}
            </Text>
          </View>
        ) : null}

        {/* Premium badge */}
        {story.isPremium ? (
          <View
            style={{
              position: "absolute",
              top: story.tags && story.tags.length > 0 ? 36 : 10,
              left: 10,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: "rgba(234,179,8,0.92)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={11} color="#FFFFFF" />
          </View>
        ) : null}

        {/* Title + author */}
        <View
          style={{
            position: "absolute",
            bottom: hasProgress ? 7 : 0,
            left: 0,
            right: 0,
            paddingHorizontal: 11,
            paddingBottom: hasProgress ? 7 : 13,
            paddingTop: 8,
          }}
        >
          {/* Multi-Language Badges */}
          {story.languages && story.languages.length > 0 && (
            <View style={{ flexDirection: "row", gap: 4, marginBottom: 5, flexWrap: "wrap" }}>
              {story.languages.map((lCode) => {
                const flag = lCode === "es" ? "🇪🇸" : lCode === "fr" ? "🇫🇷" : lCode === "de" ? "🇩🇪" : lCode === "bn" ? "🇧🇩" : "🇬🇧";
                return (
                  <View
                    key={lCode}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 5,
                      paddingVertical: 1.5,
                      borderRadius: 4,
                      backgroundColor: "rgba(15,23,42,0.85)",
                      borderWidth: 0.5,
                      borderColor: "rgba(255,255,255,0.2)",
                      gap: 2,
                    }}
                  >
                    <Text style={{ fontSize: 9 }}>{flag}</Text>
                    <Text weight="Bold" style={{ color: "#7DD3FC", fontSize: 8 }}>
                      {lCode.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text
            weight="Bold"
            numberOfLines={2}
            style={{ color: "#FFFFFF", fontSize: 13.5, lineHeight: 19, letterSpacing: -0.2, marginBottom: 3 }}
          >
            {getLocalizedText(story.title)}
          </Text>
          {story.author ? (
            <Text weight="Medium" numberOfLines={1} style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              {story.author}
            </Text>
          ) : null}
        </View>

        {/* Border */}
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.22)",
          }}
        />

        {/* Progress bar */}
        {hasProgress && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ height: "100%", backgroundColor: "#38BDF8", width: `${progress}%`, borderRadius: 1.5 }} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

/* ── Export ────────────────────────────── */

const StoryCard: React.FC<StoryCardProps> = ({ story, onPress, variant = "standard" }) => {
  if (variant === "continue") return <ContinueReadingCard story={story} onPress={onPress} />;
  return <StandardCard story={story} onPress={onPress} />;
};

export default StoryCard;
