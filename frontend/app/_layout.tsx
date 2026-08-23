import React from "react";
import { Provider } from "react-redux";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { store } from "@/redux/store";
import GlobalProvider from "@/context/GlobalContext";
import { AlertProvider } from "@/context/AlertContext";
import "../global.css";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GlobalProvider>
        <AlertProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <StatusBar style="light" />
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
              </Stack>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </AlertProvider>
      </GlobalProvider>
    </Provider>
  );
}
