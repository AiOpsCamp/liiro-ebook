import React from "react";
import { View, Text, Pressable } from "react-native";
import { Flame, Zap, Award, ChevronRight, CheckCircle2, Bell, Sparkles } from "lucide-react-native";

interface EbookStreakBannerProps {
  currentStreak?: number;
  xpScore?: number;
  dailyGoalMinutes?: number;
  completedMinutesToday?: number;
  isDark?: boolean;
  onPressDetails?: () => void;
  onPressBell?: () => void;
  onPressUpgrade?: () => void;
}

export const EbookStreakBanner: React.FC<EbookStreakBannerProps> = ({
  currentStreak = 7,
  xpScore = 450,
  dailyGoalMinutes = 15,
  completedMinutesToday = 12,
  isDark = true,
  onPressDetails,
  onPressBell,
  onPressUpgrade,
}) => {
  const goalProgressPct = Math.min(100, Math.round((completedMinutesToday / dailyGoalMinutes) * 100));

  const weekDays = [
    { label: "M", done: true },
    { label: "T", done: true },
    { label: "W", done: true },
    { label: "T", done: true },
    { label: "F", done: true },
    { label: "S", done: true },
    { label: "S", done: false },
  ];

  return (
    <Pressable
      onPress={onPressDetails}
      style={({ pressed }) => ({
        marginBottom: 20,
        borderRadius: 20,
        padding: 16,
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "#FFFFFF",
        borderWidth: 1,
        borderColor: isDark ? "rgba(56, 189, 248, 0.25)" : "rgba(14, 165, 233, 0.2)",
        opacity: pressed ? 0.95 : 1,
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.25 : 0.1,
        shadowRadius: 12,
        elevation: 4,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {/* Streak & XP Badges */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Flame Streak Pill */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
              backgroundColor: "rgba(249, 115, 22, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(249, 115, 22, 0.35)",
            }}
          >
            <Flame size={18} color="#F97316" />
            <Text style={{ color: "#F97316", fontSize: 13, fontWeight: "700" }}>
              {currentStreak} Day Streak
            </Text>
          </View>

          {/* XP Pill */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
              backgroundColor: "rgba(168, 85, 247, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(168, 85, 247, 0.35)",
            }}
          >
            <Zap size={16} color="#C084FC" />
            <Text style={{ color: "#C084FC", fontSize: 13, fontWeight: "700" }}>
              {xpScore} XP
            </Text>
          </View>
        </View>

        {/* Action Controls & Notifications */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {onPressUpgrade && (
            <Pressable
              onPress={onPressUpgrade}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.5)",
              }}
            >
              <Sparkles size={14} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 11.5, fontWeight: "700" }}>Pro</Text>
            </Pressable>
          )}

          {onPressBell && (
            <Pressable
              onPress={onPressBell}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                alignItems: "center",
                justify: "center",
                alignSelf: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={16} color={isDark ? "#94A3B8" : "#64748B"} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress Ring & Weekly Checkmarks */}
      <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {/* Progress Text */}
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={{ color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 14, fontWeight: "700" }}>
            {completedMinutesToday} of {dailyGoalMinutes} mins read today
          </Text>
          {/* Progress Bar Container */}
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${goalProgressPct}%`,
                height: "100%",
                borderRadius: 3,
                backgroundColor: "#0EA5E9",
              }}
            />
          </View>
        </View>

        {/* Weekly Day Tracker Pills */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          {weekDays.map((d, idx) => (
            <View
              key={idx}
              style={{
                width: 22,
                height: 26,
                borderRadius: 6,
                backgroundColor: d.done
                  ? "#0EA5E9"
                  : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
                alignItems: "center",
                justify: "center",
                borderWidth: d.done ? 0 : 1,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: d.done ? "#FFFFFF" : isDark ? "#64748B" : "#94A3B8",
                  marginTop: 4,
                }}
              >
                {d.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
};
