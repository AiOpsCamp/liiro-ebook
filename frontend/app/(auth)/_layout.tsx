import React from "react";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="login" options={{ headerShown: false, animation: "none" }} />
      <Stack.Screen name="register" options={{ headerShown: false, animation: "none" }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false, animation: "none" }} />
    </Stack>
  );
}
