import React, { useState } from "react";
import { View, Pressable, Image } from "react-native";
import { useSelector } from "react-redux";
import { BookOpen, Headphones, Play, Clock, Sparkles } from "lucide-react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { selectIsDark } from "@/redux/features/themeSlice";
import { getLocalizedText } from "@/utils/getLocalizedText";
import type { Story } from "@/api/storiesQuery";

interface ContinueCardProps {
  story: Story;
  onPress: (slug: string, preferAudio?: boolean) => void;
  variant: "reading" | "listening" | "visit";
}

function formatSeconds(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const ContinueCard: React.FC<ContinueCardProps> = ({ story, onPress, variant }) => {
  const isDark = useSelector(selectIsDark);
  const [imageError, setImageError] = useState(false);
  const titleStr = getLocalizedText(story.title, "Untitled");
  const cover = story.coverImageUrl?.replace(/^http:\/\//, "https://");
  const progress = story.userProgress;

  const audioTime = progress?.audioTimestamp || 0;
  const lastType = progress?.lastActivityType || (variant === "listening" ? "listening" : "reading");
  const isAudioMode = variant === "listening" || lastType === "listening";

  return (
    <Pressable
      onPress={() => onPress(story.slug, isAudioMode)}
      style={({ pressed }) => ({
        width: 320,
        marginRight: 14,
        opacity: pressed ? 0.92 : 1,
      })}
      accessibilityLabel={`Continue ${titleStr}`}
    >
      <View
        style={{
          borderRadius: 22,
          overflow: "hidden",
          flexDirection: "row",
          backgroundColor: isDark ? "#121C30" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.45 : 0.08,
          shadowRadius: 18,
          elevation: 5,
        }}
      >
        {/* Cover Art */}
        <View style={{ width: 104, height: 146, position: "relative" }}>
          {cover && !imageError ? (
            <Image
              source={{ uri: cover }}
              onError={() => setImageError(true)}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
              }}
            >
              {isAudioMode ? <Headphones size={30} color="#8B5CF6" /> : <BookOpen size={30} color="#3B82F6" />}
            </View>
          )}

          {/* Mode Pill on Cover */}
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 100,
              backgroundColor: isAudioMode ? "rgba(139,92,246,0.9)" : "rgba(59,130,246,0.9)",
              gap: 4,
            }}
          >
            {isAudioMode ? <Headphones size={10} color="#FFFFFF" /> : <BookOpen size={10} color="#FFFFFF" />}
            <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 9, letterSpacing: 0.4, textTransform: "uppercase" }}>
              {isAudioMode ? "Audio" : "Reading"}
            </Text>
          </View>
        </View>

        {/* Info Column */}
        <View style={{ flex: 1, padding: 14, justifyContent: "space-between" }}>
          {/* Header & Title */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Clock size={11} color={isDark ? "#94A3B8" : "#64748B"} />
                <Text weight="Medium" style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 10.5 }}>
                  {formatTimeAgo(progress?.lastVisitedAt || progress?.lastReadAt || progress?.lastListenedAt)}
                </Text>
              </View>
              {story.difficultyLevel && (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  }}
                >
                  <Text weight="Bold" style={{ color: isDark ? "#CBD5E1" : "#475569", fontSize: 9.5 }}>
                    {story.difficultyLevel}
                  </Text>
                </View>
              )}
            </View>

            <Text weight="Bold" numberOfLines={2} style={{ color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 14, lineHeight: 19.5, marginBottom: 2 }}>
              {titleStr}
            </Text>

            {story.author ? (
              <Text weight="Medium" numberOfLines={1} style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11.5 }}>
                {story.author}
              </Text>
            ) : null}
          </View>

          {/* Action / Progress Footer */}
          <View style={{ marginTop: 6 }}>
            {/* Real Progress Bar & Percentage */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text weight="SemiBold" style={{ fontSize: 10.5, color: isDark ? "#94A3B8" : "#64748B" }}>
                {progress?.isCompleted ? "Completed" : (progress?.completedChapterIds?.length || 0) > 0 ? `${progress?.completedChapterIds?.length}/${story.totalChapters || 1} Chapters` : "In Progress"}
              </Text>
              <Text weight="Bold" style={{ fontSize: 10.5, color: isAudioMode ? "#8B5CF6" : "#3B82F6" }}>
                {progress?.isCompleted ? 100 : Math.min(100, Math.max((progress?.completedChapterIds?.length || 0) > 0 ? 12 : 5, Math.round(((progress?.completedChapterIds?.length || 0) / (story.totalChapters || 1)) * 100)))}%
              </Text>
            </View>

            <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", marginBottom: 8, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${progress?.isCompleted ? 100 : Math.min(100, Math.max((progress?.completedChapterIds?.length || 0) > 0 ? 12 : 5, Math.round(((progress?.completedChapterIds?.length || 0) / (story.totalChapters || 1)) * 100)))}%`,
                  backgroundColor: isAudioMode ? "#8B5CF6" : "#3B82F6",
                  borderRadius: 2,
                }}
              />
            </View>

            {variant === "listening" || isAudioMode ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Headphones size={12} color="#8B5CF6" />
                  <Text weight="SemiBold" style={{ color: "#8B5CF6", fontSize: 11 }}>
                    {formatSeconds(audioTime)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#8B5CF6",
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 100,
                    gap: 4,
                  }}
                >
                  <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                  <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 11 }}>
                    Listen
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <BookOpen size={12} color="#3B82F6" />
                  <Text weight="SemiBold" style={{ color: "#3B82F6", fontSize: 11 }}>
                    Resume
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#3B82F6",
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 100,
                    gap: 4,
                  }}
                >
                  <Sparkles size={10} color="#FFFFFF" />
                  <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 11 }}>
                    Read
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default ContinueCard;
