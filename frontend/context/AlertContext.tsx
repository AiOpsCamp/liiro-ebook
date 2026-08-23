import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  PremiumAlert,
  AlertStatus,
  AlertButton,
  PremiumAlertConfig,
} from "@/components/ui/PremiumAlert";
import { setAlertRef } from "@/lib/alert";

interface AlertContextType {
  showAlert: (config: PremiumAlertConfig) => void;
  showSuccess: (title: string, message: string, buttons?: AlertButton[], xpReward?: number) => void;
  showError: (title: string, message: string, buttons?: AlertButton[]) => void;
  showWarning: (title: string, message: string, buttons?: AlertButton[]) => void;
  showInfo: (title: string, message: string, buttons?: AlertButton[]) => void;
  showLoading: (title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<PremiumAlertConfig>({
    title: "",
    message: "",
    status: "info",
    buttons: [{ text: "OK", style: "default" }],
    dismissible: true,
  });

  // Store ref for stateless helper functions
  const alertFunctionsRef = React.useRef<any>(null);

  const showAlert = useCallback((newConfig: PremiumAlertConfig) => {
    setConfig({
      title: newConfig.title,
      message: newConfig.message,
      status: newConfig.status || "info",
      buttons: newConfig.buttons || [{ text: "OK", style: "default" }],
      dismissible: newConfig.dismissible !== false,
      icon: newConfig.icon,
      xpReward: newConfig.xpReward,
    });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  const showSuccess = useCallback(
    (title: string, message: string, buttons?: AlertButton[], xpReward?: number) => {
      showAlert({
        title,
        message,
        status: "success",
        buttons: buttons || [{ text: "OK", style: "default" }],
        xpReward,
      });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title: string, message: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        status: "error",
        buttons: buttons || [{ text: "OK", style: "default" }],
      });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (title: string, message: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        status: "warning",
        buttons: buttons || [{ text: "OK", style: "default" }],
      });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (title: string, message: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        status: "info",
        buttons: buttons || [{ text: "OK", style: "default" }],
      });
    },
    [showAlert]
  );

  const showLoading = useCallback(
    (title: string, message: string = "Please wait...") => {
      showAlert({
        title,
        message,
        status: "loading",
        buttons: [],
        dismissible: false,
      });
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
    ) => {
      const { confirmText = "Confirm", cancelText = "Cancel", destructive = false } = options || {};

      showAlert({
        title,
        message,
        status: destructive ? "warning" : "info",
        buttons: [
          {
            text: cancelText,
            style: "cancel",
            onPress: onCancel,
          },
          {
            text: confirmText,
            style: destructive ? "destructive" : "default",
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert]
  );

  // Set ref for global helper functions
  useEffect(() => {
    setAlertRef({
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showLoading,
      showConfirm,
      hideAlert,
    });
    return () => setAlertRef(null);
  }, [
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showConfirm,
    hideAlert,
  ]);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        showConfirm,
        hideAlert,
      }}
    >
      {children}
      <PremiumAlert
        visible={visible}
        title={config.title}
        message={config.message}
        status={config.status}
        buttons={config.buttons}
        dismissible={config.dismissible}
        icon={config.icon}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export default AlertProvider;
