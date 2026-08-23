import { AppText as Text } from '@/components/ui/AppText';
import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Pressable,
  useWindowDimensions,
  BackHandler,
  StyleSheet,
  Switch,
  Platform
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  Volume2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Type,
  Music,
  Settings as SettingsIcon,
  Hourglass,
  Home,
  CheckCircle2,
  Trophy
} from "lucide-react-native";
import { useAudioPlayer } from "expo-audio";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  runOnJS,
  runOnUI,
  cancelAnimation,
  Easing,
  SharedValue,
  ZoomIn,
  useAnimatedStyle,
  withSequence,
  withSpring
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router, useNavigation } from "expo-router";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  setTimerDuration,
  setFontSizeScale,
  toggleAutoPlayAudio,
  toggleAutoPlayOnMount
} from "@/redux/features/slideshowSettingSlice";
import { cn } from "@/lib/utils";
import ResponsiveSheet from "@/components/ui/shared/ResponsiveSheet";
import ExitModal from "../smart-learn/shared/ExitModal";
import ExampleCard from "../smart-learn/shared/ExampleCard";
import { Image as ExpoImage } from "expo-image";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
// --- Types ---
interface Progress {
  confidence: number;
  isLearned: boolean;
}
interface Example {
  sentence: string;
  meaning: string;
  audio: string;
}
interface VocabularyItem {
  id: string;
  term: string;
  definition: string;
  examples: Example[];
  image: string;
  type: string;
  audio: string;
  progress: Progress;
}
interface SlideshowProps {
  data: VocabularyItem[];
  timeLimit?: number; // 0 = Unlimited
  autoEndSession?: boolean;
  onTimeExpire?: () => void;
  onProgressUpdate?: (viewedCount: number) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SessionEndScreen = ({ onExit }: { onExit: () => void }) => {
  return (
    <Animated.View
      entering={FadeIn.duration(800)}
      style={{ flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.darkPlum }}
    >
      <LinearGradient
        colors={[AppColors.violet950, AppColors.darkPlum]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View className="w-full max-w-md items-center px-6" style={{ width: "100%", maxWidth: 440, alignItems: "center", paddingHorizontal: 24 }}>
        <Animated.View
          entering={ZoomIn.delay(200).springify()}
          className="mb-8 p-8 bg-white/5 rounded-full border border-white/10 shadow-2xl shadow-violet-500/50"
          style={{
            marginBottom: 32,
            padding: 32,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.12)",
          }}
        >
          <Hourglass size={64} color={AppColors.violet400} />
        </Animated.View>
        <Text className="text-white font-black text-3xl mb-2 text-center tracking-tight" style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 28, marginBottom: 8, textAlign: "center" }}>
          Time Limit Exceeded
        </Text>
        <Text className="text-violet-200/60 text-base mb-12 text-center font-medium" style={{ color: "rgba(221, 214, 254, 0.7)", fontSize: 16, marginBottom: 48, textAlign: "center" }}>
          You have reached the time limit for this practice session. Great effort!
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
            onExit();
          }}
          className="flex-row items-center justify-center w-full bg-violet-600 px-8 py-4 rounded-2xl shadow-lg shadow-violet-600/40 active:scale-95 transition-all"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "#7C3AED",
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 16,
          }}
        >
          <Home color="white" size={20} style={{ marginRight: 10 }} />
          <Text className="text-white font-bold text-lg uppercase tracking-wider" style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 18 }}>Back to Home</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const SessionCompletedScreen = ({
  onExit,
  totalCount }: {
    onExit: () => void;
    totalCount: number;
  }) => {
  return (
    <Animated.View
      entering={FadeIn.duration(800)}
      style={{ flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#05180f' }}
    >
      <LinearGradient
        colors={[AppColors.emerald900, AppColors.emeraldDeepest, "#000"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View className="w-full max-w-md items-center px-6" style={{ width: "100%", maxWidth: 440, alignItems: "center", paddingHorizontal: 24 }}>
        <Animated.View entering={ZoomIn.delay(200).springify()} className="mb-8 relative" style={{ marginBottom: 32, position: "relative" }}>
          <View className="absolute -inset-4 bg-emerald-500/20 blur-xl rounded-full" style={{ position: "absolute", top: -16, bottom: -16, left: -16, right: -16, backgroundColor: "rgba(16, 185, 129, 0.2)", borderRadius: 9999 }} />
          <View className="p-8 bg-white/5 rounded-full border border-white/10 shadow-2xl shadow-emerald-500/50" style={{ padding: 32, backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: 9999, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.12)" }}>
            <Trophy size={64} color={AppColors.amber400} fill={AppColors.amber400} />
          </View>
          <View className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-full border-4 border-[#022c22]" style={{ position: "absolute", bottom: -8, right: -8, backgroundColor: "#10B981", padding: 8, borderRadius: 9999, borderWidth: 4, borderColor: "#022c22" }}>
            <CheckCircle2 size={24} color="white" />
          </View>
        </Animated.View>
        <Text className="font-black text-3xl mb-2 text-center tracking-tight text-emerald-50" style={{ color: "#ECFDF5", fontWeight: "900", fontSize: 28, marginBottom: 8, textAlign: "center" }}>
          Session Completed!
        </Text>
        <Text className="text-emerald-200/60 text-base mb-12 text-center font-medium">
          You&apos;ve successfully reviewed all {totalCount} terms. Excellent work!
        </Text>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            onExit();
          }}
          className="flex-row items-center justify-center w-full bg-emerald-600 px-8 py-4 rounded-2xl shadow-lg shadow-emerald-600/40 active:scale-95 transition-all"
        >
          <Home color="white" size={20} style={{ marginRight: 10 }} />
          <Text className="text-white font-bold text-lg uppercase tracking-wider">Finish</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const TimerBadge = ({ totalTime, remainingTime }: { totalTime: number; remainingTime: number }) => {
  if (totalTime === 0) return null;
  const progressPercent = (remainingTime / totalTime) * 100;
  const isUrgent = remainingTime < 20;
  const fillWidth = `${progressPercent}%`;

  return (
    <View className="absolute top-14 left-0 right-0 items-center z-50 pointer-events-none">
      <View className="h-9 min-w-[110px] rounded-full overflow-hidden flex-row items-center justify-center relative border border-white/10 bg-black/40 backdrop-blur-md" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
        <View
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: fillWidth as `${number}%`,
            backgroundColor: isUrgent ? "rgba(220, 38, 38, 0.5)" : "rgba(255, 139, 90, 0.5)"
          }}
        />
        <View className="flex-row items-center px-4 z-10">
          <Clock size={14} color={isUrgent ? AppColors.errorBorderLight : AppColors.violet200} style={{ marginRight: 6 }} />
          <Text
            className={`font-bold font-mono text-sm ${isUrgent ? "text-red-100" : "text-violet-50"}`}
          >
            {formatTime(remainingTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const PlayButton = ({
  isPlaying,
  togglePlay,
  progress,
  compact = false }: {
    isPlaying: boolean;
    togglePlay: () => void;
    progress: SharedValue<number>;
    compact?: boolean;
  }) => {
  const size = compact ? 68 : 80;
  const radius = compact ? 26 : 32;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return { strokeDashoffset };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => { });
          togglePlay();
        }}
        style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      >
        {/* Background ring */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={AppColors.violet950}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>

        {/* Progress ring */}
        <Svg
          width={size}
          height={size}
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: "-90deg" }] }]}
        >
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={AppColors.violet400}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>

        {/* Center button (no offsets) */}
        <View
          style={{
            width: compact ? 54 : 64,
            height: compact ? 54 : 64,
            borderRadius: compact ? 27 : 32,
            backgroundColor: themeColors["purple-dark"],
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.10)"
          }}
        >
          {isPlaying ? (
            <Pause size={compact ? 22 : 28} color="white" fill="white" />
          ) : (
            <Play size={compact ? 22 : 28} color="white" fill="white" />
          )}
        </View>
      </Pressable>
    </View>
  );
};

const AudioButton = ({
  url,
  style = "default",
  autoPlay = false,
  isActiveSlide = false }: {
    url: string;
    size?: number;
    style?: "default" | "mini" | "hero";
    autoPlay?: boolean;
    isActiveSlide?: boolean;
  }) => {
  const player = useAudioPlayer(url);

  const [isPlaying, setIsPlaying] = useState(false);
  const scale = useSharedValue(1);

  // Autoplay / stop on slide activation changes
  useEffect(() => {
    let t: any;

    if (!player) return;

    if (isActiveSlide && autoPlay) {
      t = setTimeout(() => {
        try {
          const s = player.seekTo(0);
          if (s && typeof (s as any).catch === "function") (s as any).catch(() => {});
          const p = player.play();
          if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
          setIsPlaying(true);
        } catch { }
      }, 250);
    } else {
      // slide not active => stop
      try {
        const p = player.pause();
        if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
      } catch { }
      setIsPlaying(false);
    }

    return () => {
      if (t) clearTimeout(t);
    };
  }, [isActiveSlide, autoPlay, player]);

  const handlePress = useCallback(() => {
    if (!player) return;

    runOnUI(() => {
      "worklet";
      scale.value = withSequence(withTiming(0.8, { duration: 100 }), withSpring(1));
    })();

    Haptics.selectionAsync().catch(() => { });

    try {
      let playing = false;
      try { playing = !!player.playing; } catch {}

      if (playing) {
        const p = player.pause();
        if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
        setIsPlaying(false);
      } else {
        // ensure replay works
        try {
          const s = player.seekTo(0);
          if (s && typeof (s as any).catch === "function") (s as any).catch(() => {});
        } catch { }
        const p = player.play();
        if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Audio error", e);
      setIsPlaying(false);
    }
  }, [player, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const containerClasses =
    style === "hero"
      ? "w-20 h-20 bg-violet-600/30 rounded-full items-center justify-center border border-violet-400/30"
      : "w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10";

  return (
    <Pressable onPress={handlePress}>
      <Animated.View className={`${containerClasses}`} style={animatedStyle}>
        {isPlaying ? (
          <Pause color="white" fill="white" size={style === "hero" ? 30 : 16} />
        ) : (
          <Volume2 color="white" size={style === "hero" ? 36 : 20} />
        )}
      </Animated.View>
    </Pressable>
  );
};

const SlideItem = React.memo(
  ({ item, index, total, width, height, isActive, onOpenDetails, settings }: any) => {
    const { fontSizeScale, autoPlayAudio } = settings;
    const hasExamples = item.examples && item.examples.length > 0;
    const firstExample = hasExamples ? item.examples[0] : null;
    const isWeb = Platform.OS === "web";
    const isShort = height < 760;
    const isVerySmall = height < 690 || width < 360;
    const isCompact = isVerySmall || isShort || (isWeb && width < 430);

    const termSize = Math.min(52 * fontSizeScale, isVerySmall ? 34 : isShort ? 42 : 52);
    const defSize = Math.min(33 * fontSizeScale, isVerySmall ? 24 : isShort ? 28 : 33);
    const sentenceSize = Math.min(18 * fontSizeScale, isVerySmall ? 14 : isShort ? 16 : 18);
    const meaningSize = Math.min(14 * fontSizeScale, isVerySmall ? 11 : isShort ? 12 : 14);

    const contentPadX = isVerySmall ? 16 : 24;
    // Reserve fixed chrome space so content stays centered and never tucks under
    // top timer/buttons or bottom controls.
    const topInset = isVerySmall ? 164 : isShort ? 150 : 138;
    const bottomInset = isVerySmall ? 196 : isShort ? 182 : 162;
    const headingGap = isVerySmall ? 4 : 8;
    const cardPadding = isVerySmall ? 12 : 20;
    const exampleGap = isVerySmall ? 10 : 16;
    const exampleMarginBottom = isVerySmall ? 12 : 24;
    const badgeTop = isVerySmall ? 94 : 106;

    const bgUri = item.image?.startsWith("http")
      ? item.image.replace("http://", "https://")
      : item.image;

    return (
      <View style={{ width, height }} className="bg-[#0f0518] relative overflow-hidden">
        {!!bgUri && (
          <ExpoImage
            source={{ uri: bgUri }}
            style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
          />
        )}
        <LinearGradient
          colors={[AppColors.darkPlum, "transparent", AppColors.darkPlum]}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={{
            flex: 1,
            paddingHorizontal: contentPadX,
            paddingTop: topInset,
            paddingBottom: bottomInset,
            justifyContent: "center",
          }}
        >
          <View
            className="self-center bg-black/40 px-4 py-1.5 rounded-full border border-white/10 z-10"
            style={{ position: "absolute", top: badgeTop }}
          >
            <Text className="text-white/60 font-bold text-xs tracking-[4px]">
              {index + 1} / {total}
            </Text>
          </View>

          {isActive && (
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)}>
              <View className="items-center" style={{ marginBottom: isCompact ? 12 : 24 }}>
                <Text
                  style={{ fontSize: termSize, lineHeight: termSize + (isVerySmall ? 2 : 6) }}
                  className="text-white font-black text-center tracking-tight drop-shadow-2xl"
                  numberOfLines={2}
                >
                  {item.definition}
                </Text>
                <View
                  className="w-12 h-1 bg-violet-600 rounded-full"
                  style={{ marginTop: headingGap, marginBottom: isVerySmall ? 10 : 16 }}
                />
                <Text
                  style={{ fontSize: defSize, lineHeight: defSize + (isVerySmall ? 4 : 10) }}
                  className="text-violet-200 text-center font-medium px-2 opacity-90"
                  numberOfLines={2}
                >
                  {item.term}
                </Text>
              </View>

              {firstExample && (
                <View
                  className="bg-white/5 rounded-3xl border border-white/10 shadow-sm"
                  style={{ padding: cardPadding, marginBottom: exampleMarginBottom }}
                >
                  <View className="flex-row items-center" style={{ columnGap: exampleGap }}>
                    <AudioButton url={firstExample.audio} style="mini" />
                    <View className="flex-1">
                      <Text
                        style={{ fontSize: sentenceSize, fontFamily: "serif", lineHeight: sentenceSize + 5 }}
                        className="text-white font-medium italic"
                        numberOfLines={isVerySmall ? 2 : 3}
                      >
                        &quot;{firstExample.sentence}&quot;
                      </Text>
                      <Text
                        style={{ fontSize: meaningSize, marginTop: isVerySmall ? 6 : 8 }}
                        className="text-white/50 font-medium tracking-wide uppercase"
                        numberOfLines={2}
                      >
                        {firstExample.meaning}
                      </Text>
                    </View>
                  </View>

                  {item.examples.length > 1 && (
                    <Pressable
                      onPress={() => onOpenDetails(item)}
                      className="border-t border-white/5 flex-row justify-center items-center"
                      style={{ marginTop: isVerySmall ? 10 : 14, paddingTop: isVerySmall ? 8 : 12 }}
                    >
                      <Text
                        className="text-violet-400 font-bold uppercase tracking-wider mr-1"
                        style={{ fontSize: isVerySmall ? 10 : 12 }}
                      >
                        View {item.examples.length - 1} More Examples
                      </Text>
                      <ChevronRight size={12} color={AppColors.violet400} />
                    </Pressable>
                  )}
                </View>
              )}

              <View className="items-center">
                <AudioButton
                  url={item.audio}
                  style="hero"
                  autoPlay={autoPlayAudio}
                  isActiveSlide={isActive}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }
);

const SettingSection = ({ title, icon: Icon, children }: any) => (
  <View className="mb-6 bg-[#2d1b4e]/50 p-4 rounded-2xl border border-white/5">
    <View className="flex-row items-center gap-2 mb-4">
      <Icon color={AppColors.violet400} size={18} />
      <Text className="text-white/90 font-bold uppercase text-xs tracking-widest">{title}</Text>
    </View>
    {children}
  </View>
);

// ---------- NEW: centered responsive bottom bar ----------
const BottomControlsBar = React.memo(function BottomControlsBar({
  safePadX,
  maxWidth,
  isTablet,
  isCompact,
  activeIndex,
  isPlaying,
  progress,
  onPrev,
  onNext,
  onTogglePlay }: {
    safePadX: number;
    maxWidth: number;
    isTablet: boolean;
    isCompact: boolean;
    activeIndex: number;
    isPlaying: boolean;
    progress: SharedValue<number>;
    onPrev: () => void;
    onNext: () => void;
    onTogglePlay: () => void;
  }) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: isCompact ? 22 : isTablet ? 44 : 36,
        alignItems: "center",
        zIndex: 999
      }}
    >
      <View style={{ width: "100%", maxWidth, paddingHorizontal: safePadX }}>
        <View
          className="bg-[#1e1035]/90 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black flex-row items-center justify-between"
          style={{
            height: isCompact ? 82 : 96,
            borderRadius: isCompact ? 30 : 40,
            paddingHorizontal: isCompact ? 16 : 24,
            width: "100%",
          }}
        >
          <Pressable
            onPress={onPrev}
            disabled={activeIndex === 0}
            className={`rounded-full active:bg-white/10 ${activeIndex === 0 ? "opacity-20" : "opacity-100"}`}
            style={{ padding: isCompact ? 10 : 16 }}
          >
            <ChevronLeft size={isCompact ? 24 : 32} color="white" />
          </Pressable>

          <PlayButton
            isPlaying={isPlaying}
            togglePlay={onTogglePlay}
            progress={progress}
            compact={isCompact}
          />

          <Pressable
            onPress={onNext}
            className="rounded-full active:bg-white/10"
            style={{ padding: isCompact ? 10 : 16 }}
          >
            <ChevronRight size={isCompact ? 24 : 32} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

export default function VocabularySlideshow({
  data,
  timeLimit = 0,
  autoEndSession = true,
  onTimeExpire,
  onProgressUpdate }: SlideshowProps) {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const isWeb = Platform.OS === "web";
  const isTablet = Math.min(width, height) >= 600 || Math.max(width, height) >= 900;
  const isDesktop = isWeb && width >= 1024;
  const isCompactScreen = Math.min(width, height) < 390 || height < 760;

  // Centered stage on desktop web
  const stageMaxWidth = isDesktop ? 980 : undefined;
  const stageWidth = stageMaxWidth ? Math.min(width, stageMaxWidth) : width;
  const stageHeight = height;

  // padding based on stage width (not full screen)
  const safePadX = useMemo(() => {
    if (stageWidth >= 1024) return 28;
    if (stageWidth >= 768) return 24;
    return 20;
  }, [stageWidth]);

  // bottom bar max width based on stage width
  const bottomBarMaxW = useMemo(() => {
    if (stageWidth >= 1280) return 720;
    if (stageWidth >= 1024) return 640;
    return stageWidth;
  }, [stageWidth]);

  const carouselRef = useRef<ICarouselInstance>(null);
  const bottomSheetRef = useRef<any>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimit);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showTimeLimitScreen, setShowTimeLimitScreen] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  const settings = useSelector((state: RootState) => state.slideshowSettings);
  const {
    timerDuration = 5000,
    fontSizeScale = 1,
    autoPlayAudio = false,
    autoPlayOnMount = false } = settings || {};

  const snapPoints = useMemo(() => ["50%", "75%"], []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
    ),
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => !!autoPlayOnMount);
  const [showExitModal, setShowExitModal] = useState(false);
  const [sheetMode, setSheetMode] = useState<"settings" | "details">("details");
  const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);

  const progress = useSharedValue(0);

  // Prefetch around active index
  useEffect(() => {
    const urls = [
      data?.[activeIndex]?.image,
      data?.[activeIndex + 1]?.image,
      data?.[activeIndex - 1]?.image,
    ]
      .filter(Boolean)
      .map((u) => (u.startsWith("http://") ? u.replace("http://", "https://") : u));

    if (!urls.length) return;
    ExpoImage.prefetch(urls).catch(() => { });
  }, [activeIndex, data]);

  const maxIndexSeenRef = useRef(0);
  useEffect(() => {
    if (activeIndex >= maxIndexSeenRef.current) maxIndexSeenRef.current = activeIndex + 1;
    onProgressUpdate?.(maxIndexSeenRef.current);
  }, [activeIndex, onProgressUpdate]);

  useEffect(() => {
    if (timeLimit === 0 || isTimeUp) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);

          if (onTimeExpire) runOnJS(onTimeExpire)();

          if (autoEndSession) {
            setIsPlaying(false);
            setShowTimeLimitScreen(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimeUp, autoEndSession, onTimeExpire, timeLimit]);

  const handleSnap = useCallback(
    (index: number) => {
      setActiveIndex(index);
      runOnUI(() => {
        "worklet";
        progress.value = 0;
      })();
    },
    [progress]
  );

  const goToNext = useCallback(() => {
    if (activeIndex < data.length - 1) carouselRef.current?.next();
    else {
      setIsPlaying(false);
      setShowCompletionScreen(true);
    }
  }, [activeIndex, data.length]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) carouselRef.current?.prev();
  }, [activeIndex]);

  const startTimer = useCallback(() => {
    const remainingTime = (1 - progress.value) * timerDuration;
    runOnUI(() => {
      "worklet";
      progress.value = withTiming(
        1,
        { duration: remainingTime, easing: Easing.linear },
        (finished) => {
          if (finished) runOnJS(goToNext)();
        }
      );
    })();
  }, [goToNext, progress, timerDuration]);

  const pauseTimer = useCallback(() => {
    cancelAnimation(progress);
  }, [progress]);

  useEffect(() => {
    if (isPlaying && !showTimeLimitScreen && !showCompletionScreen) startTimer();
    else pauseTimer();
    return () => pauseTimer();
  }, [isPlaying, startTimer, pauseTimer, activeIndex, showTimeLimitScreen, showCompletionScreen]);

  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  useEffect(() => {
    const onBackPress = () => {
      if (showTimeLimitScreen || showCompletionScreen) {
        router.back();
      } else {
        setIsPlaying(false);
        setShowExitModal(true);
      }
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [showTimeLimitScreen, showCompletionScreen]);

  const openDetails = (item: VocabularyItem) => {
    setSelectedItem(item);
    setSheetMode("details");
    setIsPlaying(false);
    setSheetVisible(true);
  };

  const openSettings = () => {
    setSheetMode("settings");
    setIsPlaying(false);
    setSheetVisible(true);
  };

  if (showTimeLimitScreen) return <SessionEndScreen onExit={() => navigation.goBack()} />;
  if (showCompletionScreen)
    return <SessionCompletedScreen onExit={() => navigation.goBack()} totalCount={data.length} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: AppColors.darkPlum }}>
        <StatusBar style="light" />

        <ExitModal
          isVisible={showExitModal}
          onDismiss={() => setShowExitModal(false)}
          onConfirm={() => {
            setShowExitModal(false);
            navigation.goBack();
          }}
        />

        <TimerBadge totalTime={timeLimit} remainingTime={secondsRemaining} />

        {/* Exit Button (Top Left) */}
        <View
          style={{
            position: "absolute",
            top: isTablet ? 56 : 50,
            left: safePadX,
            zIndex: 999
          }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => {
              setIsPlaying(false);
              setShowExitModal(true);
            }}
            style={{
              width: 44,
              height: 44,
              backgroundColor: "rgba(20, 10, 40, 0.6)",
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)"
            }}
          >
            <X color="white" size={20} />
          </Pressable>
        </View>

        {/* Centered stage for web/desktop */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <View style={{ width: stageWidth, height: stageHeight }}>
            <Carousel
              ref={carouselRef}
              loop={false}
              width={stageWidth}
              height={stageHeight}
              data={data}
              scrollAnimationDuration={500}
              onSnapToItem={handleSnap}
              renderItem={({ item, index }) => (
                <SlideItem
                  item={item}
                  index={index}
                  total={data.length}
                  width={stageWidth}
                  height={stageHeight}
                  isActive={index === activeIndex}
                  onOpenDetails={openDetails}
                  settings={{ timerDuration, fontSizeScale, autoPlayAudio }}
                />
              )}
            />
          </View>
        </View>

        {/* Settings button (anchored to stage gutter) */}
        <View
          style={{
            position: "absolute",
            top: isTablet ? 56 : 50,
            right: safePadX,
            zIndex: 999
          }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={openSettings}
            style={{
              width: 44,
              height: 44,
              backgroundColor: "rgba(20, 10, 40, 0.6)",
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)"
            }}
          >
            <SettingsIcon color="white" size={20} />
          </Pressable>
        </View>

        {/* ✅ Centered bottom bar */}
        <BottomControlsBar
          safePadX={safePadX}
          maxWidth={bottomBarMaxW}
          isTablet={isTablet}
          isCompact={isCompactScreen}
          activeIndex={activeIndex}
          isPlaying={isPlaying}
          progress={progress}
          onPrev={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
            goToPrev();
          }}
          onNext={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
            goToNext();
          }}
          onTogglePlay={togglePlay}
        />

        <ResponsiveSheet
          ref={bottomSheetRef}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          snapPoints={snapPoints}
          backgroundColor="#180d2b"
          handleColor="#ffffff30"
          isDark={true}
          maxWidth={sheetMode === "settings" ? 500 : 640}
        >
          {sheetMode === "settings" ? (
              <View className="flex-1 px-6 pt-2 pb-10">
                <Text className="text-white text-2xl font-bold mb-6 text-center">Settings</Text>

                <SettingSection title="Playback" icon={Clock}>
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-white font-medium">Slide Duration</Text>
                      <Text className="text-violet-300 font-bold">{ `${timerDuration / 1000}s` }</Text>
                    </View>
                    <View className="flex-row justify-between bg-black/20 p-1 rounded-xl">
                      {[3000, 5000, 7000, 10000].map((time) => (
                        <Pressable
                          key={time}
                          onPress={() => dispatch(setTimerDuration(time))}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            alignItems: "center",
                            borderRadius: 12,
                            backgroundColor: timerDuration === time ? themeColors["purple-dark"] : "transparent",
                            shadowColor: timerDuration === time ? AppColors.violet400 : "transparent",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: timerDuration === time ? 0.3 : 0,
                            shadowRadius: timerDuration === time ? 6 : 0
                          }}
                        >
                          <Text
                            className={cn(
                              `font-bold text-xs`,
                              timerDuration === time ? "text-white" : "text-white/40"
                            )}
                          >
                            {time / 1000}s
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-white/5">
                    <Text className="text-white font-medium text-base">Auto-Start on Mount</Text>
                    <Switch
                      value={autoPlayOnMount}
                      onValueChange={() => { dispatch(toggleAutoPlayOnMount()); }}
                      trackColor={{ false: AppColors.zinc700, true: themeColors["purple-dark"] }}
                      thumbColor={"#fff"}
                    />
                  </View>
                </SettingSection>

                <SettingSection title="Audio" icon={Music}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-medium text-base">
                        Auto-Play Pronunciation
                      </Text>
                      <Text className="text-white/40 text-xs mt-1">
                        Play audio when slide appears
                      </Text>
                    </View>
                    <Switch
                      value={autoPlayAudio}
                      onValueChange={() => { dispatch(toggleAutoPlayAudio()); }}
                      trackColor={{ false: AppColors.zinc700, true: themeColors["purple-dark"] }}
                      thumbColor={"#fff"}
                    />
                  </View>
                </SettingSection>

                <SettingSection title="Appearance" icon={Type}>
                  <View>
                    <Text className="text-white font-medium mb-3">Text Size Scale</Text>
                    <View className="flex-row justify-between bg-black/20 p-1 rounded-xl">
                      <Pressable
                        onPress={() => dispatch(setFontSizeScale(0.8))}
                        className={`flex-1 py-3 items-center rounded-lg ${fontSizeScale === 0.8 ? "bg-violet-600" : ""}`}
                      >
                        <Text className="text-white/80 text-xs">Small</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => dispatch(setFontSizeScale(1))}
                        className={`flex-1 py-3 items-center rounded-lg ${fontSizeScale === 1 ? "bg-violet-600" : ""}`}
                      >
                        <Text className="text-white text-sm font-semibold">Normal</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => dispatch(setFontSizeScale(1.2))}
                        className={`flex-1 py-3 items-center rounded-lg ${fontSizeScale === 1.2 ? "bg-violet-600" : ""}`}
                      >
                        <Text className="text-white font-bold text-base">Large</Text>
                      </Pressable>
                    </View>
                  </View>
                </SettingSection>
              </View>
            ) : (
              selectedItem && (
                <View className="flex-1 px-6 pt-2">
                  <View className="border-b border-white/5 pb-4 mb-4 flex-row justify-between items-center">
                    <Text className="text-white text-xl font-bold uppercase tracking-widest">
                      Examples
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSheetVisible(false);
                      }}
                      className="bg-white/5 p-2 rounded-full"
                    >
                      <X color="#fff" size={18} />
                    </Pressable>
                  </View>

                  <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    {selectedItem.examples.map((ex, idx) => (
                      <ExampleCard
                        key={idx}
                        sentence={ex.sentence}
                        meaning={ex.meaning}
                        audioUrl={ex.audio}
                      />
                    ))}
                  </BottomSheetScrollView>
                </View>
              )
            )}
        </ResponsiveSheet>
      </View>
    </GestureHandlerRootView>
  );
}
