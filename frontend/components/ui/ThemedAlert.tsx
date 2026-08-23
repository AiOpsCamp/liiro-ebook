import React from "react";
import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react-native";
import { UnifiedModal } from "@/components/ui/shared/UnifiedModal";
import themeColors from "@/constants/theme-colors.json";
import { AppColors } from "@/constants/Colors";

const COLORS = {
  sunbeam: themeColors["sunbeam"],
  lemonLeaf: themeColors["lemon-leaf"],
  meadowGreen: themeColors["meadow-green"],
  forestCore: themeColors["forest-core"],
};

export interface ThemedAlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export interface ThemedAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: ThemedAlertButton[];
  type?: "success" | "warning" | "info" | "error";
  onClose: () => void;
}

const ThemedAlert: React.FC<ThemedAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: "OK", style: "default" }],
  type = "info",
  onClose,
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle size={32} color={COLORS.forestCore} />,
          bgColor: `${COLORS.meadowGreen}20`,
        };
      case "warning":
        return {
          icon: <AlertTriangle size={32} color={themeColors["warning"]} />,
          bgColor: AppColors.warningBgLight,
        };
      case "error":
        return {
          icon: <X size={32} color={themeColors["error"]} />,
          bgColor: AppColors.errorBgLight,
        };
      default:
        return {
          icon: <Info size={32} color={COLORS.forestCore} />,
          bgColor: `${COLORS.lemonLeaf}30`,
        };
    }
  };

  const { icon, bgColor } = getIconAndColor();

  const actionButtons = buttons.map((btn) => ({
    text: btn.text,
    onPress: () => {
      if (btn.onPress) btn.onPress();
      onClose();
    },
    style:
      btn.style === "destructive"
        ? ("danger" as const)
        : btn.style === "cancel"
        ? ("secondary" as const)
        : ("primary" as const),
  }));

  return (
    <UnifiedModal
      visible={visible}
      onClose={onClose}
      title={title}
      variant="dialog"
      maxWidth="max-w-sm"
      actionButtons={actionButtons}
    >
      <View className="items-center py-2">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: bgColor }}
        >
          {icon}
        </View>
        <Text className="text-sm text-gray-600 dark:text-slate-300 text-center leading-5">
          {message}
        </Text>
      </View>
    </UnifiedModal>
  );
};

export default ThemedAlert;
