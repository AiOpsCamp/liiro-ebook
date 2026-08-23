import { AppText as Text } from '@/components/ui/AppText';
import React, { useEffect } from "react";
import {
  View,
  Pressable,
  ScrollView,
  ToastAndroid,
  Platform,
  Alert,
} from "react-native";
import * as Updates from "expo-updates";

// Import your custom logger
import logger from "@/lib/discord-logger";
import { SafeAreaView } from "react-native-safe-area-context";

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
  retry?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, retry }) => {
  // 1. Log the error to Discord as soon as this component mounts
  useEffect(() => {
    logger.error("Global Error Boundary Caught Exception", JSON.stringify(error));
  }, [error]);

  const reloadApp = async (): Promise<void> => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Could not reload app", ToastAndroid.SHORT);
      } else {
        Alert.alert("Error", "Could not reload app");
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6 bg-white">
        {/* Visual Icon / Header */}
        <View className="bg-violet-100 p-6 rounded-full mb-6 items-center justify-center shadow-sm">
          <Text className="text-4xl">👾</Text>
        </View>

        <Text className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Whoops!</Text>

        <Text className="text-base text-slate-500 text-center mb-8 px-4 leading-6">
          Something unexpected happened. We&apos;ve notified our team and are looking
          into it.
        </Text>

        {/* Error Details Card */}
        <View className="w-full bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-8 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-violet-900 font-bold text-sm uppercase tracking-wider">
              Error Details
            </Text>
            <View className="bg-violet-200 px-2 py-1 rounded">
              <Text className="text-xs text-violet-800 font-bold">AUTO-LOGGED</Text>
            </View>
          </View>

          <ScrollView className="max-h-40" showsVerticalScrollIndicator={true}>
            <Text className="text-slate-700 font-semibold mb-1">
              {error.message || "Unknown Error"}
            </Text>
            <Text className="text-slate-500 text-xs font-mono leading-5">
              {error.stack ? error.stack : "Stack trace hidden in production."}
            </Text>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View className="w-full flex-col gap-y-3">
          {/* Primary Action: Reload */}
          <Pressable
            onPress={() => reloadApp()}
            className="w-full bg-violet-600 active:bg-violet-700 py-4 rounded-xl items-center shadow-lg shadow-violet-200"
          >
            <Text className="text-white text-lg font-bold">Restart Application</Text>
          </Pressable>

          {/* Secondary Action: Try Again (Reset Error Boundary) */}
          <Pressable
            onPress={resetError || retry}
            className="w-full bg-white border border-slate-200 active:bg-slate-50 py-4 rounded-xl items-center"
          >
            <Text className="text-slate-700 text-lg font-semibold">Try Again</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
