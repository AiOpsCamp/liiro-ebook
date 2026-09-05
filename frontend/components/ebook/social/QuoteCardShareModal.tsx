import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Share,
  Platform,
  Dimensions,
  StyleSheet,
  Image
} from "react-native";
import { X, Share2, Copy, Check, Sparkles, BookOpen, Quote as QuoteIcon, Heart } from "lucide-react-native";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface QuoteCardData {
  quoteText: string;
  storyTitle?: string;
  storySlug?: string;
  authorName?: string;
  category?: string;
  coverUrl?: string;
}

interface QuoteCardShareModalProps {
  visible: boolean;
  onClose: () => void;
  quoteData: QuoteCardData | null;
}

const THEMES = [
  {
    id: "midnight",
    name: "Midnight Obsidian",
    bgGradient: ["#0F172A", "#1E293B"],
    cardBg: "#0F172A",
    borderColor: "#38BDF8",
    textColor: "#F8FAFC",
    accentColor: "#38BDF8",
    authorColor: "#94A3B8"
  },
  {
    id: "royal_gold",
    name: "Royal Gold",
    bgGradient: ["#1C1917", "#292524"],
    cardBg: "#1C1917",
    borderColor: "#F59E0B",
    textColor: "#FEF3C7",
    accentColor: "#F59E0B",
    authorColor: "#D97706"
  },
  {
    id: "emerald",
    name: "Cyber Emerald",
    bgGradient: ["#064E3B", "#022C22"],
    cardBg: "#022C22",
    borderColor: "#10B981",
    textColor: "#ECFDF5",
    accentColor: "#10B981",
    authorColor: "#6EE7B7"
  },
  {
    id: "parchment",
    name: "Vintage Parchment",
    bgGradient: ["#2C2523", "#1F1A18"],
    cardBg: "#241E1C",
    borderColor: "#E2D9D2",
    textColor: "#FAF6F0",
    accentColor: "#D4AF37",
    authorColor: "#C2B5A8"
  },
  {
    id: "velvet",
    name: "Deep Velvet",
    bgGradient: ["#3B0764", "#1E1B4B"],
    cardBg: "#2E1065",
    borderColor: "#C084FC",
    textColor: "#FAF5FF",
    accentColor: "#C084FC",
    authorColor: "#E9D5FF"
  }
];

export function QuoteCardShareModal({ visible, onClose, quoteData }: QuoteCardShareModalProps) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [aspectRatio, setAspectRatio] = useState<"square" | "story">("square");
  const [isCopied, setIsCopied] = useState(false);

  if (!quoteData) return null;

  const quoteText = quoteData.quoteText || "To live will be an awfully big adventure.";
  const authorName = quoteData.authorName || "Classic Author";
  const storyTitle = quoteData.storyTitle || "Classic Literature";

  const handleCopyText = () => {
    const formatted = `"${quoteText}"\n\n— ${authorName}, ${storyTitle}\nRead on Liiro Ebook: https://liiro.app/read/${quoteData.storySlug || ""}`;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareMessage = `"${quoteText}"\n\n— ${authorName}, 《${storyTitle}》\n\n✨ Read on Liiro: https://liiro.app/read/${quoteData.storySlug || ""}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: `${storyTitle} Quote by ${authorName}`,
          text: shareMessage,
          url: `https://liiro.app/read/${quoteData.storySlug || ""}`
        });
      } else {
        await Share.share({
          message: shareMessage,
          title: `${storyTitle} Quote`
        });
      }
    } catch (e) {
      handleCopyText();
    }
  };

  const isSquare = aspectRatio === "square";
  const cardWidth = Math.min(SCREEN_WIDTH - 48, 400);
  const cardHeight = isSquare ? cardWidth : Math.round(cardWidth * 1.55);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={20} color="#38BDF8" />
              <Text style={styles.headerTitle}>Social Quote Card Generator</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* The Live Rendered Quote Card */}
            <View
              style={[
                styles.quoteCard,
                {
                  width: cardWidth,
                  minHeight: cardHeight,
                  backgroundColor: selectedTheme.cardBg,
                  borderColor: selectedTheme.borderColor,
                  shadowColor: selectedTheme.accentColor
                }
              ]}
            >
              {/* Top Watermark & App Brand */}
              <View style={styles.cardHeader}>
                <View style={styles.brandRow}>
                  <View style={[styles.brandDot, { backgroundColor: selectedTheme.accentColor }]} />
                  <Text style={[styles.brandText, { color: selectedTheme.accentColor }]}>LIIRO CLASSICS</Text>
                </View>
                <QuoteIcon size={24} color={selectedTheme.accentColor} opacity={0.6} />
              </View>

              {/* Central Quote Text */}
              <View style={styles.quoteBody}>
                <Text
                  style={[
                    styles.quoteMainText,
                    {
                      color: selectedTheme.textColor,
                      fontSize: quoteText.length > 140 ? 17 : quoteText.length > 80 ? 20 : 23,
                      lineHeight: quoteText.length > 140 ? 26 : quoteText.length > 80 ? 30 : 34
                    }
                  ]}
                >
                  "{quoteText}"
                </Text>
              </View>

              {/* Footer with Book & Author */}
              <View style={styles.cardFooter}>
                <View style={styles.authorMeta}>
                  <Text style={[styles.authorNameText, { color: selectedTheme.textColor }]}>
                    {authorName}
                  </Text>
                  <Text style={[styles.storyTitleText, { color: selectedTheme.authorColor }]}>
                    {storyTitle}
                  </Text>
                </View>

                {quoteData.coverUrl ? (
                  <Image source={{ uri: quoteData.coverUrl }} style={styles.miniCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.miniCoverPlaceholder, { borderColor: selectedTheme.borderColor }]}>
                    <BookOpen size={16} color={selectedTheme.accentColor} />
                  </View>
                )}
              </View>
            </View>

            {/* Layout Controls: Aspect Ratio */}
            <View style={styles.controlsSection}>
              <Text style={styles.controlLabel}>CARD FORMAT</Text>
              <View style={styles.ratioRow}>
                <TouchableOpacity
                  onPress={() => setAspectRatio("square")}
                  style={[styles.ratioBtn, isSquare && styles.ratioBtnActive]}
                >
                  <Text style={[styles.ratioBtnText, isSquare && styles.ratioBtnTextActive]}>
                    1:1 Square (Post)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAspectRatio("story")}
                  style={[styles.ratioBtn, !isSquare && styles.ratioBtnActive]}
                >
                  <Text style={[styles.ratioBtnText, !isSquare && styles.ratioBtnTextActive]}>
                    9:16 Story / Reels
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme Picker */}
            <View style={styles.controlsSection}>
              <Text style={styles.controlLabel}>THEME & PALETTE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow}>
                {THEMES.map((theme) => {
                  const isSelected = selectedTheme.id === theme.id;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      onPress={() => setSelectedTheme(theme)}
                      style={[
                        styles.themePill,
                        { backgroundColor: theme.cardBg, borderColor: isSelected ? theme.accentColor : "#334155" },
                        isSelected && styles.themePillSelected
                      ]}
                    >
                      <View style={[styles.themeColorDot, { backgroundColor: theme.accentColor }]} />
                      <Text style={[styles.themePillText, { color: isSelected ? "#FFFFFF" : "#94A3B8" }]}>
                        {theme.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleCopyText} style={styles.copyBtn}>
                {isCopied ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#94A3B8" />}
                <Text style={[styles.copyBtnText, isCopied && { color: "#10B981" }]}>
                  {isCopied ? "Copied!" : "Copy Quote"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share Quote Card</Text>
              </TouchableOpacity>
            </View>

            {/* Read Book CTA */}
            {quoteData.storySlug && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push(`/read/${quoteData.storySlug}`);
                }}
                style={styles.readBookCta}
              >
                <BookOpen size={16} color="#38BDF8" />
                <Text style={styles.readBookCtaText}>Read "{storyTitle}" in Liiro Reader</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  container: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "92%",
    backgroundColor: "#0B1329",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B"
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  scrollContent: {
    padding: 20,
    alignItems: "center"
  },
  quoteCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    justifyContent: "space-between",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  brandText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5
  },
  quoteBody: {
    marginVertical: 20,
    justifyContent: "center"
  },
  quoteMainText: {
    fontWeight: "600",
    fontStyle: "italic",
    textAlign: "center"
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 16
  },
  authorMeta: {
    flex: 1,
    paddingRight: 12
  },
  authorNameText: {
    fontSize: 15,
    fontWeight: "700"
  },
  storyTitleText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2
  },
  miniCover: {
    width: 36,
    height: 52,
    borderRadius: 6,
    backgroundColor: "#1E293B"
  },
  miniCoverPlaceholder: {
    width: 36,
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  controlsSection: {
    width: "100%",
    marginBottom: 16
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 8
  },
  ratioRow: {
    flexDirection: "row",
    gap: 10
  },
  ratioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0F172A",
    alignItems: "center"
  },
  ratioBtnActive: {
    borderColor: "#38BDF8",
    backgroundColor: "#0369A1"
  },
  ratioBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8"
  },
  ratioBtnTextActive: {
    color: "#FFFFFF"
  },
  themeRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4
  },
  themePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  themePillSelected: {
    borderWidth: 2
  },
  themeColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  themePillText: {
    fontSize: 12,
    fontWeight: "600"
  },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1E293B"
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC"
  },
  shareBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#0284C7"
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  readBookCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8
  },
  readBookCtaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#38BDF8"
  }
});
