import React, { useCallback, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useState } from "react";
import {
    View,
    ScrollView,
    Pressable,
    Modal,
    useWindowDimensions,
    StyleSheet,
    Platform,
} from "react-native";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetFooter,
    BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "@/constants/Colors";

interface ResponsiveSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Snap points for mobile BottomSheetModal (default: ["90%"]) */
    snapPoints?: string[];
    /** Background color for the sheet */
    backgroundColor?: string;
    /** Border/handle indicator color */
    handleColor?: string;
    /** Background color for the handle area (useful for colorful headers) */
    handleBgColor?: string;
    /** Whether the theme is dark */
    isDark?: boolean;
    /** Max width for the desktop modal card (default: 650) */
    maxWidth?: number;
    /** Sheet content (scrollable) */
    children: React.ReactNode;
    /** Footer content (rendered at bottom) */
    footer?: React.ReactNode;
    /** Footer background color */
    footerBgColor?: string;
    /** Footer border color */
    footerBorderColor?: string;
    /** Flat, shadowless design */
    shadowless?: boolean;
}

/**
 * ResponsiveSheet
 *
 * On mobile/tablet (native & web): renders a native `BottomSheetModal` with swipe-to-dismiss.
 * On desktop (width >= 1024): renders a centered card modal with a premium frosted glass backdrop.
 */
const ResponsiveSheet = forwardRef<any, ResponsiveSheetProps>(({
    visible,
    onClose,
    snapPoints: snapPointsProp,
    backgroundColor = "#ffffff",
    handleColor = AppColors.slate200,
    handleBgColor,
    isDark = false,
    maxWidth = 650,
    children,
    footer,
    footerBgColor,
    footerBorderColor,
    shadowless = false,
}, ref) => {
    const { width: windowWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    // Desktop means wide screens (both web and native tablets in landscape)
    const isDesktop = windowWidth >= 1024;
    const useBottomSheet = Platform.OS !== 'web' && !isDesktop;

    const bottomSheetRef = useRef<BottomSheetModal | null>(null);
    // Guard: prevent onDismiss from firing before present() completes.
    const hasPresentedRef = useRef(false);

    useImperativeHandle(ref, () => ({
        present: () => {
            if (useBottomSheet) {
                bottomSheetRef.current?.present();
                hasPresentedRef.current = true;
            } else {
                // For web/desktop, rely on the parent updating the `visible` prop
            }
        },
        dismiss: () => {
            if (useBottomSheet) {
                bottomSheetRef.current?.dismiss();
                hasPresentedRef.current = false;
            }
        }
    }));

    const snapPoints = useMemo(
        () => snapPointsProp ?? ["90%"],
        [snapPointsProp]
    );

    useEffect(() => {
        if (!useBottomSheet) return; // Only control bottom sheet on native mobile
        
        if (visible) {
            if (hasPresentedRef.current) return; // Already presented
            
            // Short timeout to ensure layout is ready on Android before presenting
            const timer = setTimeout(() => {
                bottomSheetRef.current?.present();
                hasPresentedRef.current = true;
            }, 80);
            return () => clearTimeout(timer);
        } else {
            // Only dismiss if the sheet was actually presented — calling dismiss()
            // on a never-presented BottomSheetModal can corrupt its internal state
            // on Android, preventing future present() calls from working.
            if (hasPresentedRef.current) {
                bottomSheetRef.current?.dismiss();
                hasPresentedRef.current = false;
            }
        }
    }, [visible, useBottomSheet]);

    // Safe dismiss handler that only fires after the sheet has been presented
    const handleDismiss = useCallback(() => {
        if (hasPresentedRef.current) {
            onClose();
        }
    }, [onClose]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={isDark ? 0.75 : 0.55}
                pressBehavior="close"
            />
        ),
        [isDark]
    );

    const safeBottomPadding = Math.max(insets.bottom + 8, 24);

    const renderFooter = useCallback(
        (props: BottomSheetFooterProps) => {
            if (!footer) return null;
            return (
                <BottomSheetFooter {...props} bottomInset={0}>
                    <View
                        style={[
                            styles.mobileFooter,
                            {
                                paddingBottom: safeBottomPadding,
                                backgroundColor: footerBgColor ?? backgroundColor,
                                borderTopColor: footerBorderColor ?? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                            },
                        ]}
                    >
                        {footer}
                    </View>
                </BottomSheetFooter>
            );
        },
        [footer, backgroundColor, footerBgColor, footerBorderColor, isDark, safeBottomPadding]
    );

    // ─── DESKTOP or WEB (mobile & desktop): Centered Modal / Web Sheet View ───
    
    if (!visible) return null;

    if (useBottomSheet) {
        return (
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                footerComponent={renderFooter}
                backgroundStyle={{ 
                    backgroundColor, 
                    borderRadius: 36,
                }}
                handleIndicatorStyle={{ 
                    backgroundColor: handleColor, 
                    width: 54, 
                    height: 5, 
                    borderRadius: 99 
                }}
                handleStyle={handleBgColor ? {
                    backgroundColor: handleBgColor,
                    borderTopLeftRadius: 36,
                    borderTopRightRadius: 36,
                    paddingBottom: 10, // Match default padding
                } : undefined}
                onDismiss={handleDismiss}
                enablePanDownToClose={true}
            >
                <BottomSheetScrollView
                    contentContainerStyle={{ paddingBottom: footer ? 120 + safeBottomPadding : 32 + safeBottomPadding }}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }

    const modalContent = (
        <View style={[StyleSheet.absoluteFill, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 } as any]}>
            <View style={[
                styles.desktopOverlay,
                {
                    justifyContent: isDesktop ? "center" : "flex-end",
                }
            ]}>
                <Pressable onPress={onClose} style={StyleSheet.absoluteFill}>
                    {Platform.OS === 'web' ? (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)" }]} />
                    ) : (
                        <>
                            <BlurView
                                intensity={isDark ? 35 : 55}
                                tint={isDark ? "dark" : "light"}
                                style={StyleSheet.absoluteFill}
                            />
                            <View 
                                style={[
                                    styles.backdrop, 
                                    { backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)" }
                                ]} 
                            />
                        </>
                    )}
                </Pressable>

                {/* Modal Card */}
                <View
                    style={[
                        styles.desktopCard,
                        {
                            maxWidth: isDesktop ? maxWidth : "100%",
                            width: isDesktop ? "90%" : "100%",
                            borderRadius: isDesktop ? 24 : 0,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            maxHeight: isDesktop ? "85%" : "90%",
                            backgroundColor,
                            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                        },
                        shadowless && {
                            shadowColor: "transparent",
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0,
                            shadowRadius: 0,
                            elevation: 0,
                        },
                    ]}
                >
                    {/* Content */}
                    <View style={{ flex: 1, width: "100%", minHeight: 0 }}>
                        {children}
                    </View>

                    {/* Footer */}
                    {footer && (
                        <View
                            style={[
                                styles.desktopFooter,
                                {
                                    backgroundColor: footerBgColor ?? backgroundColor,
                                    borderTopColor: footerBorderColor ?? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                                },
                            ]}
                        >
                            {footer}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    // On web, render inside a Modal so the overlay escapes any parent overflow:hidden / stacking context.
    // On native, render directly in place — absolute fill covers the screen correctly.
    if (!visible) return null;

    if (Platform.OS === 'web') {
        return (
            <Modal
                visible={visible}
                transparent
                animationType={isDesktop ? "fade" : "slide"}
                onRequestClose={onClose}
                statusBarTranslucent
            >
                {modalContent}
            </Modal>
        );
    }

    return modalContent;
});

const styles = StyleSheet.create({
    mobileFooter: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopWidth: 1,
    },
    desktopFooter: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
        borderTopWidth: 1,
    },
    desktopOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "transparent",
        zIndex: 9999,
    },
    desktopCard: {
        width: "90%",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        maxHeight: "85%",
        overflow: "hidden",
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
    },
});

export default ResponsiveSheet;
// Triggering Metro cache invalidation