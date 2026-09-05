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
  Headphones,
  Languages,
  Download,
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
import { AuthBackground } from "@/components/auth/AuthBackground";

import GoogleAuthService from "@/services/google-auth.service";

const V = getAuthTheme();

/* ──────────────────────────────────────────────────────────────
   Type system — three loaded brand fonts, used deliberately so
   rendering is identical on iOS / Android / Web (no silent
   fallback to whatever the platform's default happens to be):
     • PlayfairDisplay-Bold  → display headlines (editorial voice)
     • Lora                  → reading copy, CTAs, links, footer
     • JetBrainsMono         → eyebrows, field labels, input values
   ────────────────────────────────────────────────────────────── */
const FONT_DISPLAY = "PlayfairDisplay-Bold";
const FONT_SERIF = "Lora";
const FONT_SERIF_SEMIBOLD = "Lora-SemiBold";
const FONT_SERIF_BOLD = "Lora-Bold";
const FONT_SERIF_ITALIC = "Lora-Italic";
const FONT_MONO = "JetBrainsMono";
const FONT_MONO_SEMIBOLD = "JetBrainsMono-SemiBold";

// AppColors.green500 (#22C55E) and themeColors.warning (#F59E0B) sit at ~2.2:1
// against white/mint — well under WCAG AA. These are darkened, local-only
// substitutes used for the two small inline status hints below.
const SUCCESS_TEXT = "#15803D";
const WARNING_TEXT = "#B45309";

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
   Bundled social icons (no third-party image hotlinking)
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

const rawGoogleAsset = require("../../assets/images/google.svg");
let GOOGLE_SVG_URI = "";
if (typeof rawGoogleAsset === "string") {
  GOOGLE_SVG_URI = rawGoogleAsset;
} else if (rawGoogleAsset && rawGoogleAsset.uri) {
  GOOGLE_SVG_URI = rawGoogleAsset.uri;
} else if (typeof (ExpoImage as any).resolveAssetSource === "function") {
  GOOGLE_SVG_URI = (ExpoImage as any).resolveAssetSource(rawGoogleAsset).uri;
}

const AppleIcon = memo(function AppleIcon() {
  return (
    <SvgUri
      uri={APPLE_SVG_URI}
      width={19}
      height={19}
      fill={V.textPrimary}
    />
  );
});

// Bundled, full-color "G" mark — replaces the previous flaticon.com hotlink
// (a production liability: third-party dependency, no offline guarantee).
const GoogleIcon = memo(function GoogleIcon() {
  return <SvgUri uri={GOOGLE_SVG_URI} width={19} height={19} />;
});

/* ──────────────────────────────────────────────────────────────
   UI Components
   ────────────────────────────────────────────────────────────── */
const Wordmark = memo(function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const router = useRouter();
  const isLight = tone === "light";
  const textColor = isLight ? "#FFFFFF" : V.textPrimary;
  const badgeBg = isLight ? "rgba(255,255,255,0.14)" : "rgba(14, 165, 233, 0.15)";
  const badgeBorder = isLight ? "rgba(255,255,255,0.32)" : "rgba(14, 165, 233, 0.3)";
  const badgeText = isLight ? "rgba(255,255,255,0.85)" : "#0EA5E9";

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
      hitSlop={8}
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
        <Text weight="Bold" style={{ fontFamily: FONT_DISPLAY, fontSize: 25, color: textColor, letterSpacing: -0.4 }}>
          Liiro
        </Text>
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: badgeBg,
            borderWidth: 1,
            borderColor: badgeBorder,
          }}
        >
          <Text weight="Bold" style={{ fontFamily: FONT_MONO_SEMIBOLD, fontSize: 10, color: badgeText, letterSpacing: 0.5 }}>
            EBOOK
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

// Tactile Architectural Input — flush modern minimalism with a real (visible,
// AA-contrast) border, a mono field label, and monospaced input text for
// maximum character legibility in email/password fields.
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text
          weight="SemiBold"
          style={{
            fontFamily: FONT_MONO_SEMIBOLD,
            fontSize: 11.5,
            color: isFocused ? V.accentText || V.accentDark : V.textSecondary,
            letterSpacing: 1.1,
            textTransform: "uppercase",
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
          borderRadius: 16,
          paddingHorizontal: 16,
          width: "100%",
          borderWidth: isFocused ? 1.5 : 1,
          borderColor: isFocused ? V.accentDark : V.inputBorder,
          backgroundColor: isFocused ? V.inputBgFocus : V.inputBg,
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
              fontFamily: FONT_MONO,
              fontSize: 15,
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
          selectionColor={V.accentDark}
        />

        {isPasswordToggle && (
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              onTogglePassword();
            }}
            style={{ paddingVertical: 10, paddingHorizontal: 6, marginRight: -6 }}
            hitSlop={12}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            accessibilityRole="button"
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

// Tactile Executive Social Button — high-contrast, zero-shadow minimalism.
const TactileSocialButton = ({ title, leftIcon, onPress, disabled }: any) => {
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
            borderRadius: 16,
            backgroundColor: V.socialBtnBg,
            borderWidth: 1,
            borderColor: V.socialBtnBorder,
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
        {leftIcon ? <View style={{ marginRight: 12 }}>{leftIcon}</View> : null}
        <Text weight="SemiBold" style={{ fontFamily: FONT_SERIF_SEMIBOLD, color: V.textPrimary, fontSize: 15.5 }}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// Editorial stat chip used inside the desktop brand panel.
const BrandStat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </View>
    <View>
      <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 15.5, color: "#FFFFFF", lineHeight: 19 }}>{value}</Text>
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10.5,
          color: "rgba(255,255,255,0.68)",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginTop: 1,
        }}
      >
        {label}
      </Text>
    </View>
  </View>
);

// Desktop-only editorial brand panel — replaces the empty gradient dead-zone
// that used to sit beside the form above ~900px with real visual storytelling.
const BrandPanel = memo(function BrandPanel() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 0.86, minWidth: 420, overflow: "hidden" }}>
      <LinearGradient
        colors={[V.accentDeep || V.accentDark, "#04241B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Ambient decorative glyph — pure typography, no image asset needed */}
        <Text
          style={{
            position: "absolute",
            top: -40,
            right: 8,
            fontFamily: FONT_DISPLAY,
            fontSize: 320,
            lineHeight: 320,
            color: "rgba(255,255,255,0.05)",
          }}
        >
          “
        </Text>

        <View
          style={{
            flex: 1,
            paddingHorizontal: 56,
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 16, 40),
            justifyContent: "space-between",
          }}
        >
          <Wordmark tone="light" />

          <View style={{ maxWidth: 480 }}>
            <Text
              style={{
                fontFamily: FONT_MONO_SEMIBOLD,
                fontSize: 12,
                color: "rgba(255,255,255,0.62)",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              For readers who listen
            </Text>
            <Text
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 46,
                lineHeight: 52,
                color: "#FFFFFF",
                letterSpacing: -0.6,
                marginBottom: 20,
              }}
            >
              Every classic,{"\n"}read aloud.
            </Text>
            <Text
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 16.5,
                lineHeight: 26,
                color: "rgba(255,255,255,0.78)",
                marginBottom: 40,
              }}
            >
              1,400+ public-domain classics narrated with whispersynced,
              word-for-word highlighting — synced across every device, in the
              language you're learning.
            </Text>

            <View style={{ flexDirection: "row", gap: 32 }}>
              <BrandStat icon={<Headphones size={17} color="#FFFFFF" strokeWidth={2} />} value="1,400+" label="Classics" />
              <BrandStat icon={<Languages size={17} color="#FFFFFF" strokeWidth={2} />} value="Multi" label="Language sync" />
              <BrandStat icon={<Download size={17} color="#FFFFFF" strokeWidth={2} />} value="Offline" label="Ready" />
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.14)",
            }}
          >
            <Text style={{ fontFamily: FONT_SERIF_ITALIC, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              Free classics. No ads. Ever.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

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

  const formMaxWidth = isLargeDesktop ? 480 : isTablet ? 520 : 460;

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

  // Full top row (wordmark + create-account pill) — used whenever there's no
  // dedicated brand panel to carry the logo (mobile / tablet / single column).
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
          backgroundColor: toRgba(V.accentDark, 0.1),
          paddingHorizontal: 20,
          height: 44,
          justifyContent: "center",
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: V.accentDark,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "nowrap" }}>
          <Text weight="Bold" style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 14.5, color: V.accentText || V.accentDark, marginRight: 8 }} numberOfLines={1}>
            Create account
          </Text>
          <ArrowRight size={16} color={V.accentText || V.accentDark} strokeWidth={2.6} />
        </View>
      </Pressable>
    </View>
  );

  // Slim top row used inside the desktop split-screen form panel — the brand
  // panel already carries the wordmark, so this is just the account switch.
  const desktopTopRow = (
    <View style={{ flexDirection: "row", justifyContent: "flex-end", width: "100%", marginBottom: 28 }}>
      <Pressable
        onPress={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          router.push("/register");
        }}
        style={({ pressed }) => ({
          paddingHorizontal: 20,
          height: 44,
          justifyContent: "center",
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: V.accentDark,
          backgroundColor: toRgba(V.accentDark, 0.1),
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "nowrap" }}>
          <Text weight="Bold" style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 14.5, color: V.accentText || V.accentDark, marginRight: 8 }} numberOfLines={1}>
            Create account
          </Text>
          <ArrowRight size={16} color={V.accentText || V.accentDark} strokeWidth={2.6} />
        </View>
      </Pressable>
    </View>
  );

  // Editorial heading — a real display serif (PlayfairDisplay, bundled and
  // loaded in app/_layout.tsx) instead of AppText's default "Raleway-*"
  // family, which isn't loaded anywhere and silently falls back to whatever
  // font each platform/browser happens to default to (inconsistent look
  // across iOS / Android / Web).
  const headerSection = (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          fontFamily: FONT_MONO_SEMIBOLD,
          fontSize: 11.5,
          color: V.accentText || V.accentDark,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Sign in
      </Text>
      <Text style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: V.textPrimary, letterSpacing: -0.6, lineHeight: 40 }}>
        Welcome back.
      </Text>
      <Text style={{ fontFamily: FONT_SERIF, fontSize: 15.5, color: V.textSecondary, marginTop: 8, lineHeight: 24 }}>
        Sign in to explore 1,400+ classic books, multi-language alignment, and sync your reading progress.
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
                <CheckCircle2 size={14} color={SUCCESS_TEXT} style={{ marginRight: 4 }} strokeWidth={2.2} />
                <Text weight="Medium" style={{ fontFamily: FONT_MONO, fontSize: 11, color: SUCCESS_TEXT }}>VALID</Text>
              </View>
            ) : (
              <Text weight="Medium" style={{ fontFamily: FONT_MONO, fontSize: 11, color: WARNING_TEXT }}>CHECK EMAIL</Text>
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
          style={{ paddingVertical: 8, minHeight: 44, justifyContent: "center" }}
        >
          <Text weight="SemiBold" style={{ fontFamily: FONT_SERIF_SEMIBOLD, color: V.accentText || V.accentDark, fontSize: 13.5 }}>
            Forgot password?
          </Text>
        </Pressable>
      </View>

      {/* Tactile Executive CTA Button */}
      <Pressable
        onPress={handleEmailLogin}
        disabled={anyLoading}
        style={({ pressed }) => ({
          width: "100%",
          height: 56,
          borderRadius: 16,
          overflow: "hidden",
          opacity: anyLoading ? 0.8 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <LinearGradient
          colors={
            loginLoader || exchangeLoader
              ? [themeColors["gray-500"], themeColors["gray-600"]]
              : [V.accentText || V.accentDark, V.accentDeep || V.accentDark]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 56,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            borderRadius: 16,
          }}
        >
          {loginLoader || exchangeLoader ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={V.textOnAccent} size="small" style={{ marginRight: 10 }} />
              <Text weight="SemiBold" style={{ fontFamily: FONT_SERIF_SEMIBOLD, color: V.textOnAccent, fontSize: 16 }}>
                Signing in...
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Text weight="SemiBold" style={{ fontFamily: FONT_SERIF_SEMIBOLD, color: V.textOnAccent, fontSize: 16.5 }}>
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
        <Text
          weight="Medium"
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10.5,
            color: V.textSecondary,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginHorizontal: 16,
          }}
        >
          Or continue with
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: V.dividerColor }} />
      </View>

      <View style={{ gap: 12 }}>
        <TactileSocialButton
          title={googlePopupLoading ? "Signing in..." : "Continue with Google"}
          leftIcon={<GoogleIcon />}
          onPress={handleGoogleLogin}
          disabled={anyLoading}
        />

        {/* Sign in with Apple for native iOS */}
        {Platform.OS === "ios" && appleAvailableNative ? (
          <View style={{ overflow: "hidden", borderRadius: 16, opacity: anyLoading ? 0.6 : 1 }}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
              cornerRadius={16}
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
        <Text style={{ fontFamily: FONT_SERIF, fontSize: 15, color: V.textSecondary }}>
          Don't have an account?{" "}
        </Text>
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.push("/register");
          }}
          hitSlop={10}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text weight="Bold" style={{ fontFamily: FONT_SERIF_BOLD, color: V.accentText || V.accentDark, fontSize: 15, textDecorationLine: "underline" }}>
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
          minHeight: 44,
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <HelpCircle size={15} color={V.textSecondary} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: FONT_SERIF, fontSize: 14, color: V.textSecondary }}>
            Need assistance?{" "}
            <Text style={{ fontFamily: FONT_SERIF_SEMIBOLD, color: V.accentText || V.accentDark }}>Help & Support</Text>
          </Text>
        </View>
      </Pressable>
    </View>
  );

  const formColumn = (
    <View style={{ width: "100%", maxWidth: formMaxWidth, alignSelf: "center" }}>
      {isLargeDesktop ? desktopTopRow : topNavigationRow}
      {headerSection}
      {formSection}
      {socialSection}
      {footerSection}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {isLargeDesktop ? (
          // Editorial split-screen for wide viewports: a brand/value-prop
          // panel on the left, the form on the right — instead of stretching
          // the same 460px column across a sea of empty gradient.
          <View style={{ flex: 1, flexDirection: "row" }}>
            <BrandPanel />
            <View style={{ flex: 1 }}>
              <AuthBackground />
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
                {formColumn}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <AuthBackground />
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
              {formColumn}
            </ScrollView>
          </View>
        )}
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
    success: { icon: CheckCircle2, color: SUCCESS_TEXT, bg: "rgba(21,128,61,0.12)" },
    error: { icon: XCircle, color: themeColors["error"], bg: "rgba(239,68,68,0.14)" },
    warning: { icon: AlertCircle, color: WARNING_TEXT, bg: "rgba(180,83,9,0.12)" },
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
          <Pressable onPress={onClose} style={{ position: "absolute", right: 12, top: 12, padding: 10 }} hitSlop={8}>
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

          <Text style={{ fontFamily: FONT_DISPLAY, fontSize: 20, marginBottom: 8, textAlign: "center", color: V.textPrimary }}>
            {title}
          </Text>

          <Text style={{ fontFamily: FONT_SERIF, fontSize: 14.5, textAlign: "center", lineHeight: 22, marginBottom: 24, color: V.textSecondary }}>
            {message}
          </Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 13,
              minHeight: 44,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: V.bgSubtle,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text weight="SemiBold" style={{ fontFamily: FONT_SERIF_SEMIBOLD, color: V.textPrimary, fontSize: 15 }}>Okay, Got it</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
});
