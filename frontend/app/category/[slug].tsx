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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Search,
  X,
  BookOpen,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  Flame,
  Compass,
  Headphones,
  Zap,
  Globe,
  Award,
  Heart,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppText as Text } from "@/components/ui/AppText";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import { useGetCategoryBySlugQuery, useGetCategoriesQuery } from "@/api/storiesQuery";
import StoryCard from "@/components/ebook/StoryCard";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";
import { getLocalizedText } from "@/utils/getLocalizedText";

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const tokens = useSelector(selectThemeTokens);
  const isDark = useSelector(selectIsDark);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const { data: categoryData, isLoading } = useGetCategoryBySlugQuery(slug || "");
  const { data: allCategoriesResp } = useGetCategoriesQuery(undefined);
  const categoriesList = useMemo(() => allCategoriesResp?.data || [], [allCategoriesResp]);

  const category = categoryData?.data || categoryData;

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBooks = useMemo(() => {
    if (!category?.books) return [];
    if (!searchQuery.trim()) return category.books;
    const q = searchQuery.toLowerCase().trim();
    return category.books.filter(
      (b: any) =>
        getLocalizedText(b.title).toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.tags && b.tags.some((t: any) => getLocalizedText(t).toLowerCase().includes(q)))
    );
  }, [category, searchQuery]);

  const accentColor = category?.color || "#F59E0B";

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
                backgroundColor: "#6366F1",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <BookOpen size={20} color="#FFFFFF" />
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
                LIIRO EBOOK
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600" }}>
                Public Domain Catalog
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
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Explore Catalog</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/category")}>
                <Text style={{ color: "#818CF8", fontSize: 13.5, fontWeight: "700" }}>Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/series")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Book Series</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/author")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Authors</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/reels")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Book Reels</Text>
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
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.35)",
              }}
            >
              <Flame size={14} color="#F59E0B" />
              <Text style={{ color: "#FDE68A", fontSize: 11.5, fontWeight: "800" }}>5 STREAK</Text>
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
            <Pressable onPress={() => router.push("/category")}>
              <Text style={{ color: "#94A3B8", fontSize: 12.5, fontWeight: "600" }}>Categories</Text>
            </Pressable>
            <ChevronRight size={12} color="#64748B" />
            <Text style={{ color: accentColor, fontSize: 12.5, fontWeight: "800" }}>
              {category?.name || slug}
            </Text>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 100, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#818CF8" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading category collection...
              </Text>
            </View>
          ) : category ? (
            <>
              {/* Category Hero Banner Showcase */}
              <View
                style={{
                  borderRadius: 28,
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  padding: isWeb ? 32 : 20,
                  marginBottom: 24,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <LinearGradient
                  colors={[accentColor + "33", "rgba(139, 92, 246, 0.08)", "transparent"]}
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
                  {/* Category Icon Circle */}
                  <View
                    style={{
                      width: isWeb ? 72 : 60,
                      height: isWeb ? 72 : 60,
                      borderRadius: isWeb ? 36 : 30,
                      backgroundColor: accentColor + "25",
                      borderWidth: 2,
                      borderColor: accentColor,
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: `0 0 25px ${accentColor}40`,
                    }}
                  >
                    <BookOpen size={isWeb ? 32 : 26} color={accentColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 20,
                          backgroundColor: accentColor + "25",
                          borderWidth: 1,
                          borderColor: accentColor + "50",
                        }}
                      >
                        <Text style={{ color: accentColor, fontSize: 11, fontWeight: "800" }}>
                          CURATED GENRE COLLECTION
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
                          {category.books?.length || category.bookCount || 0} Masterwork Volumes
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
                      {category.name}
                    </Text>

                    <Text style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 22 }}>
                      {category.description || `Explore timeless public domain literature and audiobooks in ${category.name}.`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Category Quick Pills Switcher Bar */}
              {categoriesList.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
                >
                  {categoriesList.map((c: any) => {
                    const isSelected = c.slug === slug;
                    return (
                      <Pressable
                        key={c._id || c.slug}
                        onPress={() => router.push(`/category/${c.slug}`)}
                        style={({ hovered }: any) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 100,
                          backgroundColor: isSelected
                            ? c.color || "#818CF8"
                            : hovered
                            ? "rgba(30, 41, 59, 0.9)"
                            : "rgba(15, 23, 42, 0.8)",
                          borderWidth: 1,
                          borderColor: isSelected
                            ? c.color || "#818CF8"
                            : hovered
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(255, 255, 255, 0.08)",
                          gap: 8,
                        })}
                      >
                        <BookOpen size={14} color={isSelected ? "#FFFFFF" : "#94A3B8"} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? "800" : "600",
                            color: isSelected ? "#FFFFFF" : "#CBD5E1",
                          }}
                        >
                          {c.name}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 10,
                            backgroundColor: isSelected ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.1)",
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? "#FFFFFF" : "#94A3B8",
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            {c.bookCount || 0}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              {/* Filter & View Mode Control Bar */}
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
                {/* Search Bar */}
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
                    placeholder={`Search ${category.name} masterworks...`}
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
                    Showing <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{filteredBooks.length}</Text> books
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
                        backgroundColor: viewMode === "grid" ? "rgba(129, 140, 248, 0.25)" : "transparent",
                      }}
                    >
                      <LayoutGrid size={16} color={viewMode === "grid" ? "#818CF8" : "#64748B"} />
                    </Pressable>
                    <Pressable
                      onPress={() => setViewMode("list")}
                      style={{
                        padding: 6,
                        borderRadius: 8,
                        backgroundColor: viewMode === "list" ? "rgba(129, 140, 248, 0.25)" : "transparent",
                      }}
                    >
                      <List size={16} color={viewMode === "list" ? "#818CF8" : "#64748B"} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Masterwork Books Grid */}
              {filteredBooks.length > 0 ? (
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
                  <BookOpen size={48} color="#64748B" />
                  <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                    No masterworks found matching "{searchQuery}"
                  </Text>
                  <Pressable
                    onPress={() => setSearchQuery("")}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: "rgba(129, 140, 248, 0.2)",
                      borderWidth: 1,
                      borderColor: "rgba(129, 140, 248, 0.4)",
                    }}
                  >
                    <Text style={{ color: "#818CF8", fontSize: 13, fontWeight: "700" }}>
                      Clear Search Query
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                Category not found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

