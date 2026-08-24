import React from "react";
import { View, Pressable } from "react-native";
import { Flame, Award, ChevronRight } from "lucide-react-native";
import { AppText as Text } from "@/components/ui/AppText";

interface StreakFlameBadgeProps {
  currentStreak: number;
  todayMinutesRead: number;
  dailyGoalMinutes: number;
  goalPercent: number;
  onPress: () => void;
}

export function StreakFlameBadge({
  currentStreak = 1,
  todayMinutesRead = 5,
  dailyGoalMinutes = 15,
  goalPercent = 33,
  onPress,
}: StreakFlameBadgeProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(245,158,11,0.12)",
        borderWidth: 1,
        borderColor: "rgba(245,158,11,0.35)",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#F59E0B",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Flame size={22} color="#0F172A" />
        </View>

        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text weight="Bold" style={{ color: "#F59E0B", fontSize: 16 }}>
              {currentStreak}-Day Streak 🔥
            </Text>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100, backgroundColor: "rgba(245,158,11,0.2)" }}>
              <Text weight="Bold" style={{ color: "#FCD34D", fontSize: 10 }}>ACTIVE</Text>
            </View>
          </View>
          <Text weight="Medium" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
            {todayMinutesRead} / {dailyGoalMinutes} mins read today ({goalPercent}%)
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Award size={18} color="#FCD34D" />
        <ChevronRight size={18} color="#FCD34D" />
      </View>
    </Pressable>
  );
}
