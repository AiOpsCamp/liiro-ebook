import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";
import { useFonts, Lora_400Regular, Lora_600SemiBold, Lora_700Bold, Lora_400Regular_Italic } from "@expo-google-fonts/lora";
import { PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from "@expo-google-fonts/jetbrains-mono";
import { store } from "@/redux/store";
import GlobalProvider, { useGlobalContext } from "@/context/GlobalContext";
import { AlertProvider } from "@/context/AlertContext";
import "../global.css";

function RootNavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useGlobalContext();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Lora: Lora_400Regular,
    "Lora-SemiBold": Lora_600SemiBold,
    "Lora-Bold": Lora_700Bold,
    "Lora-Italic": Lora_400Regular_Italic,
    PlayfairDisplay: PlayfairDisplay_400Regular,
    "PlayfairDisplay-SemiBold": PlayfairDisplay_600SemiBold,
    "PlayfairDisplay-Bold": PlayfairDisplay_700Bold,
    JetBrainsMono: JetBrainsMono_400Regular,
    "JetBrainsMono-SemiBold": JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    if (isLoading || typeof window === "undefined") return;

    const isAuthenticated = Boolean(
      user && (user.data || user.email || user.username || user._id || user.id)
    );

    const firstSegment = (segments[0] as string) || "";
    const isAuthRoute =
      firstSegment === "(auth)" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/reset-password");

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isAuthRoute) {
      router.replace("/");
    }
  }, [user, isLoading, segments, pathname, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GlobalProvider>
        <AlertProvider>
          <GestureHandlerRootView style={{ flex: 1, width: "100%", height: "100%" }}>
            <SafeAreaProvider>
              <StatusBar style="light" />
              <RootNavigationGuard>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#080E1A" },
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="explore" />
                  <Stack.Screen name="details/[slug]" />
                  <Stack.Screen name="read/[slug]" />
                  <Stack.Screen name="author/[slug]" />
                  <Stack.Screen name="category/[slug]" />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                </Stack>
              </RootNavigationGuard>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </AlertProvider>
      </GlobalProvider>
    </Provider>
  );
}
