import { AppText as Text } from '@/components/ui/AppText';
 
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  BackHandler,
  Platform} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Zap,
  Award,
  RotateCcw,
  Lightbulb,
  SkipForward,
  Sparkles,
  ShieldCheck,
  Eye,
  ChevronRight,
  ChevronLeft,
  Trophy} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import "nativewind";
import { router } from "expo-router";
import { ConfirmationModal } from "./slideshow/slideshow-components";

// Reanimated + Gestures
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  runOnJS} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
// ===== Types (kept intact) =====
type StreakData = {
  currentStreak: number;
  lastCompletedDate: string;
  totalQuizzesCompleted: number;
  bestScore: number;
};

type Term = {
  term: string;
  definition: string;
  image: string;
};

type Question = {
  id: string;
  type: "multipleChoice" | "trueFalse";
  question: string;
  options: string[];
  correctAnswer: string | boolean;
  image: string;
  selectedAnswer?: string | boolean;
  isCorrect?: boolean;
  explanation?: string;
  hint?: string;
  skipped?: boolean;
};

export default function QuizScreen({
  allTerms,
  onBack}: {
  allTerms: Term[];
  onBack?: () => void;
}) {
  // ======= Layout & Theme =======
  const { width, height } = useWindowDimensions();
  const isWide = width >= 768;
  const isTall = height > width;

  // Premium violet palette (NativeWind-friendly)
  const theme = useMemo(
    () => ({
      primary: themeColors["purple-dark"], // violet-600
      primaryDark: AppColors.purpleDeeper, // violet-700
      primarySoft: AppColors.violet50, // violet-50
      ring: AppColors.violet300, // violet-300
      success: AppColors.green600,
      error: themeColors["error"],
      amber: themeColors["warning"],
      text: themeColors["gray-900"],
      muted: themeColors["gray-500"],
      card: themeColors["white"],
      bg: themeColors["white"],
      softBg: AppColors.slate50}),
    []
  );

  // ======= State =======
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastCompletedDate: "",
    totalQuizzesCompleted: 0,
    bestScore: 0});

  const [isReviewMode, setIsReviewMode] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([]);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // ======= Power-ups (advanced features) =======
  const [powerups, setPowerups] = useState({
    fifty: 1, // 50/50 eliminate two wrong options
    peek: 1, // briefly reveal correct answer
    skip: 2, // skip question
  });
  const [hiddenOptions, setHiddenOptions] = useState<Record<string, number[]>>({}); // questionId -> hidden option indices
  const [peeked, setPeeked] = useState<Record<string, boolean>>({}); // questionId -> peek used

  // ======= Reanimated shared values =======
  const cardX = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const progressSV = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const timerSV = useSharedValue(1); // scale animation for timer when low

  // Mount animations
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    cardOpacity.value = withDelay(100, withTiming(1, { duration: 350 }));
  }, []);

  // Progress animated style
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(progressSV.value, [0, 100], [0, 100], Extrapolate.CLAMP)}%`,
      transform: [{ scaleX: withTiming(1, { duration: 250 }) }]};
  });

  // Card animated style
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: cardX.value }],
      opacity: cardOpacity.value};
  });

  // Header fade
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value}));

  // Timer bump when < 30s
  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerSV.value }]}));

  // Swipe gesture
  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      cardX.value = e.translationX;
    })
    .onEnd((e) => {
      const shouldNext = e.translationX < -80;
      const shouldPrev = e.translationX > 80;
      if (shouldNext) runOnJS(navigateTo)(Math.min(questions.length - 1, currentIndex + 1));
      else if (shouldPrev) runOnJS(navigateTo)(Math.max(0, currentIndex - 1));
      cardX.value = withSpring(0, { damping: 18, stiffness: 180 });
    });

  // ======= Init / Back handler =======
  useEffect(() => {
    const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowEndConfirmation(true);
      return true;
    });
    return () => backSub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cachedStreak = await AsyncStorage.getItem("streakData");
        if (cachedStreak) setStreakData(JSON.parse(cachedStreak));
      } catch {}
      await generateQuestions();
      setInitialLoading(false);
    })();
  }, [allTerms]);

  // ======= Timer =======
  useEffect(() => {
    if (isReviewMode || showResult) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit();
          return 0;
        }
        if (s === 30) {
          timerSV.value = withSpring(1.06);
          timerSV.value = withDelay(250, withSpring(1));
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isReviewMode, showResult]);

  // ======= Question generation (kept logic, improved stability) =======
  const generateQuestions = async () => {
    try {
      setLoading(true);

      const newQuestions: Question[] = allTerms.map((term, index) => {
        if (index % 2 === 0) {
          const options = new Set<string>([term.definition]);
          while (options.size < 4 && allTerms.length > 1) {
            const rnd = allTerms[Math.floor(Math.random() * allTerms.length)].definition;
            if (rnd !== term.definition) options.add(rnd);
          }
          return {
            id: `mc-${index}-${Date.now()}`,
            type: "multipleChoice",
            question: term.term,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            correctAnswer: term.definition,
            image: term.image,
            explanation: `"${term.term}" means "${term.definition}" in Finnish.`,
            hint: `Think airport vocab.`};
        } else {
          const isTrue = Math.random() < 0.5;
          let alt = term.definition;
          while (alt === term.definition && allTerms.length > 1) {
            const rnd = allTerms[Math.floor(Math.random() * allTerms.length)].definition;
            if (rnd !== term.definition) alt = rnd;
          }
          return {
            id: `tf-${index}-${Date.now()}`,
            type: "trueFalse",
            question: `${term.term} means "${isTrue ? term.definition : alt}" in Finnish.`,
            options: ["True", "False"],
            correctAnswer: isTrue,
            image: term.image,
            explanation: `"${term.term}" actually means "${term.definition}" in Finnish.`,
            hint: `Picture it in a terminal.`};
        }
      });

      setQuestions(newQuestions);
      setLoading(false);
      await AsyncStorage.setItem("cachedQuestions", JSON.stringify(newQuestions));
      // Mount progress bar
      progressSV.value = withTiming(0, { duration: 0 });
    } catch (e) {
      setLoading(false);
    }
  };

  // ======= Helpers =======
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIndex];

  const updateProgress = useCallback(
    (arr: Question[]) => {
      const answered = arr.filter((q) => q.selectedAnswer !== undefined).length;
      const pct = (answered / arr.length) * 100;
      setProgressPct(pct);
      progressSV.value = withTiming(pct, { duration: 250 });
    },
    [progressSV]
  );

  const handleAnswer = useCallback(
    (id: string, answer: string | boolean) => {
      if (!currentQuestion) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = questions.map((q) => (q.id === id ? { ...q, selectedAnswer: answer } : q));
      setQuestions(updated);
      updateProgress(updated);

      // Slide to next with delight
      if (!isReviewMode) {
        cardOpacity.value = withTiming(0.96, { duration: 120 }, () => {
          runOnJS(setCurrentIndex)(Math.min(questions.length - 1, currentIndex + 1));
          cardOpacity.value = withDelay(40, withTiming(1, { duration: 220 }));
        });
      }
    },
    [questions, currentIndex, isReviewMode, currentQuestion]
  );

  const navigateTo = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      const dir = idx > currentIndex ? -1 : 1;
      cardX.value = withTiming(50 * dir, { duration: 120 }, () => {
        runOnJS(setCurrentIndex)(idx);
        cardX.value = withTiming(-40 * dir, { duration: 0 }, () => {
          cardX.value = withSpring(0, { damping: 18, stiffness: 200 });
        });
      });
    },
    [currentIndex]
  );

  const computeResults = (arr: Question[]) => {
    const marked = arr.map((q) => {
      if (q.selectedAnswer === undefined) return { ...q, skipped: true };
      const isCorrect =
        q.type === "trueFalse"
          ? q.selectedAnswer === q.correctAnswer
          : q.selectedAnswer === q.correctAnswer;
      return { ...q, isCorrect };
    });
    const skipped = marked.map((q, i) => (q.skipped ? i : -1)).filter((i) => i !== -1);
    const totalScore = marked.filter((q) => q.isCorrect).length;
    return { marked, skipped, totalScore };
  };

  const handleSubmit = useCallback(async () => {
    const { marked, skipped, totalScore } = computeResults(questions);
    setQuestions(marked);
    setSkippedQuestions(skipped);
    setScore(totalScore);

    // Streaks
    try {
      const today = new Date().toISOString().split("T")[0];
      const next = { ...streakData };
      if (next.lastCompletedDate !== today) {
        next.currentStreak += 1;
        next.lastCompletedDate = today;
      }
      next.totalQuizzesCompleted += 1;
      next.bestScore = Math.max(next.bestScore, totalScore);
      setStreakData(next);
      await AsyncStorage.setItem("streakData", JSON.stringify(next));
    } catch {}

    // Reveal result
    cardOpacity.value = withTiming(0.9, { duration: 200 }, () => {
      runOnJS(setShowResult)(true);
      cardOpacity.value = withTiming(1, { duration: 0 });
    });
  }, [questions, streakData]);

  const resetQuiz = useCallback(() => {
    setLoading(true);
    setScore(0);
    setShowResult(false);
    setProgressPct(0);
    setTimeLeft(300);
    setCurrentIndex(0);
    setIsReviewMode(false);
    setSkippedQuestions([]);
    setPowerups({ fifty: 1, peek: 1, skip: 2 });
    setHiddenOptions({});
    setPeeked({});
    generateQuestions();
  }, []);

  const enterReviewMode = useCallback(() => {
    setIsReviewMode(true);
    setShowResult(false);
    setCurrentIndex(0);
  }, []);

  // ======= Power-ups handlers =======
  const useFifty = () => {
    if (!currentQuestion || powerups.fifty <= 0 || currentQuestion.type !== "multipleChoice")
      return;
    const correct = currentQuestion.correctAnswer as string;
    const correctIdx = currentQuestion.options.findIndex((o) => o === correct);
    const wrongIndices = currentQuestion.options
      .map((o, i) => ({ o, i }))
      .filter(({ i }) => i !== correctIdx)
      .map(({ i }) => i);
    // Randomly hide two wrongs
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions((prev) => ({ ...prev, [currentQuestion.id]: shuffled }));
    setPowerups((p) => ({ ...p, fifty: p.fifty - 1 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const usePeek = () => {
    if (!currentQuestion || powerups.peek <= 0) return;
    setPeeked((p) => ({ ...p, [currentQuestion.id]: true }));
    setPowerups((p) => ({ ...p, peek: p.peek - 1 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // auto-remove peek after 1.2s
    setTimeout(() => {
      setPeeked((p) => ({ ...p, [currentQuestion.id]: false }));
    }, 1200);
  };

  const useSkip = () => {
    if (!currentQuestion || powerups.skip <= 0) return;
    setPowerups((p) => ({ ...p, skip: p.skip - 1 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigateTo(Math.min(questions.length - 1, currentIndex + 1));
  };

  // ======= UI bits =======
  const Header = () => (
    <Animated.View
      style={headerStyle}
      className="px-4 pt-4 pb-3 flex-row items-center justify-between"
    >
      <View className="flex-row items-center">
        <Pressable
          onPress={() => (onBack ? onBack() : router.back())}
          className="p-2 rounded-full bg-violet-50 border border-violet-200 mr-2"
        >
          <ArrowLeft size={22} color={theme.primary} />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Language Quiz</Text>
      </View>
      {!isReviewMode && !showResult && (
        <Animated.View
          style={timerStyle}
          className="flex-row items-center bg-violet-50 px-3 py-1 rounded-full"
        >
          <Clock size={14} color={theme.primary} />
          <Text className="ml-1 font-mono text-sm" style={{ color: theme.primary }}>
            {formatTime(timeLeft)}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  const ProgressBar = () => (
    <View className="px-4">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500">Progress</Text>
        <Text className="text-xs text-gray-500">{ `\${Math.round(progressPct)}%` }</Text>
      </View>
      <View className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <Animated.View
          className="h-full rounded-full"
          style={[progressStyle, { backgroundColor: theme.primary }]}
        />
      </View>
    </View>
  );

  const PowerupsBar = () => {
    if (isReviewMode || showResult) return null;
    return (
      <View className="px-4 mt-3 flex-row items-center justify-between">
        <Pressable
          onPress={useFifty}
          disabled={powerups.fifty <= 0 || currentQuestion?.type !== "multipleChoice"}
          className={`px-3 py-2 rounded-xl border flex-row items-center ${
            powerups.fifty <= 0 || currentQuestion?.type !== "multipleChoice"
              ? "opacity-40 border-gray-200 bg-gray-50"
              : "border-violet-200 bg-violet-50"
          }`}
        >
          <ShieldCheck size={16} color={theme.primary} />
          <Text className="ml-2 font-medium text-violet-700">50/50</Text>
          <Text className="ml-2 px-1.5 py-0.5 text-xs rounded bg-white text-violet-700 border border-violet-200">
            {powerups.fifty}
          </Text>
        </Pressable>

        <Pressable
          onPress={usePeek}
          disabled={powerups.peek <= 0}
          className={`px-3 py-2 rounded-xl border flex-row items-center ${
            powerups.peek <= 0
              ? "opacity-40 border-gray-200 bg-gray-50"
              : "border-violet-200 bg-violet-50"
          }`}
        >
          <Eye size={16} color={theme.primary} />
          <Text className="ml-2 font-medium text-violet-700">Peek</Text>
          <Text className="ml-2 px-1.5 py-0.5 text-xs rounded bg-white text-violet-700 border border-violet-200">
            {powerups.peek}
          </Text>
        </Pressable>

        <Pressable
          onPress={useSkip}
          disabled={powerups.skip <= 0}
          className={`px-3 py-2 rounded-xl border flex-row items-center ${
            powerups.skip <= 0
              ? "opacity-40 border-gray-200 bg-gray-50"
              : "border-violet-200 bg-violet-50"
          }`}
        >
          <SkipForward size={16} color={theme.primary} />
          <Text className="ml-2 font-medium text-violet-700">Skip</Text>
          <Text className="ml-2 px-1.5 py-0.5 text-xs rounded bg-white text-violet-700 border border-violet-200">
            {powerups.skip}
          </Text>
        </Pressable>
      </View>
    );
  };

  const OptionItem = React.memo(function OptionItem({
    label,
    selected,
    correct,
    disabled,
    onPress,
    hidden,
    peekHighlight}: {
    label: string;
    selected: boolean;
    correct?: boolean;
    disabled?: boolean;
    onPress: () => void;
    hidden?: boolean;
    peekHighlight?: boolean;
  }) {
    const localOpacity = useSharedValue(hidden ? 0 : 1);
    useEffect(() => {
      localOpacity.value = withTiming(hidden ? 0 : 1, { duration: 150 });
    }, [hidden]);

    const aStyle = useAnimatedStyle(() => ({
      opacity: localOpacity.value,
      transform: [{ scale: withTiming(selected ? 1.02 : 1, { duration: 120 }) }]}));

    const ring =
      selected && correct === true
        ? "ring-2 ring-green-300"
        : selected && correct === false
          ? "ring-2 ring-red-300"
          : peekHighlight
            ? "ring-2 ring-violet-300"
            : "ring-1 ring-gray-200";

    const bg =
      selected && correct === true
        ? "bg-green-50"
        : selected && correct === false
          ? "bg-red-50"
          : peekHighlight
            ? "bg-violet-50"
            : "bg-white";

    const textColor =
      selected && correct === true
        ? "text-green-700"
        : selected && correct === false
          ? "text-red-700"
          : "text-gray-800";

    return (
      <Animated.View style={aStyle}>
        <Pressable
          disabled={disabled || hidden}
          onPress={onPress}
          className={`px-4 py-3 rounded-2xl ${ring} ${bg} mb-3`}
          android_ripple={{ color: "#DDD" }}
        >
          <Text className={`text-base font-medium ${textColor}`} numberOfLines={3}>
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  });

  const QuestionCard = () => {
    if (!currentQuestion) return null;

    const hiddenIdx = hiddenOptions[currentQuestion.id] ?? [];
    const showPeek = !!peeked[currentQuestion.id];

    const selectedValue = currentQuestion.selectedAnswer;
    const isTF = currentQuestion.type === "trueFalse";
    const correctValue = currentQuestion.correctAnswer;

    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle} className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Chip + Type */}
            <View className="bg-white rounded-2xl p-4 border border-violet-100">
              <View className="flex-row justify-between items-center mb-2">
                <View className="px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
                  <Text className="text-xs font-semibold text-violet-700">
                    Question {currentIndex + 1} / {questions.length}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500">
                  {isTF ? "True/False" : "Multiple Choice"}
                </Text>
              </View>

              <Text className="text-lg font-bold text-gray-900">{currentQuestion.question}</Text>
            </View>

            {/* Image */}
            <View className="mt-3 rounded-2xl overflow-hidden border border-gray-100 bg-gray-100">
              <ExpoImage
                source={{
                  uri: currentQuestion.image?.startsWith("http://")
                    ? currentQuestion.image.replace("http://", "https://")
                    : currentQuestion.image}}
                className={`${isWide ? "h-56" : "h-44"} w-full`}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            </View>

            {/* Options */}
            <View className={`mt-3 ${isWide ? "flex-row flex-wrap -mx-2" : ""}`}>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedValue === (isTF ? (opt === "True" ? true : false) : opt);
                // Answer state only when reviewing or after submit
                const showTruth = isReviewMode || showResult;
                const isCorrect = showTruth
                  ? isTF
                    ? (currentQuestion.correctAnswer as boolean) === (opt === "True")
                    : (currentQuestion.correctAnswer as string) === opt
                  : undefined;

                const hidden = hiddenIdx.includes(idx);
                const peekHighlight =
                  showPeek &&
                  (isTF
                    ? (currentQuestion.correctAnswer as boolean) === (opt === "True")
                    : (currentQuestion.correctAnswer as string) === opt);

                return (
                  <View key={idx} className={`${isWide ? "w-1/2 px-2" : ""}`}>
                    <OptionItem
                      label={opt}
                      selected={!!isSelected}
                      correct={isCorrect}
                      hidden={hidden}
                      peekHighlight={peekHighlight}
                      onPress={() =>
                        handleAnswer(
                          currentQuestion.id,
                          isTF ? (opt === "True" ? true : false) : opt
                        )
                      }
                    />
                  </View>
                );
              })}
            </View>

            {/* Hint */}
            {!showResult && (
              <HintBlock
                hint={currentQuestion.hint ?? "Think context clues."}
                primary={theme.primary}
              />
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    );
  };

  const HintBlock = ({ hint, primary }: { hint: string; primary: string }) => {
    const [open, setOpen] = useState(false);
    const h = useSharedValue(0);
    const o = useSharedValue(0);

    const aStyle = useAnimatedStyle(() => ({
      height: h.value,
      opacity: o.value}));

    const toggle = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setOpen((v) => !v);
      if (!open) {
        h.value = withTiming(70, { duration: 220 });
        o.value = withTiming(1, { duration: 220 });
      } else {
        h.value = withTiming(0, { duration: 180 });
        o.value = withTiming(0, { duration: 160 });
      }
    };

    return (
      <View className="mt-2">
        <Pressable
          onPress={toggle}
          className="self-center flex-row items-center px-3 py-2 rounded-xl bg-violet-50 border border-violet-200"
        >
          <Lightbulb size={16} color={primary} />
          <Text className="ml-2 text-sm font-semibold text-violet-700">
            {open ? "Hide Hint" : "Show Hint"}
          </Text>
        </Pressable>
        <Animated.View style={aStyle} className="overflow-hidden mt-2">
          <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Text className="text-amber-800 text-sm">{hint}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  // ======= Result Screen =======
  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="mt-3 text-gray-600">Preparing your premium session…</Text>
      </View>
    );
  }

  if (showResult) {
    const correct = questions.filter((q) => q.isCorrect).length;
    const pct = (correct / questions.length) * 100;
    let color = theme.primary;
    let title = "Great job! 🎉";
    if (pct < 60) {
      color = themeColors["orange"];
      title = "Keep practicing! 💪";
    } else if (pct < 80) {
      color = AppColors.sky500;
      title = "Well done! 👏";
    }
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        {onBack && (
          <Pressable
            onPress={onBack}
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white border border-gray-200"
          >
            <ArrowLeft size={22} color={theme.primary} />
          </Pressable>
        )}

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="items-center">
            <View className="bg-violet-50 p-6 rounded-full mb-6 border border-violet-200">
              <Trophy width={64} height={64} color={color} />
            </View>
            <Text className="text-2xl font-extrabold text-center">{title}</Text>
            <Text className="text-5xl font-extrabold mt-2" style={{ color }}>
              {score} / {questions.length}
            </Text>
            <Text className="text-gray-500 mt-2">{ `\${Math.round(pct)}% Correct` }</Text>
            <Text className="text-gray-500 mb-8">{ `Time: \${formatTime(300 - timeLeft)}` }</Text>

            {/* Stats */}
            <View className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8">
              <Text className="text-lg font-semibold mb-4">Your Learning Stats</Text>
              <View className="flex-row justify-between">
                <Stat
                  icon={<Zap size={22} color={themeColors["purple-dark"]} />}
                  label="Day Streak"
                  value={streakData.currentStreak}
                />
                <Stat
                  icon={<Award size={22} color={themeColors["purple-dark"]} />}
                  label="Best Score"
                  value={streakData.bestScore}
                />
                <Stat
                  icon={<BookOpen size={22} color={themeColors["purple-dark"]} />}
                  label="Quizzes"
                  value={streakData.totalQuizzesCompleted}
                />
              </View>
            </View>

            {/* Summary Pills */}
            <View className="w-full mb-8">
              <Text className="text-lg font-semibold mb-3">Question Summary</Text>
              <View className="flex-row flex-wrap">
                {questions.map((q, i) => (
                  <View key={q.id} className="w-1/5 items-center mb-4">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        q.skipped ? "bg-amber-100" : q.isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {q.skipped ? (
                        <SkipForward size={18} color={theme.amber} />
                      ) : q.isCorrect ? (
                        <CheckCircle2 size={18} color={theme.success} />
                      ) : (
                        <XCircle size={18} color={theme.error} />
                      )}
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">{i + 1}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View className="w-full flex-row">
              <Pressable
                onPress={enterReviewMode}
                className="flex-1 mr-2 bg-white px-4 py-4 rounded-2xl border border-gray-200 flex-row items-center justify-center"
              >
                <BookOpen size={18} color={themeColors["gray-700"]} />
                <Text className="ml-2 font-semibold text-gray-800">Review</Text>
              </Pressable>
              <Pressable
                onPress={resetQuiz}
                className="flex-1 ml-2 px-4 py-4 rounded-2xl flex-row items-center justify-center bg-violet-600"
              >
                <RotateCcw size={18} color="#fff" />
                <Text className="ml-2 font-semibold text-white">Try Again</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderReviewBanner = () =>
    isReviewMode ? (
      <View className="bg-amber-50 px-4 py-3 flex-row items-center justify-between border-b border-amber-200">
        <View className="flex-row items-center">
          <BookOpen size={18} color={themeColors["warning-dark"]} />
          <Text className="ml-2 font-medium text-amber-700">Review Mode</Text>
        </View>
        <Pressable
          onPress={() => setShowResult(true)}
          className="bg-amber-100 px-3 py-1 rounded-lg"
        >
          <Text className="text-amber-700 font-medium">Exit Review</Text>
        </Pressable>
      </View>
    ) : null;

  if (loading || !currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" key={`quiz-${allTerms.length}`}>
      <StatusBar style="dark" />
      {renderReviewBanner()}
      <Header />
      <ProgressBar />
      <PowerupsBar />

      {/* Main */}
      <View className="flex-1 bg-slate-50 mt-3">
        <QuestionCard />
      </View>

      {/* Footer actions */}
      <View className="p-3 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between mb-3">
          <Pressable
            onPress={() => navigateTo(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className={`px-3 py-2 rounded-xl flex-row items-center border ${
              currentIndex === 0
                ? "opacity-40 border-gray-200 bg-gray-50"
                : "border-violet-200 bg-violet-50"
            }`}
          >
            <ChevronLeft size={18} color={theme.primary} />
            <Text className="font-medium ml-1 text-sm text-violet-700">Previous</Text>
          </Pressable>

          <Pressable
            onPress={() => navigateTo(Math.min(questions.length - 1, currentIndex + 1))}
            disabled={currentIndex === questions.length - 1}
            className={`px-3 py-2 rounded-xl flex-row items-center border ${
              currentIndex === questions.length - 1
                ? "opacity-40 border-gray-200 bg-gray-50"
                : "border-violet-200 bg-violet-50"
            }`}
          >
            <Text className="font-medium mr-1 text-sm text-violet-700">Next</Text>
            <ChevronRight size={18} color={theme.primary} />
          </Pressable>
        </View>

        {isReviewMode ? (
          <Pressable
            onPress={() => setShowResult(true)}
            className="p-3 rounded-2xl flex-row items-center justify-center bg-violet-600"
          >
            <Text className="text-center font-semibold text-white mr-2">Back to Results</Text>
            <Sparkles size={18} color="#fff" />
          </Pressable>
        ) : progressPct >= 100 ? (
          <Pressable onPress={handleSubmit} className="p-3 rounded-2xl bg-violet-600">
            <Text className="text-center font-semibold text-white">Submit Quiz</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit}
            className="p-3 rounded-2xl border border-violet-300 bg-violet-50"
          >
            <Text className="text-center font-semibold text-violet-700">End Session</Text>
          </Pressable>
        )}
      </View>

      <ConfirmationModal
        visible={showEndConfirmation}
        onConfirm={() => router.back()}
        onCancel={() => setShowEndConfirmation(false)}
        title="End Test?"
        message="Are you sure you want to end the Test session? Your progress will be saved."
      />
    </SafeAreaView>
  );
}

// ===== Small stat component =====
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View className="items-center">
      <View className="w-12 h-12 rounded-full items-center justify-center bg-violet-50 border border-violet-200 mb-2">
        {icon}
      </View>
      <Text className="text-xl font-extrabold text-violet-700">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
