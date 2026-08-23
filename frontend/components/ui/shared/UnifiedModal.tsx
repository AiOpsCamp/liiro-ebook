import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

export type ModalVariant = "dialog" | "sheet" | "fullscreen";

export interface ModalActionButton {
  text: string;
  onPress: () => void;
  style?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
}

export interface UnifiedModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: ModalVariant;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  actionButtons?: ModalActionButton[];
  maxWidth?: string;
}

export const UnifiedModal: React.FC<UnifiedModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  variant = "dialog",
  children,
  showCloseButton = true,
  closeOnBackdropPress = true,
  actionButtons = [],
  maxWidth = "max-w-md",
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(variant === "sheet" ? 300 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(variant === "dialog" ? 0.95 : 1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, variant, fadeAnim, slideAnim, scaleAnim]);

  if (!visible) return null;

  const renderButtons = () => {
    if (!actionButtons || actionButtons.length === 0) return null;

    const isTwoButtons = actionButtons.length === 2;

    return (
      <View
        style={{
          flexDirection: isTwoButtons ? "row" : "column",
          alignItems: "center",
          gap: 12,
          marginTop: 20,
          width: "100%",
        }}
      >
        {actionButtons.map((btn, idx) => {
          const isDanger = btn.style === "danger";
          const isSecondary = btn.style === "secondary";
          const isGhost = btn.style === "ghost";

          let btnBg = "#7C3AED";
          let textColor = "#FFFFFF";
          let btnBorderColor = "transparent";

          if (isDanger) {
            btnBg = "#E11D48";
            textColor = "#FFFFFF";
          } else if (isSecondary) {
            btnBg = isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9";
            btnBorderColor = isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1";
            textColor = isDark ? "#E2E8F0" : "#334155";
          } else if (isGhost) {
            btnBg = "transparent";
            textColor = isDark ? "#94A3B8" : "#475569";
          }

          return (
            <Pressable
              key={idx}
              onPress={btn.onPress}
              disabled={btn.disabled}
              style={({ pressed, hovered }: any) => [
                {
                  flex: isTwoButtons ? 1 : undefined,
                  width: isTwoButtons ? undefined : "100%",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  borderWidth: btnBorderColor !== "transparent" ? 1 : 0,
                  borderColor: btnBorderColor,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: btnBg,
                  opacity: pressed || btn.disabled ? 0.85 : 1,
                  transform: [{ scale: hovered ? 1.02 : pressed ? 0.98 : 1 }],
                },
                Platform.OS === "web" &&
                  ({ cursor: "pointer", transition: "all 0.18s ease" } as any),
              ]}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "800", color: textColor, textAlign: "center" }}
              >
                {btn.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const isSheet = variant === "sheet";
  const isFullscreen = variant === "fullscreen";

  const resolvedMaxWidth =
    maxWidth === "max-w-xs"
      ? 320
      : maxWidth === "max-w-sm"
        ? 380
        : maxWidth === "max-w-lg"
          ? 540
          : maxWidth === "max-w-xl"
            ? 640
            : 440;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={closeOnBackdropPress ? onClose : undefined}>
          <View
            style={{
              flex: 1,
              justifyContent: isSheet ? "flex-end" : isFullscreen ? "center" : "center",
              alignItems: isSheet || isFullscreen ? "stretch" : "center",
              padding: isFullscreen ? 0 : 16,
            }}
          >
            {/* Glassmorphic Dark Backdrop Overlay */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark ? "rgba(0, 0, 0, 0.75)" : "rgba(15, 23, 42, 0.65)",
                  opacity: fadeAnim,
                  ...(Platform.OS === "web"
                    ? ({ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" } as any)
                    : {}),
                },
              ]}
            />

            {/* Modal Card Content */}
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                  borderColor: isDark ? "rgba(51, 65, 85, 0.7)" : "rgba(226, 232, 240, 0.9)",
                  borderWidth: 1,
                  borderRadius: isFullscreen ? 0 : isSheet ? 24 : 24,
                  padding: 24,
                  overflow: "hidden",
                  width: isFullscreen ? "100%" : "100%",
                  maxWidth: isFullscreen ? "100%" : isSheet ? "100%" : resolvedMaxWidth,
                  height: isFullscreen ? "100%" : undefined,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: isDark ? 0.5 : 0.15,
                  shadowRadius: 32,
                  elevation: 16,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                }}
              >
                {/* Header Row */}
                {(title || showCloseButton || icon) && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                        paddingRight: 12,
                      }}
                    >
                      {icon && (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isDark
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(254, 243, 199, 0.9)",
                            borderWidth: 1,
                            borderColor: isDark
                              ? "rgba(245, 158, 11, 0.3)"
                              : "rgba(252, 211, 77, 0.6)",
                          }}
                        >
                          {icon}
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        {title && (
                          <Text
                            style={{
                              fontSize: 20,
                              fontWeight: "800",
                              color: isDark ? "#FFFFFF" : "#0F172A",
                            }}
                          >
                            {title}
                          </Text>
                        )}
                        {subtitle && (
                          <Text
                            style={{
                              fontSize: 13,
                              marginTop: 2,
                              fontWeight: "500",
                              color: isDark ? "#94A3B8" : "#64748B",
                            }}
                          >
                            {subtitle}
                          </Text>
                        )}
                      </View>
                    </View>

                    {showCloseButton && (
                      <Pressable
                        onPress={onClose}
                        style={({ pressed }: any) => ({
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isDark
                            ? "rgba(51, 65, 85, 0.6)"
                            : "rgba(241, 245, 249, 1)",
                          opacity: pressed ? 0.7 : 1,
                        })}
                        hitSlop={8}
                      >
                        <X size={16} color={isDark ? "#94A3B8" : "#64748B"} strokeWidth={2.5} />
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Body Content */}
                <View style={{ flexShrink: 1 }}>{children}</View>

                {/* Action Buttons */}
                {renderButtons()}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default UnifiedModal;
