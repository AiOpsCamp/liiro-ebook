import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { AppText as Text } from "@/components/ui/AppText";
import { LucideIcon } from "lucide-react-native";
import type { ThemeTokens } from "@/redux/features/themeSlice";

interface CreativeLoaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  colors: ThemeTokens;
  isDark: boolean;
}

export default function CreativeLoader({
  icon: IconComponent,
  title,
  subtitle,
  colors,
  isDark,
}: CreativeLoaderProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View className="items-center justify-center py-10 px-6">
      {/* Animation Container */}
      <View className="w-28 h-28 items-center justify-center relative mb-6">
        {/* Outer rotating dashed ring */}
        <Animated.View
          style={[
            rotationStyle,
            {
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: colors.accentPrimary,
              position: "absolute",
            },
          ]}
        />

        {/* Inner pulsing solid circle */}
        <Animated.View
          style={[
            pulseStyle,
            {
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: colors.accentPrimarySoft,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <IconComponent size={34} color={colors.accentPrimary} />
        </Animated.View>
      </View>

      {/* Texts */}
      <Text
        weight="Black"
        className="text-xl text-center mb-2"
        style={{ color: colors.textPrimary, letterSpacing: -0.5 }}
      >
        {title}
      </Text>
      <Text
        weight="Medium"
        className="text-sm text-center px-4"
        style={{ color: colors.textSecondary, lineHeight: 20 }}
      >
        {subtitle}
      </Text>
    </View>
  );
}
