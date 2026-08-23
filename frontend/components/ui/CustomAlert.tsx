import React from "react";
import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { UnifiedModal } from "@/components/ui/shared/UnifiedModal";

interface CustomAlertButton {
  text: string;
  onPress: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  isVisible: boolean;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
  onClose: () => void;
  icon?: React.ReactNode;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  isVisible,
  title,
  message,
  buttons,
  onClose,
  icon,
}) => {
  const actionButtons = buttons.map((btn) => ({
    text: btn.text,
    onPress: () => {
      btn.onPress();
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
      visible={isVisible}
      onClose={onClose}
      title={title}
      variant="dialog"
      maxWidth="max-w-sm"
      actionButtons={actionButtons}
    >
      <View className="items-center py-2">
        {icon && <View className="mb-3">{icon}</View>}
        <Text className="text-sm text-gray-600 dark:text-slate-300 text-center leading-5">
          {message}
        </Text>
      </View>
    </UnifiedModal>
  );
};

export default CustomAlert;
