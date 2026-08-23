import React from "react";
import { Pressable, StyleProp, ViewStyle, Platform } from "react-native";
import { ChevronLeft, ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { safeGoBack } from "@/lib/navigation";
import { AppText as Text } from "@/components/ui/AppText";

export interface BackButtonProps {
  fallbackUrl?: string;
  onPress?: () => void;
  variant?: "pill" | "circle" | "minimal" | "glass" | "ghost";
  iconType?: "chevron" | "arrow";
  size?: number | "sm" | "md" | "lg";
  color?: string;
  isDark?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  className?: string;
}

export function BackButton({
  fallbackUrl = "/exercises/all",
  onPress,
  variant = "pill",
  iconType = "chevron",
  size = "md",
  color,
  isDark = false,
  label,
  style,
  accessibilityLabel = "Go back",
  className,
}: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      safeGoBack(fallbackUrl, router);
    }
  };

  const defaultColor = color || (isDark ? "#FFFFFF" : "#0F172A");

  const iconSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 18
      : size === "lg"
      ? 24
      : 20;

  const IconComponent = iconType === "arrow" ? ArrowLeft : ChevronLeft;

  let containerStyle: StyleProp<ViewStyle> = {};

  if (variant === "pill" || variant === "circle") {
    containerStyle = {
      width: 40,
      height: 40,
      borderRadius: variant === "circle" ? 20 : 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#F1F5F9",
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "transparent",
    };
  } else if (variant === "glass") {
    containerStyle = {
      height: 40,
      paddingHorizontal: label ? 14 : 10,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
    };
  } else if (variant === "ghost") {
    containerStyle = {
      padding: 8,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    };
  } else {
    // minimal
    containerStyle = {
      padding: 6,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 4,
    };
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={className}
      style={({ pressed }) => [
        containerStyle,
        Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {},
        { opacity: pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <IconComponent size={iconSize} color={defaultColor} />
      {label ? (
        <Text style={{ color: defaultColor, fontSize: 14, fontWeight: "600" }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default BackButton;
