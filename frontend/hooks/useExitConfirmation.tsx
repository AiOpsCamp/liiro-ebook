import { useEffect } from "react";
import { BackHandler } from "react-native";
import { router } from "expo-router";
import { useAlert } from "@/context/AlertContext";

const useBackConfirmation = () => {
  const { showConfirm } = useAlert();

  useEffect(() => {
    const onBackPress = () => {
      showConfirm(
        "Go Back?",
        "Are you sure you want to leave this page?",
        () => router.back(),
        undefined,
        { confirmText: "Yes", cancelText: "Cancel" }
      );
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => subscription.remove();
  }, [showConfirm]);
};

export default useBackConfirmation;
