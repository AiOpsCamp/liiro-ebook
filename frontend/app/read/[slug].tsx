import React, { useEffect } from "react";
import { View, Pressable } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useGetStoryBySlugQuery } from "@/api/storiesQuery";
import EbookReadContent from "@/components/ebook/read/EbookReadContent";
import { AppText } from "@/components/ui/AppText";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";

const SkeletonLoader = ({ isDark }: { isDark: boolean }) => {
  const opacity = useSharedValue(0.4);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <View
      className="flex-1 p-5 max-w-[760px] w-full self-center"
      style={{ paddingTop: Math.max(insets.top + 16, 40) }}
    >
      <Animated.View className="h-3.5 w-30 rounded mb-4" style={[{ backgroundColor: bg }, animatedStyle]} />
      <Animated.View className="h-8 w-4/5 rounded-lg mb-2" style={[{ backgroundColor: bg }, animatedStyle]} />
      <Animated.View className="h-4 w-35 rounded mb-10" style={[{ backgroundColor: bg }, animatedStyle]} />
      <Animated.View className="h-20 w-full rounded-2xl mb-8" style={[{ backgroundColor: bg }, animatedStyle]} />

      <View className="gap-3">
        <Animated.View className="h-3 w-full rounded" style={[{ backgroundColor: bg }, animatedStyle]} />
        <Animated.View className="h-3 w-[95%] rounded" style={[{ backgroundColor: bg }, animatedStyle]} />
        <Animated.View className="h-3 w-[98%] rounded" style={[{ backgroundColor: bg }, animatedStyle]} />
        <Animated.View className="h-3 w-[90%] rounded" style={[{ backgroundColor: bg }, animatedStyle]} />
        <Animated.View className="h-3 w-[96%] rounded" style={[{ backgroundColor: bg }, animatedStyle]} />
        <Animated.View className="h-3 w-[85%] rounded" style={[{ backgroundColor: bg }, animatedStyle]} />
      </View>
    </View>
  );
};

export default function EbookReadScreen() {
  const { slug, audio, lang } = useLocalSearchParams<{ slug: string; audio?: string; lang?: string }>();
  const isDark = useSelector(selectIsDark);
  const tokens = useSelector(selectThemeTokens);

  const { data: story, isLoading, error, refetch } = useGetStoryBySlugQuery(
    { slug: slug as string, lang },
    { skip: !slug }
  );

  const bgColor = isDark ? "#0F172A" : "#FAFBFD";

  return (
    <View style={{ flex: 1, width: "100%", height: "100%", backgroundColor: bgColor }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {isLoading && (
        <SkeletonLoader isDark={isDark} />
      )}

      {error && !isLoading && (
        <View className="flex-1 justify-center items-center p-6">
          <AppText className="text-base text-center mb-4" style={{ color: tokens?.error || "#EF4444" }}>
            Failed to load the story. Please try again.
          </AppText>
          <Pressable
            onPress={refetch}
            className="px-6 py-3 rounded-full min-h-[44px] items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: tokens?.accentPrimary || "#0EA5E9",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <AppText weight="Medium" className="text-white">
              Retry
            </AppText>
          </Pressable>
        </View>
      )}

      {story && !isLoading && !error && <EbookReadContent story={story} startAsAudio={audio === "1" || audio === "true"} />}
    </View>
  );
}
