import React from "react";
import { View, Text, Pressable } from "react-native";
import { ArrowLeft, Settings2, List, Bookmark, BookMarked, Sun, Moon, CloudRain } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EbookReaderHeaderProps {
  storyTitle: string;
  chapterTitle?: string;
  currentChapterIdx: number;
  totalChapters: number;
  progressPct: number;
  isBookmarked: boolean;
  isDarkTheme: boolean;
  themeColors: {
    bg: string;
    textMain: string;
    textSecondary: string;
    accent: string;
    borderSoft: string;
  };
  onBack: () => void;
  onToggleBookmark: () => void;
  onOpenSettings: () => void;
  onOpenToc: () => void;
  onToggleQuickTheme: () => void;
  onOpenSoundscapes?: () => void;
}

export const EbookReaderHeader: React.FC<EbookReaderHeaderProps> = ({
  storyTitle,
  chapterTitle,
  currentChapterIdx,
  totalChapters,
  progressPct,
  isBookmarked,
  isDarkTheme,
  themeColors,
  onBack,
  onToggleBookmark,
  onOpenSettings,
  onOpenToc,
  onToggleQuickTheme,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: themeColors.bg,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.borderSoft,
        zIndex: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {/* Left Back Button & Book Title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => ({
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 22,
              backgroundColor: isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ArrowLeft size={18} color={themeColors.textMain} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ color: themeColors.textMain, fontSize: 14, fontWeight: "700" }}
            >
              {storyTitle}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: themeColors.textSecondary, fontSize: 11, marginTop: 1 }}
            >
              {chapterTitle || `Chapter ${currentChapterIdx + 1} of ${totalChapters}`}
            </Text>
          </View>
        </View>

        {/* Right Actions */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {/* Ambient Soundscapes Toggle */}
          {onOpenSoundscapes && (
            <Pressable
              onPress={onOpenSoundscapes}
              hitSlop={8}
              style={({ pressed }) => ({
                minWidth: 44,
                minHeight: 44,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 22,
                backgroundColor: isDarkTheme ? "rgba(56,189,248,0.12)" : "rgba(14,165,233,0.1)",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <CloudRain size={17} color="#38BDF8" />
            </Pressable>
          )}

          {/* Quick Theme Toggle */}
          <Pressable
            onPress={onToggleQuickTheme}
            hitSlop={8}
            style={({ pressed }) => ({
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 22,
              backgroundColor: isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {isDarkTheme ? <Sun size={17} color="#FACC15" /> : <Moon size={17} color="#475569" />}
          </Pressable>

          {/* Bookmark Toggle */}
          <Pressable
            onPress={onToggleBookmark}
            hitSlop={8}
            style={({ pressed }) => ({
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 22,
              backgroundColor: isBookmarked ? themeColors.accent + "20" : isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {isBookmarked ? (
              <BookMarked size={17} color={themeColors.accent} />
            ) : (
              <Bookmark size={17} color={themeColors.textSecondary} />
            )}
          </Pressable>

          {/* TOC Button */}
          <Pressable
            onPress={onOpenToc}
            hitSlop={8}
            style={({ pressed }) => ({
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 22,
              backgroundColor: isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <List size={17} color={themeColors.textMain} />
          </Pressable>

          {/* Reader Settings Modal Button */}
          <Pressable
            onPress={onOpenSettings}
            hitSlop={8}
            style={({ pressed }) => ({
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 22,
              backgroundColor: isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Settings2 size={17} color={themeColors.textMain} />
          </Pressable>
        </View>
      </View>

      {/* Progress Bar Line */}
      <View
        style={{
          height: 2,
          backgroundColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          borderRadius: 1,
          marginTop: 10,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.max(1, Math.min(100, progressPct))}%`,
            backgroundColor: themeColors.accent,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
};
