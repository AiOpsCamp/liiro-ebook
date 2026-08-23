import { AppText as Text } from '@/components/ui/AppText';
import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import {
  X,
  Image as ImageIcon,
  Speaker,
  List as QuizIcon,
  CheckSquare,
  ArrowRight,
  Zap
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  Layout,
  withSequence,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { useAppSelector, useAppDispatch } from "@/redux/hook";
import { selectIsDark } from "@/redux/features/themeSlice";
import { useRouter } from "expo-router";
import { setTestModeSettings } from "@/redux/features/testSettingSlice";
import ResponsiveSheet from "@/components/ui/shared/ResponsiveSheet";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
export type TestType = "quiz" | "audio" | "image" | "truefalse";
export interface TestConfig {
  types: TestType[];
  count: number;
  startedAt: string;
  estimatedDuration: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onStartTest?: (config: TestConfig) => void;
  toolTitle?: string;
  slug?: string;
}

const COLORS = {
  primary: themeColors["purple-dark"],
  primaryLight: themeColors["purple"],
  primaryDark: AppColors.purpleDeeper,
  accent: themeColors["warning"],
  success: themeColors["success"],
  darkBg: AppColors.slate900,
  lightBg: themeColors["white"],
  darkCard: AppColors.slate800,
  lightCard: AppColors.slate50,
  textDark: AppColors.slate100,
  textLight: AppColors.slate800,
  subTextDark: AppColors.slate400,
  subTextLight: AppColors.slate500,
  borderDark: AppColors.slate700,
  borderLight: AppColors.slate200
};

const SECONDS_PER_QUESTION = 10;

const TestModeSheet: React.FC<Props> = ({
  visible,
  onClose,
  onStartTest,
  toolTitle = "New Session",
  slug }) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const isTablet = width >= 768;

  const isDark = useAppSelector(selectIsDark);
  const dispatch = useAppDispatch();

  const buttonScale = useSharedValue(1);

  const [selectedTypes, setSelectedTypes] = useState<TestType[]>(["quiz"]);
  const [selectedCount, setSelectedCount] = useState<number>(10);

  const horizontalPadding = isWide ? 28 : isTablet ? 24 : 20;

  const theme = useMemo(
    () => ({
      bg: isDark ? COLORS.darkBg : COLORS.lightBg,
      card: isDark ? COLORS.darkCard : COLORS.lightCard,
      text: isDark ? COLORS.textDark : COLORS.textLight,
      subText: isDark ? COLORS.subTextDark : COLORS.subTextLight,
      border: isDark ? COLORS.borderDark : COLORS.borderLight,
      iconBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
    }),
    [isDark]
  );

  const estimatedTimeDisplay = useMemo(() => {
    const totalSeconds = selectedCount * SECONDS_PER_QUESTION;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds} sec`;
    return `${minutes} min ${seconds > 0 ? `${seconds}s` : ""}`;
  }, [selectedCount]);

  const toggleType = useCallback((t: TestType) => {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }, []);

  const typesMeta = useMemo(
    () => [
      { key: "quiz" as TestType, label: "Quiz", desc: "Standard", icon: QuizIcon },
      { key: "audio" as TestType, label: "Audio", desc: "Listening", icon: Speaker },
      { key: "image" as TestType, label: "Visual", desc: "Matching", icon: ImageIcon },
      { key: "truefalse" as TestType, label: "T/F", desc: "Rapid fire", icon: CheckSquare },
    ],
    []
  );

  const handleStart = useCallback(() => {
    if (!selectedTypes.length) return;

    runOnUI(() => {
      "worklet";
      buttonScale.value = withSequence(
        withSpring(0.95),
        withSpring(1)
      );
    })();

    const mapToNormalized = (t: TestType) => (t === "truefalse" ? "tf" : t === "image" ? "img" : t);
    const normalizedTypes = selectedTypes.map(mapToNormalized);
    const startedAt = new Date().toISOString();
    const cfg = { types: normalizedTypes, count: selectedCount, startedAt };

    dispatch(setTestModeSettings({ ...cfg, slug: slug ?? null }));

    onStartTest?.({
      types: selectedTypes,
      count: selectedCount,
      startedAt,
      estimatedDuration: selectedCount * SECONDS_PER_QUESTION
    });
  }, [buttonScale, dispatch, onStartTest, selectedCount, selectedTypes, slug]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  const gridItemWidth = isWide ? "24%" : isTablet ? "32%" : "48%";

  const footerContent = (
    <Pressable onPress={handleStart} disabled={selectedTypes.length === 0}>
      <Animated.View
        style={[
          styles.heroButton,
          animatedButtonStyle,
          {
            backgroundColor: COLORS.primary,
            opacity: selectedTypes.length === 0 ? 0.5 : 1
          },
        ]}
      >
        <View style={styles.heroDecoration} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Start Session</Text>
          <View style={styles.heroSubtitleRow}>
            <Zap size={12} color={AppColors.purple200} fill={AppColors.purple200} />
            <Text style={styles.heroSubtitle}>
              {selectedCount} Questions • {estimatedTimeDisplay}
            </Text>
          </View>
        </View>
        <View style={styles.heroIconCircle}>
          <ArrowRight size={24} color={COLORS.primary} strokeWidth={3} />
        </View>
      </Animated.View>
    </Pressable>
  );

  return (
    <ResponsiveSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[isWide ? "56%" : isTablet ? "62%" : "78%"]}
      backgroundColor={theme.bg}
      handleColor={theme.border}
      isDark={isDark}
      maxWidth={680}
      footer={footerContent}
      footerBgColor={isDark ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)"}
      footerBorderColor={theme.border}
    >
      <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>{toolTitle}</Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>Configure your session</Text>
          </View>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.iconBg }]}>
            <X size={20} color={theme.text} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()} layout={Layout.springify()}>
          {/* 1. Modes Grid */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Select Mode</Text>
          <View style={styles.gridContainer}>
            {typesMeta.map((m) => {
              const ActiveIcon = m.icon;
              const isActive = selectedTypes.includes(m.key);

              return (
                <Pressable
                  key={m.key}
                  onPress={() => toggleType(m.key)}
                  style={[
                    styles.gridItem,
                    { width: gridItemWidth },
                    {
                      backgroundColor: isActive ? COLORS.primary : theme.card,
                      borderColor: isActive ? COLORS.primary : theme.border
                    },
                  ]}
                >
                  <View style={styles.gridTop}>
                    <ActiveIcon size={22} color={isActive ? "#fff" : theme.text} />
                    {isActive && <View style={styles.activeDot} />}
                  </View>
                  <Text style={[styles.gridLabel, { color: isActive ? "#fff" : theme.text }]}>
                    {m.label}
                  </Text>
                  <Text
                    style={[
                      styles.gridDesc,
                      { color: isActive ? "rgba(255,255,255,0.7)" : theme.subText },
                    ]}
                  >
                    {m.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 2. Count Selector */}
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionLabel, { color: theme.text, marginTop: 24 }]}>
              Question Limit
            </Text>
            <Text style={[styles.infoTag, { color: theme.subText }]}>
              ~{SECONDS_PER_QUESTION}s per question
            </Text>
          </View>

          <View style={styles.pillContainer}>
            {[10, 20, 30, 50].map((c) => {
              const isActive = selectedCount === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setSelectedCount(c)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isActive ? COLORS.primary : theme.card,
                      borderColor: isActive ? COLORS.primary : theme.border
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: isActive ? "#fff" : theme.text }]}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </ResponsiveSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500"
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    opacity: 0.8
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  infoTag: {
    fontSize: 12,
    marginBottom: 12,
    fontWeight: "500"
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10
  },
  gridItem: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    height: 120,
    justifyContent: "space-between"
  },
  gridTop: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff"
  },
  gridLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8
  },
  gridDesc: {
    fontSize: 12
  },
  pillContainer: {
    flexDirection: "row",
    gap: 8
  },
  pill: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1
  },
  pillText: {
    fontSize: 16,
    fontWeight: "700"
  },
  heroButton: {
    height: 80,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    position: "relative",
    overflow: "hidden"
  },
  heroDecoration: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  heroContent: {
    gap: 4
  },
  heroTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  heroSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  heroSubtitle: {
    color: AppColors.purple200,
    fontSize: 13,
    fontWeight: "600"
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  }
});

export default TestModeSheet;
