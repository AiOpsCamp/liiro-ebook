/**
 * XpToast — Premium XP Earned Toast Notification
 *
 * A non-blocking, auto-dismissing mini notification that replaces the
 * disruptive full-screen XP modal.
 *
 * - Mobile: slides down from top (compact pill bar)
 * - Web desktop: slides in from bottom-right corner
 * - Auto-dismisses after 3 seconds
 * - Supports dark mode via Redux selectIsDark
 * - Rich animations: spring entrance, sparkle burst, shimmer, glow pulse
 */
import { AppText as Text } from "@/components/ui/AppText";
import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Animated,
  Platform,
  useWindowDimensions,
  Pressable,
  StyleSheet,
  Easing,
} from "react-native";
import { Sparkles, Zap, X } from "lucide-react-native";
import { AppColors } from "@/constants/Colors";

/* ────────────────────────────────────────────────────
 *  Sparkle Particle — tiny animated dots that burst
 * ──────────────────────────────────────────────────── */
const SparkleParticle: React.FC<{
  delay: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
}> = ({ delay, angle, distance, color, size }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(angle) * distance],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(angle) * distance],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 0.6, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1.2, 0.3],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
};

/* ────────────────────────────────────────────────────
 *  Main XpToast Component
 * ──────────────────────────────────────────────────── */
export interface XpToastProps {
  xp: number;
  visible: boolean;
  isDark: boolean;
  onDismiss: () => void;
}

const XpToast: React.FC<XpToastProps> = ({ xp, visible, isDark, onDismiss }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 768;

  // Animation values
  const slideAnim = useRef(new Animated.Value(isDesktop ? 100 : -80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const xpCountAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Generate sparkle particles
  const sparkles = useMemo(() => {
    const particles = [];
    const sparkleColors = [
      AppColors.amber400,
      AppColors.amber500,
      AppColors.yellow400,
      AppColors.amber300,
      AppColors.yellow500,
      AppColors.amber600,
    ];
    for (let i = 0; i < 8; i++) {
      particles.push({
        id: i,
        angle: (i * Math.PI * 2) / 8 + (Math.random() * 0.4 - 0.2),
        distance: 18 + Math.random() * 14,
        delay: 100 + i * 60,
        color: sparkleColors[i % sparkleColors.length],
        size: 3 + Math.random() * 3,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset
      slideAnim.setValue(isDesktop ? 100 : -80);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      bounceAnim.setValue(0);

      // Entrance animation (spring)
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // XP number pop-in bounce
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(xpCountAnim, {
          toValue: 1.15,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(xpCountAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Shimmer sweep
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Small bounce at 150ms
      Animated.sequence([
        Animated.delay(350),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 300,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: isDesktop ? 100 : -80,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isDesktop, slideAnim, fadeAnim, scaleAnim, shimmerAnim, xpCountAnim, bounceAnim]);

  if (!visible && (fadeAnim as any).__getValue() === 0) return null;

  // Colors
  const bgColor = isDark ? "rgba(30, 20, 50, 0.95)" : "rgba(255, 255, 255, 0.97)";
  const borderColor = isDark ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.25)";
  const textColor = isDark ? "#F5F5F5" : "#1A1A1A";
  const subTextColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  const xpColor = AppColors.amber500;
  const xpBgColor = isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)";
  const iconBgColor = isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)";

  const slideTransform = isDesktop ? [{ translateX: slideAnim }] : [{ translateY: slideAnim }];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        isDesktop ? styles.desktopPosition : styles.mobilePosition,
        {
          opacity: fadeAnim,
          transform: [...slideTransform, { scale: scaleAnim }],
        },
      ]}
    >
      <Pressable onPress={onDismiss}>
        <View
          style={[
            styles.card,
            isDesktop ? styles.desktopCard : styles.mobileCard,
            {
              backgroundColor: bgColor,
              borderColor: borderColor,
              // Shadow
              shadowColor: AppColors.amber500,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.15,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
        >
          {/* Icon circle with sparkle burst */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
              <Zap
                size={isDesktop ? 18 : 16}
                color={AppColors.amber500}
                fill={AppColors.amber400}
              />
            </View>

            {/* Sparkle particles around the icon */}
            {sparkles.map((s) => (
              <SparkleParticle
                key={s.id}
                delay={s.delay}
                angle={s.angle}
                distance={s.distance}
                color={s.color}
                size={s.size}
              />
            ))}
          </View>

          {/* Text content */}
          <View style={styles.textContainer}>
            <View style={styles.topRow}>
              <Text weight="Bold" style={[styles.title, { color: textColor }]} numberOfLines={1}>
                XP Earned!
              </Text>
              <Sparkles
                size={12}
                color={AppColors.amber400}
                style={{ marginLeft: 4, marginTop: 1 }}
              />
            </View>
            <Text
              weight="Medium"
              style={[styles.subtitle, { color: subTextColor }]}
              numberOfLines={1}
            >
              Keep up the great work
            </Text>
          </View>

          {/* XP Badge */}
          <Animated.View
            style={[
              styles.xpBadge,
              {
                backgroundColor: xpBgColor,
                borderColor: isDark ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.2)",
                transform: [{ scale: xpCountAnim }],
              },
            ]}
          >
            <Text weight="Black" style={[styles.xpText, { color: xpColor }]}>
              +{xp}
            </Text>
            <Text
              weight="Bold"
              style={[styles.xpLabel, { color: isDark ? AppColors.amber400 : AppColors.amber600 }]}
            >
              XP
            </Text>
          </Animated.View>

          {/* Dismiss X (web desktop only, subtler on mobile) */}
          {isDesktop && (
            <Pressable
              onPress={onDismiss}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" },
              ]}
              hitSlop={8}
            >
              <X size={10} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

/* ────────────────────────────────────────────────────
 *  Styles
 * ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
  },
  mobilePosition: {
    top: Platform.OS === "ios" ? 54 : Platform.OS === "android" ? 40 : 16,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  desktopPosition: {
    bottom: 24,
    right: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  mobileCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: 380,
    width: "100%",
  },
  desktopCard: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    minWidth: 280,
    maxWidth: 340,
  },

  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
    letterSpacing: -0.1,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 3,
  },
  xpText: {
    fontSize: 16,
    letterSpacing: -0.5,
  },
  xpLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  closeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default React.memo(XpToast);
