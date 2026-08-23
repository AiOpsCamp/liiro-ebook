import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";
import { store } from "@/redux/store";
import GlobalProvider, { useGlobalContext } from "@/context/GlobalContext";
import { AlertProvider } from "@/context/AlertContext";
import "../global.css";

function RootNavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useGlobalContext();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

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
