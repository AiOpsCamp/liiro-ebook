import { AppText as Text } from "@/components/ui/AppText";
import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  View,
  Pressable,
  Animated,
  ActivityIndicator,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
// Removed LinearGradient as requested
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles } from "lucide-react-native";
import themeColors from "@/constants/theme-colors.json";
import { AppColors } from "@/constants/Colors";

// Kept your existing palette structure but we will use specific solids for the new design
export const ALERT_COLORS = {
  royalViolet: {
    50: themeColors["purple-50"],
    100: themeColors["purple-100"],
    500: themeColors["purple-500"],
    600: themeColors["purple-600"],
    900: themeColors["purple-900"],
  },
  premium: {
    gold: themeColors["warning"],
    dark: themeColors["zinc-900"], // Zinc 900
    muted: themeColors["zinc-500"], // Zinc 500
    light: themeColors["zinc-100"], // Zinc 100
  },
  status: {
    success: {
      primary: themeColors["success"],
      bg: themeColors["emerald-50"],
      text: themeColors["emerald-800"],
    }, // Emerald
    error: { primary: themeColors["error"], bg: themeColors["red-50"], text: themeColors["error-text-light"] }, // Red
    warning: {
      primary: themeColors["warning"],
      bg: themeColors["amber-50"],
      text: themeColors["warning-text-light"],
    }, // Amber
    info: { primary: themeColors["indigo-500"], bg: themeColors["indigo-50"], text: themeColors["indigo-800"] }, // Indigo
    loading: {
      primary: themeColors["purple"],
      bg: themeColors["violet-50"],
      text: themeColors["purple-deepest"],
    }, // Violet
  },
};

export type AlertStatus = "success" | "error" | "warning" | "info" | "loading";
export type ButtonStyle = "default" | "cancel" | "destructive";

export interface AlertButton {
  text: string;
  style?: ButtonStyle;
  onPress?: () => void;
}

export interface PremiumAlertConfig {
  title: string;
  message: string;
  status?: AlertStatus;
  buttons?: AlertButton[];
  dismissible?: boolean;
  icon?: React.ReactNode;
  xpReward?: number;
}

interface PremiumAlertProps extends PremiumAlertConfig {
  visible: boolean;
  onClose: () => void;
}

// Logic preserved: Animated Icon Component
const StatusIcon: React.FC<{ status: AlertStatus; size?: number; pulseAnim: Animated.Value }> = ({
  status,
  size = 32,
  pulseAnim,
}) => {
  // Mapping status to solid hex colors
  const getStatusColor = (s: AlertStatus) => {
    switch (s) {
      case "success":
        return ALERT_COLORS.status.success.primary;
      case "error":
        return ALERT_COLORS.status.error.primary;
      case "warning":
        return ALERT_COLORS.status.warning.primary;
      case "loading":
        return ALERT_COLORS.status.loading.primary;
      case "info":
      default:
        return ALERT_COLORS.status.info.primary;
    }
  };

  const color = getStatusColor(status);
  const iconProps = { size, color, strokeWidth: 2.5 };

  switch (status) {
    case "success":
      return <CheckCircle {...iconProps} />;
    case "error":
      return <XCircle {...iconProps} />;
    case "warning":
      return <AlertTriangle {...iconProps} />;
    case "loading":
      return <ActivityIndicator size={size} color={color} />;
    case "info":
    default:
      return <Info {...iconProps} />;
  }
};

// Logic preserved: Floating Particle (Styled as simple dots now)
const FloatingParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const [translateY] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -25,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity, { toValue: 0.5, duration: 500, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    animate();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
};

export const PremiumAlert: React.FC<PremiumAlertProps> = ({
  visible,
  title,
  message,
  status = "info",
  buttons: propButtons = [{ text: "OK", style: "default" }],
  dismissible = true,
  icon,
  xpReward,
  onClose,
}) => {
  // Logic preserved: Filter buttons
  const validButtons = Array.isArray(propButtons)
    ? propButtons.filter((b) => b !== null && b !== undefined && typeof b === "object")
    : [];

  const safeButtons: AlertButton[] =
    validButtons.length > 0
      ? (validButtons as AlertButton[])
      : [{ text: "OK", style: "default" as ButtonStyle }];

  // Compute dynamic responsive viewport parameters
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  const cardWidth = isMobile ? "88%" : isTablet ? 380 : 420;

  // Logic preserved: Animation Values
  const [scaleAnim] = useState(new Animated.Value(0.9)); // Slight tweak to start larger for cleaner fade
  const [fadeAnim] = useState(new Animated.Value(0));
  const [backdropAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [ringAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));

  // Logic preserved: Effects
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
      ]).start();

      // Pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }), // Slower, subtler pulse
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();

      // Ring
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, useNativeDriver: true })
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [backdropAnim, fadeAnim, pulseAnim, ringAnim, scaleAnim, shimmerAnim, slideAnim, visible]);

  const handleBackdropPress = useCallback(() => {
    if (dismissible && status !== "loading") {
      onClose();
    }
  }, [dismissible, status, onClose]);

  const handleButtonPress = useCallback(
    (button: AlertButton) => {
      onClose();
      if (button.onPress) {
        setTimeout(() => button.onPress?.(), 150);
      }
    },
    [onClose]
  );

  // New Design Helper: Get colors for NativeWind classes
  const currentStatusColors = ALERT_COLORS.status[status] || ALERT_COLORS.status.info;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <View className="flex-1 justify-center items-center">
        {/* Backdrop: Solid dark with opacity (No Gradient) */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            className="bg-black"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6], // 60% opacity black
              }),
            }}
          />
        </TouchableWithoutFeedback>

        {/* Main Card */}
        <Animated.View
          style={{
            width: cardWidth,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          }}
        >
          <TouchableWithoutFeedback>
            <View
              className={`bg-white rounded-[32px] ${isMobile ? "p-5" : "p-7"} items-center shadow-2xl border border-slate-100 overflow-hidden`}
            >
              {/* Close Button (Top Right) */}
              {dismissible && status !== "loading" && (
                <Pressable
                  onPress={onClose}
                  className={`absolute right-4 top-4 ${isMobile ? "w-8 h-8" : "w-10 h-10"} rounded-full bg-slate-50 border border-slate-200 justify-center items-center z-10`}
                  hitSlop={12}
                >
                  <X size={isMobile ? 14 : 16} color={AppColors?.slate400 || "#94a3b8"} strokeWidth={2.5} />
                </Pressable>
              )}

              {/* Icon Section */}
              <View className="items-center justify-center mb-5 mt-2">
                {/* Animated Ring Background (Solid, no gradient) */}
                <Animated.View
                  className="absolute w-20 h-20 rounded-full opacity-20"
                  style={{
                    backgroundColor: currentStatusColors.bg,
                    transform: [
                      {
                        scale: ringAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.4],
                        }),
                      },
                    ],
                    opacity: ringAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 0],
                    }),
                  }}
                />

                {/* Icon Circle Container */}
                <Animated.View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: currentStatusColors.bg,
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  {icon || <StatusIcon status={status} size={32} pulseAnim={pulseAnim} />}
                </Animated.View>

                {/* Floating Particles (Kept logic, styled minimal) */}
                <View
                  className="items-center justify-center pointer-events-none"
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                >
                  <FloatingParticle delay={0} color={currentStatusColors.primary} />
                  <FloatingParticle delay={600} color={currentStatusColors.primary} />
                </View>
              </View>

              {/* Text Content */}
              <View className="w-full items-center px-2 mb-6">
                <Text
                  className={`font-bold text-slate-900 text-center mb-2 tracking-tight ${isMobile ? "text-lg" : "text-[21px]"}`}
                >
                  {title}
                </Text>
                <Text
                  className={`text-slate-500 text-center leading-6 font-medium ${isMobile ? "text-[14px]" : "text-[16px]"}`}
                >
                  {message}
                </Text>
              </View>

              {/* XP Reward Badge */}
              {xpReward !== undefined && xpReward > 0 && (
                <View className="flex-row items-center justify-center bg-amber-50 border border-amber-200 px-4 py-2 rounded-full mb-6 mt-1 shadow-sm">
                  <Sparkles size={16} color="#d97706" style={{ marginRight: 6 }} />
                  <Text className="text-amber-700 font-bold text-[14px]">
                    +{xpReward} XP Points Awarded!
                  </Text>
                </View>
              )}

              {/* Buttons Section */}
              {status === "loading" ? (
                <View className="flex-row items-center justify-center py-2 space-x-2">
                  <ActivityIndicator size="small" color={currentStatusColors.primary} />
                  <Text className="text-slate-400 font-medium text-sm ml-2">Processing...</Text>
                </View>
              ) : (
                <View className="w-full flex-col gap-3">
                  {safeButtons.map((button, index) => {
                    const isCancel = button.style === "cancel";
                    const isDestructive = button.style === "destructive";

                    // Determine styling based on type without gradients
                    let btnBg = "bg-slate-900"; // Default Premium Dark
                    let btnText = "text-white";
                    let btnBorder = "border-transparent";

                    if (isCancel) {
                      btnBg = "bg-white";
                      btnText = "text-slate-700";
                      btnBorder = "border-slate-200";
                    } else if (isDestructive) {
                      btnBg = "bg-red-500";
                    } else {
                      // Optional: Match button to status color for 'default' style
                      // btnBg = status === 'success' ? 'bg-emerald-600' : 'bg-slate-900';
                      // Keeping it sleek slate-900 for "Premium" look unless logic dictates otherwise
                    }

                    return (
                      <Pressable
                        key={index}
                        onPress={() => handleButtonPress(button)}
                        className={`w-full ${isMobile ? "h-[48px]" : "h-[54px]"} rounded-2xl items-center justify-center border ${btnBorder} ${btnBg} shadow-sm `}
                      >
                        <Text
                          className={`font-semibold ${isMobile ? "text-[15px]" : "text-[16px]"} ${btnText}`}
                        >
                          {button.text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Subtle Decor (Sparkle) */}
              <View className="absolute bottom-3 opacity-10 pointer-events-none">
                <Sparkles size={16} color={currentStatusColors.primary} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PremiumAlert;
