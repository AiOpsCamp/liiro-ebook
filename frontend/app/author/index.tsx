import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
  useWindowDimensions,
  Pressable
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  User,
  Search,
  ChevronRight,
  BookOpen,
  Feather,
  Flame,
  X
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";

export default function AllAuthorsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const [authorsList, setAuthorsList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAuthors();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(authorsList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        authorsList.filter(
          (a) => a.name?.toLowerCase().includes(q) || a.slug?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, authorsList]);

  const fetchAllAuthors = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/authors`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAuthorsList(json.data);
        setFilteredList(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch authors directory:", e);
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
                Authors & Figures
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
                <Text style={{ color: "#818CF8", fontSize: 13.5, fontWeight: "700" }}>Authors</Text>
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
          {/* Hero Authors Banner */}
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
              colors={["rgba(16, 185, 129, 0.22)", "rgba(129, 140, 248, 0.08)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 100,
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(16, 185, 129, 0.4)",
                alignSelf: "flex-start",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "800" }}>
                620+ WORLD CLASS AUTHORS
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
              Discover Famous Authors & Novelists
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 13.5, marginBottom: 20 }}>
              From Shakespeare, Tolstoy, and Dostoevsky to Jules Verne, Arthur Conan Doyle, and Lewis Carroll
            </Text>

            {/* Author Search Bar */}
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
                placeholder="Search author by name..."
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

          {/* Authors Grid */}
          {loading ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading authors directory...
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
              {filteredList.map((author) => (
                <Pressable
                  key={author._id || author.slug}
                  onPress={() => router.push(`/author/${author.slug}`)}
                  style={({ hovered }: any) => ({
                    width: cardWidth as any,
                    borderRadius: 20,
                    backgroundColor: hovered ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.85)",
                    borderWidth: 1,
                    borderColor: hovered ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.08)",
                    padding: 16,
                    alignItems: "center",
                    gap: 12,
                    transform: hovered ? [{ translateY: -4 }] : [],
                  })}
                >
                  {author.imageUrl ? (
                    <Image
                      source={{ uri: author.imageUrl }}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: "#1E293B",
                        borderWidth: 2,
                        borderColor: "rgba(16, 185, 129, 0.4)",
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        borderWidth: 2,
                        borderColor: "rgba(16, 185, 129, 0.4)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Feather size={28} color="#10B981" />
                    </View>
                  )}

                  <View style={{ alignItems: "center" }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "800",
                        textAlign: "center",
                        fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                      }}
                    >
                      {author.name}
                    </Text>

                    <View
                      style={{
                        marginTop: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 100,
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#10B981", fontSize: 10.5, fontWeight: "800" }}>
                        {author.storyCount || author.bookCount || 1} Books
                      </Text>
                    </View>
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
