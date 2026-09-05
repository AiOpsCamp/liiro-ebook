import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import {
  Headphones,
  Search,
  X,
  BookOpen,
  LayoutGrid,
  List,
  Sparkles,
  Flame,
  ChevronRight,
  Zap,
  Globe,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppText as Text } from "@/components/ui/AppText";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import { useGetStoriesDashboardQuery, useGetAudiobooksQuery } from "@/api/storiesQuery";
import StoryCard from "@/components/ebook/StoryCard";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";
import { getLocalizedText } from "@/utils/getLocalizedText";

export default function AudiobooksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tokens = useSelector(selectThemeTokens);
  const isDark = useSelector(selectIsDark);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const { data: audiobooksApiData, isLoading: isLoadingAudiobooks } = useGetAudiobooksQuery(undefined);
  const { data: dashboardData, isLoading: isLoadingDashboard } = useGetStoriesDashboardQuery(undefined);
  const isLoading = isLoadingAudiobooks && isLoadingDashboard;

  const audiobooks = useMemo(() => {
    if (audiobooksApiData?.data && Array.isArray(audiobooksApiData.data) && audiobooksApiData.data.length > 0) {
      return audiobooksApiData.data;
    }
    if (!dashboardData) return [];
    const all = dashboardData.audiobooks || dashboardData.allPublished || [];
    return all.filter((s: any) => !!(s.hasAudio || s.isAudiobook));
  }, [audiobooksApiData, dashboardData]);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBooks = useMemo(() => {
    if (!audiobooks) return [];
    if (!searchQuery.trim()) return audiobooks;
    const q = searchQuery.toLowerCase().trim();
    return audiobooks.filter(
      (b: any) =>
        getLocalizedText(b.title).toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.tags && b.tags.some((t: any) => getLocalizedText(t).toLowerCase().includes(q)))
    );
  }, [audiobooks, searchQuery]);

  return (
    <View style={{ flex: 1, width: "100%", backgroundColor: "#020617" }}>
      <StatusBar style="light" />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP GLASS NAVIGATION NAVBAR */}
      {/* ───────────────────────────────────────────────────────────── */}
      <View
        style={{
          width: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.08)",
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: 12,
          paddingHorizontal: isWeb ? 32 : 16,
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: contentWidth,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo & Brand */}
          <Pressable
            onPress={() => router.push("/")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: "#8B5CF6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Headphones size={20} color="#FFFFFF" />
            </View>

            <View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: "900",
                  letterSpacing: 1,
                  fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                }}
              >
                LIIRO AUDIO
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600" }}>
                Narrated Audiobook Library
              </Text>
            </View>
          </Pressable>

          {/* Desktop Navigation Links */}
          {isWeb ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/explore")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Explore</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/audiobooks")}>
                <Text style={{ color: "#C084FC", fontSize: 13.5, fontWeight: "700" }}>Audiobooks</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/category")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/series")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Series</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* User Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 18,
                backgroundColor: "rgba(139, 92, 246, 0.15)",
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.35)",
              }}
            >
              <Headphones size={14} color="#C084FC" />
              <Text style={{ color: "#E9D5FF", fontSize: 11.5, fontWeight: "800" }}>AUDIO PLAYER READY</Text>
            </View>

            <ProfileNavbarMenu />
          </View>
        </View>
      </View>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT SCROLL VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: isWeb ? 32 : 16,
          paddingTop: 24,
          paddingBottom: 60,
        }}
      >
        <View style={{ width: "100%", maxWidth: contentWidth }}>
          {/* Breadcrumb Navigation */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <Pressable onPress={() => router.push("/")}>
              <Text style={{ color: "#94A3B8", fontSize: 12.5, fontWeight: "600" }}>Home</Text>
            </Pressable>
            <ChevronRight size={12} color="#64748B" />
            <Text style={{ color: "#C084FC", fontSize: 12.5, fontWeight: "800" }}>
              Audiobook Catalog
            </Text>
          </View>

          {/* Hero Banner Showcase */}
          <View
            style={{
              borderRadius: 28,
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderWidth: 1,
              borderColor: "rgba(139, 92, 246, 0.25)",
              padding: isWeb ? 32 : 20,
              marginBottom: 24,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.25)", "rgba(56, 189, 248, 0.05)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            <View
              style={{
                flexDirection: isWeb ? "row" : "column",
                alignItems: isWeb ? "center" : "flex-start",
                gap: isWeb ? 24 : 16,
              }}
            >
              <View
                style={{
                  width: isWeb ? 72 : 60,
                  height: isWeb ? 72 : 60,
                  borderRadius: isWeb ? 36 : 30,
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  borderWidth: 2,
                  borderColor: "#A855F7",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 0 25px rgba(168, 85, 247, 0.4)",
                }}
              >
                <Headphones size={isWeb ? 32 : 26} color="#C084FC" />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: "rgba(168, 85, 247, 0.2)",
                      borderWidth: 1,
                      borderColor: "rgba(168, 85, 247, 0.5)",
                    }}
                  >
                    <Text style={{ color: "#E9D5FF", fontSize: 11, fontWeight: "800" }}>
                      FULL AUDIOBOOK CATALOG
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Sparkles size={12} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
                      {audiobooks.length} Narrated Volumes
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: isWeb ? 32 : 24,
                    fontWeight: "900",
                    fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                    marginBottom: 6,
                  }}
                >
                  Listen & Explore Masterworks
                </Text>

                <Text style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 22 }}>
                  Immerse yourself in public domain audiobooks narrated by studio voices with synchronized sentence highlights.
                </Text>
              </View>
            </View>
          </View>

          {/* Filter & Search Bar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* Search Input */}
            <View
              style={{
                flex: 1,
                maxWidth: 450,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(2, 6, 23, 0.8)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 10,
                gap: 10,
              }}
            >
              <Search size={16} color="#94A3B8" />
              <TextInput
                placeholder="Search audiobooks by title, author, narrator..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, color: "#FFFFFF", fontSize: 13.5, outlineStyle: "none" }}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <X size={15} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>

            {/* Counter & View Mode Switcher */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: "600" }}>
                Showing <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{filteredBooks.length}</Text> audiobooks
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  padding: 3,
                  gap: 4,
                }}
              >
                <Pressable
                  onPress={() => setViewMode("grid")}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: viewMode === "grid" ? "rgba(168, 85, 247, 0.25)" : "transparent",
                  }}
                >
                  <LayoutGrid size={16} color={viewMode === "grid" ? "#C084FC" : "#64748B"} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode("list")}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: viewMode === "list" ? "rgba(168, 85, 247, 0.25)" : "transparent",
                  }}
                >
                  <List size={16} color={viewMode === "list" ? "#C084FC" : "#64748B"} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Masterwork Audiobook Grid */}
          {isLoading ? (
            <View style={{ paddingVertical: 100, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#C084FC" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading audiobook collection...
              </Text>
            </View>
          ) : filteredBooks.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -8 }}>
              {filteredBooks.map((story: any) => {
                const cols = viewMode === "grid" ? (width >= 1024 ? 4 : width >= 768 ? 3 : 2) : 1;
                return (
                  <View
                    key={story._id || story.slug}
                    style={{ width: `${100 / cols}%`, paddingHorizontal: 8, paddingBottom: 20 }}
                  >
                    <StoryCard
                      story={story}
                      onPress={(sSlug) => router.push(`/details/${sSlug}`)}
                      variant="standard"
                    />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ paddingVertical: 80, alignItems: "center", gap: 12 }}>
              <Headphones size={48} color="#64748B" />
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                No audiobooks found matching "{searchQuery}"
              </Text>
              <Pressable
                onPress={() => setSearchQuery("")}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 100,
                  backgroundColor: "rgba(168, 85, 247, 0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(168, 85, 247, 0.4)",
                }}
              >
                <Text style={{ color: "#C084FC", fontSize: 13, fontWeight: "700" }}>
                  Clear Search Filter
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
