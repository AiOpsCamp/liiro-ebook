import { AppText as Text } from '@/components/ui/AppText';
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
  FadeIn,
  cancelAnimation} from "react-native-reanimated";
import { BookOpen, Layers, Play, Sparkles, Star, Zap } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
// Loading tips for different modes
const DEFAULT_TIPS = [
  "Preparing your learning session...",
  "Getting your vocabulary ready...",
  "Loading your study materials...",
  "Almost there...",
];
const FLASHCARD_TIPS = [
  "Shuffling your flashcards...",
  "Preparing memory exercises...",
  "Getting cards ready to flip...",
  "Optimizing your learning path...",
];
const SLIDESHOW_TIPS = [
  "Preparing your slides...",
  "Loading visual content...",
  "Arranging your vocabulary...",
  "Setting up the presentation...",
];

// Violet theme colors
const THEME_COLORS = {
  bg_top: AppColors.violet900, // violet-900
  bg_mid: AppColors.purpleDeeper, // violet-700
  bg_bottom: AppColors.indigoDeep, // deep indigo
  accent: AppColors.violet400, // violet-400
  accentBright: AppColors.violet300, // violet-300
  glow: themeColors["purple"], // violet-500
};

export type VioletLoaderMode = "flashcard" | "slideshow" | "default";

interface VioletLoaderProps {
  mode?: VioletLoaderMode;
  customTips?: string[];
}

const getIcon = (mode: VioletLoaderMode) => {
  switch (mode) {
    case "flashcard":
      return <Layers size={56} color="white" strokeWidth={1.5} />;
    case "slideshow":
      return <Play size={56} color="white" strokeWidth={1.5} fill="rgba(255,255,255,0.3)" />;
    default:
      return <BookOpen size={56} color="white" strokeWidth={1.5} />;
  }
};

const getTips = (mode: VioletLoaderMode, customTips?: string[]) => {
  if (customTips && customTips.length > 0) return customTips;
  switch (mode) {
    case "flashcard":
      return FLASHCARD_TIPS;
    case "slideshow":
      return SLIDESHOW_TIPS;
    default:
      return DEFAULT_TIPS;
  }
};

export default function VioletLoader({ mode = "default", customTips }: VioletLoaderProps) {
  const tips = getTips(mode, customTips);
  const [tipIndex, setTipIndex] = useState(0);

  // Animation shared values
  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);
  const innerRotate = useSharedValue(0);
  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const floatingY = useSharedValue(0);

  // Background circles (replaces MotiView)
  const bgCircle1Opacity = useSharedValue(0);
  const bgCircle1Scale = useSharedValue(0.8);
  const bgCircle2Opacity = useSharedValue(0);
  const bgCircle2Scale = useSharedValue(0.8);

  // Particle positions for orbiting effect
  const particle1Angle = useSharedValue(0);
  const particle2Angle = useSharedValue(120);
  const particle3Angle = useSharedValue(240);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [tips.length]);

  useEffect(() => {
    // Background circles intro (drop-in replacement for MotiView)
    bgCircle1Opacity.value = withTiming(0.1, { duration: 2000 });
    bgCircle1Scale.value = withTiming(1, { duration: 2000 });

    bgCircle2Opacity.value = withTiming(0.08, { duration: 2500, easing: Easing.out(Easing.cubic) });
    bgCircle2Scale.value = withTiming(1, { duration: 2500, easing: Easing.out(Easing.cubic) });
    // delay circle 2
    bgCircle2Opacity.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(0.08, { duration: 2500, easing: Easing.out(Easing.cubic) })
    );
    bgCircle2Scale.value = withSequence(
      withTiming(0.8, { duration: 300 }),
      withTiming(1, { duration: 2500, easing: Easing.out(Easing.cubic) })
    );

    // Breathing pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Outer ring slow rotation
    rotate.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );

    // Inner elements counter-rotation (slower)
    innerRotate.value = withRepeat(
      withTiming(-360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Glow pulsing
    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 2500 }), withTiming(0.35, { duration: 2500 })),
      -1,
      true
    );

    // Floating animation
    floatingY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Progress bar
    progress.value = withTiming(100, {
      duration: 5000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)});

    // Particle orbits
    particle1Angle.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
    particle2Angle.value = withRepeat(
      withTiming(480, { duration: 4500, easing: Easing.linear }),
      -1,
      false
    );
    particle3Angle.value = withRepeat(
      withTiming(600, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(pulse);
      cancelAnimation(rotate);
      cancelAnimation(innerRotate);
      cancelAnimation(glowOpacity);
      cancelAnimation(floatingY);
      cancelAnimation(progress);
      cancelAnimation(particle1Angle);
      cancelAnimation(particle2Angle);
      cancelAnimation(particle3Angle);
      cancelAnimation(bgCircle1Opacity);
      cancelAnimation(bgCircle1Scale);
      cancelAnimation(bgCircle2Opacity);
      cancelAnimation(bgCircle2Scale);
    };
     
  }, []);

  // Animated styles
  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { translateY: floatingY.value }]}));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }]}));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRotate.value}deg` }]}));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulse.value * 1.15 }]}));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`}));

  // Background circle animated styles (replaces MotiView)
  const bgCircle1Style = useAnimatedStyle(() => ({
    opacity: bgCircle1Opacity.value,
    transform: [{ scale: bgCircle1Scale.value }]}));

  const bgCircle2Style = useAnimatedStyle(() => ({
    opacity: bgCircle2Opacity.value,
    transform: [{ scale: bgCircle2Scale.value }]}));

  // Orbiting particle styles
  const useParticleStyle = (
    angleValue: ReturnType<typeof useSharedValue<number>>,
    radius: number,
    size: number
  ) => {
    return useAnimatedStyle(() => {
      const angle = angleValue.value * (Math.PI / 180);
      return {
        width: size,
        height: size,
        borderRadius: size / 2,
        position: "absolute" as const,
        transform: [
          { translateX: Math.cos(angle) * radius },
          { translateY: Math.sin(angle) * radius },
        ]};
    });
  };

  const particle1Style = useParticleStyle(particle1Angle, 100, 8);
  const particle2Style = useParticleStyle(particle2Angle, 120, 6);
  const particle3Style = useParticleStyle(particle3Angle, 140, 5);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME_COLORS.bg_top, THEME_COLORS.bg_mid, THEME_COLORS.bg_bottom]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Background decorative elements */}
      <View style={styles.bgDecorations}>
        <Animated.View
          style={[
            styles.bgCircle,
            { top: "10%", left: "5%", width: 150, height: 150 },
            bgCircle1Style,
          ]}
        />
        <Animated.View
          style={[
            styles.bgCircle,
            { bottom: "15%", right: "10%", width: 200, height: 200 },
            bgCircle2Style,
          ]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          {/* Glow blob */}
          <Animated.View style={[styles.glowBlob, glowStyle]} />

          {/* Outer rotating ring with dots */}
          <Animated.View style={[styles.outerRing, outerRingStyle]}>
            <View style={[styles.orbitDot, styles.dotTop]} />
            <View style={[styles.orbitDot, styles.dotBottom]} />
            <View style={[styles.orbitDot, styles.dotLeft]} />
            <View style={[styles.orbitDot, styles.dotRight]} />
          </Animated.View>

          {/* Inner counter-rotating ring */}
          <Animated.View style={[styles.innerRing, innerRingStyle]}>
            <View style={[styles.innerDot, { top: 0, alignSelf: "center" }]} />
            <View style={[styles.innerDot, { bottom: 0, alignSelf: "center" }]} />
          </Animated.View>

          {/* Orbiting particles */}
          <View style={styles.particleContainer}>
            <Animated.View
              style={[particle1Style, { backgroundColor: THEME_COLORS.accentBright }]}
            />
            <Animated.View style={[particle2Style, { backgroundColor: THEME_COLORS.accent }]} />
            <Animated.View style={[particle3Style, { backgroundColor: "rgba(255,255,255,0.5)" }]} />
          </View>

          {/* Main icon container with glassmorphism */}
          <Animated.View style={[styles.iconWrapper, iconContainerStyle]}>
            <BlurView intensity={50} tint="light" style={styles.glassContainer}>
              <LinearGradient
                colors={["rgba(255, 189, 125, 0.3)", "rgba(255, 169, 90, 0.2)"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {getIcon(mode)}
            </BlurView>
          </Animated.View>

          {/* Decorative sparkles */}
          <Animated.View entering={FadeIn.delay(400)} style={styles.sparkleTopRight}>
            <Sparkles size={22} color={THEME_COLORS.accentBright} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(600)} style={styles.sparkleBottomLeft}>
            <Star size={18} color={AppColors.amber400} fill={AppColors.amber400} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(800)} style={styles.sparkleTopLeft}>
            <Zap size={16} color={THEME_COLORS.accent} />
          </Animated.View>
        </View>

        {/* Bottom content */}
        <View style={styles.bottomContainer}>
          {/* Animated loading tips */}
          <View style={styles.textContainer}>
            <Animated.Text
              key={tipIndex}
              entering={FadeInDown.springify().damping(14)}
              style={styles.loadingText}
            >
              {tips[tipIndex]}
            </Animated.Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressBarStyle]}>
              <LinearGradient
                colors={[THEME_COLORS.accentBright, THEME_COLORS.accent]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>

          {/* Mode indicator */}
          <Text style={styles.modeText}>
            {mode === "flashcard"
              ? "Flashcard Mode"
              : mode === "slideshow"
                ? "Slideshow Mode"
                : "Loading"}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.bg_top},
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center"},
  bgDecorations: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden"},
  bgCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: THEME_COLORS.accent},
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"},
  glowBlob: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: THEME_COLORS.glow,
    position: "absolute",
    shadowColor: THEME_COLORS.glow,
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 0},
  outerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    position: "absolute",
    justifyContent: "center"},
  innerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderStyle: "dashed",
    position: "absolute",
    justifyContent: "center"},
  orbitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLORS.accent,
    position: "absolute",
    shadowColor: THEME_COLORS.accent,
    shadowOpacity: 0.8,
    shadowRadius: 4},
  dotTop: { top: -4, alignSelf: "center" },
  dotBottom: { bottom: -4, alignSelf: "center" },
  dotLeft: { left: -4, top: "50%", marginTop: -4 },
  dotRight: { right: -4, top: "50%", marginTop: -4 },
  innerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.4)",
    position: "absolute"},
  particleContainer: {
    position: "absolute",
    width: 0,
    height: 0,
    justifyContent: "center",
    alignItems: "center"},
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 35,
    overflow: "hidden",
    shadowColor: THEME_COLORS.glow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)"},
  glassContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)"},
  sparkleTopRight: {
    position: "absolute",
    top: -35,
    right: -25,
    opacity: 0.7},
  sparkleBottomLeft: {
    position: "absolute",
    bottom: -25,
    left: -35,
    opacity: 0.5},
  sparkleTopLeft: {
    position: "absolute",
    top: -20,
    left: -40,
    opacity: 0.6},
  bottomContainer: {
    width: "100%",
    paddingHorizontal: 36,
    paddingBottom: 48,
    alignItems: "center"},
  textContainer: {
    height: 44,
    justifyContent: "center",
    marginBottom: 24},
  loadingText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3},
  progressTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 18},
  progressBar: {
    height: "100%",
    borderRadius: 3,
    overflow: "hidden",
    shadowColor: THEME_COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8},
  modeText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.5}});
