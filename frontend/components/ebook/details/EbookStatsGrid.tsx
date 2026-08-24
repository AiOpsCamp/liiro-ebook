import React from "react";
import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Hash, Clock, Award, Volume2, BookOpen } from "lucide-react-native";

interface EbookStatsGridProps {
  totalChapters: number;
  readTimeDisplay: string;
  difficultyLevel?: string;
  totalAudioDurationSec: number;
  contentType?: string;
  surfaceColor: string;
  borderColor: string;
  accentColor: string;
  formatDuration: (minutes: number) => string;
}

export function EbookStatsGrid({
  totalChapters,
  readTimeDisplay,
  difficultyLevel = "—",
  totalAudioDurationSec,
  contentType,
  surfaceColor,
  borderColor,
  accentColor,
  formatDuration,
}: EbookStatsGridProps) {
  const stats = [
    { icon: Hash, label: "Chapters", value: String(totalChapters), color: accentColor },
    { icon: Clock, label: "Est. Read Time", value: readTimeDisplay, color: "#F59E0B" },
    { icon: Award, label: "Reading Level", value: difficultyLevel || "—", color: "#10B981" },
    {
      icon: totalAudioDurationSec > 0 ? Volume2 : BookOpen,
      label: totalAudioDurationSec > 0 ? "Audio Duration" : "Format",
      value:
        totalAudioDurationSec > 0
          ? formatDuration(Math.round(totalAudioDurationSec / 60))
          : contentType === "both"
          ? "Read & Audio"
          : contentType === "audiobook"
          ? "Audiobook"
          : "Ebook",
      color: "#8B5CF6",
    },
  ];

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24, marginTop: 8 }}>
      {stats.map((stat) => {
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
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: stat.color + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={17} color={stat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="Bold" style={{ color: stat.color, fontSize: 15, letterSpacing: -0.2 }}>
                {stat.value}
              </Text>
              <Text weight="Medium" style={{ color: "#94A3B8", fontSize: 11, marginTop: 1 }}>
                {stat.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
