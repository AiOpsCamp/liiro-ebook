import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  useWindowDimensions,
  Pressable
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Search,
  ChevronRight,
  Layers,
  Compass,
  Sparkles,
  Flame,
  Zap,
  Award,
  Globe,
  Heart,
  Search as SearchIcon,
  X
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";

export default function AllCategoriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCategories();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(categoriesList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        categoriesList.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.slug?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, categoriesList]);

  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/categories`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategoriesList(json.data);
        setFilteredList(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch categories directory:", e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "science-fiction-and-space": return <Zap size={22} color="#38BDF8" />;
      case "mystery-and-detective": return <SearchIcon size={22} color="#EC4899" />;
      case "high-adventure-and-survival": return <Compass size={22} color="#10B981" />;
      case "fantasy-and-magic": return <Sparkles size={22} color="#A855F7" />;
      case "gothic-and-dark-fantasy": return <Flame size={22} color="#F43F5E" />;
      case "philosophy-and-ethics": return <BookOpen size={22} color="#6366F1" />;
      case "plays-and-drama": return <Layers size={22} color="#EF4444" />;
      case "poetry-and-epics": return <Award size={22} color="#F59E0B" />;
      case "childrens-classics": return <Heart size={22} color="#F472B6" />;
      default: return <Globe size={22} color="#818CF8" />;
    }
  };

  const cardWidth = isWeb
    ? width > 1100
      ? "31%"
      : width > 700
      ? "48%"
      : "100%"
    : "100%";

  return (
    <View style={{ flex: 1, backgroundColor: "#020617" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* TOP FLOATING STICKY HEADER NAVBAR */}
      <View
        style={{
          width: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderBottomWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
          paddingVertical: 14,
          paddingHorizontal: isWeb ? 32 : 16,
          zIndex: 100,
          alignItems: "center",
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
          {/* Brand Logo & Title */}
          <Pressable onPress={() => router.push("/")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "rgba(129, 140, 248, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(129, 140, 248, 0.4)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <BookOpen size={20} color="#818CF8" />
            </View>
            <View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 19,
                  fontWeight: "900",
                  letterSpacing: 0.5,
                  fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                }}
              >
                LIIRO EBOOK
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600" }}>
                Category Directory
              </Text>
            </View>
          </Pressable>

          {/* Desktop Web Links */}
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

      {/* MAIN BODY CONTENT */}
      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: isWeb ? 32 : 16,
          paddingTop: 24,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth }}>
          {/* Hero Category Banner */}
          <View
            style={{
              borderRadius: 24,
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.12)",
              padding: isWeb ? 32 : 20,
              marginBottom: 28,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <LinearGradient
              colors={["rgba(129, 140, 248, 0.22)", "rgba(56, 189, 248, 0.08)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 100,
                backgroundColor: "rgba(129, 140, 248, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(129, 140, 248, 0.4)",
                alignSelf: "flex-start",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#818CF8", fontSize: 11, fontWeight: "800" }}>
                CURATED LITERARY GENRES
              </Text>
            </View>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: isWeb ? 30 : 22,
                fontWeight: "900",
                fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                marginBottom: 6,
              }}
            >
              Explore Literary Categories & Collections
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 13.5, marginBottom: 20 }}>
              Browse through curated genres containing over 1,400+ classic ebooks and audiobooks
            </Text>

            {/* Category Search Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(2, 6, 23, 0.8)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 12,
              }}
            >
              <Search size={18} color="#94A3B8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Filter categories by name, genre or description..."
                placeholderTextColor="#64748B"
                style={{
                  flex: 1,
                  color: "#FFFFFF",
                  fontSize: 14,
                  outlineStyle: "none",
                }}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <X size={16} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Categories Grid */}
          {loading ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#818CF8" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading category directory...
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              {filteredList.map((cat) => (
                <Pressable
                  key={cat._id || cat.slug}
                  onPress={() => router.push(`/category/${cat.slug}`)}
                  style={({ hovered }: any) => ({
                    width: cardWidth as any,
                    borderRadius: 20,
                    backgroundColor: hovered ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.85)",
                    borderWidth: 1,
                    borderColor: hovered ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.08)",
                    padding: 20,
                    gap: 12,
                    transform: hovered ? [{ translateY: -4 }] : [],
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: "rgba(129, 140, 248, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(129, 140, 248, 0.3)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {getCategoryIcon(cat.slug)}
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 100,
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(56, 189, 248, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#38BDF8", fontSize: 11.5, fontWeight: "800" }}>
                        {cat.bookCount || 0} Books
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 18,
                        fontWeight: "800",
                        marginBottom: 4,
                        fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                      }}
                    >
                      {cat.name}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={{ color: "#94A3B8", fontSize: 13, lineHeight: 18 }}
                    >
                      {cat.description || `Collection of ${cat.name} books and masterworks`}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: "#818CF8", fontSize: 12.5, fontWeight: "700" }}>
                      Explore Collection
                    </Text>
                    <ChevronRight size={14} color="#818CF8" />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
