import { AppText as Text } from '@/components/ui/AppText';
import React, { memo, useMemo, useState, useCallback } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform
} from "react-native";
import { Image } from "expo-image";
import { Heart, Crown, BookOpen, Star, Lock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { selectThemeTokens, selectIsDark } from "@/redux/features/themeSlice";
import { useHandleFavoritePackMutation } from "@/redux/query/lexicon-query";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
/* =========================
   Types
========================= */
interface VocabularyPack {
  _id: string;
  slug: string;
  name: string;
  topic?: string;
  category: string;
  subcategory?: string;
  image_url: string;
  free_access: boolean;
  level: string;
  difficulty?: string;
  isEnrolled: boolean;
  isFavourite: boolean;
  isCompleted?: boolean;
  access: { free: boolean; premium: boolean };
  module?: string;
  learning_level?: number;
  sequence?: number;
  production?: boolean;
}

export interface PackCardTheme {
  primary: string;
  dark: string;
  light: string;
  gradient: readonly [string, string, string];
  border: string;
}

interface PackCardProps {
  pack?: VocabularyPack;
  onPress: (pack?: VocabularyPack) => void;
  variant?: "default" | "small" | "featured" | "marketing" | "common" | "full";
  marketingData?: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onViewAll: () => void;
  };
  progress?: number;
  type?: "featured" | "in-progress" | "level";
  level?: string;
  index?: number;
  cardWidth?: number;
  theme?: PackCardTheme;
  onFavoriteStatusChange?: (packId: string, isFavourite: boolean) => void;
}

/* =========================
   Theme Presets (Royal Violet as default)
========================= */
export const PACK_CARD_THEMES = {
  royalViolet: {
    primary: themeColors["purple-dark"],
    dark: AppColors.purpleDeepest,
    light: AppColors.violet400,
    gradient: [themeColors["purple-dark"], AppColors.purpleDeeper, AppColors.purpleDeepest] as const,
    border: "rgba(255, 139, 90, 0.15)"
  },
  emerald: {
    primary: themeColors["success"],
    dark: themeColors["success-dark"],
    light: AppColors.emerald400,
    gradient: [themeColors["success"], themeColors["success-dark"], AppColors.successDeeper] as const,
    border: "rgba(16, 185, 129, 0.15)"
  },
  amber: {
    primary: themeColors["warning"],
    dark: themeColors["warning-dark"],
    light: AppColors.amber300,
    gradient: [themeColors["warning"], themeColors["warning-dark"], AppColors.warningDeeper] as const,
    border: "rgba(245, 158, 11, 0.15)"
  },
  cyan: {
    primary: AppColors.cyan500,
    dark: AppColors.cyan600,
    light: AppColors.cyan400,
    gradient: [AppColors.cyan500, AppColors.cyan600, "#0E7490"] as const,
    border: "rgba(6, 182, 212, 0.15)"
  },
  rose: {
    primary: AppColors.rose500,
    dark: AppColors.rose600,
    light: AppColors.rose400,
    gradient: [AppColors.rose500, AppColors.rose600, AppColors.rose700] as const,
    border: "rgba(244, 63, 94, 0.15)"
  },
  indigo: {
    primary: AppColors.indigo500,
    dark: AppColors.indigo600,
    light: AppColors.indigo400,
    gradient: [AppColors.indigo500, AppColors.indigo600, AppColors.indigo700] as const,
    border: "rgba(99, 102, 241, 0.15)"
  }
} as const;

const DEFAULT_THEME = PACK_CARD_THEMES.royalViolet;

/* =========================
   Text Colors
========================= */
const TEXT = {
  primary: themeColors["gray-800"],
  secondary: themeColors["gray-500"],
  white: themeColors["white"]
};

/* =========================
   Helpers
========================= */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const titleCase = (s?: string) => (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function useCardWidth(variant: PackCardProps["variant"]) {
  const { width } = useWindowDimensions();

  // ✅ better on tablet/web: cap max widths so cards don't become huge
  const maxBase = width >= 1024 ? 320 : 260;

  const twoCol = Math.floor((width - 16 * 2 - 12) / 2);
  const base = clamp(twoCol, 168, maxBase);

  if (variant === "small") return clamp(base - 20, 140, 220);
  if (variant === "featured") return clamp(base + 24, 210, width >= 1024 ? 380 : 320);
  if (variant === "full") return clamp(width - 32, 320, width >= 1024 ? 720 : 520);
  if (variant === "common") return base;

  return base;
}

/* =========================
   Level Badge Component
========================= */
const LevelBadge = memo(function LevelBadge({
  level }: {
    level: "beginner" | "intermediate" | "advanced" | string;
  }) {
  const normalizedLevel = (level || "").toLowerCase();
  const config = {
    beginner: { color: themeColors["success"], bg: "rgba(16, 185, 129, 0.12)", label: "Beginner" },
    intermediate: { color: themeColors["warning"], bg: "rgba(245, 158, 11, 0.12)", label: "Intermediate" },
    advanced: { color: themeColors["error"], bg: "rgba(239, 68, 68, 0.12)", label: "Advanced" }
  }[normalizedLevel] || {
    color: themeColors["gray-500"],
    bg: "rgba(107, 114, 128, 0.12)",
    label: titleCase(level)
  };

  return (
    <View
      style={{
        backgroundColor: config.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
      }}
    >
      <Text style={{ color: config.color, fontSize: 10, fontWeight: "600" }}>{config.label}</Text>
    </View>
  );
});

/* =========================
   Status Badge Component
========================= */
const StatusBadge = memo(function StatusBadge({
  isEnrolled,
  isCompleted,
  theme }: {
    isEnrolled: boolean;
    isCompleted?: boolean;
    theme: PackCardTheme;
  }) {
  if (isCompleted) {
    return (
      <View
        style={{
          backgroundColor: themeColors["success"],
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 4
        }}
      >
        <Star size={10} color="#FFF" fill="#FFF" />
        <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>Done</Text>
      </View>
    );
  }
  if (isEnrolled) {
    return (
      <View
        style={{
          backgroundColor: theme.primary,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 4
        }}
      >
        <BookOpen size={10} color="#FFF" />
        <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>Enrolled</Text>
      </View>
    );
  }
  return null;
});

/* =========================
   Main PackCard Component
========================= */
export const PackCard: React.FC<PackCardProps> = memo(function PackCard({
  pack,
  onPress,
  variant = "default",
  marketingData,
  onFavoriteStatusChange,
  level,
  index = 0,
  cardWidth: propsCardWidth,
  theme = DEFAULT_THEME }) {
  const t = useSelector(selectThemeTokens);
  const dark = useSelector(selectIsDark);

  const defaultCardWidth = useCardWidth(variant);
  const cardWidth = propsCardWidth || defaultCardWidth;

  const imageHeight = cardWidth * 0.52;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const [handleFavoritePack, { isLoading: favLoading }] = useHandleFavoritePackMutation();

  const [imgError, setImgError] = useState(false);

  // ✅ Lint fix: no setState in effect to sync from props.
  // We keep an optimistic override instead.
  const [optimisticFav, setOptimisticFav] = useState<{
    packId: string | null;
    value: boolean;
  }>(() => ({
    packId: pack?._id ?? null,
    value: pack?.isFavourite ?? false
  }));

  // If pack changes (different id), reset optimistic state synchronously during render via memoized init
  const effectiveFav = useMemo(() => {
    const packId = pack?._id ?? null;
    const propFav = pack?.isFavourite ?? false;

    if (optimisticFav.packId !== packId) {
      // reset local cache for new pack id (no effect, no setState)
      return propFav;
    }
    return optimisticFav.value;
  }, [optimisticFav.packId, optimisticFav.value, pack?._id, pack?.isFavourite]);

  const imgUri = useMemo(() => {
    const raw = pack?.image_url ?? "";
    return raw.startsWith("http://") ? raw.replace("http://", "https://") : raw;
  }, [pack?.image_url]);

  const showImage = !!imgUri && !imgError;

  const onPressIn = () => {
    runOnUI(() => {
      "worklet";
      scale.value = withTiming(0.97, { duration: 120 });
    })();
  };

  const onPressOut = () => {
    runOnUI(() => {
      "worklet";
      scale.value = withTiming(1, { duration: 180 });
    })();
  };

  const handleToggleFavorite = async () => {
    if (!pack || favLoading) return;

    const optimisticNext = !effectiveFav;

    // update optimistic state for current pack id
    setOptimisticFav({ packId: pack._id, value: optimisticNext });

    try {
      const res = await handleFavoritePack({
        slug: pack.slug,
        newFav: optimisticNext
      }).unwrap();

      onFavoriteStatusChange?.(pack._id, optimisticNext);

      if (!(res?.status >= 200 && res?.status < 300)) {
        setOptimisticFav({ packId: pack._id, value: !optimisticNext });
      }
    } catch {
      setOptimisticFav({ packId: pack._id, value: !optimisticNext });
    }
  };

  /* Marketing variant */
  if (variant === "marketing" && marketingData) {
    return (
      <Pressable
        onPress={marketingData.onViewAll}
        android_ripple={{ color: t.accentPrimarySoft }}
        style={{ width: cardWidth }}
        accessibilityRole="button"
        accessibilityLabel={`${marketingData.title}. ${marketingData.subtitle}`}
      >
        <View
          style={{
            borderRadius: 16,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: theme.light,
            backgroundColor: AppColors.slate50,
            alignItems: "center",
            justifyContent: "center",
            padding: 24
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: theme.light + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {marketingData.icon}
            </View>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: theme.dark,
              textAlign: "center",
              marginBottom: 4
            }}
          >
            {marketingData.title}
          </Text>
          <Text style={{ fontSize: 12, color: TEXT.secondary, textAlign: "center" }}>
            {marketingData.subtitle}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (!pack) return null;

  const lvlLabel = pack.level || level || "";

  const moduleName =
    typeof pack.module === "object" && pack.module !== null
      ? (pack.module as any).en || Object.values(pack.module)[0]
      : pack.module;

  return (
    <Animated.View entering={FadeIn.delay(index * 60).duration(350)} style={animatedStyle}>
      <Pressable
        onPress={() => onPress(pack)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${pack.name}`}
        testID={`pack-card-${pack.slug}`}
          style={{
            width: cardWidth,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: dark ? "rgba(26, 22, 54, 0.55)" : themeColors["white"],
            borderWidth: 1.5,
            borderColor: dark ? "rgba(139, 92, 246, 0.18)" : theme.primary + "30",
            borderBottomWidth: dark ? 3 : 4,
            borderBottomColor: dark ? "rgba(139, 92, 246, 0.35)" : theme.primary + "40",
          }}
      >
        {/* Image Section */}
        <View style={{ height: imageHeight, position: "relative" }}>
          {showImage ? (
            <Image
              source={{ uri: imgUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={250}
              onError={() => setImgError(true)}
            />
          ) : (
            <LinearGradient
              colors={theme.gradient as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <BookOpen size={24} color={themeColors["white"]} />
              </View>
            </LinearGradient>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.35)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 35 }}
          />

          {/* Top Row: Crown/Access + Favorite */}
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              right: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}
          >
            {pack.access?.premium || !pack.access?.free ? (
              <View
                style={{
                  backgroundColor: "rgba(217, 119, 6, 0.95)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 2,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <Lock size={10} color="#FFF" strokeWidth={2.5} />
                <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "900" }}>PRO</Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.95)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 2,
                  flexDirection: "row",
                  alignItems: "center"
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "900" }}>FREE</Text>
              </View>
            )}

            {/* Favorite Button */}
            <Pressable
              onPress={handleToggleFavorite}
              disabled={favLoading}
              hitSlop={10}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: dark ? "rgba(26, 22, 54, 0.85)" : "rgba(255,255,255,0.95)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3
              }}
              accessibilityRole="button"
              accessibilityLabel={effectiveFav ? "Remove from favorites" : "Add to favorites"}
              testID={`favorite-${pack.slug}`}
            >
              {favLoading ? (
                <ActivityIndicator size={14} color={theme.primary} />
              ) : (
                <Heart
                  size={14}
                  color={effectiveFav ? AppColors.rose600 : (dark ? AppColors.slate300 : TEXT.secondary)}
                  fill={effectiveFav ? AppColors.rose600 : "none"}
                />
              )}
            </Pressable>
          </View>

          {/* Category Badge */}
          <View
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              backgroundColor: dark ? "rgba(26, 22, 54, 0.85)" : "rgba(255,255,255,0.95)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3
            }}
          >
            <Text weight="Bold" style={{ fontSize: 10, color: dark ? AppColors.slate200 : TEXT.primary }}>
              {pack.category}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={{ position: "absolute", bottom: 8, right: 8 }}>
            <StatusBadge
              isEnrolled={pack.isEnrolled}
              isCompleted={pack.isCompleted}
              theme={theme}
            />
          </View>
        </View>

        {/* Content Section */}
        <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 }}>
          {/* Title */}
          <Text
            weight="Bold"
            numberOfLines={1}
            style={{
              fontSize: 14,
              color: dark ? AppColors.slate100 : TEXT.primary,
              lineHeight: 18,
              letterSpacing: -0.2
            }}
          >
            {pack.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

PackCard.displayName = "PackCard";
export default PackCard;
