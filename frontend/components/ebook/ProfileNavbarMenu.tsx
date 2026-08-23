import React, { useState, useCallback } from "react";
import { View, Text, Pressable, Modal, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  LogOut,
  Settings,
  Bookmark,
  Moon,
  Sun,
  Crown,
  Sparkles,
  ChevronRight,
  X,
  BookOpen,
  Flame,
  Zap,
  Globe,
} from "lucide-react-native";
import { useGlobalContext } from "@/context/GlobalContext";
import { selectIsDark, selectThemeTokens, setThemeMode } from "@/redux/features/themeSlice";

export default function ProfileNavbarMenu() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, signOut } = useGlobalContext();

  const isDark = useSelector(selectIsDark);
  const tokens = useSelector(selectThemeTokens);

  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // User details fallback
  const userData = user?.data || user || {};
  const name = userData?.name || userData?.username || userData?.first_name || "Liiro Reader";
  const email = userData?.email || "reader@liiro.io";
  const avatarUrl = userData?.picture || userData?.avatarUrl || null;
  const initial = (name || "L").charAt(0).toUpperCase();

  const xpScore = userData?.xp_score || 1250;
  const currentStreak = userData?.streak?.current || 7;

  const surfaceColor = isDark ? "#111827" : "#FFFFFF";
  const cardColor = isDark ? "#1E293B" : "#F8FAFC";
  const textColor = isDark ? "#F1F5F9" : "#0F172A";
  const textSubColor = isDark ? "#94A3B8" : "#64748B";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const accentColor = tokens?.accentPrimary || "#0EA5E9";

  const handleToggleTheme = () => {
    dispatch(setThemeMode(isDark ? "light" : "dark"));
  };

  const handleConfirmLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      if (signOut) {
        await signOut();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      setIsOpen(false);
    }
  }, [signOut]);

  return (
    <>
      {/* ── NAVBAR TRIGGER BUTTON ─────────────────────────────────── */}
      <Pressable
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 100,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
          opacity: pressed ? 0.75 : 1,
        })}
        accessibilityLabel="User profile menu"
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} />
        ) : (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: accentColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>{initial}</Text>
          </View>
        )}
        <Text style={{ color: textColor, fontWeight: "600", fontSize: 13 }}>{name.split(" ")[0]}</Text>
        <Crown size={13} color="#F59E0B" />
      </Pressable>

      {/* ── PROFILE MODAL DIALOG ──────────────────────────────────── */}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View
            style={{
              width: "100%",
              maxWidth: 440,
              borderRadius: 24,
              backgroundColor: surfaceColor,
              padding: 24,
              borderWidth: 1,
              borderColor,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color={accentColor} />
                <Text style={{ fontSize: 18, fontWeight: "700", color: textColor }}>Profile & Account</Text>
              </View>
              <Pressable
                onPress={() => setIsOpen(false)}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <X size={18} color={textSubColor} />
              </Pressable>
            </View>

            {/* User Info Card */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: 16,
                borderRadius: 16,
                backgroundColor: cardColor,
                borderWidth: 1,
                borderColor,
                marginBottom: 20,
              }}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: accentColor,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 22 }}>{initial}</Text>
                </View>
              )}

              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: textColor }} numberOfLines={1}>
                    {name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 100,
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                    }}
                  >
                    <Crown size={11} color="#F59E0B" />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#F59E0B" }}>PRO</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12.5, color: textSubColor }} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              <View
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: cardColor,
                  borderWidth: 1,
                  borderColor,
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <Zap size={14} color="#F59E0B" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: textColor }}>{xpScore}</Text>
                </View>
                <Text style={{ fontSize: 11, color: textSubColor, fontWeight: "600" }}>Reading XP</Text>
              </View>

              <View
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: cardColor,
                  borderWidth: 1,
                  borderColor,
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <Flame size={14} color="#EF4444" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: textColor }}>{currentStreak} Days</Text>
                </View>
                <Text style={{ fontSize: 11, color: textSubColor, fontWeight: "600" }}>Streak</Text>
              </View>

              <View
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: cardColor,
                  borderWidth: 1,
                  borderColor,
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <BookOpen size={14} color="#10B981" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: textColor }}>864</Text>
                </View>
                <Text style={{ fontSize: 11, color: textSubColor, fontWeight: "600" }}>Catalog</Text>
              </View>
            </View>

            {/* Menu Options List */}
            <View style={{ gap: 8, marginBottom: 20 }}>
              {/* Theme Toggle Option */}
              <Pressable
                onPress={handleToggleTheme}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: cardColor,
                  borderWidth: 1,
                  borderColor,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  {isDark ? <Sun size={17} color="#F59E0B" /> : <Moon size={17} color={accentColor} />}
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: textColor }}>
                    {isDark ? "Light Appearance" : "Dark Appearance"}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: textSubColor }}>{isDark ? "DARK" : "LIGHT"}</Text>
                </View>
              </Pressable>

              {/* Bookmarks Option */}
              <Pressable
                onPress={() => {
                  setIsOpen(false);
                  router.push("/explore");
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: cardColor,
                  borderWidth: 1,
                  borderColor,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Bookmark size={17} color={accentColor} />
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: textColor }}>Explore & Saved Books</Text>
                </View>
                <ChevronRight size={16} color={textSubColor} />
              </Pressable>

              {/* Language Preferences Option */}
              <Pressable
                onPress={() => {
                  setIsOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: cardColor,
                  borderWidth: 1,
                  borderColor,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Globe size={17} color="#10B981" />
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: textColor }}>Language Preferences</Text>
                </View>
                <Text style={{ fontSize: 12, color: textSubColor, fontWeight: "600" }}>English (54+)</Text>
              </Pressable>
            </View>

            {/* Log Out Button */}
            <Pressable
              onPress={() => setShowLogoutConfirm(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: "rgba(239, 68, 68, 0.10)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.25)",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <LogOut size={16} color="#EF4444" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#EF4444" }}>Log Out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── LOGOUT CONFIRMATION DIALOG ───────────────────────────── */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.70)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View
            style={{
              width: "100%",
              maxWidth: 380,
              borderRadius: 24,
              backgroundColor: surfaceColor,
              padding: 24,
              borderWidth: 1,
              borderColor,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.15)", alignItems: "center", justifyContent: "center" }}>
                <LogOut size={18} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: textColor }}>Log Out of Liiro?</Text>
            </View>

            <Text style={{ fontSize: 13.5, color: textSubColor, lineHeight: 20, marginBottom: 20 }}>
              Are you sure you want to log out? You will need to sign in again to sync your reading progress and bookmarks.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setShowLogoutConfirm(false)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9",
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: textColor, fontWeight: "600", fontSize: 14 }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Log Out</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
