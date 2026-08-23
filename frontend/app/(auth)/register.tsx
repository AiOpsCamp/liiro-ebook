import { AppText as Text, AppTextInput as TextInput } from '@/components/ui/AppText';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing
} from "react-native-reanimated";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react-native";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from "firebase/auth";
let signInWithPopup: any = null;
if (Platform.OS === "web") {
  signInWithPopup = require("firebase/auth").signInWithPopup;
}
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";

import { auth } from "@/config/firebase.init";
import { saveToken } from "@/lib/utils";
import { useGlobalContext } from "@/context/GlobalContext";
import Logger from "@/lib/discord-logger";
import { getBranding } from "@/config/branding";
import { useGoogleAuthMutation, useRegisterMutation } from "@/redux/query/auth-query";
import { getFriendlyErrorMessage } from "@/lib/auth-validation";
import themeColors from "@/constants/theme-colors.json";
import { getAuthTheme } from "@/config/auth-theme";
import { AuthBackground } from "@/components/auth/AuthBackground";

import { getGoogleWebClientId, getGoogleNativeConfig } from "@/config/oauth.config";
import { AppColors } from "@/constants/Colors";

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

const Wordmark = () => {
  const branding = getBranding();
  return (
    <View style={{ alignItems: "flex-start" }}>
      <Text weight="Bold" style={{ fontSize: 28, color: V.textPrimary, letterSpacing: -0.6 }}>
        {branding.appName === 'IeltsCamp' ? (
          <>Ielts<Text weight="Bold" style={{ color: V.accent }}>Camp</Text></>
        ) : branding.appName === 'LangoWords' ? (
          <>Lango<Text weight="Bold" style={{ color: V.accent }}>Words</Text></>
        ) : branding.appName === 'LangoRead' || branding.appName === 'LangoReads' ? (
          <>Lango<Text weight="Bold" style={{ color: V.accent }}>Read</Text></>
        ) : (
          <>Lango<Text weight="Bold" style={{ color: V.accent }}>Prep</Text></>
        )}
      </Text>
    </View>
  );
};

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
  rightElement
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
          height: 56,
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

// Tactile Interactive Checkbox with Spring physics & haptics (ZERO SHADOWS!)
const TactileCheckbox = ({ checked, onToggle }: { checked: boolean; onToggle: () => void }) => {
  const scale = useSharedValue(1);

  const animatedBoxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.85, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  return (
    <Pressable onPress={handlePress} style={{ paddingRight: 12, paddingVertical: 4 }} hitSlop={6}>
      <Animated.View
        style={[
          animatedBoxStyle,
          {
            width: 22,
            height: 22,
            borderRadius: 7,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            backgroundColor: checked ? V.accent : "transparent",
            borderColor: checked ? V.accent : V.textMuted,
          },
        ]}
      >
        {checked && <Check size={14} color={V.textOnAccent} strokeWidth={3} />}
      </Animated.View>
    </Pressable>
  );
};

// Tactile Executive Social Button — High-contrast human minimalism (ZERO SHADOWS!)
const TactileSocialButton = ({ title, imageSource, onPress, disabled }: any) => {
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
            height: 56,
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
        <ExpoImage
          source={{ uri: imageSource }}
          style={{ width: 20, height: 20, marginRight: 12 }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
        />
        <Text weight="SemiBold" style={{ color: V.textPrimary, fontSize: 15.5 }}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export default function RegisterScreen() {
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

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googlePopupLoading, setGooglePopupLoading] = useState(false);
  const [acceptTos, setAcceptTos] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    type: "warning" as "success" | "error" | "warning"
  });
  const [appleAvailable, setAppleAvailable] = useState(false);

  const { user, refetch } = useGlobalContext();
  const [register, { isLoading: registerLoader }] = useRegisterMutation();
  const [googleAuth, { isLoading: googleLoader }] = useGoogleAuthMutation();
  const anyLoading = registerLoader || googleLoader || googlePopupLoading;

  useEffect(() => {
    if (Platform.OS === "web") {
      GoogleAuthService.checkRedirectResult()
        .then(async (result) => {
          if (result?.idToken) {
            setGooglePopupLoading(true);
            try {
              const resp = await googleAuth({ token: result.idToken }).unwrap();
              await saveToken("token", resp?.data?.tokens?.accessToken ?? resp?.data?.accessToken ?? "");
              await refetch();
              const onboarded = resp?.data?.onboardingStatus === true;
      router.replace("/");
            } catch (e) {
              // Ignore handled errors
            } finally {
              setGooglePopupLoading(false);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const emailLooksValid = useCallback((e: string) => /\S+@\S+\.\S+/.test(e), []);
  const passwordRules = useMemo(
    () => ({
      hasLen: password.length >= 8,
      hasNum: /\d/.test(password),
      hasLetter: /[A-Za-z]/.test(password)
    }),
    [password]
  );
  const strengthCount = useMemo(
    () => [passwordRules.hasLen, passwordRules.hasNum, passwordRules.hasLetter].filter(Boolean).length,
    [passwordRules]
  );

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const showAlert = useCallback(
    (title: string, message: string, type: "success" | "error" | "warning") => {
      setModalData({ title, message, type });
      setModalVisible(true);
    },
    []
  );

  const handleRegister = useCallback(async () => {
    Keyboard.dismiss();

    if (!username || !email || !password)
      return showAlert("Missing Info", "Please fill in your username, email, and password.", "warning");
    if (!emailLooksValid(email))
      return showAlert("Invalid Email", "Please enter a valid email address.", "warning");
    if (password.length < 8)
      return showAlert("Password Too Short", "Please use at least 8 characters for your password.", "warning");
    if (!acceptTos)
      return showAlert("Terms Required", "Please agree to the Terms & Privacy Policy to create your account.", "warning");

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await register({ email, password, username }).unwrap();
      showAlert("Account Created", "Welcome to LangoWords! Your account is ready. Please log in.", "success");
      setTimeout(() => router.replace("/login"), 1400);
    } catch (error: any) {
      Logger.error("Register Failed", error);
      showAlert("Registration Failed", getFriendlyErrorMessage(error), "error");
    }
  }, [
    acceptTos,
    email,
    emailLooksValid,
    password,
    register,
    router,
    showAlert,
    username,
  ]);

  const handleGoogleSignup = useCallback(async () => {
    if (anyLoading) return;

    try {
      if (Platform.OS !== "web") {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setGooglePopupLoading(true);
      }

      // On web: triggers signInWithRedirect — page navigates to Google.
      // Result is captured on return via the checkRedirectResult useEffect.
      const result = await GoogleAuthService.signIn();

      const resp = await googleAuth({ token: result.idToken }).unwrap();
      await saveToken("token", resp?.data?.tokens?.accessToken ?? resp?.data?.accessToken ?? "");
      await refetch();

      const onboarded = resp?.data?.onboardingStatus === true;
      router.replace("/");
    } catch (error: any) {
      const code = String(error?.code || "");
      if (
        error?.isCancelled ||
        code === "CANCELLED" ||
        code === "SIGN_IN_CANCELLED" ||
        code === "-5" ||
        error?.message?.includes("CANCELLED")
      ) {
        if (Platform.OS === "web") setGooglePopupLoading(false);
        return;
      }
      if (code === "IN_PROGRESS" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        if (Platform.OS === "web") setGooglePopupLoading(false);
        return;
      }
      if (code === "auth/unauthorized-domain") {
        setGooglePopupLoading(false);
        showAlert(
          "Domain Unauthorized",
          `Add this domain (${window?.location?.hostname}) in Firebase Console -> Authentication -> Settings -> Authorized domains.`,
          "error"
        );
        return;
      }
      if (code === "PLAY_SERVICES_NOT_AVAILABLE") {
        showAlert("Play Services Error", "Google Play Services are not available on this device.", "error");
        return;
      }
      if (Platform.OS === "web") setGooglePopupLoading(false);
      Logger.error("Google auth failed:", error);
      showAlert("Google Auth Failed", getFriendlyErrorMessage(error), "error");
    }
    // NOTE: No finally block — on web the redirect navigates the page away
    // so resetting loading state would cause a flash before navigation.
  }, [anyLoading, googleAuth, refetch, router, showAlert]);

  const handleAppleSignup = useCallback(async () => {
    if (anyLoading) return;
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("No Apple identity token returned.");
      }

      const provider = new OAuthProvider("apple.com");
      const oauthCredential = provider.credential({
        idToken: credential.identityToken,
      });

      await signInWithCredential(auth, oauthCredential);
      const resp = await googleAuth({ token: credential.identityToken }).unwrap();
      await saveToken("token", resp?.data?.tokens?.accessToken ?? resp?.data?.accessToken ?? "");
      await refetch();

      const onboarded = resp?.data?.onboardingStatus === true;
      router.replace("/");
    } catch (error: any) {
      const isCanceled = error?.code === "ERR_REQUEST_CANCELED" || error?.code === "ERR_CANCELED" || error?.code === "1001";
      if (isCanceled) return;

      const isUnknownSimulatorErr = error?.code === "ERR_REQUEST_UNKNOWN" || (error?.message && error.message.includes("authorization attempt failed"));
      if (isUnknownSimulatorErr) {
        showAlert(
          "Apple Sign-In Unavailable",
          "Apple Authentication requires an active Apple ID. Please sign into iCloud in iOS Settings or test on a physical iOS device.",
          "error"
        );
        return;
      }

      Logger.error("Apple signup failed", error);
      showAlert("Apple signup failed", getFriendlyErrorMessage(error), "error");
    }
  }, [anyLoading, googleAuth, refetch, router, showAlert]);

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
          router.push("/login");
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
            Sign in
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
        Create account.
      </Text>
      <Text weight="Regular" style={{ fontSize: 15.5, color: V.textSecondary, marginTop: 6, lineHeight: 24 }}>
        Set up your profile to start learning vocabulary and dialogues.
      </Text>
    </View>
  );

  // Whisper-thin architectural password bar — Pure human minimalism (ZERO SHADOWS!)
  const passwordStrengthBar = useMemo(() => {
    if (!password) return null;
    return (
      <View style={{ marginBottom: 22, marginTop: -4 }}>
        <View style={{ flexDirection: "row", height: 3, marginBottom: 8 }}>
          <View style={{ flex: 1, borderRadius: 2, marginRight: 6, backgroundColor: strengthCount >= 1 ? (strengthCount === 3 ? AppColors.green500 : V.accent) : V.bgSubtle }} />
          <View style={{ flex: 1, borderRadius: 2, marginRight: 6, backgroundColor: strengthCount >= 2 ? (strengthCount === 3 ? AppColors.green500 : V.accent) : V.bgSubtle }} />
          <View style={{ flex: 1, borderRadius: 2, backgroundColor: strengthCount >= 3 ? AppColors.green500 : V.bgSubtle }} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text weight="Regular" style={{ fontSize: 12, color: V.textSecondary }}>
            At least 8 characters with letters & numbers
          </Text>
          <Text
            weight="SemiBold"
            style={{
              fontSize: 12,
              color: strengthCount === 3 ? AppColors.green500 : strengthCount === 2 ? V.accent : V.textMuted
            }}
          >
            {strengthCount === 3 ? "Strong" : strengthCount === 2 ? "Good" : "Weak"}
          </Text>
        </View>
      </View>
    );
  }, [password, strengthCount]);

  const formSection = (
    <Animated.View entering={FadeInUp.duration(400)}>
      <TactileInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        placeholder="e.g. polyglot_jane"
        editable={!anyLoading}
        autoCapitalize="none"
        rightElement={
          username.trim().length >= 3 ? (
            <Text weight="Medium" style={{ fontSize: 12, color: V.accent }}>Available</Text>
          ) : null
        }
      />

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
            emailLooksValid(email) ? (
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
        placeholder="At least 8 characters"
        secureTextEntry={!showPassword}
        isPasswordToggle
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v: boolean) => !v)}
        editable={!anyLoading}
        autoCapitalize="none"
      />

      {passwordStrengthBar}

      {/* Interactive Bouncy Checkbox & Terms */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
        <TactileCheckbox checked={acceptTos} onToggle={() => setAcceptTos((v) => !v)} />

        <Text weight="Regular" style={{ fontSize: 13.5, color: V.textSecondary, flex: 1, lineHeight: 20 }}>
          I agree to the{" "}
          <Text
            weight="SemiBold"
            style={{ color: V.accent }}
            onPress={() => router.push("/terms-and-conditions")}
          >
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            weight="SemiBold"
            style={{ color: V.accent }}
            onPress={() => Linking.openURL("https://langowords.io/privacy-policy")}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>

      {/* Tactile Executive CTA Button (ZERO SHADOWS, centered text and icon!) */}
      <Pressable
        onPress={handleRegister}
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
          colors={anyLoading ? [themeColors["gray-500"], themeColors["gray-600"]] : [V.accent, V.accentDark]}
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
          {anyLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={V.textOnAccent} size="small" style={{ marginRight: 10 }} />
              <Text weight="SemiBold" style={{ color: V.textOnAccent, fontSize: 16 }}>
                Creating Account...
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Text weight="SemiBold" style={{ color: V.textOnAccent, fontSize: 16 }}>
                Create Account
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
          title="Continue with Google"
          imageSource="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
          onPress={handleGoogleSignup}
          disabled={anyLoading}
        />

        {appleAvailable && Platform.OS === "ios" && (
          <View style={{ overflow: "hidden", borderRadius: 28, opacity: anyLoading ? 0.6 : 1 }}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
              cornerRadius={28}
              style={{ height: 56, width: "100%" }}
              onPress={handleAppleSignup}
            />
          </View>
        )}
      </View>
    </View>
  );

  const footerSection = (
    <View style={{ marginTop: 36, alignItems: "center", justifyContent: "center", gap: 16 }}>
      {/* High-visibility bottom account switch */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
        <Text weight="Regular" style={{ fontSize: 15, color: V.textSecondary }}>
          Already have an account?{" "}
        </Text>
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.push("/login");
          }}
          hitSlop={10}
        >
          <Text weight="Bold" style={{ color: V.accent, fontSize: 15, textDecorationLine: "underline" }}>
            Sign in
          </Text>
        </Pressable>
      </View>

      {/* Clean, tactile Help & Support link (Explicit flex row with marginRight to prevent icon stacking!) */}
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
            paddingBottom: insets.bottom + 36
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
        onClose={() => setModalVisible(false)}
        type={modalData.type}
      />
    </View>
  );
}

const ModernAlert = ({
  visible,
  title,
  message,
  type,
  onClose
}: {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
    } else {
      opacity.value = 0;
      translateY.value = 20;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const config = {
    success: { icon: CheckCircle2, color: AppColors.green500, bg: "rgba(34,197,94,0.1)" },
    error: { icon: XCircle, color: themeColors["error"], bg: "rgba(239,68,68,0.1)" },
    warning: { icon: AlertCircle, color: themeColors["warning"], bg: "rgba(245,158,11,0.1)" }
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
};
