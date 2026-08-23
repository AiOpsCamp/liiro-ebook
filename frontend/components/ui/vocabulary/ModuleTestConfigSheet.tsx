import { AppText as Text } from "@/components/ui/AppText";
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions, Platform } from "react-native";
import ResponsiveSheet from "@/components/ui/shared/ResponsiveSheet";
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Zap,
  ToggleLeft,
  Image as ImageIcon,
  Layers,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ListFilter,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAppSelector } from "@/redux/hook";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";

const AnimView = ({ children, entering, style, ...props }: any) => {
  if (Platform.OS === "web") {
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }
  return (
    <Animated.View entering={entering} style={style} {...props}>
      {children}
    </Animated.View>
  );
};

// ─── Types ────────────────────────────────────────────────
export type ModuleTestType =
  | "mcq"
  | "true_false"
  | "audio_listening"
  | "image_select"
  | "mixed"
  | "mcq,true_false"
  | "mcq,true_false,audio_listening";

export interface ModuleTestConfig {
  testType: ModuleTestType;
  examSize: number;
  limit: number;
  audioSize?: number;
}

export interface Props {
  visible: boolean;
  onClose?: () => void;
  onStart: (config: ModuleTestConfig) => void;
  moduleName?: string;
  totalTerms?: number;
  packCount?: number;
}

// ─── Color Palette ────────────────────────────────────────
const C = {
  violet: themeColors["purple-deeper"],
  violetMid: themeColors["purple-dark"],
  violetAcc: themeColors["purple"],
  violetSft: themeColors["violet-400"],
  violetMst: themeColors["violet-300"],
  violetGhs: themeColors["light-purple"],
  // Dark
  dkBg: "#0A0614",
  dkCard: "#130D22",
  dkCard2: "#1C1430",
  dkBorder: "#2A1F45",
  dkText: themeColors["violet-tint"],
  dkSub: "#9580C0",
  // Light
  ltBg: themeColors["zinc-50"],
  ltCard: "#F5F0FF",
  ltCard2: "#EDE6FF",
  ltBorder: themeColors["violet-200"],
  ltText: "#1A0D33",
  ltSub: themeColors["muted-purple"],
};

// ─── Test Type Definitions ────────────────────────────────
const TEST_TYPES: {
  key: ModuleTestType;
  label: string;
  sublabel: string;
  icon: React.ComponentType<any>;
  gradient: [string, string];
  tag: string;
}[] = [
  {
    key: "mcq",
    label: "Multiple Choice",
    sublabel: "Classic 4-option format",
    icon: BookOpen,
    gradient: [themeColors["purple-deeper"], themeColors["violet-900"]],
    tag: "Standard",
  },
  {
    key: "true_false",
    label: "True / False",
    sublabel: "Quick judgment calls",
    icon: ToggleLeft,
    gradient: [themeColors["sky-500"], "#0369A1"],
    tag: "Fast",
  },
  {
    key: "audio_listening",
    label: "Audio Listen",
    sublabel: "Hear it, pick the answer",
    icon: Headphones,
    gradient: [themeColors["purple-dark"], themeColors["purple-deepest"]],
    tag: "Audio",
  },
  {
    key: "image_select",
    label: "Image Select",
    sublabel: "See it, match the word",
    icon: ImageIcon,
    gradient: [themeColors["success"], themeColors["emerald-800"]],
    tag: "Visual",
  },
  {
    key: "mixed",
    label: "All Types",
    sublabel: "Mixed question variety",
    icon: Layers,
    gradient: [themeColors["warning"], themeColors["warning-deeper"]],
    tag: "Varied",
  },
  {
    key: "mcq,true_false",
    label: "MCQ + T/F",
    sublabel: "Two-mode combo",
    icon: GraduationCap,
    gradient: [themeColors["purple"], themeColors["purple-deeper"]],
    tag: "Combo",
  },
  {
    key: "mcq,true_false,audio_listening",
    label: "Full Combo",
    sublabel: "MCQ + T/F + Audio",
    icon: Sparkles,
    gradient: [themeColors["pink-400"], themeColors["purple-dark"]],
    tag: "Ultimate",
  },
];

const SIZE_OPTIONS = [5, 10, 20, 30, 50];
const LIMIT_OPTIONS = [20, 30, 50, 75, 100];

/* ───────────────────────── SizeRow (static component) ───────────────────────── */
const SizeRow = memo(function SizeRow({
  label,
  sublabel,
  value,
  options,
  onChange,
  icon: Icon,
  accentColor,
  theme,
}: {
  label: string;
  sublabel: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
  icon: React.ComponentType<any>;
  accentColor: string;
  theme: {
    card: string;
    card2: string;
    border: string;
    text: string;
    sub: string;
    iconBg: string;
  };
}) {
  const idx = options.indexOf(value);
  const canDec = idx > 0;
  const canInc = idx < options.length - 1;

  return (
    <View style={[styles.sizeRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.sizeRowIcon, { backgroundColor: theme.iconBg }]}>
        <Icon size={18} color={accentColor} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.sizeLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.sizeSub, { color: theme.sub }]}>{sublabel}</Text>
      </View>

      <View style={styles.sizeControls}>
        <Pressable
          onPress={() => {
            if (!canDec) return;
            Haptics.selectionAsync().catch(() => {});
            onChange(options[idx - 1]);
          }}
          style={[
            styles.sizeBtn,
            {
              opacity: canDec ? 1 : 0.35,
              backgroundColor: theme.card2,
              borderColor: theme.border,
            },
          ]}
        >
          <ChevronDown size={14} color={theme.text} strokeWidth={2.5} />
        </Pressable>

        <View style={[styles.sizeVal, { backgroundColor: accentColor }]}>
          <Text style={styles.sizeValText}>{value}</Text>
        </View>

        <Pressable
          onPress={() => {
            if (!canInc) return;
            Haptics.selectionAsync().catch(() => {});
            onChange(options[idx + 1]);
          }}
          style={[
            styles.sizeBtn,
            {
              opacity: canInc ? 1 : 0.35,
              backgroundColor: theme.card2,
              borderColor: theme.border,
            },
          ]}
        >
          <ChevronUp size={14} color={theme.text} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
});

const ModuleTestConfigSheet: React.FC<Props> = ({
  visible,
  onClose,
  onStart,
  moduleName = "Module Test",
  totalTerms = 0,
  packCount = 0,
}) => {
  const isDark = useAppSelector(selectIsDark);
  const colors = useAppSelector(selectThemeTokens);
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isWide = width >= 1024;

  const bottomSheetRef = useRef<any>(null);

  const [selectedType, setSelectedType] = useState<ModuleTestType>("mcq");
  const [examSize, setExamSize] = useState(20);
  const [limit, setLimit] = useState(50);

  const buttonScale = useSharedValue(1);
  const cardScale = useSharedValue(1);

  // ✅ Responsive snap points
  const snapPoints = useMemo(() => {
    if (isWide) return ["70%"];
    if (isTablet) return ["78%"];
    return ["92%"];
  }, [isTablet, isWide]);

  // ✅ Responsive horizontal padding
  const padX = useMemo(() => {
    if (width >= 1024) return 28;
    if (width >= 768) return 24;
    return 20;
  }, [width]);

  const theme = useMemo(() => {
    const primary = colors.accentPrimary || C.violet;

    // Generate soft brand tinted backgrounds instead of hardcoded purple
    const bgSelected = isDark
      ? `${primary}26` // 15% opacity primary brand accent
      : `${primary}12`; // 7% opacity primary brand accent

    const card = isDark ? colors.backgroundSoft || "#130D22" : colors.card || "#F8FAFC";

    const card2 = isDark
      ? `${primary}12` // nested background in dark mode gets a tiny brand hint
      : `${primary}08`; // nested background in light mode

    return {
      bg: colors.background || (isDark ? "#0A0614" : "#F8FAFC"),
      card,
      card2,
      cardSelected: bgSelected,
      border: colors.border || (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"),
      text: colors.textPrimary || (isDark ? "#FFFFFF" : "#0F172A"),
      sub: colors.textSecondary || (isDark ? "#94A3B8" : "#475569"),
      iconBg: `${primary}1F`, // 12% opacity
      accent: primary,
    };
  }, [isDark, colors]);

  // Animate cardScale on selected type changes
  useEffect(() => {
    cardScale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withSpring(1, { damping: 14, stiffness: 220 })
    );
  }, [selectedType, cardScale]);

  const selectType = useCallback((key: ModuleTestType) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedType(key);
  }, []);

  // Animate buttonScale on click
  const handleStart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    buttonScale.value = withSequence(withSpring(0.95), withSpring(1));

    const isAudio =
      selectedType === "audio_listening" || selectedType === "mcq,true_false,audio_listening";

    onStart({
      testType: selectedType,
      examSize,
      limit,
      ...(isAudio ? { audioSize: Math.min(examSize, 10) } : {}),
    });
  }, [buttonScale, selectedType, examSize, limit, onStart]);

  const animatedButton = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // (kept in case you use it later)
  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const footerContent = useMemo(
    () => (
      <View style={{ paddingHorizontal: padX, gap: 12 }}>
        <View
          style={[styles.summaryPill, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={[styles.summaryDot, { backgroundColor: colors.accentPrimary }]} />
          <Text style={[styles.summaryText, { color: theme.sub }]}>
            {TEST_TYPES.find((t) => t.key === selectedType)?.label} · {examSize} Q · Pool {limit}
          </Text>
        </View>

        <Pressable onPress={handleStart}>
          <View
            style={[
              styles.heroBtn,
              { shadowColor: colors.accentPrimary || AppColors.purpleDeeper },
              animatedButton,
            ]}
          >
            <LinearGradient
              colors={[
                colors.gradientFrom || colors.accentPrimary,
                colors.gradientTo || colors.accentPrimary,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBtnGradient}
            >
              <View style={styles.blobL} />
              <View style={styles.blobR} />
              <View style={styles.heroBtnInner}>
                <View>
                  <Text style={styles.heroBtnTitle}>Start Module Test</Text>
                  <Text style={styles.heroBtnSub}>{moduleName}</Text>
                </View>
                <View style={styles.heroBtnCircle}>
                  <ArrowRight size={22} color={colors.accentPrimary} strokeWidth={3} />
                </View>
              </View>
            </LinearGradient>
          </View>
        </Pressable>
      </View>
    ),
    [
      animatedButton,
      examSize,
      handleStart,
      limit,
      moduleName,
      padX,
      selectedType,
      theme.border,
      theme.card,
      theme.sub,
      colors.accentPrimary,
      colors.gradientFrom,
      colors.gradientTo,
    ]
  );

  const renderTypeCard = useCallback(
    (item: (typeof TEST_TYPES)[0], index: number) => {
      const isSelected = selectedType === item.key;
      const Icon = item.icon;

      return (
        <View key={item.key}>
          <Pressable
            onPress={() => selectType(item.key)}
            style={[
              styles.typeCard,
              {
                borderColor: isSelected ? colors.accentPrimary : theme.border,
                borderWidth: isSelected ? 2 : 1,
                backgroundColor: isSelected ? theme.cardSelected : theme.card,
              },
            ]}
          >
            <View style={styles.typeCardLeft}>
              <LinearGradient
                colors={item.gradient}
                style={styles.typeIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon size={20} color="#fff" strokeWidth={2} />
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={[styles.typeLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.typeSub, { color: theme.sub }]} numberOfLines={1}>
                  {item.sublabel}
                </Text>
              </View>
            </View>

            <View style={styles.typeCardRight}>
              <View
                style={[
                  styles.typeTag,
                  { backgroundColor: isSelected ? `${colors.accentPrimary}18` : theme.card2 },
                ]}
              >
                <Text
                  style={[
                    styles.typeTagText,
                    { color: isSelected ? colors.accentPrimary : theme.sub },
                  ]}
                >
                  {item.tag}
                </Text>
              </View>

              {isSelected && (
                <CheckCircle2
                  size={20}
                  color={colors.accentPrimary}
                  fill={`${colors.accentPrimary}15`}
                />
              )}
            </View>
          </Pressable>
        </View>
      );
    },
    [isDark, selectType, selectedType, theme, colors.accentPrimary]
  );

  return (
    <ResponsiveSheet
      visible={visible}
      onClose={onClose || (() => {})}
      snapPoints={snapPoints}
      backgroundColor={theme.bg}
      handleColor={theme.border}
      isDark={isDark}
      maxWidth={720}
      footer={footerContent}
      footerBgColor={isDark ? "rgba(10,6,20,0.97)" : "rgba(250,250,250,0.97)"}
      footerBorderColor={theme.border}
    >
      <View style={{ paddingHorizontal: padX }}>
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.border, marginHorizontal: -padX, paddingHorizontal: padX },
          ]}
        >
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[
                colors.gradientFrom || colors.accentPrimary,
                colors.gradientTo || colors.accentPrimary,
              ]}
              style={styles.headerIcon}
            >
              <GraduationCap size={20} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Module Test</Text>
              <Text style={[styles.headerSub, { color: theme.sub }]}>
                {totalTerms > 0
                  ? `${totalTerms} terms · ${packCount} packs`
                  : "Configure your test"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <X size={18} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: colors.accentPrimary }]} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Question Type</Text>
          </View>
          <Text style={[styles.sectionSub, { color: theme.sub }]}>
            Choose how questions are presented
          </Text>
        </View>

        <View style={styles.typeList}>{TEST_TYPES.map((item, i) => renderTypeCard(item, i))}</View>

        <View style={[styles.section, { marginTop: 24 }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: colors.accentPrimary }]} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Test Parameters</Text>
          </View>
          <Text style={[styles.sectionSub, { color: theme.sub }]}>
            Set question count and question pool size
          </Text>
        </View>

        <View style={styles.sizeSection}>
          <SizeRow
            label="Exam Size"
            sublabel="Number of questions in the test"
            value={examSize}
            options={SIZE_OPTIONS}
            onChange={setExamSize}
            icon={Zap}
            accentColor={colors.accentPrimary}
            theme={theme}
          />
          <SizeRow
            label="Question Pool"
            sublabel="Total terms to draw from"
            value={limit}
            options={LIMIT_OPTIONS}
            onChange={setLimit}
            icon={ListFilter}
            accentColor={colors.accentPrimary}
            theme={theme}
          />
        </View>

        <View style={styles.presetsRow}>
          <Text style={[styles.presetsLabel, { color: theme.sub }]}>Quick presets:</Text>
          {[
            { label: "Exam", examSize: 30, limit: 50 },
            { label: "Quick", examSize: 10, limit: 30 },
            { label: "Full", examSize: 50, limit: 100 },
          ].map((p) => {
            const active = examSize === p.examSize && limit === p.limit;
            return (
              <Pressable
                key={p.label}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setExamSize(p.examSize);
                  setLimit(p.limit);
                }}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: active ? colors.accentPrimary : theme.card,
                    borderColor: active ? colors.accentPrimary : theme.border,
                  },
                ]}
              >
                <Text style={[styles.presetChipText, { color: active ? "#fff" : theme.sub }]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ResponsiveSheet>
  );
};

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginTop: 20,
    gap: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 14,
  },
  typeList: {
    marginTop: 12,
    gap: 10,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 18,
  },
  typeCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  typeCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  typeSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sizeSection: {
    marginTop: 12,
    gap: 10,
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  sizeRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sizeLabel: { fontSize: 13, fontWeight: "700" },
  sizeSub: { fontSize: 11, fontWeight: "500" },
  sizeControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  sizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeVal: {
    minWidth: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
  },
  sizeValText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  presetsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
  },
  presetsLabel: { fontSize: 12, fontWeight: "600" },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  presetChipText: { fontSize: 12, fontWeight: "700" },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryDot: { width: 7, height: 7, borderRadius: 4 },
  summaryText: { fontSize: 12, fontWeight: "600" },
  heroBtn: {
    borderRadius: 22,
    elevation: 12,
    shadowColor: AppColors.purpleDeeper,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  heroBtnGradient: {
    borderRadius: 22,
    overflow: "hidden",
  },
  blobL: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    zIndex: 1,
  },
  blobR: {
    position: "absolute",
    bottom: -30,
    right: 70,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    zIndex: 1,
  },
  heroBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 22,
    paddingRight: 12,
    paddingVertical: 14,
    zIndex: 2,
    position: "relative",
  },
  heroBtnTitle: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  heroBtnSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600", marginTop: 2 },
  heroBtnCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});

export default ModuleTestConfigSheet;
