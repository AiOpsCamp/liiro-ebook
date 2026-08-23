import { useState, useCallback } from "react";
import ThemedAlert from "@/components/ui/ThemedAlert";

interface ThemedAlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface ShowAlertParams {
  title: string;
  message: string;
  buttons?: ThemedAlertButton[];
  type?: "success" | "warning" | "info" | "error";
}

export const useThemedAlert = () => {
  const [alertConfig, setAlertConfig] = useState<ShowAlertParams | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((config: ShowAlertParams) => {
    setAlertConfig(config);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setTimeout(() => setAlertConfig(null), 200); // Wait for animation to complete
  }, []);

  const ModalRenderer = useCallback(() => {
    if (!alertConfig) return null;

    return (
      <ThemedAlert
        visible={visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onClose={hide}
      />
    );
  }, [alertConfig, visible, hide]);

  return {
    show,
    hide,
    ModalRenderer,
  };
};
