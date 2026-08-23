import { useState, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { CheckCircle, XCircle, AlertTriangle, Info, BookOpen, X, Crown } from "lucide-react-native";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
const colors = {
  primary: themeColors["sunbeam"],
  secondary: themeColors["lemon-leaf"],
  tertiary: themeColors["meadow-green"],
  accent: themeColors["forest-core"],
  white: themeColors["white"],
  black: themeColors["gray-800"],
  gray: themeColors["gray-500"],
  lightGray: themeColors["gray-100"],
  success: themeColors["success"],
  error: themeColors["error"],
  warning: themeColors["warning"],
  info: themeColors["info"],
};

interface SimpleModalConfig {
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info" | "learning" | "premium";
  primaryButton?: {
    text: string;
    onPress: () => void | Promise<void>;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  showCloseButton?: boolean;
  autoClose?: number;
}

const useSimpleModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<SimpleModalConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Refs to track state without causing re-renders
  const isHidingRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type ModalType = "success" | "error" | "warning" | "info" | "learning" | "premium";

  const getTypeConfig = (type: ModalType) => {
    const configs: Record<ModalType, { color: string; icon: typeof CheckCircle; bgColor: string }> =
      {
        success: { color: colors.success, icon: CheckCircle, bgColor: "#10B98120" },
        error: { color: colors.error, icon: XCircle, bgColor: "#EF444420" },
        warning: { color: colors.warning, icon: AlertTriangle, bgColor: "#F59E0B20" },
        info: { color: colors.info, icon: Info, bgColor: "#3B82F620" },
        learning: { color: colors.accent, icon: BookOpen, bgColor: "#387F3920" },
        premium: { color: colors.primary, icon: Crown, bgColor: "#F6E96B20" },
      };
    return configs[type] || configs.info;
  };

  const show = useCallback(
    (modalConfig: SimpleModalConfig) => {
      // Clear any pending hide operations
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      isHidingRef.current = false;

      setConfig(modalConfig);
      setIsLoading(false);
      setIsVisible(true);

      // Start show animation
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close if specified
      if (modalConfig.autoClose) {
        setTimeout(() => {
          hide();
        }, modalConfig.autoClose);
      }
    },
     
    [fadeAnim, scaleAnim]
  );

  const update = useCallback((newConfig: Partial<SimpleModalConfig>) => {
    setConfig((prevConfig) => {
      if (!prevConfig) return null;
      return { ...prevConfig, ...newConfig };
    });
    setIsLoading(false);
  }, []);

  const hide = useCallback(() => {
    if (isHidingRef.current) return;
    isHidingRef.current = true;

    // Start hide animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Schedule state updates outside of animation callback to avoid insertion effect issues
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setConfig(null);
      setIsLoading(false);
      isHidingRef.current = false;
    }, 200); // Slightly longer than animation duration
  }, [fadeAnim, scaleAnim]);

  const handlePrimaryAction = useCallback(async () => {
    if (!config?.primaryButton?.onPress) return;

    setIsLoading(true);
    try {
      const result = config.primaryButton.onPress();
      if (result instanceof Promise) {
        await result;
      }
      // Don't auto-hide, let the calling code handle it
    } catch (error) {
      console.error("Modal action error:", error);
      setIsLoading(false);
    }
  }, [config]);

  const handleBackdropPress = useCallback(() => {
    // Use setTimeout to avoid insertion effect issues
    setTimeout(() => {
      hide();
    }, 0);
  }, [hide]);

  const handleClosePress = useCallback(() => {
    // Use setTimeout to avoid insertion effect issues
    setTimeout(() => {
      hide();
    }, 0);
  }, [hide]);

  const handleSecondaryPress = useCallback(() => {
    if (config?.secondaryButton?.onPress) {
      config.secondaryButton.onPress();
    }
    // Use setTimeout to avoid insertion effect issues
    setTimeout(() => {
      hide();
    }, 0);
  }, [config, hide]);

  const renderIcon = () => {
    const typeConfig = getTypeConfig(((config as any).type as ModalType) || "info");

    const IconComponent = typeConfig.icon;

    return (
      <View
        className="w-16 h-16 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: typeConfig.bgColor }}
      >
        <IconComponent size={28} color={typeConfig.color} />
      </View>
    );
  };

  const ModalRenderer = () => {
    if (!config) return null;

    const typeConfig = getTypeConfig(config.type || "info");

    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleBackdropPress}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

        <Pressable
          className="flex-1 justify-center items-center bg-black/50 px-6"
          onPress={handleBackdropPress}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 12,
              }}
            >
              {/* Close button */}
              {config.showCloseButton !== false && (
                <Pressable
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  onPress={handleClosePress}
                >
                  <X size={16} color={colors.gray} />
                </Pressable>
              )}

              {/* Content */}
              <View className="items-center">
                {renderIcon()}

                <Text
                  className="text-xl font-bold text-center mb-2 px-2"
                  style={{ color: colors.black }}
                >
                  {config.title}
                </Text>

                <Text
                  className="text-base text-center mb-6 leading-6 px-2"
                  style={{ color: colors.gray }}
                >
                  {config.message}
                </Text>

                {/* Buttons */}
                <View className="w-full space-y-3">
                  {config.primaryButton && (
                    <Pressable
                      className="w-full py-4 px-6 rounded-xl items-center"
                      style={{
                        backgroundColor: typeConfig.color,
                        opacity: isLoading ? 0.8 : 1,
                      }}
                      onPress={handlePrimaryAction}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <View className="flex-row items-center">
                          <ActivityIndicator size="small" color={colors.white} />
                          <Text className="ml-2 font-semibold" style={{ color: colors.white }}>
                            Loading...
                          </Text>
                        </View>
                      ) : (
                        <Text className="font-semibold text-base" style={{ color: colors.white }}>
                          {config.primaryButton.text}
                        </Text>
                      )}
                    </Pressable>
                  )}

                  {config.secondaryButton && (
                    <Pressable
                      className="w-full py-4 px-6 rounded-xl border-2 items-center"
                      style={{
                        borderColor: colors.lightGray,
                        opacity: isLoading ? 0.5 : 1,
                      }}
                      onPress={handleSecondaryPress}
                      disabled={isLoading}
                    >
                      <Text className="font-semibold text-base" style={{ color: colors.gray }}>
                        {config.secondaryButton.text}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  return {
    show,
    hide,
    update,
    ModalRenderer,
    isLoading,
    updateLoading: setIsLoading,
    cleanup,
  };
};

export { useSimpleModal };
