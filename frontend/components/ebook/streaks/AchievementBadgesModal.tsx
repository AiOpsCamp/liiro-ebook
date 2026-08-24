import React from "react";
import { View, Modal, Pressable, ScrollView } from "react-native";
import { X, Award, Flame, Lock, CheckCircle2 } from "lucide-react-native";
import { AppText as Text } from "@/components/ui/AppText";

interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirementCount: number;
  badgeColor: string;
  isUnlocked: boolean;
}

interface AchievementBadgesModalProps {
  visible: boolean;
  onClose: () => void;
  achievements: Achievement[];
  currentStreak: number;
}

export function AchievementBadgesModal({
  visible,
  onClose,
  achievements = [],
  currentStreak = 1,
}: AchievementBadgesModalProps) {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#0F172A",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: "#1E293B",
            maxHeight: "85%",
            padding: 24,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justify: "space-between", marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(245,158,11,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Award size={22} color="#F59E0B" />
              </View>
              <View>
                <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 18 }}>
                  Reader Achievements
                </Text>
                <Text weight="Medium" style={{ color: "#94A3B8", fontSize: 12 }}>
                  Unlocked {unlockedCount} of {achievements.length} Badges
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 100, backgroundColor: "#1E293B" }}>
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Current Streak Summary */}
          <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderHeight: 1, borderColor: "rgba(245,158,11,0.3)", borderRadius: 18, padding: 16, marginBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
              <View>
                <Text weight="Bold" style={{ color: "#F59E0B", fontSize: 15 }}>
                  {currentStreak}-Day Reading Streak
                </Text>
                <Text weight="Medium" style={{ color: "#CBD5E1", fontSize: 11 }}>
                  Keep reading 15 mins daily to maintain your flame!
                </Text>
              </View>
            </View>
          </View>

          {/* Badges Grid */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12, paddingBottom: 20 }}>
              {achievements.map((ach) => (
                <View
                  key={ach.key}
                  style={{
                    backgroundColor: ach.isUnlocked ? "rgba(30,41,59,0.8)" : "rgba(15,23,42,0.6)",
                    borderWidth: 1,
                    borderColor: ach.isUnlocked ? ach.badgeColor : "#1E293B",
                    borderRadius: 20,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    opacity: ach.isUnlocked ? 1 : 0.6,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: ach.badgeColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: ach.badgeColor + "40",
                    }}
                  >
                    <Text style={{ fontSize: 26 }}>{ach.icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 15 }}>
                        {ach.title}
                      </Text>
                      {ach.isUnlocked ? (
                        <CheckCircle2 size={16} color="#10B981" />
                      ) : (
                        <Lock size={14} color="#64748B" />
                      )}
                    </View>
                    <Text weight="Medium" style={{ color: "#94A3B8", fontSize: 12, lineHeight: 16 }}>
                      {ach.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
