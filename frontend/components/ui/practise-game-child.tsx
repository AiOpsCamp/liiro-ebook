import { AppText as Text } from '@/components/ui/AppText';
import React, { useEffect } from "react";
import { View, ActivityIndicator, Dimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";
import Animated, {
  FadeOut,
  ZoomIn,
  BounceIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing} from "react-native-reanimated";
import { Pressable } from "react-native-gesture-handler";
import { Award, Pause, Play, Star, Trophy, Lightbulb, RefreshCw, Home } from "lucide-react-native";

import { Word } from "@/types/practise-game";
import { Button } from "./button2";
import { COLORS } from "@/lib/colors";
import themeColors from "@/constants/theme-colors.json";
import { AppColors } from "@/constants/Colors";
const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedWord({
  word,
  index,
  onPress,
  isAnswer = false,
  delay = 0}: {
  word: Word;
  index: number;
  onPress: () => void;
  isAnswer?: boolean;
  delay?: number;
}) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = 50;
    scale.value = 0.5;

    translateY.value = withDelay(
      delay + index * 50,
      withSpring(0, { damping: 12, stiffness: 100 })
    );

    scale.value = withDelay(delay + index * 50, withSpring(1, { damping: 12, stiffness: 100 }));

    rotate.value = withDelay(
      delay + index * 50,
      withSequence(
        withTiming(-5, { duration: 150 }),
        withTiming(5, { duration: 300 }),
        withTiming(0, { duration: 150 })
      )
    );
  }, [delay, index]);

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ]};
  });

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      withTiming(1, { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );

    rotate.value = withSequence(
      withTiming(isAnswer ? -5 : 5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    onPress();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      className={`m-1 ${isAnswer ? "border border-accent" : ""}`}
      style={animStyle}
    >
      <View className={`py-2 px-3 rounded-xl ${isAnswer ? "bg-accent/20" : "bg-accent"}`}>
        {isAnswer ? (
          // When in answer area, show the actual word
          <Text className="font-medium text-primary">{word.content}</Text>
        ) : (
          // In word bank, show only the translation
          <Text className="font-medium text-primary">{word.translation || word.content}</Text>
        )}
      </View>
    </AnimatedTouchable>
  );
}

export function ConfettiPiece({
  color,
  size,
  duration,
  delay,
  startX}: {
  color: string;
  size: number;
  duration: number;
  delay: number;
  startX: number;
}) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(Dimensions.get("window").height * 0.5, { duration })
    );

    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() * 200 - 100), { duration })
    );

    rotate.value = withDelay(delay, withTiming(Math.random() * 360, { duration }));

    opacity.value = withDelay(delay + duration * 0.7, withTiming(0, { duration: duration * 0.3 }));
  }, [delay, duration, startX]);

  const animStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: size / 2,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value};
  });

  return <Animated.View style={animStyle} />;
}

export function AudioButton({
  isPlaying,
  isLoading,
  onPress,
  disabled = false}: {
  isPlaying: boolean;
  isLoading: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      pulseOpacity.value = withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      );

      const interval = setInterval(() => {
        pulseOpacity.value = withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        );
      }, 2000);

      return () => clearInterval(interval);
    } else {
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying]);

  const handlePress = () => {
    if (disabled) return;

    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    rotation.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    onPress();
  };

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }]};
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
      transform: [{ scale: 1 + pulseOpacity.value * 0.5 }]};
  });

  return (
    <View className="relative">
      {/* Pulse effect */}
      {isPlaying && (
        <Animated.View
          style={pulseStyle}
          className="absolute inset-0 rounded-full bg-primary opacity-20"
        />
      )}

      <AnimatedPressable
        onPress={handlePress}
        style={buttonStyle}
        className={`w-12 h-12 rounded-full items-center justify-center ${
          isPlaying ? "bg-primary" : "bg-white border border-primary"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isPlaying ? COLORS.white : COLORS.primary} />
        ) : isPlaying ? (
          <Pause size={20} color={COLORS.white} />
        ) : (
          <Play size={20} color={COLORS.primary} />
        )}
      </AnimatedPressable>
    </View>
  );
}

export function GameCompletionScreen({
  stats,
  onRestart,
  onGoHome,
  imageUrl}: {
  stats: {
    correctAnswers: number;
    totalQuestions: number;
    points: number;
    streak: number;
    timeSpent: number;
  };
  onRestart: () => void;
  onGoHome: () => void;
  imageUrl: string;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(-10);
  const badgeScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 800, easing: Easing.elastic(1.2) });
    opacity.value = withTiming(1, { duration: 600 });
    rotation.value = withTiming(0, { duration: 800, easing: Easing.elastic(1.2) });

    setTimeout(() => {
      badgeScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 500);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }]}));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }]}));

  // Calculate performance score (0-100)
  const score = Math.round((stats.correctAnswers / Math.max(1, stats.totalQuestions)) * 100);

  // Determine badge and message based on score
  let badge = {
    icon: Trophy,
    color: AppColors.gold, // Gold
    title: "Perfect!",
    message: "You're a language master!"};

  if (score < 100 && score >= 80) {
    badge = {
      icon: Award,
      color: "#C0C0C0", // Silver
      title: "Great Job!",
      message: "You're making excellent progress!"};
  } else if (score < 80 && score >= 60) {
    badge = {
      icon: Star,
      color: "#CD7F32", // Bronze
      title: "Good Work!",
      message: "Keep practicing to improve!"};
  } else if (score < 60) {
    badge = {
      icon: Lightbulb,
      color: themeColors["gray-500"], // Gray
      title: "Nice Try!",
      message: "Practice makes perfect!"};
  }

  const BadgeIcon = badge.icon;

  return (
    <View className="flex-1 items-center justify-center p-6 bg-white">
      <Animated.View
        style={containerStyle}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* Header with image */}
        <View className="w-full h-40 bg-primary/10 items-center justify-center">
          <ExpoImage
            source={{ uri: imageUrl }}
            className="w-28 h-28 rounded-full border-4 border-white"
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <Animated.View
            style={badgeStyle}
            className="absolute -bottom-6 bg-white rounded-full p-2 border-2"
          >
            <BadgeIcon size={32} color={badge.color} />
          </Animated.View>
        </View>

        {/* Content */}
        <View className="p-6 pt-10 items-center">
          <Text className="text-2xl font-bold text-primary mb-1">{badge.title}</Text>
          <Text className="text-gray-500 mb-6 text-center">{badge.message}</Text>

          {/* Stats */}
          <View className="w-full bg-gray-50 rounded-xl p-4 mb-6">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Score:</Text>
              <Text className="font-bold text-primary">{ `\${score}%` }</Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Correct Answers:</Text>
              <Text className="font-bold text-primary">
                {stats.correctAnswers}/{stats.totalQuestions}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Points Earned:</Text>
              <Text className="font-bold text-primary">{stats.points}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Best Streak:</Text>
              <Text className="font-bold text-primary">{ `\${stats.streak}x` }</Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="w-full flex-row space-x-3">
            <Button onPress={onGoHome} className="flex-1 bg-gray-200">
              <View className="flex-row items-center justify-center">
                <Home size={18} color={COLORS.darkGray} />
                <Text className="ml-2 text-gray-800 font-medium">Home</Text>
              </View>
            </Button>

            <Button
              onPress={onRestart}
              className="flex-1"
              style={{ backgroundColor: COLORS.primary }}
            >
              <View className="flex-row items-center justify-center">
                <RefreshCw size={18} color={COLORS.white} />
                <Text className="ml-2 text-white font-medium">Play Again</Text>
              </View>
            </Button>
          </View>
        </View>
      </Animated.View>

      {/* Confetti */}
      {Array.from({ length: 30 }).map((_, i) => {
        const colors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.lightGreen];
        return (
          <ConfettiPiece
            key={i}
            color={colors[i % colors.length]}
            size={Math.random() * 10 + 5}
            duration={Math.random() * 1000 + 1500}
            delay={Math.random() * 500}
            startX={Math.random() * Dimensions.get("window").width}
          />
        );
      })}
    </View>
  );
}
