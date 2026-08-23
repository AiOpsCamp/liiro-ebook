import { AppText as Text } from "@/components/ui/AppText";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Platform,
} from "react-native";
import {
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Brain,
  Zap,
  BookOpen,
  Target,
  Lock,
  Crown,
  RotateCcw,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnUI,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAppSelector } from "@/redux/hook";
import { selectIsDark } from "@/redux/features/themeSlice";
import * as Haptics from "expo-haptics";
import ResponsiveSheet from "@/components/ui/shared/ResponsiveSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
// --- Types ---
export type PresetKey = "learn_quick" | "learn_standard" | "learn_deep";
export type StrategyKey =
  | "smart"
  | "balanced"
  | "reviews_only"
  | "new_first"
  | "shuffle_reviews"
  | "review_first";

export type TargetSubset = "all" | "started" | "in_progress" | "learned";

export interface LearnConfig {
  preset: PresetKey;
  strategy: StrategyKey;
  timeLimit: number | null;
  termCount: number;
  cycleSize: number;
  subset: TargetSubset;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onStartLearn: (config: LearnConfig) => void;
  toolTitle?: string;
  onSubscribePress?: () => void;
  isSubscribed?: boolean;
  onPremiumPress?: () => void;
  totalTermsCount?: number;
}

// --- Royal Violet Color Theme ---
const COLORS = {
  royalViolet: AppColors.purpleDeeper,
  violetLight: themeColors["purple-dark"],
  violetAccent: themeColors["purple"],
  violetSoft: AppColors.violet400,
  violetSurface: AppColors.violet200,
  violetMuted: themeColors["light-purple"],
  gold: themeColors["warning"],
  goldLight: AppColors.amber300,
  white: themeColors["white"],
  darkBg: AppColors.darkVioletInk,
  darkCard: AppColors.darkPlumSurface,
  darkCardHover: AppColors.darkAubergine,
  darkBorder: AppColors.darkMauve,
  lightBg: AppColors.nearWhite,
  lightCard: AppColors.violetGhost,
  lightCardHover: AppColors.violetTint,
  lightBorder: AppColors.lavenderMist,
  textDark: AppColors.violet50,
  textLight: AppColors.darkGrape,
  subTextDark: AppColors.mutedLavender,
  subTextLight: AppColors.mutedPurple,
  quickGradientStart: themeColors["purple"],
  quickGradientEnd: AppColors.purpleDeeper,
  standardGradientStart: themeColors["purple-dark"],
  standardGradientEnd: AppColors.purpleDeepest,
  deepGradientStart: AppColors.purpleDeeper,
  deepGradientEnd: AppColors.violet900,
};

// --- Configuration Data ---
type FocusGoalKey = "smart" | "reviews_only" | "new_first" | "quick_wins";
type SessionLengthKey = "half" | "all";

const FOCUS_GOALS: {
  key: FocusGoalKey;
  label: string;
  description: string;
  details: string;
  icon: React.ComponentType<any>;
  gradientColors: [string, string];
  strategy: StrategyKey;
  subset: TargetSubset;
}[] = [
  {
    key: "smart",
    label: "Smart Mix",
    description: "Balanced learning",
    details: "New, review & master",
    icon: Sparkles,
    gradientColors: [COLORS.quickGradientStart, COLORS.quickGradientEnd],
    strategy: "smart",
    subset: "all",
  },
  {
    key: "reviews_only",
    label: "Review Only",
    description: "Fix your mistakes",
    details: "Focus on terms needing review",
    icon: RotateCcw,
    gradientColors: ["#EF4444", "#DC2626"], // Red gradient
    strategy: "reviews_only",
    subset: "all",
  },
  {
    key: "new_first",
    label: "New Terms",
    description: "Fresh vocabulary",
    details: "Learn unpracticed words first",
    icon: Zap,
    gradientColors: ["#3B82F6", "#1D4ED8"], // Blue gradient
    strategy: "new_first",
    subset: "all",
  },
  {
    key: "quick_wins",
    label: "Quick Wins",
    description: "Closest to mastery",
    details: "Lock in near-mastered words",
    icon: Crown,
    gradientColors: ["#FBBF24", "#D97706"], // Gold gradient
    strategy: "review_first",
    subset: "all",
  },
];

type SessionLength = {
  key: SessionLengthKey;
  label: string;
  termCount: number;
  cycleSize: number;
  premium: boolean;
};

// Two options, both derived from the pack's total term count:
//   Half — half the terms (rounded up)   ·   All — every term
function buildSessionLengths(total: number): SessionLength[] {
  const safeTotal = Math.max(1, total || 0);
  const half = Math.max(1, Math.ceil(safeTotal / 2));
  return [
    { key: "half", label: `Half · ${half}`, termCount: half, cycleSize: 4, premium: false },
    { key: "all", label: `All · ${safeTotal}`, termCount: safeTotal, cycleSize: 4, premium: false },
  ];
}

// --- Strategy and Time Options Removed ---
// The backend SRS now intelligently handles strategy and timing.

const LearnModeSheet: React.FC<Props> = ({
  visible,
  onClose,
  onStartLearn,
  toolTitle = "Learn Mode",
  onSubscribePress,
  isSubscribed = false,
  totalTermsCount,
}: Props) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTablet = width >= 768;
  const isWide = width >= 1024;
  const isSmallPhone = width < 360;

  const isDark = useAppSelector(selectIsDark);
  const isAccessUnlocked = isSubscribed || __DEV__;

  // responsive columns for presets (2x2 grid on mobile/tablet, 4 columns on desktop)
  const presetColumns = useMemo(() => {
    if (isWide) return 4;
    if (isTablet) return 2;
    if (width >= 360) return 2;
    return 1;
  }, [isTablet, isWide, width]);

  const padX = isWide ? 28 : isTablet ? 24 : 16;

  const theme = useMemo(
    () => ({
      bg: isDark ? COLORS.darkBg : COLORS.lightBg,
      card: isDark ? COLORS.darkCard : COLORS.lightCard,
      cardHover: isDark ? COLORS.darkCardHover : COLORS.lightCardHover,
      border: isDark ? COLORS.darkBorder : COLORS.lightBorder,
      text: isDark ? COLORS.textDark : COLORS.textLight,
      subText: isDark ? COLORS.subTextDark : COLORS.subTextLight,
      iconBg: isDark ? "rgba(255, 169, 90, 0.15)" : "rgba(255, 120, 90, 0.08)",
    }),
    [isDark]
  );

  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const [selectedFocus, setSelectedFocus] = useState<FocusGoalKey>("smart");
  const [selectedLength, setSelectedLength] = useState<SessionLengthKey>("all");

  // Two length options (Half / All) computed from the pack's term count.
  const SESSION_LENGTHS = useMemo(() => buildSessionLengths(totalTermsCount ?? 0), [totalTermsCount]);

  useEffect(() => {
    runOnUI(() => {
      "worklet";
      pulseScale.value = withSequence(
        withTiming(1.02, { duration: 150 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    })();
  }, [selectedFocus, pulseScale]);

  const selectFocus = useCallback((key: FocusGoalKey) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedFocus(key);
  }, []);

  const selectLength = useCallback((key: SessionLengthKey) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedLength(key);
  }, []);

  const currentFocus = useMemo(
    () => FOCUS_GOALS.find((p) => p.key === selectedFocus)!,
    [selectedFocus]
  );

  const currentLength = useMemo(
    () => SESSION_LENGTHS.find((l) => l.key === selectedLength) ?? SESSION_LENGTHS[SESSION_LENGTHS.length - 1],
    [SESSION_LENGTHS, selectedLength]
  );

  const isPremiumSelected = useMemo(() => {
    if (isAccessUnlocked) return false;
    return currentLength.premium;
  }, [currentLength.premium, isAccessUnlocked]);

  const handleStart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    runOnUI(() => {
      "worklet";
      buttonScale.value = withSequence(
        withSpring(0.96),
        withSpring(1)
      );
    })();

    onStartLearn({
      preset: "learn_standard", // placeholder, can be removed from types eventually
      strategy: currentFocus.strategy,
      timeLimit: null,
      termCount: currentLength.termCount,
      cycleSize: currentLength.cycleSize,
      subset: currentFocus.subset,
    });
  }, [buttonScale, currentFocus, currentLength, onStartLearn]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const footerContent = useMemo(
    () => (
      <View style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        <Pressable onPress={isPremiumSelected ? onSubscribePress : handleStart}>
          <Animated.View
            style={[
              styles.heroButton,
              animatedButtonStyle,
              { backgroundColor: isPremiumSelected ? COLORS.gold : COLORS.royalViolet },
            ]}
          >
            <View style={styles.heroDecoration} />
            <View style={styles.heroDecorationSmall} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                {isPremiumSelected ? "Subscribe Now" : "Start Learning"}
              </Text>
              <View style={styles.heroSubtitleRow}>
                {isPremiumSelected ? (
                  <>
                    <Crown size={12} color={AppColors.brownDeep} fill={AppColors.brownDeep} />
                    <Text style={[styles.heroSubtitle, { color: AppColors.brownDeep }]}>
                      Unlock all premium features
                    </Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} color={AppColors.violet200} />
                    <Text style={[styles.heroSubtitle, { color: AppColors.violet200 }]} numberOfLines={1}>
                      {currentFocus.label} • {currentLength.label}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={[styles.heroIconCircle, isPremiumSelected && { backgroundColor: AppColors.brownDeep }]}>
              {isPremiumSelected ? (
                <Crown size={24} color={COLORS.gold} strokeWidth={3} />
              ) : (
                <ArrowRight size={24} color={COLORS.royalViolet} strokeWidth={3} />
              )}
            </View>
          </Animated.View>
        </Pressable>
      </View>
    ),
    [
      animatedButtonStyle,
      currentFocus.label,
      currentLength.label,
      handleStart,
      insets.bottom,
      isPremiumSelected,
      onSubscribePress,
    ]
  );

  const renderFocusCard = useCallback(
    (item: (typeof FOCUS_GOALS)[0], index: number) => {
      const isSelected = selectedFocus === item.key;
      const Icon = item.icon;

      const cardWidthPct = 100 / presetColumns; // reusing presetColumns logic which gives 2 or 3 cols

      return (
        <Animated.View
          key={item.key}
          entering={FadeInDown.delay(index * 80)}
          style={[
            styles.presetCell,
            {
              width: `${cardWidthPct}%`,
              transform: [{ scale: isSelected ? 1 : 0.98 }],
            },
          ]}
        >
          <Pressable onPress={() => selectFocus(item.key)} style={{ width: "100%" }}>
            <LinearGradient
              colors={item.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.presetCard,
                {
                  borderColor: isSelected ? COLORS.white : "transparent",
                  borderWidth: isSelected ? 2.5 : 0,
                  minHeight: isSmallPhone ? 116 : 126,
                },
              ]}
            >
              {!isSelected && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: isDark
                        ? "rgba(0,0,0,0.25)"
                        : "rgba(255,255,255,0.15)",
                    },
                  ]}
                />
              )}

              {isSelected && (
                <View style={styles.selectedBadge}>
                  <View style={styles.selectedBadgeInner}>
                    <CheckCircle2 size={16} color={COLORS.royalViolet} fill={COLORS.white} />
                  </View>
                </View>
              )}

              <View style={styles.presetContentCompact}>
                <View
                  style={[
                    styles.iconContainerCompact,
                    {
                      backgroundColor: isSelected
                        ? "rgba(255,255,255,0.30)"
                        : "rgba(255,255,255,0.15)",
                    },
                  ]}
                >
                  <Icon size={24} color={COLORS.white} strokeWidth={isSelected ? 2.5 : 2} />
                </View>

                <Text style={[styles.presetLabelCompact, { opacity: isSelected ? 1 : 0.92 }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.presetDetailsCompact} numberOfLines={1}>
                  {item.details}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      );
    },
    [isDark, isSmallPhone, presetColumns, selectFocus, selectedFocus]
  );

  // snap point: a bit taller on tiny phones so content fits, but still scrolls
  const snapPoint = useMemo(() => {
    if (isWide) return "74%";
    if (isTablet) return "80%";
    if (height < 700) return "94%";
    return "90%";
  }, [height, isTablet, isWide]);

  return (
    <ResponsiveSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[snapPoint]}
      backgroundColor={theme.bg}
      handleColor={theme.border}
      isDark={isDark}
      maxWidth={680}
      footer={footerContent}
      footerBgColor={isDark ? "rgba(15, 10, 26, 0.98)" : "rgba(254, 254, 254, 0.98)"}
      footerBorderColor={theme.border}
    >
      {/* IMPORTANT: scrollable body so footer never "replaces" content on phones */}
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: padX,
            paddingTop: 6,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          // helps in some Android cases when nested in sheet-like views
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(220)}
            style={[
              styles.header,
              {
                borderBottomColor: theme.border,
                marginHorizontal: -padX,
                paddingHorizontal: padX,
              },
            ]}
          >
            <View style={styles.headerContent}>
              <View style={[styles.headerIconBg, { backgroundColor: theme.iconBg }]}>
                <BookOpen size={20} color={COLORS.royalViolet} />
              </View>

              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {toolTitle}
                </Text>
                <Text style={[styles.subtitle, { color: theme.subText }]} numberOfLines={1}>
                  Configure your learning session
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.iconBg }]}>
              <X size={20} color={theme.text} />
            </Pressable>
          </Animated.View>

          <View style={styles.content}>
            {/* Section: Focus Goal */}
            <Animated.View entering={FadeIn.duration(220)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: theme.iconBg }]}>
                  <Target size={14} color={COLORS.royalViolet} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Focus Goal</Text>
              </View>

              <View style={styles.presetRow}>
                {FOCUS_GOALS.map((item, index) => renderFocusCard(item, index))}
              </View>
            </Animated.View>

            {/* Section: Session Length */}
            <Animated.View entering={FadeIn.duration(220)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: theme.iconBg }]}>
                  <Zap size={14} color={COLORS.royalViolet} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Session Length</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                {SESSION_LENGTHS.map((lengthOpt) => {
                  const isSelected = selectedLength === lengthOpt.key;
                  const isLocked = lengthOpt.premium && !isAccessUnlocked;

                  return (
                    <Pressable
                      key={lengthOpt.key}
                      onPress={() => selectLength(lengthOpt.key)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: isSelected ? COLORS.royalViolet : theme.border,
                        backgroundColor: isSelected ? (isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)") : "transparent",
                        opacity: isLocked ? 0.7 : 1,
                      }}
                    >
                      <Text style={{ color: isSelected ? (isDark ? AppColors.violet200 : COLORS.royalViolet) : theme.text, fontWeight: isSelected ? "700" : "500", fontSize: 14 }}>
                        {lengthOpt.label}
                      </Text>
                      {isLocked && <Lock size={12} color={theme.text} style={{ marginLeft: 6 }} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Extra bottom spacer so last row never sits behind footer */}
            <View style={{ height: Math.max(insets.bottom, 12) }} />
          </View>
        </ScrollView>
      </View>
    </ResponsiveSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    // avoid relying on `gap` for critical layout
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    padding: 10,
    borderRadius: 14,
  },

  content: {
    paddingVertical: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // Presets: responsive wrap
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: -6,
    marginRight: -6,
  },
  presetCell: {
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  presetCard: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    // use minHeight instead of fixed height for small devices + large fonts
    shadowColor: AppColors.purpleDeeper,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === "web" ? 0 : 0.25,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
  },
  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  selectedBadgeInner: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 2,
  },
  presetContentCompact: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  iconContainerCompact: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  presetLabelCompact: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  presetDetailsCompact: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 4,
  },



  // Footer button
  heroButton: {
    minHeight: 70,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 12,
    shadowColor: COLORS.royalViolet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: Platform.OS === "web" ? 0 : 0.4,
    shadowRadius: 20,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
  },
  heroDecoration: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  heroDecorationSmall: {
    position: "absolute",
    bottom: -30,
    right: 80,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroContent: {
    flexShrink: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heroSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "web" ? 0 : 0.15,
    shadowRadius: 10,
  },

  premiumLockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

});

export default LearnModeSheet;