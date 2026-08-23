import { AppText as Text } from '@/components/ui/AppText';
import type React from "react";
import { Pressable, View, Image, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import GoogleAuthService from "@/services/google-auth.service";
import { auth } from "@/config/firebase.init";
import { saveToken } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { useGoogleAuthMutation } from "@/redux/query/auth-query";
import themeColors from "@/constants/theme-colors.json";

import { AppColors } from "@/constants/Colors";
const COLORS = {
  sunbeam: themeColors["sunbeam"],
  lemonLeaf: themeColors["lemon-leaf"],
  meadowGreen: themeColors["meadow-green"],
  forestCore: themeColors["forest-core"],
  white: themeColors["white"],
  gray: {
    100: themeColors["gray-100"],
    200: themeColors["gray-200"],
    600: themeColors["gray-600"],
    700: themeColors["gray-700"]}};

// No longer needed as we use GoogleAuthService

interface GoogleLoginButtonProps {
  onSuccess: (userData: any) => void;
  onError: (title: string, message: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  buttonText?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  loading,
  setLoading,
  buttonText = "Continue with Google"}) => {
  const [googleAuth] = useGoogleAuthMutation();

  const handleGoogleLogin = async (): Promise<void> => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    try {
      const result = await GoogleAuthService.signIn();

      const res = await googleAuth({ token: result.idToken }).unwrap();

      const accessToken =
        res?.data?.accessToken ?? (res as any)?.accessToken ?? (res as any)?.token?.accessToken;

      if (!accessToken) throw new Error("Invalid response from server");

      await saveToken("token", accessToken);
      onSuccess(res);
    } catch (error: any) {
      if (error?.code === "sign_in_cancelled" || error?.message === "SIGN_IN_CANCELLED") return;
      const errorMsg = error?.data?.message || error?.message || "Failed to sign in with Google. Please try again.";
      onError("Google Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleGoogleLogin}
      disabled={loading}
      className="py-5 rounded-2xl items-center justify-center mb-6 border-2"
      style={{
        backgroundColor: loading ? COLORS.gray[100] : COLORS.white,
        borderColor: COLORS.gray[200],
        shadowColor: COLORS.gray[600],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: loading ? 0 : 0.1,
        shadowRadius: 4,
        elevation: loading ? 0 : 2}}
    >
      {loading ? (
        <View className="flex-row items-center">
          <MaterialIcons name="hourglass-empty" size={20} color={COLORS.gray[600]} />
          <Text className="font-bold text-lg ml-2" style={{ color: COLORS.gray[600] }}>
            Connecting...
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center">
          <Image
            source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
            className="w-6 h-6 mr-3"
          />
          <Text className="font-bold text-lg" style={{ color: COLORS.gray[700] }}>
            {buttonText}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default GoogleLoginButton;
