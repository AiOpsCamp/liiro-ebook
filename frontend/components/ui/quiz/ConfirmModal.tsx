import React, { memo } from "react";
import { AppText as Text } from "@/components/ui/AppText";
import { View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { UnifiedModal } from "@/components/ui/shared/UnifiedModal";
import { AppColors } from "@/constants/Colors";

interface ConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal = memo<ConfirmationModalProps>(
  ({
    visible,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) => {
    return (
      <UnifiedModal
        visible={visible}
        onClose={onCancel}
        title={title}
        variant="dialog"
        maxWidth="max-w-sm"
        actionButtons={[
          {
            text: cancelText,
            onPress: onCancel,
            style: "secondary",
          },
          {
            text: confirmText,
            onPress: onConfirm,
            style: "primary",
          },
        ]}
      >
        <View className="items-center py-2">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: `${AppColors.violet200}40` }}
          >
            <MaterialIcons name="help-outline" size={30} color={AppColors.purpleDeeper} />
          </View>
          <Text className="text-center text-sm text-slate-600 dark:text-slate-300">
            {message}
          </Text>
        </View>
      </UnifiedModal>
    );
  }
);

ConfirmationModal.displayName = "ConfirmationModal";

export default ConfirmationModal;
