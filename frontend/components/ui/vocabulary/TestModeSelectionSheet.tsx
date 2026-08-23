import { AppText as Text } from '@/components/ui/AppText';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import {
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Crown,
  Zap,
  GraduationCap,
  Lock} from "lucide-react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnUI} from "react-native-reanimated";
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
export type PresetKey = "exam" | "audio_only" | "quick";
export interface TestModeConfig {
  preset: PresetKey;
}
interface Props {
  visible: boolean;
  onClose: () => void;
  onStartTest: (config: TestModeConfig) => void;
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
  examGradientStart: AppColors.purpleDeeper,
  examGradientEnd: AppColors.violet900,
  audioGradientStart: themeColors["purple-dark"],
  audioGradientEnd: AppColors.purpleDeepest,
  quickGradientStart: themeColors["purple"],
  quickGradientEnd: AppColors.purpleDeeper};

// --- Preset Configuration ---
const PRESETS: {
  key: PresetKey;
  label: string;
  description: string;
  details: string;
  icon: React.ComponentType<any>;
  gradientColors: [string, string];
  iconBgColor: string;
  premium: boolean;
}[] = [
    {
      key: "quick",
      label: "Quick Test",
      description: "Fast practice session",
      details: "10 questions • Speed mode",
      icon: Zap,
      gradientColors: [COLORS.quickGradientStart, COLORS.quickGradientEnd],
      iconBgColor: "rgba(255,255,255,0.2)",
      premium: false},
    {
      key: "exam",
      label: "Full Test",
      description: "Full comprehensive test",
      details: "All question types • Complete assessment",
      icon: GraduationCap,
      gradientColors: [COLORS.examGradientStart, COLORS.examGradientEnd],
      iconBgColor: "rgba(255,255,255,0.2)",
      premium: false},
  ];

const TestModeSelectionSheet: React.FC<Props> = ({
  visible,
  onClose,
  onStartTest,
  toolTitle = "Test Mode"}: Props) => {
  const { width } = useWindowDimensions();

  // ✅ Better breakpoints for web/tablet
  const isTablet = width >= 768;
  const isWide = width >= 1024;

  const isDark = useAppSelector(selectIsDark);
  const isSubscribedRedux = useAppSelector(selectIsSubscribed);
  const router = useRouter();

  const isSubscribed = __DEV__ || isSubscribedRedux;

  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("exam");

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

  // ✅ FIX immutability lint: pulse animation runs on UI thread
  useEffect(() => {
    runOnUI(() => {
      "worklet";
      pulseScale.value = withSequence(
        withTiming(1.02, { duration: 150 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    })();
  }, [selectedPreset, pulseScale]);

  const selectPreset = useCallback((key: PresetKey) => {
    Haptics.selectionAsync().catch(() => { });
    setSelectedPreset(key);
  }, []);

  const isPremiumSelected = useMemo(() => {
    if (isSubscribed) return false;
    return !!PRESETS.find((p) => p.key === selectedPreset)?.premium;
  }, [selectedPreset, isSubscribed]);

  const handleSubscribe = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
    onClose();
    setTimeout(() => {
      router.push("/pricing/pricing-main");
    }, 100);
  }, [onClose, router]);

  // ✅ FIX immutability lint: mutate shared values on UI thread
  const handleStart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

    runOnUI(() => {
      "worklet";
      buttonScale.value = withSequence(
        withSpring(0.95),
        withSpring(1)
      );
    })();

    onStartTest({ preset: selectedPreset });
  }, [buttonScale, onStartTest, selectedPreset]);

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
            {isPremiumSelected ? "Subscribe Now" : "Start Test"}
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
                <Text style={[styles.heroSubtitle, { color: AppColors.violet200 }]}>
                  {PRESETS.find((p) => p.key === selectedPreset)?.label}
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
  ), [animatedButtonStyle, handleStart, handleSubscribe, isPremiumSelected, selectedPreset]);

  const renderPresetCard = useCallback(
    (item: (typeof PRESETS)[0], index: number) => {
      const isSelected = selectedPreset === item.key;
      const Icon = item.icon;
      const isLocked = item.premium && !isSubscribed;

      return (
        <Animated.View
          key={item.key}
          entering={FadeInDown.delay(index * 100).springify()}
          style={{ transform: [{ scale: isSelected ? 1 : 0.97 }] }}
        >
          <Pressable onPress={() => selectPreset(item.key)}>
            <LinearGradient
              colors={item.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.presetCard,
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

            <View style={styles.presetContent}>
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
                <Text style={[styles.presetLabel, { opacity: isSelected ? 1 : 0.95 }]}>
                  {item.label}
                </Text>
                <Text style={styles.presetDescription}>{item.description}</Text>
                <View style={styles.detailsRow}>
                  <Sparkles size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.presetDetails}>{item.details}</Text>
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
    [isDark, isSubscribed, selectPreset, selectedPreset]
  );

  return (
    <ResponsiveSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[isWide ? "70%" : isTablet ? "75%" : "86%"]}
      backgroundColor={theme.bg}
      handleColor={theme.border}
      isDark={isDark}
      maxWidth={660}
      footer={footerContent}
      footerBgColor={isDark ? "rgba(15, 10, 26, 0.98)" : "rgba(254, 254, 254, 0.98)"}
      footerBorderColor={theme.border}
    >
      <View style={{ paddingHorizontal: padX }}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.border, marginHorizontal: -padX, paddingHorizontal: padX },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={[styles.headerIconBg, { backgroundColor: theme.iconBg }]}>
              <Sparkles size={20} color={COLORS.royalViolet} />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>{toolTitle}</Text>
              <Text style={[styles.subtitle, { color: theme.subText }]}>
                Choose your test style
              </Text>
            </View>
          </View>

          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.iconBg }]}>
            <X size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Preset Cards */}
        <View style={styles.content}>
          {PRESETS.map((item, index) => renderPresetCard(item, index))}
        </View>

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
              Premium unlocks unlimited tests
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
  presetCard: {
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
  presetContent: {
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
  presetLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -0.3},
  presetDescription: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)"},
  presetDetails: {
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
  premiumNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12},
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
    zIndex: 10}});

export default TestModeSelectionSheet;
