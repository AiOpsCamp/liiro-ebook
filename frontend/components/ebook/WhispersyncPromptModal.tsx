import React from "react";
import { View, Text, Pressable, Modal, Platform } from "react-native";
import { Headphones, BookOpen, RefreshCw, X, ArrowRight } from "lucide-react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

interface WhispersyncPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmResume: (paragraphIdx: number, audioSec: number, chapterIdx: number) => void;
  whispersyncData: {
    deviceType?: string;
    chapterIndex?: number;
    paragraphIndex?: number;
    audioTimestampSec?: number;
    mappedParagraphIndex?: number;
    mappedAudioTimestampSec?: number;
    syncMode?: "reading" | "listening";
    lastSyncAt?: string;
  } | null;
  storyTitle?: string;
}

export const WhispersyncPromptModal: React.FC<WhispersyncPromptModalProps> = ({
  visible,
  onClose,
  onConfirmResume,
  whispersyncData,
  storyTitle = "this book",
}) => {
  if (!visible || !whispersyncData) return null;

  const {
    deviceType = "another device",
    chapterIndex = 1,
    mappedParagraphIndex = 0,
    mappedAudioTimestampSec = 0,
    syncMode = "listening",
  } = whispersyncData;

  const targetSec = mappedAudioTimestampSec || 0;
  const targetPara = mappedParagraphIndex || 0;
  const formattedTime = `${Math.floor(targetSec / 60).toString().padStart(2, "0")}:${Math.floor(targetSec % 60).toString().padStart(2, "0")}`;

  const isFromListening = syncMode === "listening";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutDown.duration(200)}
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "#0F172A",
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: "rgba(56,189,248,0.3)",
            padding: 24,
            shadowColor: "#0EA5E9",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
          }}
        >
          {/* Header Badge */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(14,165,233,0.12)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
              <RefreshCw size={14} color="#38BDF8" />
              <Text style={{ color: "#38BDF8", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>WHISPERSYNC SYNC</Text>
            </View>
            <Pressable onPress={onClose} style={{ padding: 4, opacity: 0.7 }}>
              <X size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Icon & Title */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isFromListening ? "rgba(139,92,246,0.2)" : "rgba(14,165,233,0.2)", alignItems: "center", justifyContent: "center" }}>
              {isFromListening ? <Headphones size={22} color="#A78BFA" /> : <BookOpen size={22} color="#38BDF8" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#F8FAFC", fontSize: 17, fontWeight: "700", lineHeight: 22 }}>
                Resume from {deviceType}?
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>
                Synced position found on {deviceType}
              </Text>
            </View>
          </View>

          {/* Detail Box */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 18 }}>
              {isFromListening
                ? `You were listening at ${formattedTime} in Chapter ${chapterIndex}. Would you like to jump to paragraph ${targetPara + 1}?`
                : `You were reading paragraph ${targetPara + 1} in Chapter ${chapterIndex}. Resume from ${formattedTime}?`}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600" }}>Dismiss</Text>
            </Pressable>

            <Pressable
              onPress={() => onConfirmResume(targetPara, targetSec, chapterIndex)}
              style={({ pressed }) => ({
                flex: 1.5,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#0EA5E9",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Jump to Position</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
