import { AppText as Text } from '@/components/ui/AppText';
import { View, Pressable, Animated, ActivityIndicator, Modal, Easing } from "react-native";
import { useEffect, memo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  type ProgressBarProps,
  type AudioButtonProps,
  type ExampleCardProps,
  type EndScreenProps,
  type ConfirmationModalProps} from "./types";
import { useSelector } from "react-redux";
import { selectIsDark } from "@/redux/features/themeSlice";
import { selectLearnModeSettings } from "@/redux/features/learnModeSettingsSlice";
import { EYE_COMFORT_COLOR } from "@/config/config";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
const getTheme = (dark: boolean) => ({
  bg: dark ? "#0B0F0A" : themeColors["white"],
  text: dark ? "#F3F6F3" : themeColors["gray-800"],
  muted: dark ? "#AAB7A9" : themeColors["gray-500"],
  card: dark ? "#111A13" : themeColors["white"],
  border: dark ? "rgba(255,255,255,0.08)" : themeColors["gray-200"],
  pillActiveBg: dark ? "#19301C" : themeColors["meadow-green"],
  pillInactiveBg: dark ? "#182019" : themeColors["gray-100"],
  primary: dark ? "#7EC35C" : themeColors["forest-core"],
  primaryOn: dark ? "#0C140D" : themeColors["white"],
  success: dark ? "#8ABF62" : AppColors.green500,
  warning: dark ? themeColors["warning"] : themeColors["warning"],
  error: themeColors["error"],
  overlay: "rgba(0,0,0,0.5)",
  successTint: dark ? "rgba(138,191,98,0.18)" : "rgba(190,220,116,0.20)",
  warningTint: dark ? "rgba(245,158,11,0.20)" : "rgba(245,158,11,0.20)",
  primaryTint: dark ? "rgba(56,127,57,0.20)" : "rgba(56,127,57,0.12)",
  accentTint: dark ? "rgba(246,233,107,0.20)" : "rgba(246,233,107,0.20)",
  gray200: dark ? "rgba(255,255,255,0.06)" : themeColors["gray-200"],
  gray400: dark ? "#9AA49B" : themeColors["gray-400"],
  gray600: dark ? "#C8D0CA" : themeColors["gray-600"],
  gray700: dark ? "#E1E6E2" : themeColors["gray-700"],
  gray800: dark ? "#F3F6F3" : themeColors["gray-800"],
  eyeComfortBg: dark ? AppColors.forestInk : EYE_COMFORT_COLOR});

const useTheme = () => {
  const dark = useSelector(selectIsDark);
  const settings = useSelector(selectLearnModeSettings);
  const T = getTheme(dark);
  return { T, dark, settings };
};

/* ───────────────── Progress Bar (SMOOTH ANIMATED) ───────────────── */
export const ProgressBar = memo<ProgressBarProps>(({ progress, color }) => {
  const { T } = useTheme();

  // Expect progress as a number between 0 and 1
  const normalized =
    typeof progress === "number" && !isNaN(progress) ? Math.min(1, Math.max(0, progress)) : 0;

  const [barWidth, setBarWidth] = useState(0);
  const [animatedWidth] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (barWidth <= 0) return;
    const targetWidth = normalized * barWidth;

    Animated.timing(animatedWidth, {
      toValue: targetWidth,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false}).start();
  }, [normalized, barWidth, animatedWidth]);

  return (
    <View
      className="h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: T.gray200 }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && barWidth === 0) {
          setBarWidth(w);
          animatedWidth.setValue(normalized * w);
        }
      }}
    >
      <Animated.View
        className="h-full rounded-full"
        style={{
          width: animatedWidth,
          backgroundColor: color ?? T.primary}}
      />
    </View>
  );
});
ProgressBar.displayName = "ProgressBar";

/* ───────────────── Audio Button ───────────────── */
export const AudioButton = memo<AudioButtonProps>(({ onPress, isLoading, isPlaying, disabled }) => {
  const { T } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="p-3 rounded-2xl"
      style={{
        backgroundColor: isPlaying ? T.primaryTint : T.pillInactiveBg,
        borderWidth: 2,
        borderColor: isPlaying ? T.primary : T.pillActiveBg,
        opacity: disabled ? 0.6 : 1}}
      accessibilityLabel="Play audio pronunciation"
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={T.primary} />
      ) : (
        <MaterialIcons name={isPlaying ? "volume-up" : "play-arrow"} size={24} color={T.primary} />
      )}
    </Pressable>
  );
});

AudioButton.displayName = "AudioButton";

/* ───────────────── Example Card (Large) ───────────────── */
export const ExampleCard = memo<ExampleCardProps>(({ example, index }) => {
  const { T } = useTheme();
  return (
    <View
      className="p-4 rounded-2xl mb-3"
      style={{ backgroundColor: T.primaryTint, borderWidth: 1, borderColor: T.border }}
    >
      <View className="flex-row">
        <View
          className="w-8 h-8 rounded-xl items-center justify-center mr-3 mt-1"
          style={{ backgroundColor: T.primary }}
        >
          <Text className="text-xs font-bold" style={{ color: T.primaryOn }}>
            {index + 1}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium mb-2" style={{ color: T.gray800 }}>
            &quot;{example.sentence}&quot;
          </Text>
          <Text className="text-xs italic" style={{ color: T.muted }}>
            {example.meaning}
          </Text>
        </View>
      </View>
    </View>
  );
});

ExampleCard.displayName = "ExampleCard";

/* ───────────────── End Screen Modal ───────────────── */
export const EndScreen = memo<EndScreenProps>(
  ({ visible, onRestart, onExit, totalTerms, timeSpent }) => {
    const { T, settings } = useTheme();
    const [scaleAnim] = useState(() => new Animated.Value(0));
    const [fadeAnim] = useState(() => new Animated.Value(0));
    const [celebrationAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
      if (visible) {
        const celebrationLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(celebrationAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(celebrationAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ])
        );
        celebrationLoop.start();

        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 40}),
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();

        return () => celebrationLoop.stop();
      } else {
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);
        celebrationAnim.stopAnimation();
        celebrationAnim.setValue(0);
      }
    }, [visible, scaleAnim, fadeAnim, celebrationAnim]);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onExit}>
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: T.overlay }}>
          <Animated.View
            className="mx-6 p-8 rounded-3xl items-center"
            style={{
              backgroundColor: settings.eyeComfort ? T.eyeComfortBg : T.card,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
              shadowColor: T.gray400,
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.3,
              shadowRadius: 25,
              elevation: 20,
              borderWidth: 1,
              borderColor: T.border}}
          >
            {/* Animated Success Icon */}
            <Animated.View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: T.successTint,
                transform: [
                  {
                    scale: celebrationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1]})},
                ]}}
            >
              <MaterialIcons name="check-circle" size={48} color={T.success} />
            </Animated.View>

            {/* Title */}
            <Text className="text-2xl font-bold mb-2" style={{ color: T.gray800 }}>
              Slideshow Complete!
            </Text>

            <Text className="text-base text-center mb-6" style={{ color: T.muted }}>
              Great job! You&apos;ve reviewed all the vocabulary terms.
            </Text>

            {/* Stats */}
            <View className="w-full mb-8">
              <View
                className="flex-row justify-between p-4 rounded-2xl mb-3"
                style={{ backgroundColor: T.accentTint }}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="library-books" size={20} color={T.primary} />
                  <Text className="font-medium ml-2" style={{ color: T.gray700 }}>
                    Terms Reviewed
                  </Text>
                </View>
                <Text className="font-bold" style={{ color: T.primary }}>
                  {totalTerms}
                </Text>
              </View>

              <View
                className="flex-row justify-between p-4 rounded-2xl"
                style={{ backgroundColor: T.primaryTint }}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="schedule" size={20} color={T.primary} />
                  <Text className="font-medium ml-2" style={{ color: T.gray700 }}>
                    Time Spent
                  </Text>
                </View>
                <Text className="font-bold" style={{ color: T.primary }}>
                  {formatTime(timeSpent)}
                </Text>
              </View>
            </View>

            {/* Achievement Badge */}
            <View
              className="px-6 py-3 rounded-2xl mb-6"
              style={{ backgroundColor: T.pillInactiveBg }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="star" size={24} color={T.primary} />
                <Text className="font-bold ml-2" style={{ color: T.primary }}>
                  Learning Achievement Unlocked!
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-y-3">
              <Pressable
                className="w-full py-4 px-5 rounded-2xl items-center"
                style={{
                  backgroundColor: T.primary,
                  shadowColor: T.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 2}}
                onPress={onRestart}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="refresh" size={20} color={T.primaryOn} />
                  <Text className="font-bold text-base ml-2" style={{ color: T.primaryOn }}>
                    Review Again
                  </Text>
                </View>
              </Pressable>

              <Pressable
                className="w-full py-4 px-5 rounded-2xl items-center"
                style={{ backgroundColor: T.gray200 }}
                onPress={onExit}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="home" size={20} color={T.gray700} />
                  <Text className="font-bold text-base ml-2" style={{ color: T.gray700 }}>
                    Back to Home
                  </Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

EndScreen.displayName = "EndScreen";

export const ConfirmationModal = ({
  visible,
  onConfirm,
  onCancel,
  title,
  message}: ConfirmationModalProps) => {
  const { T, settings } = useTheme();
  const [scaleAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40}).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: T.overlay }}>
        <Animated.View
          className="mx-6 p-6 rounded-3xl"
          style={{
            backgroundColor: settings.eyeComfort ? T.eyeComfortBg : T.card,
            transform: [{ scale: scaleAnim }],
            shadowColor: T.gray400,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.3,
            shadowRadius: 25,
            elevation: 20,
            borderWidth: 1,
            borderColor: T.border}}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4 self-center"
            style={{ backgroundColor: T.warningTint }}
          >
            <MaterialIcons name="warning" size={32} color={T.warning} />
          </View>

          <Text className="text-xl font-bold mb-3 text-center" style={{ color: T.gray800 }}>
            {title}
          </Text>
          <Text className="text-base mb-6 text-center" style={{ color: T.muted }}>
            {message}
          </Text>

          <View className="flex-row gap-x-3">
            <Pressable
              className="flex-1 py-3 rounded-2xl items-center"
              style={{ backgroundColor: T.gray200 }}
              onPress={onCancel}
            >
              <Text className="font-bold" style={{ color: T.gray700 }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 py-3 rounded-2xl items-center"
              style={{
                backgroundColor: T.error,
                shadowColor: T.error,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4}}
              onPress={onConfirm}
            >
              <Text className="font-bold" style={{ color: T.primaryOn }}>
                End
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
