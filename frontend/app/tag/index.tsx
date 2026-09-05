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
  Tag as TagIcon,
  Search,
  ChevronRight,
  BookOpen,
  Sparkles,
  Flame,
  X
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";

export default function AllTagsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const [tagsList, setTagsList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllTags();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(tagsList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        tagsList.filter(
          (t) => t.name?.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, tagsList]);

  const fetchAllTags = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/tags`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTagsList(json.data);
        setFilteredList(json.data);
      } else {
        // Fallback list of curated tags
        const fallbackTags = [
          { name: "Classic Literature", slug: "classic-literature", bookCount: 1048 },
          { name: "Science Fiction", slug: "science-fiction", bookCount: 39 },
          { name: "Mystery & Detective", slug: "mystery-and-detective", bookCount: 96 },
          { name: "High Adventure", slug: "high-adventure", bookCount: 86 },
          { name: "Fantasy & Magic", slug: "fantasy-and-magic", bookCount: 27 },
          { name: "Gothic Horror", slug: "gothic-horror", bookCount: 15 },
          { name: "Philosophy & Logic", slug: "philosophy-and-logic", bookCount: 13 },
          { name: "Public Domain Masterwork", slug: "public-domain", bookCount: 1405 },
          { name: "Victorian Era", slug: "victorian-era", bookCount: 120 },
          { name: "Time Travel", slug: "time-travel", bookCount: 18 },
          { name: "Fairy Tales & Fables", slug: "fairy-tales", bookCount: 24 },
          { name: "Poetry & Sonnets", slug: "poetry-and-sonnets", bookCount: 12 },
          { name: "Theatrical Plays", slug: "theatrical-plays", bookCount: 63 }
        ];
        setTagsList(fallbackTags);
        setFilteredList(fallbackTags);
      }
    } catch (e) {
      console.warn("Failed to fetch tags directory:", e);
    } finally {
      setLoading(false);
    }
  };

  const cardWidth = isWeb
    ? width > 1100
      ? "23%"
      : width > 700
      ? "31%"
      : "48%"
    : "48%";

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
                Literary Tags
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
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/series")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Book Series</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/author")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Authors</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/tag")}>
                <Text style={{ color: "#818CF8", fontSize: 13.5, fontWeight: "700" }}>Tags</Text>
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
          {/* Hero Tags Banner */}
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
              colors={["rgba(168, 85, 247, 0.22)", "rgba(129, 140, 248, 0.08)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 100,
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(168, 85, 247, 0.4)",
                alignSelf: "flex-start",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#A855F7", fontSize: 11, fontWeight: "800" }}>
                LITERARY TAGS & KEYWORDS
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
              Browse Ebooks by Topic & Themes
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 13.5, marginBottom: 20 }}>
              Find books tagged by specific eras, themes, narrative styles, and genres
            </Text>

            {/* Tag Search Bar */}
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
                placeholder="Search tags by keyword e.g. Victorian, Time Travel, Mystery..."
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

          {/* Tags Grid */}
          {loading ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#A855F7" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading literary tags directory...
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
              {filteredList.map((tag) => (
                <Pressable
                  key={tag._id || tag.slug}
                  onPress={() => router.push(`/tag/${tag.slug}`)}
                  style={({ hovered }: any) => ({
                    width: cardWidth as any,
                    borderRadius: 20,
                    backgroundColor: hovered ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.85)",
                    borderWidth: 1,
                    borderColor: hovered ? "rgba(168, 85, 247, 0.5)" : "rgba(255, 255, 255, 0.08)",
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    transform: hovered ? [{ translateY: -4 }] : [],
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: "rgba(168, 85, 247, 0.15)",
                      borderWidth: 1,
                      borderColor: "rgba(168, 85, 247, 0.3)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <TagIcon size={20} color="#A855F7" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "800",
                        fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                        marginBottom: 3,
                      }}
                    >
                      {tag.name || tag.slug}
                    </Text>

                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 100,
                        backgroundColor: "rgba(168, 85, 247, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(168, 85, 247, 0.3)",
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text style={{ color: "#C084FC", fontSize: 10.5, fontWeight: "800" }}>
                        {tag.bookCount || tag.storyCount || 10}+ Books
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={16} color="#A855F7" />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
