import { AppText as Text } from '@/components/ui/AppText';
import React from "react";
import { Modal, View, Pressable, Dimensions } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { COLORS } from "@/lib/colors"; // Assuming you have a COLORS file

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: "success" | "error" | "warning";
}

const ICONS = {
  success: {
    name: "check-circle",
    color: COLORS.darkGreen},
  error: {
    name: "times-circle",
    color: "#D32F2F", // A standard error red
  },
  warning: {
    name: "exclamation-triangle",
    color: "#FFA000", // A standard warning amber
  }};

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  onClose,
  type = "error"}) => {
  const icon = ICONS[type];

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View
          className="bg-white rounded-2xl p-6 items-center shadow-lg shadow-black/30"
          style={{ width: Dimensions.get("window").width * 0.85 }}
        >
          <View className="mb-5">
            {/* The icon color is dynamic, so we pass it as a prop */}
            <FontAwesome5 name={icon.name} size={48} color={icon.color} />
          </View>

          <Text className="text-2xl font-bold text-center mb-3 text-gray-800">{title}</Text>
          <Text className="text-base text-center text-gray-600 mb-6 leading-snug">{message}</Text>

          <Pressable
            className="w-full py-3.5 rounded-xl items-center"
            // The background color is dynamic, so it's applied as an inline style
            style={{ backgroundColor: icon.color }}
            onPress={onClose}
          >
            <Text className="text-white text-lg font-bold">OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlertModal;
