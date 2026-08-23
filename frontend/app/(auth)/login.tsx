import { AppText as Text, AppTextInput as TextInput } from "@/components/ui/AppText";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import {
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  BookOpen,
  X,
} from "lucide-react-native";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from "firebase/auth";
import { SvgUri } from "react-native-svg";

let signInWithPopup: any = null;
if (Platform.OS === "web") signInWithPopup = require("firebase/auth").signInWithPopup;

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { auth } from "@/config/firebase.init";
import { getGoogleNativeConfig } from "@/config/oauth.config";
import { getBranding } from "@/config/branding";
import { saveToken } from "@/lib/utils";
import { useGlobalContext } from "@/context/GlobalContext";
import Logger from "@/lib/discord-logger";
import { useLoginMutation, useFirebaseExchangeMutation, useGoogleAuthMutation } from "@/redux/query/auth-query";
import { getFriendlyErrorMessage } from "@/lib/auth-validation";
import themeColors from "@/constants/theme-colors.json";
import { getAuthTheme } from "@/config/auth-theme";
import { AppColors } from "@/constants/Colors";
import { AuthBackground } from "@/components/auth/AuthBackground";

import GoogleAuthService from "@/services/google-auth.service";

const V = getAuthTheme();

// Safe hex-to-rgba converter to prevent React Native Android blank white card rendering bugs
const toRgba = (hex: string, alpha: number) => {
  let cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    cleaned = cleaned.split("").map((c) => c + c).join("");
  }
  if (cleaned.length !== 6) {
    return `rgba(124, 58, 237, ${alpha})`;
  }
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(style).catch(() => {});
  }
};

function isIosWeb(): boolean {
  if (Platform.OS !== "web") return false;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /iPhone|iPad|iPod/i.test(ua);
}

/* ──────────────────────────────────────────────────────────────
   Apple SVG Loader
   ────────────────────────────────────────────────────────────── */
const rawAppleAsset = require("../../assets/images/apple.svg");
let APPLE_SVG_URI = "";
if (typeof rawAppleAsset === "string") {
  APPLE_SVG_URI = rawAppleAsset;
} else if (rawAppleAsset && rawAppleAsset.uri) {
  APPLE_SVG_URI = rawAppleAsset.uri;
} else if (typeof (ExpoImage as any).resolveAssetSource === "function") {
  APPLE_SVG_URI = (ExpoImage as any).resolveAssetSource(rawAppleAsset).uri;
}

const AppleIcon = memo(function AppleIcon() {
  return (
    <SvgUri
      uri={APPLE_SVG_URI}
      width={18}
      height={18}
      fill={V.textPrimary}
    />
  );
});

/* ──────────────────────────────────────────────────────────────
   UI Components
   ────────────────────────────────────────────────────────────── */
const Wordmark = memo(function Wordmark() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/")}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        opacity: pressed ? 0.8 : 1,
      })}
      accessibilityLabel="Liiro Ebook Home"
    >
      <LinearGradient
        colors={["#0EA5E9", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BookOpen size={22} color="#FFFFFF" strokeWidth={2.5} />
      </LinearGradient>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text weight="Bold" style={{ fontSize: 26, color: V.textPrimary, letterSpacing: -0.6 }}>
          Liiro
        </Text>
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: "rgba(14, 165, 233, 0.15)",
            borderWidth: 1,
            borderColor: "rgba(14, 165, 233, 0.3)",
          }}
        >
          <Text weight="Bold" style={{ fontSize: 10, color: "#0EA5E9", letterSpacing: 0.5 }}>
            EBOOK
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

// Tactile Architectural Input — ZERO SHADOWS, flush modern minimalism (Linear/Stripe style)
const TactileInput = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  isPasswordToggle,
  showPassword,
  onTogglePassword,
  label,
  editable = true,
  autoCapitalize = "none",
  keyboardType,
  rightElement,
  autoFocus,
}: any) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={{ marginBottom: 18, width: "100%" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <Text
          weight="SemiBold"
          style={{
            fontSize: 13,
            color: isFocused ? V.accent : V.textPrimary,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
        {rightElement || null}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 54,
          borderRadius: 28,
          paddingHorizontal: 16,
          width: "100%",
          borderWidth: isFocused ? 1.5 : 1,
          borderColor: isFocused ? V.accent : toRgba(V.textPrimary, 0.12),
          backgroundColor: isFocused ? V.card : toRgba(V.textPrimary, 0.025),
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          ...(Platform.OS === "web" ? { boxShadow: "none", outlineStyle: "none" } : {}),
        } as any}
      >
        <TextInput
          weight="Regular"
          style={[
            {
              flex: 1,
              height: "100%",
              fontSize: 15.5,
              color: V.textPrimary,
              paddingVertical: 0,
            },
            Platform.OS === "web" ? ({ outlineStyle: "none", boxShadow: "none" } as any) : {},
          ]}
          placeholder={placeholder}
          placeholderTextColor={V.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          editable={editable}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={V.accent}
        />

        {isPasswordToggle && (
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              onTogglePassword();
            }}
            style={{ paddingVertical: 10, paddingLeft: 12, marginRight: -6 }}
            hitSlop={10}
          >
            {showPassword ? (
              <EyeOff size={19} color={V.textSecondary} />
            ) : (
              <Eye size={19} color={V.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

// Tactile Executive Social Button — High-contrast human minimalism (ZERO SHADOWS!)
const TactileSocialButton = ({ title, imageSource, leftIcon, onPress, disabled }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) scale.value = withTiming(0.985, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={{ width: "100%", opacity: disabled ? 0.55 : 1 }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            height: 54,
            borderRadius: 28,
            backgroundColor: toRgba(V.textPrimary, 0.02),
            borderWidth: 1,
            borderColor: toRgba(V.textPrimary, 0.12),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 18,
            shadowColor: "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
            ...(Platform.OS === "web" ? { boxShadow: "none" } : {}),
          } as any,
        ] as any}
      >
        {leftIcon ? (
          <View style={{ marginRight: 12 }}>{leftIcon}</View>
        ) : imageSource ? (
          <ExpoImage
            source={{ uri: imageSource }}
            style={{ width: 20, height: 20, marginRight: 12 }}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : null}
        <Text weight="SemiBold" style={{ color: V.textPrimary, fontSize: 15.5 }}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main Screen Component
   ────────────────────────────────────────────────────────────── */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isTablet = windowWidth >= 768;
  const isLargeDesktop = isWeb && windowWidth >= 1024;

  const horizontalPadding = useMemo(() => {
    if (isLargeDesktop) return 56;
    if (isTablet) return 40;
    return 24;
  }, [isLargeDesktop, isTablet]);

  const topPadding = useMemo(() => {
    return Math.max(insets.top + 16, isWeb ? 40 : 28);
  }, [insets.top, isWeb]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googlePopupLoading, setGooglePopupLoading] = useState(false);

  // Alert Dialog Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    type: "warning" as "success" | "error" | "warning",
  });

  const showAlert = useCallback((title: string, message: string, type: "success" | "error" | "warning") => {
    setModalData({ title, message, type });
    setModalVisible(true);
  }, []);

  const { user, setUser, refetch } = useGlobalContext();
  const [login, { isLoading: loginLoader }] = useLoginMutation();
  const [firebaseExchange, { isLoading: exchangeLoader }] = useFirebaseExchangeMutation();
  const [googleAuth, { isLoading: googleAuthLoader }] = useGoogleAuthMutation();
  const anyLoading = loginLoader || exchangeLoader || googleAuthLoader || googlePopupLoading;

  const [appleAvailableNative, setAppleAvailableNative] = useState(false);
  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailableNative)
        .catch(() => setAppleAvailableNative(false));
    }
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (!user) return;
    const isOnboarded = Boolean(user?.data?.onBoarding ?? user?.data?.onboardingStatus ?? user?.onBoarding ?? user?.onboardingStatus ?? true);
    if (isOnboarded) router.replace("/home");
    else router.replace("/onboarding");
  }, [router, user]);

  const exchangeFirebaseIdToken = useCallback(
    async (firebaseIdToken: string) => {
      let resp;
      try {
        resp = await firebaseExchange({ token: firebaseIdToken }).unwrap();
      } catch (err) {
        console.warn("firebaseExchange failed, trying googleAuth fallback", err);
        resp = await googleAuth({ token: firebaseIdToken }).unwrap();
      }
      const accessToken = resp?.data?.tokens?.accessToken || resp?.data?.accessToken;
      if (!accessToken) throw new Error("Authentication failed (no access token).");

      await saveToken("token", accessToken);
      if (typeof setUser === "function") {
        setUser(resp?.data?.user ? { data: resp.data.user } : { data: resp?.data });
      }
      const isOnboarded = Boolean(resp?.data?.onboardingStatus ?? resp?.data?.user?.onBoarding ?? true);
      if (typeof refetch === "function") {
        void refetch({ silent: true });
      }
      router.replace("/");
    },
    [firebaseExchange, googleAuth, setUser, refetch, router]
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      GoogleAuthService.checkRedirectResult()
        .then((result) => {
          if (result?.idToken) {
            setGooglePopupLoading(true);
            exchangeFirebaseIdToken(result.idToken).finally(() => setGooglePopupLoading(false));
          }
        })
        .catch(() => {});
    }
  }, [exchangeFirebaseIdToken]);

  const handleEmailLogin = useCallback(async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      showAlert("Missing info", "Please enter both your email and password.", "warning");
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      showAlert("Invalid email", "Please enter a valid email address.", "warning");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const resp = await login({ email, password }).unwrap();
      const accessToken = resp?.data?.tokens?.accessToken || resp?.data?.accessToken;
      if (!accessToken) throw new Error("Authentication failed on server.");

      await saveToken("token", accessToken);
      if (typeof setUser === "function") {
        setUser(resp?.data?.user ? { data: resp.data.user } : { data: resp?.data });
      }
      const isOnboarded = Boolean(resp?.data?.onboardingStatus ?? resp?.data?.user?.onBoarding ?? true);
      if (typeof refetch === "function") {
        void refetch({ silent: true });
      }
      router.replace("/");
    } catch (e: any) {
      Logger.error("Email login failed", e);
      showAlert("Login failed", getFriendlyErrorMessage(e), "error");
    }
  }, [email, password, login, setUser, refetch, router, showAlert]);

  const handleGoogleLogin = useCallback(async () => {
    if (anyLoading) return;

    try {
      if (Platform.OS !== "web") {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setGooglePopupLoading(true);
      }

      const result = await GoogleAuthService.signIn();
      if (result?.idToken) {
        await exchangeFirebaseIdToken(result.idToken);
      }
    } catch (e: any) {
      if (e?.isCancelled || e?.code === "CANCELLED" || e?.code === "IN_PROGRESS") {
        return;
      }
      const code = String(e?.code || "");
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      Logger.error("Google Auth Error", e);
      showAlert("Google sign-in failed", getFriendlyErrorMessage(e), "error");
    } finally {
      if (Platform.OS === "web") setGooglePopupLoading(false);
    }
  }, [anyLoading, exchangeFirebaseIdToken, showAlert]);

  const handleAppleLogin = useCallback(async () => {
    if (anyLoading) return;

    if (Platform.OS === "web") {
      showAlert(
        "Apple Sign‑In",
        "Apple Sign‑In is natively supported in the app. For web, please use our other login flows.",
        "warning"
      );
      return;
    }

    if (Platform.OS !== "ios") {
      showAlert("Unavailable", "Apple Sign‑In is only available on iOS.", "warning");
      return;
    }

    try {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

      const appleRes = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleRes.identityToken) throw new Error("Apple Sign‑In failed (missing identity token).");

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({ idToken: appleRes.identityToken });

      const userCred = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCred.user.getIdToken(true);

      await exchangeFirebaseIdToken(firebaseIdToken);
    } catch (e: any) {
      const isCanceled = e?.code === "ERR_REQUEST_CANCELED" || e?.code === "ERR_CANCELED" || e?.code === "1001";
      if (isCanceled) return;

      const isUnknownSimulatorErr = e?.code === "ERR_REQUEST_UNKNOWN" || (e?.message && e.message.includes("authorization attempt failed"));
      if (isUnknownSimulatorErr) {
        showAlert(
          "Apple Sign-In Unavailable",
          "Apple Authentication requires an active Apple ID. Please sign into iCloud in iOS Settings or test on a physical iOS device.",
          "error"
        );
        return;
      }

      Logger.error("Apple Auth Error", e);
      showAlert("Apple sign-in failed", getFriendlyErrorMessage(e), "error");
    }
  }, [anyLoading, exchangeFirebaseIdToken, showAlert]);

  // Executive Top Navigation — ZERO SHADOWS, high-visibility tactile capsule
  const topNavigationRow = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 36,
        width: "100%",
      }}
    >
      <Wordmark />

      <Pressable
        onPress={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          router.push("/register");
        }}
        style={({ pressed }) => ({
          backgroundColor: toRgba(V.accent, 0.12),
          paddingHorizontal: 20,
          height: 44,
          justifyContent: "center",
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: V.accent,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "nowrap" }}>
          <Text weight="Bold" style={{ fontSize: 14.5, color: V.accent, marginRight: 8 }} numberOfLines={1}>
            Create account
          </Text>
          <ArrowRight size={16} color={V.accent} strokeWidth={2.6} />
        </View>
      </Pressable>
    </View>
  );

  // Pure Editorial Heading — Human, mature, Scandinavian minimal confidence
  const headerSection = (
    <View style={{ marginBottom: 32 }}>
      <Text weight="Bold" style={{ fontSize: 32, color: V.textPrimary, letterSpacing: -0.8, lineHeight: 38 }}>
        Welcome back.
      </Text>
      <Text weight="Regular" style={{ fontSize: 15.5, color: V.textSecondary, marginTop: 6, lineHeight: 24 }}>
        Sign in to explore 864+ classic audiobooks, multi-language alignment, and sync your reading progress.
      </Text>
    </View>
  );

  const formSection = (
    <Animated.View entering={FadeInUp.duration(400)}>
      <TactileInput
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="hello@example.com"
        editable={!anyLoading}
        autoCapitalize="none"
        keyboardType="email-address"
        rightElement={
          email.trim().length > 3 ? (
            /\S+@\S+\.\S+/.test(email) ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <CheckCircle2 size={14} color={AppColors.green500} style={{ marginRight: 4 }} strokeWidth={2.2} />
                <Text weight="Medium" style={{ fontSize: 12, color: AppColors.green500 }}>Valid</Text>
              </View>
            ) : (
              <Text weight="Medium" style={{ fontSize: 12, color: themeColors["warning"] }}>Check email</Text>
            )
          ) : null
        }
      />

      <TactileInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        isPasswordToggle
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v: boolean) => !v)}
        editable={!anyLoading}
        autoCapitalize="none"
      />

      {/* Forgot Password link */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: -4, marginBottom: 28 }}>
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.push("/reset-password");
          }}
          disabled={anyLoading}
          hitSlop={10}
          style={{ paddingVertical: 4 }}
        >
          <Text weight="SemiBold" style={{ color: V.accent, fontSize: 13.5 }}>
            Forgot password?
          </Text>
        </Pressable>
      </View>

      {/* Tactile Executive CTA Button (ZERO SHADOWS, centered text and icon!) */}
      <Pressable
        onPress={handleEmailLogin}
        disabled={anyLoading}
        style={({ pressed }) => ({
          width: "100%",
          height: 56,
          borderRadius: 28,
          overflow: "hidden",
          opacity: anyLoading ? 0.8 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <LinearGradient
          colors={loginLoader || exchangeLoader ? [themeColors["gray-500"], themeColors["gray-600"]] : [V.accent, V.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 56,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            borderRadius: 28,
          }}
        >
          {loginLoader || exchangeLoader ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={V.textOnAccent} size="small" style={{ marginRight: 10 }} />
              <Text weight="SemiBold" style={{ color: V.textOnAccent, fontSize: 16 }}>
                Signing in...
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Text weight="SemiBold" style={{ color: V.textOnAccent, fontSize: 16 }}>
                Sign In
              </Text>
              <ArrowRight size={18} color={V.textOnAccent} style={{ marginLeft: 8 }} strokeWidth={2.5} />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  const socialSection = (
    <View style={{ marginTop: 28 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 22, paddingHorizontal: 4 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: V.dividerColor }} />
        <Text weight="Medium" style={{ fontSize: 12, color: V.textMuted, marginHorizontal: 16 }}>
          or continue with
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: V.dividerColor }} />
      </View>

      <View style={{ gap: 12 }}>
        <TactileSocialButton
          title={googlePopupLoading ? "Signing in..." : "Continue with Google"}
          imageSource="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
          onPress={handleGoogleLogin}
          disabled={anyLoading}
        />

        {/* Sign in with Apple for native iOS */}
        {Platform.OS === "ios" && appleAvailableNative ? (
          <View style={{ overflow: "hidden", borderRadius: 28, opacity: anyLoading ? 0.6 : 1 }}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
              cornerRadius={28}
              style={{ height: 56, width: "100%" }}
              onPress={handleAppleLogin}
            />
          </View>
        ) : null}

        {/* Custom Apple button for Web/Safari on iOS */}
        {Platform.OS === "web" && isIosWeb() ? (
          <TactileSocialButton
            title="Sign in with Apple"
            leftIcon={<AppleIcon />}
            onPress={handleAppleLogin}
            disabled={anyLoading}
          />
        ) : null}
      </View>
    </View>
  );

  const footerSection = (
    <View style={{ marginTop: 36, alignItems: "center", justifyContent: "center", gap: 16 }}>
      {/* High-visibility bottom account switch */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
        <Text weight="Regular" style={{ fontSize: 15, color: V.textSecondary }}>
          Don't have an account?{" "}
        </Text>
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.push("/register");
          }}
          hitSlop={10}
        >
          <Text weight="Bold" style={{ color: V.accent, fontSize: 15, textDecorationLine: "underline" }}>
            Create account
          </Text>
        </Pressable>
      </View>

      {/* Clean, tactile Help & Support link */}
      <Pressable
        onPress={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          router.push("/help-support");
        }}
        style={({ pressed }) => ({
          paddingVertical: 6,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <HelpCircle size={15} color={V.textSecondary} style={{ marginRight: 6 }} />
          <Text weight="Regular" style={{ fontSize: 14, color: V.textSecondary }}>
            Need assistance? <Text weight="SemiBold" style={{ color: V.accent }}>Help & Support</Text>
          </Text>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <StatusBar style="dark" />
      <AuthBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: horizontalPadding,
            paddingTop: topPadding,
            paddingBottom: insets.bottom + 36,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Single-Column Layout for All Screen Sizes (Web, Tablet, Mobile) */}
          <View style={{ width: "100%", maxWidth: 460, alignSelf: "center" }}>
            {topNavigationRow}
            {headerSection}
            {formSection}
            {socialSection}
            {footerSection}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ModernAlert
        visible={modalVisible}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────
   Animated Alert Modal (fully compatible with original)
   ────────────────────────────────────────────────────────────── */
const ModernAlert = memo(function ModernAlert({
  visible,
  title,
  message,
  type,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
    } else {
      opacity.value = 0;
      translateY.value = 18;
    }
  }, [visible, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const config = {
    success: { icon: CheckCircle2, color: AppColors.green500, bg: "rgba(34,197,94,0.14)" },
    error: { icon: XCircle, color: themeColors["error"], bg: "rgba(239,68,68,0.14)" },
    warning: { icon: AlertCircle, color: themeColors["warning"], bg: "rgba(245,158,11,0.14)" },
  }[type];

  const Icon = config.icon;
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 24 }}>
        <Animated.View
          style={[
            animatedStyle,
            {
              width: "100%",
              maxWidth: 400,
              borderRadius: 20,
              padding: 24,
              backgroundColor: V.card,
              alignItems: "center",
            },
          ]}
        >
          <Pressable onPress={onClose} style={{ position: "absolute", right: 16, top: 16, padding: 8 }}>
            <X size={18} color={V.textMuted} />
          </Pressable>

          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: config.bg,
              marginBottom: 16,
            }}
          >
            <Icon size={26} color={config.color} strokeWidth={2} />
          </View>

          <Text weight="Bold" style={{ fontSize: 20, marginBottom: 8, textAlign: "center", color: V.textPrimary }}>
            {title}
          </Text>

          <Text weight="Regular" style={{ fontSize: 14.5, textAlign: "center", lineHeight: 22, marginBottom: 24, color: V.textSecondary }}>
            {message}
          </Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 13,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: V.bgSubtle,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text weight="SemiBold" style={{ color: V.textPrimary, fontSize: 15 }}>Okay, Got it</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
});
