import React, { useState, useEffect } from "react";
import { View, Pressable, Modal, ScrollView, Platform } from "react-native";
import { X, CloudRain, Flame, Trees, Coffee, Castle, Volume2, Play, Pause, VolumeX } from "lucide-react-native";
import { soundscapeManager, SOUNDSCAPE_TRACKS } from "@/lib/utils/soundscapeManager";
import { AppText } from "@/components/ui/AppText";

interface EbookAmbientSoundscapeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EbookAmbientSoundscapeModal: React.FC<EbookAmbientSoundscapeModalProps> = ({
  visible,
  onClose,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    const unsubscribe = soundscapeManager.subscribe((state) => {
      setActiveKey(state.activeKey);
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
    });
    return unsubscribe;
  }, []);

  if (!visible) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "CloudRain": return <CloudRain size={20} color="#38BDF8" />;
      case "Flame": return <Flame size={20} color="#FB923C" />;
      case "Trees": return <Trees size={20} color="#34D399" />;
      case "Coffee": return <Coffee size={20} color="#FBBF24" />;
      case "Castle": return <Castle size={20} color="#C084FC" />;
      default: return <CloudRain size={20} color="#38BDF8" />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.82)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 520,
            backgroundColor: "#0F172A",
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: "rgba(255, 255, 255, 0.12)",
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.08)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(56, 189, 248, 0.15)", alignItems: "center", justifyContent: "center" }}>
                <CloudRain size={20} color="#38BDF8" />
              </View>
              <AppText weight="Bold" style={{ fontSize: 18, color: "#FFFFFF" }}>
                Ambient Soundscapes
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <X size={18} color="#94A3B8" />
            </Pressable>
          </View>

          <AppText weight="Medium" style={{ fontSize: 13, color: "#94A3B8", lineHeight: 20, marginBottom: 18 }}>
            Mix calming focus soundscapes underneath your eBook reading or audiobook narration.
          </AppText>

          {/* Soundscapes List */}
          <ScrollView style={{ maxHeight: 320, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {SOUNDSCAPE_TRACKS.map((track) => {
                const isSelected = activeKey === track.key;
                const isTrackPlaying = isSelected && isPlaying;

                return (
                  <Pressable
                    key={track.key}
                    onPress={() => soundscapeManager.playSoundscape(track.key)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 14,
                      borderRadius: 18,
                      backgroundColor: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#38BDF8" : "rgba(255, 255, 255, 0.08)",
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 }}>
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          backgroundColor: "rgba(0, 0, 0, 0.4)",
                          borderWidth: 1,
                          borderColor: "rgba(255, 255, 255, 0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getIcon(track.icon)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <AppText weight="Bold" style={{ fontSize: 14, color: "#FFFFFF" }}>
                            {track.name}
                          </AppText>
                          <AppText style={{ fontSize: 13 }}>{track.emoji}</AppText>
                        </View>
                        <AppText weight="Medium" numberOfLines={1} style={{ fontSize: 12, color: "#94A3B8" }}>
                          {track.description}
                        </AppText>
                      </View>
                    </View>

                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: isTrackPlaying ? "#38BDF8" : "rgba(56, 189, 248, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "#38BDF8",
                      }}
                    >
                      {isTrackPlaying ? (
                        <Pause size={16} color="#FFFFFF" />
                      ) : (
                        <Play size={16} color={isSelected ? "#FFFFFF" : "#38BDF8"} style={{ marginLeft: 2 }} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Volume Control Bar */}
          {activeKey && (
            <View
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                padding: 14,
                borderRadius: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Volume2 size={16} color="#38BDF8" />
                <AppText weight="Bold" style={{ fontSize: 12, color: "#E2E8F0" }}>
                  Volume ({Math.round(volume * 100)}%)
                </AppText>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pressable
                  onPress={() => soundscapeManager.setVolume(Math.max(0, volume - 0.2))}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 10,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText weight="Bold" style={{ fontSize: 13, color: "#FFFFFF" }}>
                    −
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => soundscapeManager.setVolume(Math.min(1, volume + 0.2))}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 10,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppText weight="Bold" style={{ fontSize: 13, color: "#FFFFFF" }}>
                    +
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => soundscapeManager.stopSoundscape()}
                  style={({ pressed }) => ({
                    padding: 8,
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    borderRadius: 10,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <VolumeX size={16} color="#F87171" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
