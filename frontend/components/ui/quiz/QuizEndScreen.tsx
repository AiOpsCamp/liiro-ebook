import { AppText as Text } from '@/components/ui/AppText';
import { memo, useState, useEffect } from "react";
import { View, Pressable, Modal, Animated, ScrollView, Dimensions } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Trophy, Star, Target } from "lucide-react-native";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
const { width } = Dimensions.get("window");

const COLORS = {
  sunbeam: themeColors["sunbeam"],
  lemonLeaf: themeColors["lemon-leaf"],
  meadowGreen: themeColors["meadow-green"],
  forestCore: themeColors["forest-core"],
  white: themeColors["white"],
  success: themeColors["success"],
  error: themeColors["error"],
  warning: themeColors["warning"],
  gray: {
    50: themeColors["gray-50"],
    100: themeColors["gray-100"],
    200: themeColors["gray-200"],
    300: themeColors["gray-300"],
    400: themeColors["gray-400"],
    500: themeColors["gray-500"],
    600: themeColors["gray-600"],
    700: themeColors["gray-700"],
    800: themeColors["gray-800"],
    900: themeColors["gray-900"]}};

interface QuizEndScreenProps {
  visible: boolean;
  onRestart: () => void;
  onExit: () => void;
  currentSession: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    questionsAnswered: number;
  };
  lifetimeStats?: {
    totalSessions: number;
    bestScore: number;
    averageAccuracy: number;
    streakDays: number;
  };
}

export const QuizEndScreen = memo<QuizEndScreenProps>(
  ({ visible, onRestart, onExit, currentSession, lifetimeStats }) => {
    const [scaleAnim] = useState(() => new Animated.Value(0));
    const [fadeAnim] = useState(() => new Animated.Value(0));
    const [celebrationAnim] = useState(() => new Animated.Value(0));
    const [statsAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
      if (visible) {
        // Start celebration animation
        const celebrationLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(celebrationAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true}),
            Animated.timing(celebrationAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true}),
          ])
        );
        celebrationLoop.start();

        // Main entrance animation
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 40}),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true}),
        ]).start();

        // Staggered stats animation
        setTimeout(() => {
          Animated.spring(statsAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 50}).start();
        }, 300);

        return () => {
          celebrationLoop.stop();
        };
      } else {
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);
        statsAnim.setValue(0);
        celebrationAnim.stopAnimation();
        celebrationAnim.setValue(0);
      }
    }, [visible, scaleAnim, fadeAnim, celebrationAnim, statsAnim]);

    const accuracy =
      currentSession.totalQuestions > 0
        ? Math.round((currentSession.correctAnswers / currentSession.totalQuestions) * 100)
        : 0;

    const getPerformanceMessage = () => {
      if (accuracy >= 90)
        return { message: "Outstanding Performance!", color: COLORS.success, icon: "emoji-events" };
      if (accuracy >= 75) return { message: "Great Job!", color: COLORS.warning, icon: "star" };
      if (accuracy >= 60)
        return { message: "Good Effort!", color: COLORS.meadowGreen, icon: "thumb-up" };
      return { message: "Keep Practicing!", color: COLORS.forestCore, icon: "trending-up" };
    };

    const performance = getPerformanceMessage();

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onExit}>
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
              width: width * 0.9,
              maxWidth: 400}}
          >
            <ScrollView
              className="max-h-[80vh]"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 20 }}
            >
              <View
                className="bg-white rounded-3xl overflow-hidden"
                style={{
                  shadowColor: COLORS.gray[400],
                  shadowOffset: { width: 0, height: 20 },
                  shadowOpacity: 0.3,
                  shadowRadius: 25,
                  elevation: 20}}
              >
                {/* Main Stats */}
                <View className="p-6">
                  <Animated.View
                    className="flex-row justify-between mb-6 p-6 rounded-2xl"
                    style={{
                      backgroundColor: `${COLORS.forestCore}10`,
                      transform: [{ scale: statsAnim }],
                      opacity: statsAnim}}
                  >
                    <View className="items-center flex-1">
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-2"
                        style={{ backgroundColor: `${COLORS.success}20` }}
                      >
                        <Text className="text-2xl font-bold" style={{ color: COLORS.success }}>
                          {currentSession.score}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
                        Correct
                      </Text>
                    </View>

                    <View className="items-center flex-1">
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-2"
                        style={{ backgroundColor: `${COLORS.forestCore}20` }}
                      >
                        <Text className="text-2xl font-bold" style={{ color: COLORS.forestCore }}>
                          {currentSession.totalQuestions}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
                        Total
                      </Text>
                    </View>

                    <View className="items-center flex-1">
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-2"
                        style={{ backgroundColor: `${COLORS.warning}20` }}
                      >
                        <Text className="text-2xl font-bold" style={{ color: COLORS.warning }}>
                          {accuracy}%
                        </Text>
                      </View>
                      <Text className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
                        Accuracy
                      </Text>
                    </View>
                  </Animated.View>

                  {/* Achievement Badge */}
                  <Animated.View
                    className="p-4 rounded-2xl mb-6 flex-row items-center justify-center"
                    style={{
                      backgroundColor: `${COLORS.lemonLeaf}30`,
                      transform: [
                        {
                          translateY: statsAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]})},
                      ],
                      opacity: statsAnim}}
                  >
                    <Star size={24} color={COLORS.forestCore} />
                    <Text className="font-bold ml-2 text-lg" style={{ color: COLORS.forestCore }}>
                      Quiz Master Achievement!
                    </Text>
                  </Animated.View>

                  {/* Lifetime Stats */}
                  {lifetimeStats && (
                    <Animated.View
                      className="mb-6"
                      style={{
                        transform: [
                          {
                            translateY: statsAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0]})},
                        ],
                        opacity: statsAnim}}
                    >
                      <Text className="text-lg font-bold mb-4" style={{ color: COLORS.forestCore }}>
                        Your Progress
                      </Text>
                      <View className="flex-row flex-wrap justify-between">
                        <View
                          className="w-[48%] p-4 rounded-2xl mb-3"
                          style={{ backgroundColor: `${COLORS.meadowGreen}20` }}
                        >
                          <View className="flex-row items-center mb-2">
                            <MaterialCommunityIcons
                              name="trophy-outline"
                              size={20}
                              color={COLORS.forestCore}
                            />
                            <Text className="font-medium ml-2" style={{ color: COLORS.gray[700] }}>
                              Best Score
                            </Text>
                          </View>
                          <Text className="text-xl font-bold" style={{ color: COLORS.forestCore }}>
                            {lifetimeStats.bestScore}
                          </Text>
                        </View>

                        <View
                          className="w-[48%] p-4 rounded-2xl mb-3"
                          style={{ backgroundColor: `${COLORS.sunbeam}20` }}
                        >
                          <View className="flex-row items-center mb-2">
                            <Target size={20} color={COLORS.forestCore} />
                            <Text className="font-medium ml-2" style={{ color: COLORS.gray[700] }}>
                              Avg Accuracy
                            </Text>
                          </View>
                          <Text className="text-xl font-bold" style={{ color: COLORS.forestCore }}>
                            {Math.round(lifetimeStats.averageAccuracy)}%
                          </Text>
                        </View>

                        <View
                          className="w-[48%] p-4 rounded-2xl"
                          style={{ backgroundColor: `${COLORS.lemonLeaf}20` }}
                        >
                          <View className="flex-row items-center mb-2">
                            <MaterialIcons name="quiz" size={20} color={COLORS.forestCore} />
                            <Text className="font-medium ml-2" style={{ color: COLORS.gray[700] }}>
                              Sessions
                            </Text>
                          </View>
                          <Text className="text-xl font-bold" style={{ color: COLORS.forestCore }}>
                            {lifetimeStats.totalSessions}
                          </Text>
                        </View>

                        <View
                          className="w-[48%] p-4 rounded-2xl"
                          style={{ backgroundColor: `${COLORS.success}20` }}
                        >
                          <View className="flex-row items-center mb-2">
                            <MaterialCommunityIcons
                              name="fire"
                              size={20}
                              color={COLORS.forestCore}
                            />
                            <Text className="font-medium ml-2" style={{ color: COLORS.gray[700] }}>
                              Streak
                            </Text>
                          </View>
                          <Text className="text-xl font-bold" style={{ color: COLORS.forestCore }}>
                            {lifetimeStats.streakDays} days
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  )}

                  {/* Action Buttons */}
                  <Animated.View
                    className="gap-y-4"
                    style={{
                      transform: [
                        {
                          translateY: statsAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [40, 0]})},
                      ],
                      opacity: statsAnim}}
                  >
                    <Pressable
                      className="p-5 rounded-2xl items-center"
                      style={{
                        backgroundColor: COLORS.forestCore,
                        shadowColor: COLORS.forestCore,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4}}
                      onPress={onRestart}
                    >
                      <View className="flex-row items-center">
                        <MaterialIcons name="refresh" size={24} color={COLORS.white} />
                        <Text className="text-white font-bold text-lg ml-2">Play Again</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      className="p-5 rounded-2xl items-center border-2"
                      style={{
                        backgroundColor: COLORS.white,
                        borderColor: COLORS.gray[300]}}
                      onPress={onExit}
                    >
                      <View className="flex-row items-center">
                        <MaterialIcons name="home" size={24} color={COLORS.gray[700]} />
                        <Text
                          className="font-bold text-lg ml-2"
                          style={{ color: COLORS.gray[700] }}
                        >
                          Back
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

QuizEndScreen.displayName = "QuizEndScreen";
