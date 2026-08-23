import { AppText as Text } from "@/components/ui/AppText";
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Mail, CheckCircle, X } from "lucide-react-native";
import { useResendVerificationMutation } from "@/redux/query/auth-query";
import { useAlert } from "@/context/AlertContext";
import { useAppSelector } from "@/redux/hook";
import { selectIsDark } from "@/redux/features/themeSlice";
import { getCurrentEnvironment } from "@/config/environments";

/* ─────────── Brand Palette ─────────── */

function brandAccent() {
  const env = getCurrentEnvironment();
  if (env === "langoprep") return { primary: "#F97316", light: "#FFF7ED", border: "#FED7AA", text: "#9A3412" };
  if (env === "ieltscamp") return { primary: "#00BFFF", light: "#F0F9FF", border: "#BAE6FD", text: "#075985" };
  return { primary: "#8B5CF6", light: "#F5F3FF", border: "#DDD6FE", text: "#5B21B6" };
}

/* ─────────── Types ─────────── */

interface EmailVerificationBannerProps {
  email: string;
  isVerified: boolean;
  idToken: string;
  dismissible?: boolean;
}

/* ─────────── Component ─────────── */

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  email,
  isVerified,
  idToken,
  dismissible = true,
}) => {
  const { width } = useWindowDimensions();
  const isDark = useAppSelector(selectIsDark);
  const isWeb = Platform.OS === "web";
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const maxWidth = isWeb ? (isDesktop ? 980 : isTablet ? 820 : undefined) : undefined;

  const brand = useMemo(() => brandAccent(), []);

  const [resendVerification, { isLoading }] = useResendVerificationMutation();
  const { showSuccess, showError } = useAlert();
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const maskedEmail = useMemo(() => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (!domain) return email;
    if (name.length <= 2) return `${name}@${domain}`;
    return `${name.slice(0, 2)}…@${domain}`;
  }, [email]);

  const handleResend = useCallback(async () => {
    try {
      await resendVerification({ idToken }).unwrap();
      setSent(true);
      showSuccess("Verification Email Sent", "Check your inbox and click the verification link.");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to send verification email. Please try again.";
      showError("Error", message);
    }
  }, [idToken, resendVerification, showError, showSuccess]);

  if (isVerified || dismissed) return null;

  /* ─── Theme tokens ─── */
  const bg = isDark ? "rgba(255,255,255,0.04)" : brand.light;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : brand.border;
  const titleColor = isDark ? "#F1F3F9" : brand.text;
  const subColor = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const emailPillBg = isDark ? "rgba(255,255,255,0.06)" : `${brand.primary}0D`;
  const emailPillBorder = isDark ? "rgba(255,255,255,0.08)" : `${brand.primary}1A`;
  const emailColor = isDark ? "rgba(255,255,255,0.65)" : brand.text;
  const iconColor = isDark ? brand.primary : brand.primary;
  const dismissBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const dismissBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const dismissIcon = isDark ? "rgba(255,255,255,0.40)" : "#9CA3AF";
  const btnBg = sent ? "#059669" : brand.primary;

  return (
    <View
      style={{
        width: "100%",
        maxWidth,
        alignSelf: "center",
        paddingHorizontal: isWeb ? 12 : 16,
        marginTop: 10,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor,
          backgroundColor: bg,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: isDark ? `${brand.primary}18` : `${brand.primary}12`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mail size={18} color={iconColor} />
        </View>

        {/* Text content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text
              style={{ color: titleColor, fontWeight: "800", fontSize: 13 }}
              numberOfLines={1}
            >
              Verify your email
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: emailPillBg,
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: emailPillBorder,
              }}
            >
              <Text style={{ color: emailColor, fontSize: 10, fontWeight: "700" }} numberOfLines={1}>
                {maskedEmail}
              </Text>
            </View>
          </View>
          {!sent && (
            <Text
              style={{ color: subColor, fontSize: 11, marginTop: 3, lineHeight: 15, fontWeight: "500" }}
              numberOfLines={1}
            >
              Verify to unlock all features
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={handleResend}
            disabled={isLoading || sent}
            accessibilityRole="button"
            accessibilityLabel="Resend verification email"
            style={{
              height: 34,
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: btnBg,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : sent ? (
              <CheckCircle size={14} color="#FFF" />
            ) : null}
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
              {sent ? "Sent ✓" : "Resend"}
            </Text>
          </Pressable>

          {dismissible && (
            <Pressable
              onPress={() => setDismissed(true)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss banner"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: dismissBg,
                borderWidth: 1,
                borderColor: dismissBorder,
              }}
            >
              <X size={14} color={dismissIcon} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default EmailVerificationBanner;
