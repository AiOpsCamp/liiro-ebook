import React from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { X, Check, Type, Sun, Moon, Sparkles } from "lucide-react-native";

interface EbookReaderSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  activeThemeKey: string;
  activeFontFamily: "sans" | "serif" | "mono";
  activeFontSize: number;
  activeTextAlign: "left" | "justify" | "center";
  themeColors: {
    bg: string;
    textMain: string;
    textSecondary: string;
    accent: string;
    borderSoft: string;
  };
  onUpdateSettings: (updates: {
    theme?: string;
    fontFamily?: "sans" | "serif" | "mono";
    fontSize?: number;
    textAlign?: "left" | "justify" | "center";
  }) => void;
}

const THEME_OPTIONS = [
  { key: "light", name: "Classic Paper", bg: "#FFFFFF", text: "#0F172A" },
  { key: "sepia", name: "Vintage Sepia 📜", bg: "#FBF7EE", text: "#433422" },
  { key: "dark", name: "Midnight Dark", bg: "#0F172A", text: "#F8FAFC" },
  { key: "oled", name: "Pitch OLED", bg: "#000000", text: "#E2E8F0" },
  { key: "victorian", name: "Gothic 🏰", bg: "#121016", text: "#F1EDF7" },
  { key: "forest", name: "Forest 🌲", bg: "#0D1813", text: "#ECFDF5" },
];

const FONT_OPTIONS: Array<{ key: "sans" | "serif" | "mono"; name: string }> = [
  { key: "sans", name: "Sans-Serif" },
  { key: "serif", name: "Classic Serif" },
  { key: "mono", name: "Monospace" },
];

export const EbookReaderSettingsModal: React.FC<EbookReaderSettingsModalProps> = ({
  visible,
  onClose,
  activeThemeKey,
  activeFontFamily,
  activeFontSize,
  activeTextAlign,
  themeColors,
  onUpdateSettings,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: themeColors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            borderTopWidth: 1,
            borderColor: themeColors.borderSoft,
            maxHeight: "80%",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Text style={{ color: themeColors.textMain, fontSize: 18, fontWeight: "700" }}>
              Reader Preferences
            </Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={themeColors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Reading Themes */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 }}>
              THEME COLOR
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
              {THEME_OPTIONS.map((t) => {
                const isActive = activeThemeKey === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => onUpdateSettings({ theme: t.key })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: t.bg,
                      borderWidth: isActive ? 2 : 1,
                      borderColor: isActive ? themeColors.accent : "rgba(0,0,0,0.1)",
                    }}
                  >
                    <Text style={{ color: t.text, fontSize: 13, fontWeight: "600" }}>{t.name}</Text>
                    {isActive && <Check size={14} color={themeColors.accent} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Typography */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 }}>
              TYPOGRAPHY
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
              {FONT_OPTIONS.map((f) => {
                const isActive = activeFontFamily === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => onUpdateSettings({ fontFamily: f.key })}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: isActive ? themeColors.accent + "20" : "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: isActive ? themeColors.accent : themeColors.borderSoft,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: isActive ? themeColors.accent : themeColors.textMain, fontSize: 13, fontWeight: "700" }}>
                      {f.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Font Size Adjustments */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 }}>
              FONT SIZE ({activeFontSize}px)
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <Pressable
                onPress={() => onUpdateSettings({ fontSize: Math.max(12, activeFontSize - 2) })}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}
              >
                <Text style={{ color: themeColors.textMain, fontSize: 14, fontWeight: "700" }}>A-</Text>
              </Pressable>
              <Pressable
                onPress={() => onUpdateSettings({ fontSize: Math.min(32, activeFontSize + 2) })}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}
              >
                <Text style={{ color: themeColors.textMain, fontSize: 18, fontWeight: "700" }}>A+</Text>
              </Pressable>
            </View>

            {/* Text Alignment */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 }}>
              TEXT ALIGNMENT
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["left", "justify", "center"] as const).map((align) => {
                const isActive = activeTextAlign === align;
                return (
                  <Pressable
                    key={align}
                    onPress={() => onUpdateSettings({ textAlign: align })}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: isActive ? themeColors.accent + "20" : "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: isActive ? themeColors.accent : themeColors.borderSoft,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: isActive ? themeColors.accent : themeColors.textMain, fontSize: 13, fontWeight: "700", textTransform: "capitalize" }}>
                      {align}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
