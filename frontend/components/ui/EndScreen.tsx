import { AppText as Text } from "@/components/ui/AppText";
import React, { memo, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { View, Pressable, Modal, Animated, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { selectIsSubscribed } from "@/redux/features/subscriptionSlice";
import { useAppSelector } from "@/redux/hook";
import { selectIsDark } from "@/redux/features/themeSlice";
import {
  useGetActivityDataQuery,
  useMarkTodayAsLearnedMutation,
  useXpBoostMutation,
} from "@/redux/query/activity-query";
import { extractMsg } from "@/types";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { StreakResponse } from "@/types/activity";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
const VIOLET = {
  50: themeColors["violet-50"],
  100: themeColors["light-purple"],
  200: themeColors["violet-200"],
  300: themeColors["violet-300"],
  400: themeColors["violet-400"],
  500: themeColors["purple"],
  600: themeColors["purple-dark"],
  700: themeColors["purple-deeper"],
  800: themeColors["purple-deepest"],
  900: themeColors["violet-900"],
};

const NEUTRAL = {
  white: themeColors["white"],
  black: themeColors["black"],
  borderLight: themeColors["gray-200"],
  borderDark: "rgba(255,255,255,0.08)",
  overlayLight: "rgba(0,0,0,0.4)",
  overlayDark: "rgba(0,0,0,0.6)",
};

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
const rf = (width: number, base: number, min: number, max: number) =>
  clamp((width / 375) * base, min, max);

const getTheme = (dark: boolean) => ({
  bg: dark ? "#0B0F0A" : themeColors["white"],
  card: dark ? "#111A13" : themeColors["white"],
  text: dark ? "#F3F6F3" : themeColors["gray-900"],
  muted: dark ? "#AAB7A9" : themeColors["gray-500"],
  border: dark ? NEUTRAL.borderDark : NEUTRAL.borderLight,
  subtle: dark ? "#151422" : "#F7F7FB",
  rowBg: dark ? "#17152A" : VIOLET[50],
  chipBg: dark ? "#1A1730" : VIOLET[100],
  chipIcon: VIOLET[600],
  overlay: dark ? NEUTRAL.overlayDark : NEUTRAL.overlayLight,
  primary: VIOLET[600],
  primaryOn: NEUTRAL.white,
  surfaceSoft: VIOLET[100],
  ring: dark ? "#FF8B5A40" : "#FF8B5A33",
});

export interface EndScreenProps {
  visible: boolean;
  onRestart: () => void;
  onExit: () => void;
  totalTerms?: number;
  timeSpent: number;
  title?: string;
  subtitle?: string;
  achievementText?: string;
  restartButtonText?: string;
  exitButtonText?: string;
  showStats?: boolean;
  customStats?: Array<{
    icon: string;
    label: string;
    value: string | number;
    color?: string;
    backgroundColor?: string;
  }>;
  xpAmount?: number;
  onXPAwarded?: (payload: { message: string; amount: number }) => void;
  onXPAwardFailed?: (error: unknown) => void;
}

export const EndScreen = memo<EndScreenProps>(
  ({
    visible,
    onRestart,
    onExit,
    totalTerms,
    timeSpent,
    title = "Session Complete!",
    subtitle = "Nice! You’ve wrapped up this set.",
    achievementText = "Well done!",
    restartButtonText = "Study Again",
    exitButtonText = "Back to Library",
    showStats = true,
    customStats = [],
    xpAmount = 10,
    onXPAwarded,
    onXPAwardFailed,
  }) => {
    const router = useRouter();
    const isSubscribed = useSelector(selectIsSubscribed);
    const [mark_today_as_learned] = useMarkTodayAsLearnedMutation();
    const [xp] = useXpBoostMutation();
    const { refetch, isUninitialized } = useGetActivityDataQuery("30");

    const dark = useAppSelector(selectIsDark);
    const T = useMemo(() => getTheme(dark), [dark]);

    const { width } = useWindowDimensions();

    // ✅ Responsive sizing
    const maxW = useMemo(() => {
      if (width >= 1280) return 520;
      if (width >= 1024) return 500;
      return 460;
    }, [width]);

    const cardMaxW = Math.min(width - 24, maxW);
    const headSize = rf(width, 22, 18, 26);
    const subSize = rf(width, 14, 13, 16);
    const statValSize = rf(width, 18, 16, 22);
    const statLabelSize = rf(width, 13, 12, 15);
    const btnTextSize = rf(width, 16, 14, 18);
    const chipSize = rf(width, 12, 11, 13);

    // ✅ We do NOT mirror `visible` into state in an effect.
    // We only keep a "closing" flag so the modal can remain mounted during fade-out.
    const [isClosing, setIsClosing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // streak info can remain state; we never set it in an effect body synchronously in response to visible
    const [streakInfo, setStreakInfo] = useState<StreakResponse | null>(null);

    const mountedVisible = visible || isClosing;

    const locked = !isSubscribed;
    const primaryText = isSubscribed ? restartButtonText : "Subscribe to restart";

    const defaultStats: Array<{ icon: string; label: string; value: string | number }> = [];
    if (totalTerms) defaultStats.push({ icon: "library-books", label: "Terms", value: totalTerms });
    const statsToShow = customStats.length > 0 ? customStats : defaultStats;

    // ✅ Side-effects when opening (XP + streak) - triggered when `visible` becomes true.
    // No setState in effect body except via async callbacks (allowed) and animation start (no setState).
    const didRunOpenSideEffectsRef = useRef(false);

    useEffect(() => {
      if (!visible) {
        didRunOpenSideEffectsRef.current = false;
        return;
      }
      if (didRunOpenSideEffectsRef.current) return;
      didRunOpenSideEffectsRef.current = true;

      const awardXP = async () => {
        try {
          await xp({ amount: xpAmount }).unwrap();
        } catch (err) {
          const msg = extractMsg(err as FetchBaseQueryError | SerializedError);
          console.error("XP award error:", err);
          onXPAwardFailed?.(msg);
          return;
        }
        if (!isUninitialized) refetch();
        onXPAwarded?.({ message: "XP added", amount: xpAmount });
      };

      const markStreak = async () => {
        try {
          const resp = await mark_today_as_learned().unwrap();
          setStreakInfo(resp as StreakResponse);
        } catch (err) {
          console.warn("Streak mark failed:", err);
          setStreakInfo({ error: "Unable to update streak today." } as any);
        }
      };

      awardXP();
      markStreak();
    }, [
      visible,
      xp,
      xpAmount,
      isUninitialized,
      refetch,
      onXPAwarded,
      onXPAwardFailed,
      mark_today_as_learned,
    ]);

    // ✅ Fade animation driven by `visible`.
    // No setState in effect body. We set isClosing only inside animation callbacks.
    useEffect(() => {
      if (visible) {
        // ensure mounted during fade in
        if (isClosing) {
          // allowed? would be setState in effect body -> avoid
          // we don't need to unset isClosing here; it will be false after closing callback anyway
        }

        fadeAnim.stopAnimation();
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      } else {
        if (!mountedVisible) return;

        fadeAnim.stopAnimation();
        // mark closing only when we actually start closing, but do it via microtask to avoid sync setState-in-effect
        queueMicrotask(() => setIsClosing(true));

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start(() => {
          setIsClosing(false);
          setStreakInfo(null);
        });
      }
    }, [visible]); // intentionally only driven by visible

    const handlePrimaryPress = useCallback(() => {
      if (isSubscribed) {
        // fade out then restart
        setIsClosing(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start(() => {
          setIsClosing(false);
          setStreakInfo(null);
          onRestart();
        });
      } else {
        router.push("/pricing/pricing-main");
      }
    }, [fadeAnim, isSubscribed, onRestart, router]);

    const handleExitPress = useCallback(() => {
      setIsClosing(true);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        setIsClosing(false);
        setStreakInfo(null);
        onExit();
      });
    }, [fadeAnim, onExit]);

    if (!mountedVisible) return null;

    return (
      <Modal
        visible
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={handleExitPress}
        hardwareAccelerated
      >
        <Animated.View
          style={{ opacity: fadeAnim, backgroundColor: T.overlay }}
          className="flex-1 items-center justify-center"
          pointerEvents="box-none"
        >
          <View
            style={{
              backgroundColor: T.card,
              width: cardMaxW,
              shadowColor: NEUTRAL.black,
              borderColor: T.border,
              borderWidth: 1,
            }}
            className="rounded-3xl max-w-full shadow-xl"
          >
            {/* Header */}
            <View className="items-center px-5 pt-7 pb-5">
              <View
                style={{ backgroundColor: T.surfaceSoft, borderColor: T.ring, borderWidth: 1 }}
                className="w-14 h-14 rounded-xl items-center justify-center mb-3"
              >
                <MaterialIcons name="check" size={26} color={T.primary} />
              </View>

              <Text
                style={{ color: T.text, fontSize: headSize, lineHeight: headSize * 1.2 }}
                className="font-extrabold text-center"
              >
                {title}
              </Text>

              <Text
                style={{ color: T.muted, fontSize: subSize, lineHeight: subSize * 1.5 }}
                className="text-center mt-1"
              >
                {subtitle}
              </Text>
            </View>

            {/* Streak chip */}
            {streakInfo?.message || (streakInfo as any)?.error ? (
              <View
                className="self-center mb-3 px-3 py-1.5 rounded-full flex-row items-center"
                style={{ backgroundColor: T.chipBg, borderColor: T.ring, borderWidth: 1 }}
              >
                <MaterialIcons name="whatshot" size={14} color={T.chipIcon} />
                <Text
                  className="ml-1 font-semibold"
                  style={{ color: T.chipIcon, fontSize: chipSize }}
                >
                  {(streakInfo as any)?.message ?? (streakInfo as any)?.error}
                </Text>
                {(streakInfo as any)?.streak?.current ? (
                  <Text className="ml-2" style={{ color: T.muted, fontSize: chipSize }}>
                    🔥 {(streakInfo as any).streak.current}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Stats */}
            {showStats && statsToShow.length > 0 && (
              <View className="px-5 mb-5">
                {statsToShow.map((stat, index) => (
                  <View
                    key={`${stat.label}-${index}`}
                    style={{ backgroundColor: T.rowBg, borderColor: T.border }}
                    className={`flex-row items-center justify-between py-3.5 px-4 rounded-2xl border ${
                      index === statsToShow.length - 1 ? "" : "mb-2"
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        style={{ backgroundColor: T.surfaceSoft }}
                        className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                      >
                        <MaterialIcons name={stat.icon as any} size={20} color={T.primary} />
                      </View>
                      <Text
                        style={{ color: T.text, fontSize: statLabelSize }}
                        className="font-semibold"
                      >
                        {stat.label}
                      </Text>
                    </View>
                    <Text
                      style={{ color: T.primary, fontSize: statValSize }}
                      className="font-extrabold"
                    >
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Achievement */}
            <View
              style={{ backgroundColor: T.surfaceSoft, borderColor: T.ring, borderWidth: 1 }}
              className="mx-5 mb-5 py-3 px-4 rounded-2xl flex-row items-center justify-center"
            >
              <MaterialIcons name="emoji-events" size={20} color={T.primary} />
              <Text style={{ color: T.primary }} className="font-extrabold ml-2">
                {achievementText}
              </Text>
            </View>

            {/* Actions */}
            <View className="px-5 pb-5 gap-3">
              <Pressable
                onPress={handlePrimaryPress}
                style={{ backgroundColor: T.primary, opacity: locked ? 0.9 : 1 }}
                className="py-3.5 px-6 rounded-2xl flex-row items-center justify-center"
                android_ripple={{ color: VIOLET[700] + "55" }}
              >
                <MaterialIcons name={locked ? "lock" : "refresh"} size={20} color={T.primaryOn} />
                <Text
                  style={{ color: T.primaryOn, fontSize: btnTextSize }}
                  className="font-extrabold ml-2"
                >
                  {primaryText}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleExitPress}
                style={{ backgroundColor: T.subtle, borderColor: T.border }}
                className="py-3.5 px-6 rounded-2xl flex-row items-center justify-center border"
                android_ripple={{ color: VIOLET[200] + "55" }}
              >
                <MaterialIcons name="home" size={20} color={T.text} />
                <Text
                  style={{ color: T.text, fontSize: btnTextSize }}
                  className="font-extrabold ml-2"
                >
                  {exitButtonText}
                </Text>
              </Pressable>

              <Text style={{ color: T.muted, fontSize: subSize }} className="text-center mt-1">
                {locked
                  ? "Session ended. Subscribe to restart, or head back and start a fresh set."
                  : "Keep it rolling—hit restart and stack that streak."}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Modal>
    );
  }
);

EndScreen.displayName = "EndScreen";
