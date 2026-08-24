import React, { useState } from "react";
import { View, Modal, Pressable, ScrollView, Share, Platform } from "react-native";
import { X, Share2, Sparkles, Quote, Check, Image as ImageIcon } from "lucide-react-native";
import { AppText as Text } from "@/components/ui/AppText";

interface SocialQuoteCardModalProps {
  visible: boolean;
  onClose: () => void;
  storyTitle: string;
  author: string;
  quoteText?: string;
  coverImageUrl?: string;
}

const STYLE_TEMPLATES = [
  { id: "dark_gold", name: "Gothic Gold", bg: "#0F172A", text: "#F59E0B", border: "#F59E0B" },
  { id: "sepia_classic", name: "Warm Sepia", bg: "#78350F", text: "#FEF3C7", border: "#FDE68A" },
  { id: "midnight_purple", name: "Midnight Glow", bg: "#311B92", text: "#E9D5FF", border: "#C084FC" },
  { id: "emerald_stoic", name: "Stoic Emerald", bg: "#064E3B", text: "#A7F3D0", border: "#34D399" },
];

export function SocialQuoteCardModal({
  visible,
  onClose,
  storyTitle,
  author,
  quoteText = "Man is not truly one, but truly two.",
  coverImageUrl,
}: SocialQuoteCardModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(STYLE_TEMPLATES[0]);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const shareMessage = `“${quoteText}”\n\n— ${author}, ${storyTitle}\n\nCurrently listening to unabridged classics on Liiro Ebook & Audiobooks 🚀\nhttp://localhost:8086/details/${storyTitle.toLowerCase().replace(/\s+/g, "-")}`;

      if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: `${storyTitle} Quote`,
          text: shareMessage,
        });
      } else {
        await Share.share({
          message: shareMessage,
        });
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Share failed:", e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 }}>
        <View
          style={{
            backgroundColor: "#0F172A",
            borderRadius: 28,
            borderWidth: 1,
            borderColor: "#1E293B",
            padding: 24,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Sparkles size={20} color="#F59E0B" />
              <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 18 }}>
                Generate Quote Card 🎨
              </Text>
            </View>
            <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 100, backgroundColor: "#1E293B" }}>
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Render Preview Card */}
          <View
            style={{
              backgroundColor: selectedTemplate.bg,
              borderColor: selectedTemplate.border,
              borderWidth: 2,
              borderRadius: 24,
              padding: 24,
              marginBottom: 20,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 220,
              shadowColor: selectedTemplate.text,
              shadowOpacity: 0.3,
              shadowRadius: 15,
            }}
          >
            <Quote size={28} color={selectedTemplate.text} style={{ opacity: 0.6, marginBottom: 12 }} />
            <Text
              weight="Bold"
              style={{
                color: selectedTemplate.text,
                fontSize: 18,
                textAlign: "center",
                lineHeight: 26,
                marginBottom: 16,
                fontStyle: "italic",
              }}
            >
              “{quoteText}”
            </Text>

            <View style={{ alignItems: "center" }}>
              <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 13 }}>
                — {author}
              </Text>
              <Text weight="Medium" style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
                {storyTitle} • Liiro Audiobooks 🎧
              </Text>
            </View>
          </View>

          {/* Style Template Selector */}
          <Text weight="Bold" style={{ color: "#94A3B8", fontSize: 12, marginBottom: 10, textTransform: "uppercase" }}>
            Card Style Templates
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {STYLE_TEMPLATES.map((tmpl) => (
              <Pressable
                key={tmpl.id}
                onPress={() => setSelectedTemplate(tmpl)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: tmpl.bg,
                  borderWidth: 2,
                  borderColor: selectedTemplate.id === tmpl.id ? "#FFFFFF" : tmpl.border,
                  alignItems: "center",
                }}
              >
                <Text weight="Bold" style={{ color: tmpl.text, fontSize: 11 }}>
                  {tmpl.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Action Button */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => ({
              backgroundColor: "#F59E0B",
              paddingVertical: 14,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {copied ? <Check size={18} color="#0F172A" /> : <Share2 size={18} color="#0F172A" />}
            <Text weight="Bold" style={{ color: "#0F172A", fontSize: 15 }}>
              {copied ? "Status Shared!" : "Share to Instagram / X 🚀"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
