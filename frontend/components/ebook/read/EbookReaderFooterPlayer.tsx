import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Play, Pause, RotateCcw, RotateCw, Headphones, Volume2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EbookReaderFooterPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  selectedVoiceKey: string;
  themeColors: {
    bg: string;
    textMain: string;
    textSecondary: string;
    accent: string;
    borderSoft: string;
  };
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  onChangeSpeed: () => void;
}

export const EbookReaderFooterPlayer: React.FC<EbookReaderFooterPlayerProps> = ({
  isPlaying,
  isLoading,
  currentTime,
  duration,
  playbackSpeed,
  selectedVoiceKey,
  themeColors,
  onTogglePlayPause,
  onSeek,
  onChangeSpeed,
}) => {
  const insets = useSafeAreaInsets();

  const formattedCurrent = `${Math.floor(currentTime / 60).toString().padStart(2, "0")}:${Math.floor(currentTime % 60).toString().padStart(2, "0")}`;
  const formattedDuration = `${Math.floor(duration / 60).toString().padStart(2, "0")}:${Math.floor(duration % 60).toString().padStart(2, "0")}`;

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 10,
        paddingHorizontal: 16,
        backgroundColor: themeColors.bg,
        borderTopWidth: 1,
        borderTopColor: themeColors.borderSoft,
        zIndex: 20,
      }}
    >
      {/* Progress slider bar */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: "600", width: 36 }}>
          {formattedCurrent}
        </Text>

        <Pressable
          style={{ flex: 1, height: 20, justifyContent: "center" }}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            // Approximate seek
            if (duration > 0) {
              const ratio = Math.max(0, Math.min(1, locationX / 240));
              onSeek(ratio * duration);
            }
          }}
        >
          <View
            style={{
              height: 4,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${Math.max(0, Math.min(100, progressPct))}%`,
                backgroundColor: themeColors.accent,
                borderRadius: 2,
              }}
            />
          </View>
        </Pressable>

        <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: "600", width: 36, textAlign: "right" }}>
          {formattedDuration}
        </Text>
      </View>

      {/* Control Buttons Bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {/* Speed Selector */}
        <Pressable
          onPress={onChangeSpeed}
          style={({ pressed }) => ({
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.06)",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: themeColors.accent, fontSize: 12, fontWeight: "700" }}>
            {playbackSpeed}x
          </Text>
        </Pressable>

        {/* Playback Controls */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {/* Skip Backwards 15s */}
          <Pressable
            onPress={() => onSeek(currentTime - 15)}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <RotateCcw size={20} color={themeColors.textMain} />
          </Pressable>

          {/* Main Play / Pause Button */}
          <Pressable
            onPress={onTogglePlayPause}
            disabled={isLoading}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: themeColors.accent,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: themeColors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isPlaying ? (
              <Pause size={22} color="#FFFFFF" />
            ) : (
              <Play size={22} color="#FFFFFF" style={{ marginLeft: 3 }} />
            )}
          </Pressable>

          {/* Skip Forwards 15s */}
          <Pressable
            onPress={() => onSeek(currentTime + 15)}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <RotateCw size={20} color={themeColors.textMain} />
          </Pressable>
        </View>

        {/* Voice Badge Indicator */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
          <Headphones size={12} color={themeColors.textSecondary} />
          <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>
            {selectedVoiceKey}
          </Text>
        </View>
      </View>
    </View>
  );
};
