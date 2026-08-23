import { AppText as Text } from '@/components/ui/AppText';
import type React from "react";
import { View } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: any;
  className?: string;
}

export function Card({ children, style, className = "" }: CardProps) {
  return (
    <View
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}
      style={[
        {
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style, className = "" }: CardProps) {
  return <View className={`p-4 ${className}`} style={[{ padding: 16 }, style]}>{children}</View>;
}

export function CardTitle({ children, style, className = "" }: CardProps) {
  return <Text className={`text-xl font-bold ${className}`} style={[{ fontSize: 20, fontWeight: "700" }, style]}>{children}</Text>;
}

export function CardContent({ children, style, className = "" }: CardProps) {
  return <View className={`p-4 ${className}`} style={[{ padding: 16 }, style]}>{children}</View>;
}

export function CardFooter({ children, style, className = "" }: CardProps) {
  return <View className={`p-4 border-t border-gray-200 ${className}`} style={[{ padding: 16, borderTopWidth: 1, borderTopColor: "#E2E8F0" }, style]}>{children}</View>;
}
