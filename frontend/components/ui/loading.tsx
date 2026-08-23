import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { AppColors } from "@/constants/Colors";
import { useAppSelector } from "@/redux/hook";
import { selectIsDark } from "@/redux/features/themeSlice";

const { width } = Dimensions.get("window");

interface GlobalLoadingProps {
  message?: string;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({ message = "Loading..." }) => {
  const isDark = useAppSelector(selectIsDark);
  
  const rotation = useSharedValue(0);
  const scale1 = useSharedValue(0.8);
  const scale2 = useSharedValue(0.8);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    scale1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    scale2.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity, rotation, scale1, scale2]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }, { rotate: `${rotation.value}deg` }],
    opacity: interpolate(scale1.value, [0.8, 1.2], [0.8, 0]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }, { rotate: `-${rotation.value * 1.5}deg` }],
    opacity: interpolate(scale2.value, [0.9, 1.3], [0.6, 0]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
  }));

  // Colors based on premium theme
  const bgColor = isDark ? "#050B14" : "#F8FAFC";
  const ringColor1 = isDark ? "rgba(139, 92, 246, 0.4)" : "rgba(139, 92, 246, 0.25)";
  const ringColor2 = isDark ? "rgba(217, 70, 239, 0.3)" : "rgba(217, 70, 239, 0.2)";
  const textColor = isDark ? "#E2E8F0" : "#334155";
  
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.animationContainer}>
        {/* Outer Ring */}
        <Animated.View style={[styles.ring, ring2Style, { borderColor: ringColor2, borderWidth: 1 }]} />
        
        {/* Inner Ring */}
        <Animated.View style={[styles.ring, ring1Style, { borderColor: ringColor1, borderWidth: 2 }]} />
        
        {/* Center Orb */}
        <Animated.View style={[styles.orbContainer, orbStyle]}>
          <LinearGradient
            colors={isDark ? [AppColors.fuchsia500, AppColors.violet600] : [AppColors.fuchsia400, AppColors.violet500]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orb}
          />
        </Animated.View>
      </View>
      
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.text, { color: textColor }]}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  animationContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  orbContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: AppColors.fuchsia500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  orb: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  textContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});

export default GlobalLoading;
