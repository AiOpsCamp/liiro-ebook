import { AppText as Text } from '@/components/ui/AppText';
import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, ScrollView, useWindowDimensions, StyleSheet } from "react-native";
import {
  X,
  Zap,
  Clock,
  Infinity as InfinityIcon,
  Crown,
  Lock,
  Layers,
  ListFilter,
  Hourglass,
  RotateCcw} from "lucide-react-native";
import { useAppSelector } from "@/redux/hook";
import { selectIsDark } from "@/redux/features/themeSlice";
import { useRouter } from "expo-router";
import ResponsiveSheet from "@/components/ui/shared/ResponsiveSheet";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
// --- Theme Colors ---
const COLORS = {
  violetPrimary: themeColors["purple-dark"],
  violetDark: AppColors.purpleDeepest,
  violetLight: AppColors.violet400,
  violetSoft: AppColors.violet200,
  white: themeColors["white"],
  gold: AppColors.gold,
  danger: themeColors["error"]};

const DARK_THEME = {
  bg: "#0F0F16",
  card: "#181824",
  text: themeColors["white"],
  subText: themeColors["gray-400"],
  border: "rgba(255,255,255,0.08)",
  iconDefault: AppColors.violet400};

const LIGHT_THEME = {
  bg: themeColors["white"],
  card: themeColors["gray-100"],
  text: themeColors["gray-900"],
  subText: themeColors["gray-500"],
  border: themeColors["gray-200"],
  iconDefault: themeColors["purple-dark"]};

// --- Configuration ---
const TIME_OPTIONS = [
  { value: 2, label: "2 Min", tagline: "Quick Spark", icon: Zap, premium: false },
  { value: 4, label: "4 Min", tagline: "Steady Focus", icon: Clock, premium: false },
  { value: 6, label: "6 Min", tagline: "Deep Dive", icon: Hourglass, premium: true },
  { value: 0, label: "Unlimited", tagline: "Zen Flow", icon: InfinityIcon, premium: true },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10 Qs", premium: false },
  { value: 20, label: "20 Qs", premium: false },
  { value: "all", label: "All", premium: true },
];

interface TimeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time: string | number, limit: number | "all" | string) => void;
  toolTitle: string;
  isSubscribed?: boolean;
  totalTermsCount?: number;
}

const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  toolTitle,
  isSubscribed = false,
  totalTermsCount,
}) => {
  // Hooks
  const isDark = useAppSelector(selectIsDark);
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Constants
  const T = isDark ? DARK_THEME : LIGHT_THEME;
  const isTablet = width > 768;
  const isAccessUnlocked = isSubscribed || __DEV__;

  // State: Smart default setup
  const defaultTime = 2; // 2 Min Quick Spark is ideal default for fast start
  const defaultLimit = totalTermsCount && totalTermsCount <= 15 ? (isAccessUnlocked ? "all" : 10) : 10;

  const [selectedTime, setSelectedTime] = useState<number>(defaultTime);
  const [selectedLimit, setSelectedLimit] = useState<number | "all">(defaultLimit);

  // Handlers
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleTimeSelect = (val: number, isPremium: boolean) => {
    setSelectedTime(val);
  };

  const handleLimitSelect = (val: number | "all", isPremium: boolean) => {
    setSelectedLimit(val);
  };

  const applyPreset = (time: number, limit: number | "all") => {
    setSelectedTime(time);
    setSelectedLimit(limit);
  };

  const isSelectionLocked = useMemo(() => {
    const timePremium = TIME_OPTIONS.find((t) => t.value === selectedTime)?.premium;
    const limitPremium = LIMIT_OPTIONS.find((l) => l.value === selectedLimit)?.premium;

    if (isAccessUnlocked) return false;
    return timePremium || limitPremium;
  }, [selectedTime, selectedLimit, isAccessUnlocked]);

  const onSubmit = useCallback(() => {
    if (isSelectionLocked) {
      handleClose();
      setTimeout(() => {
        try {
          if (router) router.push("/pricing/pricing-main");
        } catch (e) {
          console.warn("Navigation failed - Context missing");
        }
      }, 100);
      return;
    }
    onConfirm(selectedTime, selectedLimit);
    handleClose();
  }, [isSelectionLocked, handleClose, router, onConfirm, selectedTime, selectedLimit]);

  // Render Time Card (Compact Horizontal Layout)
  const renderTimeOption = (item: (typeof TIME_OPTIONS)[0]) => {
    const isSelected = selectedTime === item.value;
    const isLocked = item.premium && !isAccessUnlocked;
    const Icon = item.icon;

    const cardBg = isSelected
      ? isDark
        ? "rgba(255, 139, 90, 0.2)"
        : AppColors.violet50
      : T.card;

    const borderColor = isSelected ? COLORS.violetPrimary : "transparent";

    return (
      <Pressable
        key={item.value}
        onPress={() => handleTimeSelect(item.value, item.premium)}
        style={[
          styles.timeCard,
          {
            backgroundColor: cardBg,
            borderColor: borderColor,
            opacity: isLocked && !isSelected ? 0.6 : 1,
          },
        ]}
      >
        {item.premium && !isAccessUnlocked && (
          <View style={styles.premiumBadgeCorner}>
            <Lock size={9} color={COLORS.white} />
          </View>
        )}

        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isSelected
                ? COLORS.violetPrimary
                : isDark
                  ? "rgba(255,255,255,0.05)"
                  : COLORS.white,
            },
          ]}
        >
          <Icon size={15} color={isSelected ? COLORS.white : T.iconDefault} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.timeValueText, { color: isSelected ? COLORS.violetPrimary : T.text }]} numberOfLines={1}>
            {item.label}
          </Text>
          <Text
            style={[styles.timeTagline, { color: isSelected ? COLORS.violetPrimary : T.subText }]}
            numberOfLines={1}
          >
            {item.tagline}
          </Text>
        </View>

        {isSelected && <View style={styles.activeDot} />}
      </Pressable>
    );
  };

  const footerContent = (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: T.subText, marginBottom: 10 }}>
        Target: {selectedTime === 0 ? "Unlimited Duration" : `${selectedTime} Min Session`} • {selectedLimit === "all" ? "All Terms" : `${selectedLimit} Questions`}
      </Text>

      <Pressable
        onPress={onSubmit}
        style={[
          styles.actionBtn,
          {
            backgroundColor: isSelectionLocked
              ? isDark
                ? themeColors["gray-800"]
                : themeColors["gray-700"]
              : COLORS.violetPrimary,
          },
        ]}
      >
        {isSelectionLocked ? (
          <>
            <Crown size={20} color={COLORS.gold} fill={COLORS.gold} />
            <Text style={styles.actionBtnText}>Unlock Premium</Text>
          </>
        ) : (
          <>
            <Layers size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Start Session</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  return (
    <ResponsiveSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={[isTablet ? "75%" : "90%"]}
      backgroundColor={T.bg}
      handleColor={T.border}
      isDark={isDark}
      maxWidth={520}
      footer={footerContent}
      footerBgColor={isDark ? "rgba(15,15,22,0.95)" : "rgba(255,255,255,0.95)"}
      footerBorderColor={T.border}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: T.border }]}>
          <View>
            <Text style={[styles.title, { color: T.text }]}>{toolTitle}</Text>
            <Text style={[styles.subtitle, { color: T.subText }]}>Customize your session</Text>
          </View>
          <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: T.card }]}>
            <X size={20} color={T.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Quick Presets */}
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: T.subText, marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" }}>
              Quick Presets
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {/* Preset 1: Quick Warmup */}
              <Pressable
                onPress={() => applyPreset(2, 10)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: selectedTime === 2 && selectedLimit === 10
                    ? (isDark ? "rgba(255, 139, 90, 0.2)" : AppColors.violet50)
                    : T.card,
                  borderWidth: 1.5,
                  borderColor: selectedTime === 2 && selectedLimit === 10 ? COLORS.violetPrimary : T.border,
                }}
              >
                <Zap size={14} color={selectedTime === 2 && selectedLimit === 10 ? COLORS.violetPrimary : T.subText} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: selectedTime === 2 && selectedLimit === 10 ? COLORS.violetPrimary : T.text }}>
                  ⚡ Quick (2m / 10 Qs)
                </Text>
              </Pressable>

              {/* Preset 2: Review Sprint */}
              <Pressable
                onPress={() => applyPreset(4, 20)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: selectedTime === 4 && selectedLimit === 20
                    ? (isDark ? "rgba(255, 139, 90, 0.2)" : AppColors.violet50)
                    : T.card,
                  borderWidth: 1.5,
                  borderColor: selectedTime === 4 && selectedLimit === 20 ? COLORS.violetPrimary : T.border,
                }}
              >
                <RotateCcw size={14} color={selectedTime === 4 && selectedLimit === 20 ? COLORS.violetPrimary : T.subText} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: selectedTime === 4 && selectedLimit === 20 ? COLORS.violetPrimary : T.text }}>
                  🔄 Review Sprint (4m / 20 Qs)
                </Text>
              </Pressable>

              {/* Preset 3: Full Pack */}
              <Pressable
                onPress={() => applyPreset(isAccessUnlocked ? 0 : 6, isAccessUnlocked ? "all" : 20)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: (selectedTime === 0 || selectedTime === 6) && (selectedLimit === "all" || selectedLimit === 20)
                    ? (isDark ? "rgba(255, 139, 90, 0.2)" : AppColors.violet50)
                    : T.card,
                  borderWidth: 1.5,
                  borderColor: (selectedTime === 0 || selectedTime === 6) && (selectedLimit === "all" || selectedLimit === 20) ? COLORS.violetPrimary : T.border,
                }}
              >
                <InfinityIcon size={14} color={(selectedTime === 0 || selectedTime === 6) && (selectedLimit === "all" || selectedLimit === 20) ? COLORS.violetPrimary : T.subText} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: (selectedTime === 0 || selectedTime === 6) && (selectedLimit === "all" || selectedLimit === 20) ? COLORS.violetPrimary : T.text }}>
                  🎯 Full Pack ({isAccessUnlocked ? "All" : "20 Qs"})
                </Text>
              </Pressable>
            </ScrollView>
          </View>
          {/* Section 1: Time */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Clock size={16} color={COLORS.violetPrimary} />
              </View>
              <Text style={[styles.sectionTitle, { color: T.text }]}>Duration</Text>
            </View>

            <View style={styles.gridContainer}>{TIME_OPTIONS.map(renderTimeOption)}</View>
          </View>

          {/* Section 2: Limit */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <ListFilter size={16} color={COLORS.violetPrimary} />
              </View>
              <Text style={[styles.sectionTitle, { color: T.text }]}>Question Limit</Text>
            </View>

            <View style={[styles.limitContainer, { backgroundColor: T.card }]}>
              {LIMIT_OPTIONS.map((opt) => {
                const isSelected = selectedLimit === opt.value;
                const isLocked = opt.premium && !isAccessUnlocked;

                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleLimitSelect(opt.value as any, opt.premium)}
                    style={[
                      styles.limitBtn,
                      isSelected && styles.limitBtnActive,
                      isSelected && { backgroundColor: isDark ? "#2D2D3A" : COLORS.white },
                    ]}
                  >
                    {isLocked && !isSelected && (
                      <Lock size={12} color={T.subText} style={{ marginRight: 4 }} />
                    )}
                    {opt.premium && isAccessUnlocked && !isSelected && (
                      <Crown size={12} color={COLORS.gold} style={{ marginRight: 4 }} />
                    )}

                    <Text
                      style={[
                        styles.limitText,
                        { color: isSelected ? COLORS.violetPrimary : T.subText },
                        isSelected && { fontWeight: "800" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </ResponsiveSheet>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
    letterSpacing: 0.1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIconBg: {
    backgroundColor: "rgba(255, 139, 90, 0.1)",
    padding: 5,
    borderRadius: 6,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // Time Grid
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  timeCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    position: "relative",
    overflow: "hidden",
  },
  premiumBadgeCorner: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.violetPrimary,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 10,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 8,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.violetPrimary,
  },
  timeValueText: {
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  timeTagline: {
    fontSize: 10.5,
    fontWeight: "600",
    letterSpacing: 0.1,
    lineHeight: 13,
  },

  // Limit Segment
  limitContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
  },
  limitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  limitBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  limitText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  actionBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: COLORS.violetPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

export default TimeSelectionModal;
