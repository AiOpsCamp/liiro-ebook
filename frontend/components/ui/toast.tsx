import { AppText as Text } from '@/components/ui/AppText';
import type React from "react";
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { View, Animated, Pressable } from "react-native";
import { X } from "lucide-react-native";

type ToastType = "default" | "success" | "error" | "info" | "warning";

interface ToastProps {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  const toast = useCallback(({ title, message, type = "default", duration = 3000 }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);
  }, []);

  useEffect(() => {
    if (toasts.length > 0) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true}),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true}),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        dismissToast(toasts[0].id);
      }, toasts[0].duration);

      return () => clearTimeout(timer);
    }
     
  }, [toasts, fadeAnim, slideAnim]);

  const dismissToast = useCallback(
    (id: string) => {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true}),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true}),
      ]).start(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        // Reset animations for next toast
        fadeAnim.setValue(0);
        slideAnim.setValue(100);
      });
    },
    [fadeAnim, slideAnim]
  );

  const getToastColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-[#C5E1A5]";
      case "error":
        return "bg-[#FFCDD2]";
      case "info":
        return "bg-[#BBDEFB]";
      case "warning":
        return "bg-[#FFE082]";
      default:
        return "bg-white";
    }
  };

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "text-[#1B5E20]";
      case "error":
        return "text-[#B71C1C]";
      case "info":
        return "text-[#0D47A1]";
      case "warning":
        return "text-[#F57F17]";
      default:
        return "text-gray-800";
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {toasts.length > 0 && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            zIndex: 50}}
          className={`rounded-lg shadow-md p-4 ${getToastColor(toasts[0].type || "default")}`}
        >
          <View className="flex-row justify-between items-center">
            <Text className={`font-bold ${getTextColor(toasts[0].type || "default")}`}>
              {toasts[0].title}
            </Text>
            <Pressable onPress={() => dismissToast(toasts[0].id)}>
              <X size={16} color="#666" />
            </Pressable>
          </View>
          {toasts[0].message && (
            <Text className={`mt-1 ${getTextColor(toasts[0].type || "default")}`}>
              {toasts[0].message}
            </Text>
          )}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};
