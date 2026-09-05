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
  Layers,
  Search,
  ChevronRight,
  BookOpen,
  Sparkles,
  Flame,
  X
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";

export default function AllSeriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSeries();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(seriesList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        seriesList.filter(
          (s) =>
            s.title?.toLowerCase().includes(q) ||
            s.name?.toLowerCase().includes(q) ||
            s.author?.toLowerCase().includes(q) ||
            s.slug?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, seriesList]);

  const fetchAllSeries = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/series`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSeriesList(json.data);
        setFilteredList(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch series directory:", e);
    } finally {
      setLoading(false);
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
                Book Series Sagas
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
                <Text style={{ color: "#818CF8", fontSize: 13.5, fontWeight: "700" }}>Book Series</Text>
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
          {/* Hero Series Banner */}
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
              colors={["rgba(245, 158, 11, 0.22)", "rgba(129, 140, 248, 0.08)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 100,
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.4)",
                alignSelf: "flex-start",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "800" }}>
                85 MASTERWORK BOOK SERIES
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
              Explore Legendary Book Series & Sagas
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 13.5, marginBottom: 20 }}>
              From Sherlock Holmes to Jules Verne's Voyages Extraordinaires and Alice in Wonderland
            </Text>

            {/* Series Search Bar */}
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
                placeholder="Search series by title, saga name or author..."
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

          {/* Series Grid */}
          {loading ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading book series directory...
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
              {filteredList.map((item) => (
                <Pressable
                  key={item._id || item.slug}
                  onPress={() => router.push(`/series/${item.slug}`)}
                  style={({ hovered }: any) => ({
                    width: cardWidth as any,
                    borderRadius: 20,
                    backgroundColor: hovered ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.85)",
                    borderWidth: 1,
                    borderColor: hovered ? "rgba(245, 158, 11, 0.5)" : "rgba(255, 255, 255, 0.08)",
                    padding: 16,
                    flexDirection: "row",
                    gap: 16,
                    alignItems: "center",
                    transform: hovered ? [{ translateY: -4 }] : [],
                  })}
                >
                  {/* Cover Image */}
                  {item.coverImageUrl ? (
                    <Image
                      source={{ uri: item.coverImageUrl }}
                      style={{
                        width: 75,
                        height: 110,
                        borderRadius: 12,
                        backgroundColor: "#1E293B",
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 75,
                        height: 110,
                        borderRadius: 12,
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Layers size={28} color="#F59E0B" />
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 4 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 100,
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(245, 158, 11, 0.3)",
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text style={{ color: "#F59E0B", fontSize: 10.5, fontWeight: "800" }}>
                        {item.bookCount || item.books?.length || 0} Books Saga
                      </Text>
                    </View>

                    <Text
                      numberOfLines={2}
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "800",
                        fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                      }}
                    >
                      {item.title || item.name}
                    </Text>

                    <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 12.5 }}>
                      by {item.author || "Classic Master"}
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Text style={{ color: "#818CF8", fontSize: 12, fontWeight: "700" }}>View Series</Text>
                      <ChevronRight size={13} color="#818CF8" />
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
