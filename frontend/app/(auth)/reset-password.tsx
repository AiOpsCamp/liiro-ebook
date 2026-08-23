import { AppText as Text, AppTextInput as TextInput } from '@/components/ui/AppText';
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  KeyRound,
  Send,
  LifeBuoy,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { useForgotPasswordMutation } from "@/redux/query/auth-query";
import { useGlobalContext } from "@/context/GlobalContext";
import { useAlert } from "@/context/AlertContext";
import { validateEmail, getFriendlyErrorMessage } from "@/lib/auth-validation";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { getAuthTheme } from "@/config/auth-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { selectIsDark } from "@/redux/features/themeSlice";
import { getBranding } from "@/config/branding";

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS & SAFE COLOR HELPER
   ══════════════════════════════════════════════════════════ */
const V = getAuthTheme();

/**
 * Converts standard 6-digit hex string (#RRGGBB) to safe rgba(r,g,b,alpha).
 * This ensures 100% reliable rendering on Android hardware rendering layers
 * without alpha hex string (#RRGGBBAA) parsing bugs.
 */
function toRgba(hex: string, alpha: number): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  accentColor: string;
  cardColor: string;
  textPrimary: string;
  textSecondary: string;
}

const FAQItem = React.memo(function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  accentColor,
  cardColor,
  textPrimary,
  textSecondary,
}: FAQItemProps) {
  return (
    <View
      style={{
        backgroundColor: cardColor,
        borderRadius: 16,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 18,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: isOpen ? toRgba(accentColor, 0.15) : "transparent",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Info size={16} color={isOpen ? accentColor : textSecondary} strokeWidth={2} />
          </View>
          <Text
            weight="Bold"
            style={{
              fontSize: 14.5,
              color: textPrimary,
              flex: 1,
            }}
          >
            {question}
          </Text>
        </View>
        {isOpen ? (
          <ChevronUp size={18} color={accentColor} strokeWidth={2.5} />
        ) : (
          <ChevronDown size={18} color={textSecondary} strokeWidth={2.5} />
        )}
      </TouchableOpacity>
      {isOpen && (
        <View
          style={{
            paddingHorizontal: 18,
            paddingBottom: 18,
            paddingTop: 2,
          }}
        >
          <Text
            weight="Medium"
            style={{
              fontSize: 13.5,
              color: textSecondary,
              lineHeight: 22,
            }}
          >
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
});

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDark = useSelector(selectIsDark);
  const branding = getBranding();

  const [forgotPassword] = useForgotPasswordMutation();
  const { user } = useGlobalContext();
  const { showError, showSuccess } = useAlert();

  const isWeb = Platform.OS === "web";
  const isTablet = width >= 768;
  const isLargeDesktop = width >= 1100;

  // Derived validation state
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showValidation = email.length > 0;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/home");
    }
  }, [user, router]);

  const handleResetPassword = useCallback(async () => {
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      showError("Invalid Email", emailCheck.error || "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      showSuccess(
        "Check your inbox",
        "If an account exists for that email, we've sent a password reset link. It may take a few minutes to arrive.",
        [
          {
            text: "Return to Login",
            style: "default",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error: any) {
      showError("Account Recovery Failed", getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [email, forgotPassword, showError, showSuccess, router]);

  const handleContactSupport = useCallback(() => {
    const supportEmail = branding.urls.supportEmail || "support@langoprep.io";
    Linking.openURL(`mailto:${supportEmail}?subject=Account%20Recovery%20Assistance`);
  }, [branding]);

  const faqList = [
    {
      question: "I don't remember which email address I used",
      answer:
        "Check your other email inboxes for past receipts, welcome messages, or newsletters from LangoPrep. If you originally signed up using Google or Apple, you can head back to the login screen and use social login for instant access without a password.",
    },
    {
      question: "How long does the recovery link take to arrive?",
      answer:
        "Our secure recovery links are dispatched immediately and typically arrive within 60 seconds. Please make sure to check your Spam, Junk, or Promotions folders if you do not see it in your main inbox.",
    },
    {
      question: "Can I sign in without resetting my password?",
      answer:
        "Yes! If your account is linked to a Google or Apple account, simply navigate back to the sign-in screen and tap 'Continue with Google' or 'Sign in with Apple' to log in without needing a password.",
    },
  ];

  /* ── Card 1: Hero Banner (Flat, Clean, No Borders, No Shadows) ── */
  const heroCard = (
    <View
      style={{
        width: "100%",
        backgroundColor: V.card,
        borderRadius: 28,
        paddingHorizontal: isTablet ? 36 : 24,
        paddingVertical: isTablet ? 36 : 28,
        alignItems: "center",
      }}
    >
      {/* Status Badge — Clean, no sparkles, no borders */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: V.bgSubtle,
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <Lock size={13} color={V.textSecondary} strokeWidth={2.5} style={{ marginRight: 6 }} />
        <Text weight="Bold" style={{ fontSize: 11, color: V.textSecondary, letterSpacing: 1.2 }}>
          ACCOUNT RECOVERY PORTAL
        </Text>
      </View>

      {/* Handcrafted Vector Security Emblem (100% RGB safe for Android) */}
      <View
        style={{
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: toRgba(V.accent, 0.08),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: toRgba(V.accent, 0.16),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: V.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <KeyRound size={26} color={V.textOnAccent} strokeWidth={2.2} />
          </View>
        </View>
      </View>

      <Text
        weight="Black"
        style={{
          fontSize: isTablet ? 28 : 24,
          color: V.textPrimary,
          textAlign: "center",
          letterSpacing: -0.6,
          marginBottom: 10,
        }}
      >
        Locked out? Let's get you back in.
      </Text>

      <Text
        weight="Medium"
        style={{
          fontSize: 14.5,
          color: V.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          maxWidth: 380,
        }}
      >
        We'll dispatch a secure, one-click recovery link directly to your email inbox. No complicated steps required.
      </Text>
    </View>
  );

  /* ── Card 2: Interactive Form Card (Flat, Clean, No Borders, No Shadows) ── */
  const formCard = (
    <View
      style={{
        width: "100%",
        backgroundColor: V.card,
        borderRadius: 28,
        paddingHorizontal: isTablet ? 36 : 24,
        paddingVertical: isTablet ? 36 : 28,
      }}
    >
      <Text
        weight="Bold"
        style={{
          fontSize: 20,
          color: V.textPrimary,
          marginBottom: 6,
        }}
      >
        Send Recovery Link
      </Text>
      <Text
        weight="Medium"
        style={{
          fontSize: 14,
          color: V.textSecondary,
          marginBottom: 24,
        }}
      >
        Enter your account email to begin recovery.
      </Text>

      {/* Email Input Label */}
      <Text
        weight="Bold"
        style={{
          fontSize: 13,
          color: V.textPrimary,
          marginBottom: 8,
          marginLeft: 2,
        }}
      >
        Email Address
      </Text>

      {/* Email Input Box */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 58,
          borderRadius: 28,
          backgroundColor: isFocused ? V.inputBgFocus : V.inputBg,
          paddingHorizontal: 16,
          marginBottom: 10,
          borderWidth: isFocused ? 1.5 : 0,
          borderColor: isFocused ? V.accent : "transparent",
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: isFocused ? V.accentSoft : V.bgSubtle,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Mail size={18} color={isFocused ? V.accent : V.textMuted} strokeWidth={2} />
        </View>

        <TextInput
          weight="Medium"
          style={{
            flex: 1,
            height: "100%",
            fontSize: 15.5,
            color: V.textPrimary,
          }}
          placeholder="name@example.com"
          placeholderTextColor={V.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={V.accent}
        />
      </View>

      {/* Live Validation Indicator Bar */}
      {showValidation && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
            paddingHorizontal: 4,
          }}
        >
          {emailValid ? (
            <>
              <CheckCircle2 size={15} color="#10B981" strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text weight="Bold" style={{ fontSize: 12.5, color: "#10B981" }}>
                Valid email format
              </Text>
            </>
          ) : (
            <>
              <AlertCircle size={15} color="#F59E0B" strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text weight="Bold" style={{ fontSize: 12.5, color: "#F59E0B" }}>
                Please enter a complete email address
              </Text>
            </>
          )}
        </View>
      )}
      {!showValidation && <View style={{ height: 12 }} />}

      {/* Submit Action Button */}
      <Pressable
        onPress={handleResetPassword}
        disabled={loading}
        style={({ pressed }) => ({
          borderRadius: 28,
          overflow: "hidden",
          opacity: loading ? 0.8 : pressed ? 0.92 : 1,
        })}
      >
        <LinearGradient
          colors={loading ? ["#9CA3AF", "#6B7280"] : [V.accent, V.accentDark]}
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
          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color={V.textOnAccent} />
              <Text weight="Bold" style={{ color: V.textOnAccent, fontSize: 16 }}>
                Securing & Sending...
              </Text>
            </View>
          ) : (
            <>
              <Text weight="Bold" style={{ color: V.textOnAccent, fontSize: 16, marginRight: 8 }}>
                Send Secure Reset Link
              </Text>
              <ArrowRight size={18} color={V.textOnAccent} strokeWidth={2.5} />
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* Security Guarantee Strip */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: toRgba(V.dividerColor, 0.6),
          gap: 6,
        }}
      >
        <Lock size={13} color={V.textMuted} strokeWidth={2} />
        <Text weight="Medium" style={{ fontSize: 12, color: V.textMuted }}>
          256-bit SSL encrypted • Never shared
        </Text>
      </View>
    </View>
  );

  /* ── Card 3: 3-Step Guide (Flat, Clean, No Borders, No Shadows) ── */
  const guideCard = (
    <View
      style={{
        width: "100%",
        backgroundColor: V.card,
        borderRadius: 24,
        paddingHorizontal: isTablet ? 36 : 24,
        paddingVertical: 24,
      }}
    >
      <Text
        weight="Bold"
        style={{
          fontSize: 12.5,
          color: V.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          marginBottom: 20,
        }}
      >
        How Recovery Works
      </Text>

      <View style={{ gap: 18 }}>
        {/* Step 1 */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: toRgba(V.accent, 0.12),
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Mail size={18} color={V.accent} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="Bold" style={{ fontSize: 14, color: V.textPrimary }}>
              1. Enter Registered Email
            </Text>
            <Text weight="Medium" style={{ fontSize: 12.5, color: V.textSecondary, marginTop: 2 }}>
              Provide the email associated with your LangoPrep account.
            </Text>
          </View>
        </View>

        {/* Step 2 */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: toRgba(V.accent, 0.12),
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Send size={18} color={V.accent} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="Bold" style={{ fontSize: 14, color: V.textPrimary }}>
              2. Check Your Inbox
            </Text>
            <Text weight="Medium" style={{ fontSize: 12.5, color: V.textSecondary, marginTop: 2 }}>
              Click the magic recovery link sent to your email address.
            </Text>
          </View>
        </View>

        {/* Step 3 */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: toRgba(V.accent, 0.12),
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <KeyRound size={18} color={V.accent} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="Bold" style={{ fontSize: 14, color: V.textPrimary }}>
              3. Set New Password
            </Text>
            <Text weight="Medium" style={{ fontSize: 12.5, color: V.textSecondary, marginTop: 2 }}>
              Choose a new secure password and resume learning instantly.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  /* ── Card 4: Troubleshooting FAQ (Flat, Clean, No Borders, No Shadows) ── */
  const faqCard = (
    <View
      style={{
        width: "100%",
        backgroundColor: V.card,
        borderRadius: 24,
        paddingHorizontal: isTablet ? 36 : 24,
        paddingVertical: 24,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <HelpCircle size={18} color={V.accent} strokeWidth={2.2} style={{ marginRight: 8 }} />
        <Text weight="Bold" style={{ fontSize: 16, color: V.textPrimary }}>
          Troubleshooting & FAQ
        </Text>
      </View>

      {faqList.map((faq, index) => (
        <FAQItem
          key={index}
          question={faq.question}
          answer={faq.answer}
          isOpen={openFaqIndex === index}
          onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
          accentColor={V.accent}
          cardColor={V.bgSubtle}
          textPrimary={V.textPrimary}
          textSecondary={V.textSecondary}
        />
      ))}

      {/* Contact Support Option */}
      <TouchableOpacity
        onPress={handleContactSupport}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: toRgba(V.accent, 0.12),
          paddingVertical: 14,
          borderRadius: 28,
          marginTop: 6,
        }}
      >
        <LifeBuoy size={16} color={V.accent} strokeWidth={2.2} style={{ marginRight: 8 }} />
        <Text weight="Bold" style={{ fontSize: 14, color: V.accent }}>
          Still need help? Contact Support Team
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Safe area top padding ensures top nav bar NEVER collides with status bar or camera notch
  const topPadding = Math.max(insets.top + 16, isWeb ? 40 : 28);
  const bottomPadding = Math.max(insets.bottom + 32, 40);

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
            alignItems: "center",
            paddingHorizontal: isTablet ? 40 : 20,
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Navigation Bar (Safely below status bar notch) ── */}
          <View
            style={{
              width: "100%",
              maxWidth: isLargeDesktop ? 1000 : 540,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: V.card,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 28,
              }}
            >
              <ArrowLeft size={18} color={V.textPrimary} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text weight="Bold" style={{ fontSize: 14, color: V.textPrimary }}>
                Back to Sign In
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: toRgba(V.accent, 0.12),
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 28,
              }}
            >
              <ShieldCheck size={16} color={V.accent} strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text weight="Bold" style={{ fontSize: 13, color: V.accent }}>
                Secure Recovery
              </Text>
            </View>
          </View>

          {/* ── Main Layout Container ── */}
          {isLargeDesktop ? (
            /* Desktop Split Screen Layout */
            <View
              style={{
                width: "100%",
                maxWidth: 1000,
                flexDirection: "row",
                gap: 24,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1.1, width: "100%", gap: 20 }}>
                {heroCard}
                {guideCard}
              </View>
              <View style={{ flex: 1, width: "100%", gap: 20 }}>
                {formCard}
                {faqCard}
              </View>
            </View>
          ) : (
            /* Mobile / Tablet Column Layout (Hero -> Form -> Guide -> FAQ) */
            <View
              style={{
                width: "100%",
                maxWidth: 540,
                gap: 20,
                alignItems: "center",
              }}
            >
              {heroCard}
              {formCard}
              {guideCard}
              {faqCard}
            </View>
          )}

          {/* ── Footer ── */}
          <View
            style={{
              marginTop: 28,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text weight="Medium" style={{ fontSize: 15, color: V.textSecondary }}>
              Remember your password?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text weight="Bold" style={{ fontSize: 15, color: V.accent }}>
                Sign In Instead
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ResetPassword;
