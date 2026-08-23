import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getAuthTheme } from "@/config/auth-theme";

export function AuthBackground() {
  const V = getAuthTheme();

  return (
    <View 
      style={[StyleSheet.absoluteFill, { backgroundColor: V.bg, overflow: "hidden" }]} 
      pointerEvents="none"
    >
      {/* Primary mesh gradient: soft brand tint from top-left to bottom-right */}
      <LinearGradient
        colors={[V.accentLight + "12", V.bg]} // 12 is ~7% opacity of the brand light color
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Secondary soft ambient highlight: top-right to bottom-left */}
      <LinearGradient
        colors={[V.accentSoft, "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle overlay for deep smooth texture */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]} />
    </View>
  );
}
