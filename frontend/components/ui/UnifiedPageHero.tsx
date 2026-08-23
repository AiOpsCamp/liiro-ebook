import React from "react";
import { View, Pressable, useWindowDimensions, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { safeGoBack } from "@/lib/navigation";
import { ArrowLeft, Search, X } from "lucide-react-native";
import { AppText as Text, AppTextInput as TextInput } from "@/components/ui/AppText";
import { useSelector } from "react-redux";
import { selectIsDark } from "@/redux/features/themeSlice";
import { AppColors } from "@/constants/Colors";

export type HeroThemeVariant = "purple" | "emerald" | "amber" | "indigo" | "blue" | "teal";

const THEME_GRADIENTS: Record<
  HeroThemeVariant,
  { dark: [string, string, string]; light: [string, string, string]; accent: string }
> = {
  purple: {
    dark: ["#2E1065", "#1E1B4B", "#3B0764"],
    light: ["#4C1D95", "#6D28D9", "#7C3AED"],
    accent: "#DDD6FE",
  },
  emerald: {
    dark: ["#064E3B", "#022C22", "#065F46"],
    light: ["#047857", "#059669", "#10B981"],
    accent: "#A7F3D0",
  },
  amber: {
    dark: ["#451A03", "#78350F", "#B45309"],
    light: ["#B45309", "#D97706", "#F59E0B"],
    accent: "#FDE68A",
  },
  indigo: {
    dark: ["#1E1B4B", "#312E81", "#4338CA"],
    light: ["#3730A3", "#4338CA", "#6366F1"],
    accent: "#C7D2FE",
  },
  blue: {
    dark: ["#0C4A6E", "#075985", "#0284C7"],
    light: ["#0369A1", "#0284C7", "#38BDF8"],
    accent: "#BAE6FD",
  },
  teal: {
    dark: ["#134E4A", "#115E59", "#0D9488"],
    light: ["#0F766E", "#0D9488", "#14B8A6"],
    accent: "#99F6E4",
  },
};

export interface UnifiedPageHeroStat {
  icon?: any;
  label: string | number;
  color?: string;
}

export interface UnifiedPageHeroTab {
  key: string;
  label: string;
  count?: number;
}

export interface UnifiedPageHeroProps {
  title: string;
  subtitle?: string;
  icon?: any;
  badgeText?: string;
  themeVariant?: HeroThemeVariant;
  customGradient?: [string, string, string];
  stats?: UnifiedPageHeroStat[];
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  tabs?: UnifiedPageHeroTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  actionButton?: {
    label: string;
    icon?: any;
    onPress: () => void;
  };
  showBackButton?: boolean;
  backButtonFallback?: string;
}

export const UnifiedPageHero: React.FC<UnifiedPageHeroProps> = ({
  title,
  subtitle,
  icon: HeroIcon,
  badgeText,
  themeVariant = "purple",
  customGradient,
  stats = [],
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  tabs,
  activeTab,
  onTabChange,
  actionButton,
  showBackButton = true,
  backButtonFallback = "/exercises/all",
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useSelector(selectIsDark);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  const themeConfig = THEME_GRADIENTS[themeVariant] || THEME_GRADIENTS.purple;
  const gradientColors = customGradient || (isDark ? themeConfig.dark : themeConfig.light);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + (isDesktop ? 16 : 12),
        paddingBottom: tabs && tabs.length > 0 ? 12 : 20,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1280,
          alignSelf: "center",
          paddingHorizontal: isDesktop ? 24 : 16,
        }}
      >
        {/* Top Rail: Back Button, Title/Badge, Actions */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: searchQuery !== undefined || (stats && stats.length > 0) ? 14 : 0,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            {showBackButton && (
              <Pressable
                onPress={() => safeGoBack(backButtonFallback || "/exercises/all")}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: pressed
                    ? "rgba(255, 255, 255, 0.22)"
                    : "rgba(255, 255, 255, 0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
                })}
              >
                <ArrowLeft size={20} color="#FFFFFF" />
              </Pressable>
            )}

            <View style={{ flex: 1 }}>
              {badgeText && (
                <Text
                  weight="Bold"
                  style={{
                    color: themeConfig.accent,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 2,
                  }}
                >
                  {badgeText}
                </Text>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {HeroIcon && <HeroIcon size={isDesktop ? 28 : 22} color="#FFFFFF" />}
                <Text
                  numberOfLines={1}
                  weight="Black"
                  style={{
                    color: "#FFFFFF",
                    fontSize: isDesktop ? 30 : isTablet ? 24 : 20,
                    letterSpacing: -0.5,
                  }}
                >
                  {title}
                </Text>
              </View>
              {subtitle && (
                <Text
                  numberOfLines={1}
                  weight="Medium"
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {actionButton && (
            <Pressable
              onPress={actionButton.onPress}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.22)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              })}
            >
              {actionButton.icon && <actionButton.icon size={16} color="#FFFFFF" />}
              <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 13 }}>
                {actionButton.label}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Stats Rail & Search Input */}
        {(stats.length > 0 || searchQuery !== undefined) && (
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              alignItems: isDesktop ? "center" : "stretch",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 4,
            }}
          >
            {stats.length > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}
              >
                {stats.map((st, idx) => {
                  const StIcon = st.icon;
                  return (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: "rgba(0, 0, 0, 0.18)",
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.12)",
                      }}
                    >
                      {StIcon && <StIcon size={13} color={st.color || themeConfig.accent} />}
                      <Text weight="Bold" style={{ color: "#FFFFFF", fontSize: 12 }}>
                        {st.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {searchQuery !== undefined && onSearchChange && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.22)",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 42,
                  maxWidth: isDesktop ? 320 : "100%",
                  width: "100%",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.15)",
                }}
              >
                <Search size={16} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={onSearchChange}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.55)"
                  style={{
                    flex: 1,
                    color: "#FFFFFF",
                    fontSize: 13,
                    paddingVertical: 0,
                  }}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => onSearchChange("")} hitSlop={8}>
                    <X size={16} color="rgba(255, 255, 255, 0.7)" />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {/* Tabs Filter Rail */}
        {tabs && tabs.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={tabs}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const isActive = item.key === activeTab;
                return (
                  <Pressable
                    onPress={() => onTabChange?.(item.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.15)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text
                      weight="Bold"
                      style={{
                        color: isActive ? "#000000" : "#FFFFFF",
                        fontSize: 13,
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.count !== undefined && (
                      <View
                        style={{
                          backgroundColor: isActive
                            ? "rgba(0, 0, 0, 0.08)"
                            : "rgba(255, 255, 255, 0.25)",
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          weight="Bold"
                          style={{
                            color: isActive ? "#000000" : "#FFFFFF",
                            fontSize: 11,
                          }}
                        >
                          {item.count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

export default UnifiedPageHero;
