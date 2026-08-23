import { AppText as Text } from '@/components/ui/AppText';
import { View, Pressable } from "react-native";
import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  classNames?: string;
  textStyle?: string;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, classNames, onPress, textStyle, isLoading }) => {
  return (
    <Pressable onPress={onPress}>
      <View className={cn("bg-primary py-3 rounded-lg w-full", "px-4", classNames)}>
        <Text className="text-white text-center  text-lg">
          {isLoading ? "Loading..." : children}
        </Text>
      </View>
    </Pressable>
  );
};

export default Button;
