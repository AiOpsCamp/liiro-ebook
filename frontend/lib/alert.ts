/**
 * Premium Alert Helper Functions
 *
 * Drop-in replacement for React Native's Alert.alert
 * Usage: Import and use showAlert, or use the hook useAlert for more control
 */

import { AlertButton, AlertStatus, PremiumAlertConfig } from "@/components/ui/PremiumAlert";

// Store reference to alert functions (set by AlertProvider)
let alertRef: {
  showAlert: (config: PremiumAlertConfig) => void;
  showSuccess: (title: string, message: string, buttons?: AlertButton[]) => void;
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
} | null = null;

/**
 * Set the alert reference from AlertProvider
 * This is called internally by AlertProvider
 */
export const setAlertRef = (ref: typeof alertRef) => {
  alertRef = ref;
};

/**
 * Get current alert reference
 */
export const getAlertRef = () => alertRef;

/**
 * Show a premium alert - Drop-in replacement for Alert.alert
 *
 * @example
 * // Simple usage (replaces Alert.alert)
 * showAlert("Title", "Message");
 *
 * // With buttons
 * showAlert("Confirm", "Are you sure?", [
 *   { text: "Cancel", style: "cancel" },
 *   { text: "OK", onPress: () => console.log("OK pressed") }
 * ]);
 *
 * // With status
 * showAlert("Success!", "Your changes have been saved.", undefined, "success");
 */
export const showAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[],
  status?: AlertStatus
): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized. Make sure to wrap your app with AlertProvider.");
    return;
  }

  alertRef.showAlert({
    title,
    message,
    status: status || "info",
    buttons: buttons || [{ text: "OK", style: "default" }],
  });
};

/**
 * Show a success alert
 */
export const showSuccess = (title: string, message: string, buttons?: AlertButton[]): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized.");
    return;
  }
  alertRef.showSuccess(title, message, buttons);
};

/**
 * Show an error alert
 */
export const showError = (title: string, message: string, buttons?: AlertButton[]): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized.");
    return;
  }
  alertRef.showError(title, message, buttons);
};

/**
 * Show a warning alert
 */
export const showWarning = (title: string, message: string, buttons?: AlertButton[]): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized.");
    return;
  }
  alertRef.showWarning(title, message, buttons);
};

/**
 * Show an info alert
 */
export const showInfo = (title: string, message: string, buttons?: AlertButton[]): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized.");
    return;
  }
  alertRef.showInfo(title, message, buttons);
};

/**
 * Show a loading alert
 */
export const showLoading = (title: string, message?: string): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized.");
    return;
  }
  alertRef.showLoading(title, message);
};

/**
 * Show a confirmation dialog
 */
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized.");
    return;
  }
  alertRef.showConfirm(title, message, onConfirm, onCancel, options);
};

/**
 * Hide the current alert
 */
export const hideAlert = (): void => {
  if (!alertRef) {
    console.warn("AlertProvider not initialized.");
    return;
  }
  alertRef.hideAlert();
};

// Re-export types
export type { AlertButton, AlertStatus, PremiumAlertConfig };
