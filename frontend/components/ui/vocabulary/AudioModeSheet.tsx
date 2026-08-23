import { AppText as Text } from '@/components/ui/AppText';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import {
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Crown,
  Headphones,
  GraduationCap,
  Volume2,
  Music2,
  Brain,
  Layers,
  RefreshCw,
  Star,
  Shuffle,
  Lock} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming} from "react-native-reanimated";
import { useAppSelector } from "@/redux/hook";
import { selectIsDark } from "@/redux/features/themeSlice";
import { selectIsSubscribed } from "@/redux/features/subscriptionSlice";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import ResponsiveSheet from "@/components/ui/shared/ResponsiveSheet";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
// --- Types ---
export type AudioModeType = "test" | "practice";
export type AudioSizeType = "10" | "20" | "all";
export type StrategyKey = "smart" | "balanced" | "reviews_only" | "new_first" | "shuffle_reviews";
export interface AudioModeConfig {
  mode: AudioModeType;
  audioSize: AudioSizeType;
  strategy: StrategyKey;
}
interface Props {
  visible: boolean;
  onClose: () => void;
  onStart: (config: AudioModeConfig) => void;
  toolTitle?: string;
  slug?: string;
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
  // Mode gradient colors
  testGradientStart: AppColors.violet900,
  testGradientEnd: AppColors.indigo900,
  practiceGradientStart: AppColors.purpleDeeper,
  practiceGradientEnd: AppColors.purpleDeepest};

// --- Mode Options Configuration ---
const MODES: {
  key: AudioModeType;
  label: string;
  description: string;
  details: string;
  icon: React.ComponentType<any>;
  gradientColors: [string, string];
  premium: boolean;
}[] = [
    {
      key: "test",
      label: "Audio Test",
      description: "Formal assessment mode",
      details: "No feedback • Results at end",
      icon: GraduationCap,
      gradientColors: [COLORS.testGradientStart, COLORS.testGradientEnd],
      premium: false},
    {
      key: "practice",
      label: "Audio Practice",
      description: "Learn with feedback",
      details: "Check answers • Immediate results",
      icon: Headphones,
      gradientColors: [COLORS.practiceGradientStart, COLORS.practiceGradientEnd],
      premium: true},
  ];

// --- Audio Size Options ---
const AUDIO_SIZES: { key: AudioSizeType; label: string; sublabel: string; premium: boolean }[] = [
  { key: "10", label: "10", sublabel: "Quick", premium: false },
  { key: "20", label: "20", sublabel: "Standard", premium: true },
  { key: "all", label: "All", sublabel: "Full", premium: true },
];

// --- Strategy Configuration ---
const STRATEGIES: {
  key: StrategyKey;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  premium: boolean;
}[] = [
    { key: "smart", label: "Smart", description: "AI-powered", icon: Brain, premium: false },
    { key: "balanced", label: "Balanced", description: "Mixed", icon: Layers, premium: true },
    {
      key: "reviews_only",
      label: "Reviews",
      description: "Retention",
      icon: RefreshCw,
      premium: true},
    { key: "new_first", label: "New First", description: "Priority", icon: Star, premium: true },
    { key: "shuffle_reviews", label: "Shuffle", description: "Random", icon: Shuffle, premium: true },
  ];

const AudioModeSheet: React.FC<Props> = ({
  visible,
  onClose,
  onStart,
  toolTitle = "Audio Mode",
  slug}) => {
  const { width } = useWindowDimensions();

  // ✅ Better breakpoints
  const isTablet = width >= 768;
  const isWide = width >= 1024;

  const isDark = useAppSelector(selectIsDark);
  const isSubscribedRedux = useAppSelector(selectIsSubscribed);
  const router = useRouter();

  const isSubscribed = __DEV__ || isSubscribedRedux;

  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const [selectedMode, setSelectedMode] = useState<AudioModeType>("test");
  const [selectedAudioSize, setSelectedAudioSize] = useState<AudioSizeType>("10");
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>("smart");

  const padX = isWide ? 28 : isTablet ? 24 : 20;

  const theme = useMemo(
    () => ({
      bg: isDark ? COLORS.darkBg : COLORS.lightBg,
      card: isDark ? COLORS.darkCard : COLORS.lightCard,
      cardHover: isDark ? COLORS.darkCardHover : COLORS.lightCardHover,
      border: isDark ? COLORS.darkBorder : COLORS.lightBorder,
      text: isDark ? COLORS.textDark : COLORS.textLight,
      subText: isDark ? COLORS.subTextDark : COLORS.subTextLight,
      iconBg: isDark ? "rgba(255, 169, 90, 0.15)" : "rgba(255, 120, 90, 0.08)"}),
    [isDark]
  );

  // ✅ FIX immutability: pulse animation on UI thread
  useEffect(() => {
    runOnUI(() => {
      "worklet";
      pulseScale.value = withSequence(
        withTiming(1.02, { duration: 150 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    })();
  }, [selectedMode, pulseScale]);

  const selectMode = useCallback((key: AudioModeType) => {
    Haptics.selectionAsync().catch(() => { });
    setSelectedMode(key);
  }, []);

  const selectAudioSize = useCallback((key: AudioSizeType) => {
    Haptics.selectionAsync().catch(() => { });
    setSelectedAudioSize(key);
  }, []);

  const selectStrategy = useCallback((key: StrategyKey) => {
    Haptics.selectionAsync().catch(() => { });
    setSelectedStrategy(key);
  }, []);

  const isPremiumSelected = useMemo(() => {
    if (isSubscribed) return false;
    const modePremium = MODES.find((m) => m.key === selectedMode)?.premium;
    const sizePremium = AUDIO_SIZES.find((s) => s.key === selectedAudioSize)?.premium;
    const strategyPremium = STRATEGIES.find((s) => s.key === selectedStrategy)?.premium;
    return !!(modePremium || sizePremium || strategyPremium);
  }, [selectedMode, selectedAudioSize, selectedStrategy, isSubscribed]);

  const handleSubscribe = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
    onClose();
    setTimeout(() => router.push("/pricing/pricing-main"), 100);
  }, [onClose, router]);

  // ✅ FIX lint: mutate shared values on UI thread
  const handleStart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

    runOnUI(() => {
      "worklet";
      buttonScale.value = withSequence(
        withSpring(0.95),
        withSpring(1)
      );
    })();

    onStart({
      mode: selectedMode,
      audioSize: selectedAudioSize,
      strategy: selectedStrategy});
  }, [buttonScale, selectedMode, selectedAudioSize, selectedStrategy, onStart]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]}));

  const footerContent = useMemo(() => (
    <Pressable onPress={isPremiumSelected ? handleSubscribe : handleStart}>
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
            {isPremiumSelected
              ? "Subscribe Now"
              : selectedMode === "test"
                ? "Start Test"
                : "Start Practice"}
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
                <Music2 size={12} color={AppColors.violet200} />
                <Text style={[styles.heroSubtitle, { color: AppColors.violet200 }]}>
                  {selectedAudioSize === "all" ? "All" : selectedAudioSize} Questions
                </Text>
              </>
            )}
          </View>
        </View>
        <View
          style={[styles.heroIconCircle, isPremiumSelected && { backgroundColor: AppColors.brownDeep }]}
        >
          {isPremiumSelected ? (
            <Crown size={24} color={COLORS.gold} strokeWidth={3} />
          ) : (
            <ArrowRight size={24} color={COLORS.royalViolet} strokeWidth={3} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  ), [animatedButtonStyle, handleStart, handleSubscribe, isPremiumSelected, selectedAudioSize, selectedMode]);

  const renderModeCard = useCallback(
    (item: (typeof MODES)[0], index: number) => {
      const isSelected = selectedMode === item.key;
      const Icon = item.icon;
      const isLocked = item.premium && !isSubscribed;

      return (
        <Animated.View
          key={item.key}
          // ✅ no springify to avoid side drift on wide screens; still vertical
          entering={FadeInDown.delay(index * 100)}
          style={{ transform: [{ scale: isSelected ? 1 : 0.97 }] }}
        >
          <Pressable onPress={() => selectMode(item.key)}>
            <LinearGradient
              colors={item.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.modeCard,
                {
                  borderColor: isSelected ? COLORS.white : "transparent",
                  borderWidth: isSelected ? 2.5 : 0},
              ]}
            >

            {!isSelected && (
              <View
                style={{
                  ...StyleSheet.absoluteFill,
                  backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.12)"}}
              />
            )}

            {isLocked && (
              <View style={styles.premiumLockBadge}>
                <Lock size={12} color={COLORS.white} />
              </View>
            )}

            {isSelected && !isLocked && (
              <View style={styles.selectedBadge}>
                <View style={styles.selectedBadgeInner}>
                  <CheckCircle2 size={20} color={COLORS.royalViolet} fill={COLORS.white} />
                </View>
              </View>
            )}

            <View style={styles.modeContent}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.15)"},
                ]}
              >
                <Icon size={30} color={COLORS.white} strokeWidth={isSelected ? 2.5 : 2} />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.modeLabel, { opacity: isSelected ? 1 : 0.95 }]}>
                  {item.label}
                </Text>
                <Text style={styles.modeDescription}>{item.description}</Text>
                <View style={styles.detailsRow}>
                  <Sparkles size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.modeDetails}>{item.details}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.selectionIndicator,
                  {
                    backgroundColor: isSelected
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.1)"},
                ]}
              >
                <ArrowRight
                  size={18}
                  color={isSelected ? COLORS.white : "rgba(255,255,255,0.6)"}
                  strokeWidth={isSelected ? 2.5 : 2}
                />
              </View>
            </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      );
    },
    [isDark, isSubscribed, selectMode, selectedMode]
  );

  return (
    <ResponsiveSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[isWide ? "76%" : isTablet ? "84%" : "92%"]}
      backgroundColor={theme.bg}
      handleColor={theme.border}
      isDark={isDark}
      maxWidth={680}
      footer={footerContent}
      footerBgColor={isDark ? "rgba(15, 10, 26, 0.98)" : "rgba(254, 254, 254, 0.98)"}
      footerBorderColor={theme.border}
    >
      <View style={{ paddingHorizontal: padX }}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={[
            styles.header,
            { borderBottomColor: theme.border, marginHorizontal: -padX, paddingHorizontal: padX },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={[styles.headerIconBg, { backgroundColor: theme.iconBg }]}>
              <Volume2 size={20} color={COLORS.royalViolet} />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>{toolTitle}</Text>
              <Text style={[styles.subtitle, { color: theme.subText }]}>
                Choose mode & question limit
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.iconBg }]}>
            <X size={20} color={theme.text} />
          </Pressable>
        </Animated.View>

        {/* Mode Cards */}
        <View style={styles.content}>
          {MODES.map((item, index) => renderModeCard(item, index))}
        </View>

        {/* Audio Size Section */}
        <Animated.View entering={FadeIn.duration(220).delay(120)} style={styles.limitSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Audio Size</Text>
          <View style={styles.limitContainer}>
            {AUDIO_SIZES.map((size) => {
              const isSelected = selectedAudioSize === size.key;
              const isLocked = size.premium && !isSubscribed;

              return (
                <Pressable
                  key={size.key}
                  onPress={() => selectAudioSize(size.key)}
                  style={[
                    styles.limitButton,
                    {
                      backgroundColor: isSelected
                        ? COLORS.royalViolet
                        : isDark
                          ? "rgba(255, 169, 90, 0.12)"
                          : "rgba(255, 120, 90, 0.08)",
                      borderColor: isSelected
                        ? COLORS.violetLight
                        : isDark
                          ? "rgba(255, 169, 90, 0.2)"
                          : "rgba(255, 120, 90, 0.15)"},
                  ]}
                >
                  {isLocked && (
                    <View style={styles.audioSizeLockBadge}>
                      <Lock size={8} color={COLORS.white} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.limitValue,
                      {
                        color: isSelected
                          ? COLORS.white
                          : isDark
                            ? COLORS.violetSoft
                            : COLORS.royalViolet},
                    ]}
                  >
                    {size.label}
                  </Text>
                  <Text
                    style={[
                      styles.limitLabel,
                      { color: isSelected ? "rgba(255,255,255,0.8)" : theme.subText },
                    ]}
                  >
                    {size.sublabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Strategy Section */}
        <Animated.View entering={FadeIn.duration(220).delay(220)} style={styles.strategySection}>
          <View style={styles.strategySectionHeader}>
            <Brain size={16} color={COLORS.royalViolet} />
            <Text style={[styles.strategySectionTitle, { color: theme.text }]}>
              Learning Strategy
            </Text>
          </View>

          <View style={styles.strategyGrid}>
            {STRATEGIES.map((item, idx) => {
              const isSelected = selectedStrategy === item.key;
              const Icon = item.icon;
              const isLocked = item.premium && !isSubscribed;

              return (
                <Animated.View key={item.key} entering={FadeIn.delay(idx * 50)}>
                  <Pressable
                    onPress={() => selectStrategy(item.key)}
                    style={[
                      styles.strategyChip,
                      {
                        backgroundColor: isSelected
                          ? COLORS.royalViolet
                          : isDark
                            ? COLORS.darkCard
                            : COLORS.lightCard,
                        borderColor: isSelected ? COLORS.violetLight : theme.border},
                    ]}
                  >
                    <View
                      style={[
                        styles.strategyIconBg,
                        { backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : theme.iconBg },
                      ]}
                    >
                      <Icon
                        size={14}
                        color={isSelected ? COLORS.white : COLORS.violetAccent}
                        strokeWidth={2}
                      />
                    </View>

                    <Text
                      style={[
                        styles.strategyLabel,
                        { color: isSelected ? COLORS.white : theme.text },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {isLocked ? (
                      <Lock size={12} color={isSelected ? COLORS.white : COLORS.gold} />
                    ) : isSelected ? (
                      <CheckCircle2 size={14} color={COLORS.white} fill={COLORS.white} />
                    ) : null}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {!isSubscribed && (
          <View
            style={[
              styles.premiumNote,
              {
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)",
                borderColor: isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.15)"},
            ]}
          >
            <Crown size={16} color={COLORS.gold} fill={COLORS.gold} />
            <Text style={[styles.premiumNoteText, { color: COLORS.gold }]}>
              Premium unlocks unlimited audio sessions
            </Text>
          </View>
        )}
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
    paddingBottom: 20,
    borderBottomWidth: 1},
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14},
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"},
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5},
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2},
  closeBtn: {
    padding: 10,
    borderRadius: 14},
  content: {
    paddingVertical: 20,
    gap: 16},
  modeCard: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: AppColors.purpleDeeper,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10},

  selectedBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10},
  modeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 16},
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"},
  textContainer: {
    flex: 1,
    gap: 2},
  modeLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -0.3},
  modeDescription: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)"},
  modeDetails: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginLeft: 4},
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4},
  selectedBadgeInner: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2},
  selectionIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"},
  limitSection: {
    marginTop: 4},
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.3},
  limitContainer: {
    flexDirection: "row",
    gap: 12},
  limitButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center"},
  limitValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5},
  limitLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5},
  premiumNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1},
  premiumNoteText: {
    fontSize: 13,
    fontWeight: "600"},
  heroButton: {
    height: 72,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 12,
    shadowColor: COLORS.royalViolet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    position: "relative",
    overflow: "hidden"},
  heroDecoration: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.1)"},
  heroDecorationSmall: {
    position: "absolute",
    bottom: -30,
    right: 80,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)"},
  heroContent: {
    gap: 4},
  heroTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3},
  heroSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6},
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "600"},
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10},
  strategySection: {
    marginTop: 16},
  strategySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12},
  strategySectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2},
  strategyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10},
  strategyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5},
  strategyIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"},
  strategyLabel: {
    fontSize: 13,
    fontWeight: "600"},
  premiumLockBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10},
  audioSizeLockBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10}});

export default AudioModeSheet;
