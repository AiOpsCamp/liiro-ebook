import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Pressable, Animated as RNAnimated, Easing as RNEasing } from "react-native";
import { Play, Pause, Headphones } from "lucide-react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { AudioManager } from "@/lib/utils/audioManager";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";

export interface AudioPlayerBarProps {
  audioUrl?: string;
  title?: string;
  subtitle?: string;
  initialTimestamp?: number;
  onTimestampChange?: (seconds: number) => void;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  textSecondaryColor?: string;
  borderColor?: string;
  isDarkTheme?: boolean;
}

const SPEED_STEPS = [0.75, 1.0, 1.25, 1.5, 2.0];

const fmtTime = (sec: number): string => {
  const s = Math.floor(Math.max(0, sec));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
};

/* ── Animated Equalizer Bar ──────────────────────────── */

const EqualizerBar = ({
  minH,
  maxH,
  duration,
  color,
}: {
  minH: number;
  maxH: number;
  duration: number;
  color: string;
}) => {
  const h = useSharedValue(minH);
  useEffect(() => {
    h.value = withRepeat(
      withSequence(
        withTiming(maxH, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(minH, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [minH, maxH, duration, h]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View className="w-[3px] rounded-full mx-[1px]" style={[{ backgroundColor: color }, style]} />;
};

/* ── Audio Player Bar ───────────────────────────────── */

const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioUrl,
  title,
  subtitle,
  initialTimestamp = 0,
  onTimestampChange,
  accentColor: customAccent,
  bgColor: customBg,
  textColor: customTextColor,
  textSecondaryColor: customTextSecondary,
  borderColor: customBorder,
  isDarkTheme: customIsDark,
}) => {
  const globalIsDark = useSelector(selectIsDark);
  const tokens = useSelector(selectThemeTokens);
  const insets = useSafeAreaInsets();

  const isDark = customIsDark !== undefined ? customIsDark : globalIsDark;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1); // default 1.0×
  const [seekBarWidth, setSeekBarWidth] = useState(1);

  const audioManagerRef = useRef(AudioManager.getInstance());
  const initialTimestampConsumedRef = useRef(false);
  const playButtonScale = useRef(new RNAnimated.Value(1)).current;

  // Subscribe to live position updates from AudioManager
  useEffect(() => {
    const listener = (status: { position: number; duration: number }) => {
      setCurrentTime(status.position);
      if (status.duration > 0) setDuration(status.duration);
      onTimestampChange?.(status.position);
    };
    audioManagerRef.current.addStatusListener(listener);
    return () => audioManagerRef.current.removeStatusListener(listener);
  }, [onTimestampChange]);

  // Stop on unmount
  useEffect(() => {
    return () => { audioManagerRef.current.stopAudio(); };
  }, []);

  // Reset state when chapter audio changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    initialTimestampConsumedRef.current = false;
    // Reset speed to 1× on chapter change
    setSpeedIdx(1);
    audioManagerRef.current.setRate(SPEED_STEPS[1]);
  }, [audioUrl]);

  const togglePlay = useCallback(async () => {
    if (!audioUrl) return;

    if (isPlaying) {
      await audioManagerRef.current.stopAudio();
      setIsPlaying(false);
    } else {
      // Resume from saved timestamp on first play only
      const seekPos =
        !initialTimestampConsumedRef.current && initialTimestamp > 5 ? initialTimestamp : 0;
      initialTimestampConsumedRef.current = true;

      setIsPlaying(true);
      const success = await audioManagerRef.current.playAudio(audioUrl, () => setIsPlaying(false), seekPos);
      if (!success) setIsPlaying(false);
      else audioManagerRef.current.setRate(SPEED_STEPS[speedIdx]);
    }
  }, [audioUrl, isPlaying, initialTimestamp, speedIdx]);

  const handleSeek = useCallback((locationX: number) => {
    if (seekBarWidth <= 1 || duration <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / seekBarWidth));
    const pos = ratio * duration;
    audioManagerRef.current.seekTo(pos);
    setCurrentTime(pos);
    onTimestampChange?.(pos);
  }, [seekBarWidth, duration, onTimestampChange]);

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % SPEED_STEPS.length;
    setSpeedIdx(next);
    audioManagerRef.current.setRate(SPEED_STEPS[next]);
  }, [speedIdx]);

  const onPressIn = () => {
    RNAnimated.timing(playButtonScale, {
      toValue: 0.92,
      duration: 120,
      easing: RNEasing.inOut(RNEasing.ease),
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    RNAnimated.timing(playButtonScale, {
      toValue: 1,
      duration: 120,
      easing: RNEasing.inOut(RNEasing.ease),
      useNativeDriver: true,
    }).start();
  };

  if (!audioUrl) return null;

  const accent = customAccent || tokens.accentPrimary || "#0EA5E9";
  const bgSurface = customBg || (isDark ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)");
  const textColor = customTextColor || (isDark ? "#F8FAFC" : "#0F172A");
  const textSecondary = customTextSecondary || (isDark ? "#94A3B8" : "#64748B");
  const border = customBorder || (isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0,0,0,0.08)");

  const progress = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
  const currentSpeed = SPEED_STEPS[speedIdx];
  const speedLabel = currentSpeed === 1.0 ? "1×" : `${currentSpeed}×`;

  return (
    <Animated.View
      entering={FadeInDown.duration(600).delay(200)}
      className="absolute left-0 right-0 items-center z-50 px-4"
      style={{ bottom: Math.max(insets.bottom, 16) }}
      pointerEvents="box-none"
    >
      <View
        className="w-full border shadow-xl"
        style={{
          backgroundColor: bgSurface,
          borderColor: border,
          borderRadius: 28,
          maxWidth: 440,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 24,
        }}
      >
        {/* ── Row 1: Icon + Track Info + Speed + Play ── */}
        <View className="flex-row items-center mb-3">
          {/* Icon badge */}
          <View
            className="w-10 h-10 rounded-2xl justify-center items-center mr-3"
            style={{ backgroundColor: accent + "18" }}
          >
            {isPlaying ? (
              <View className="flex-row items-end h-5 justify-center">
                <EqualizerBar minH={6} maxH={18} duration={350} color={accent} />
                <EqualizerBar minH={10} maxH={22} duration={500} color={accent} />
                <EqualizerBar minH={4} maxH={14} duration={400} color={accent} />
              </View>
            ) : (
              <Headphones size={18} color={accent} />
            )}
          </View>

          {/* Track title + subtitle */}
          <View className="flex-1 mr-2">
            <AppText
              weight="SemiBold"
              className="text-[13px] tracking-tight"
              style={{ color: textColor }}
              numberOfLines={1}
            >
              {title || "Audio Narration"}
            </AppText>
            <AppText
              weight="Medium"
              className="text-[11px]"
              style={{ color: isPlaying ? accent : textSecondary }}
              numberOfLines={1}
            >
              {isPlaying ? "Playing…" : subtitle || "Tap play to listen"}
            </AppText>
          </View>

          {/* Speed toggle */}
          <Pressable
            onPress={cycleSpeed}
            hitSlop={8}
            accessibilityLabel={`Playback speed: ${speedLabel}`}
            className="px-2.5 py-1.5 rounded-lg mr-2 items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? accent + "30"
                : accent + "15",
            })}
          >
            <AppText weight="Bold" className="text-[11px]" style={{ color: accent }}>
              {speedLabel}
            </AppText>
          </Pressable>

          {/* Play / Pause */}
          <Pressable
            onPress={togglePlay}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            hitSlop={10}
            accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
            accessibilityRole="button"
          >
            <RNAnimated.View
              style={{
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: accent,
                borderRadius: 22,
                transform: [{ scale: playButtonScale }],
                shadowColor: accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
              }}
            >
              {isPlaying ? (
                <Pause size={18} color="#FFFFFF" />
              ) : (
                <Play size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
              )}
            </RNAnimated.View>
          </Pressable>
        </View>

        {/* ── Row 2: Seek bar ── */}
        <Pressable
          onPress={(e) => handleSeek(e.nativeEvent.locationX)}
          onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
          style={{ paddingVertical: 8 }}
          accessibilityLabel="Seek audio"
        >
          <View style={{ height: 3, backgroundColor: accent + "22", borderRadius: 2 }}>
            {/* Filled track */}
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                borderRadius: 2,
                backgroundColor: accent,
                width: `${progress}%`,
              }}
            />
            {/* Thumb */}
            {duration > 0 && (
              <View
                style={{
                  position: "absolute",
                  left: `${progress}%` as any,
                  top: "50%",
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: accent,
                  transform: [{ translateX: -5 }, { translateY: -5 }],
                }}
              />
            )}
          </View>
        </Pressable>

        {/* ── Row 3: Time labels ── */}
        <View className="flex-row justify-between mt-0.5">
          <AppText weight="Medium" style={{ fontSize: 10, color: textSecondary }}>
            {fmtTime(currentTime)}
          </AppText>
          <AppText weight="Medium" style={{ fontSize: 10, color: textSecondary }}>
            {duration > 0 ? fmtTime(duration) : "--:--"}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
};

export default AudioPlayerBar;
