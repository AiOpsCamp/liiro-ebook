import React, { useState, useEffect, useMemo } from "react";
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
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  Tag as TagIcon,
  BookOpen,
  Search,
  ChevronRight,
  Headphones,
  Sparkles,
  Flame,
  Play,
  X
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";
import { getLocalizedText } from "@/utils/getLocalizedText";

export default function TagDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const [tagData, setTagData] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchTagDetail();
    }
  }, [slug]);

  const fetchTagDetail = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/tags/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTagData(json.data.tag || { name: slug });
        setBooks(json.data.books || []);
      }
    } catch (e) {
      console.warn("Failed to fetch tag detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase().trim();
    return books.filter((b) => {
      const titleStr = getLocalizedText(b.title).toLowerCase();
      const authorStr = (b.author || b.authorName || "").toLowerCase();
      return titleStr.includes(q) || authorStr.includes(q);
    });
  }, [books, searchQuery]);

  const cardWidth = isWeb
    ? width > 1100
      ? "23%"
      : width > 700
      ? "31%"
      : "48%"
    : "48%";

  const tagName = tagData?.name || (slug ? slug.replace(/-/g, " ") : "Tag");

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
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(168, 85, 247, 0.4)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TagIcon size={20} color="#A855F7" />
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
                Tag: #{slug}
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
                <Text style={{ color: "#A855F7", fontSize: 13.5, fontWeight: "700" }}>Tags</Text>
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
          {/* Back button & Breadcrumb */}
          <TouchableOpacity
            onPress={() => router.push("/tag")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={16} color="#818CF8" />
            <Text style={{ color: "#818CF8", fontSize: 13, fontWeight: "700" }}>
              Back to All Tags
            </Text>
          </TouchableOpacity>

          {/* Hero Tag Showcase Banner */}
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
              colors={["rgba(168, 85, 247, 0.25)", "rgba(56, 189, 248, 0.08)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 100,
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(168, 85, 247, 0.4)",
                alignSelf: "flex-start",
                marginBottom: 10,
              }}
            >
              <TagIcon size={14} color="#A855F7" />
              <Text style={{ color: "#C084FC", fontSize: 11.5, fontWeight: "800" }}>
                {books.length} MASTERWORKS TAGGED
              </Text>
            </View>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: isWeb ? 32 : 24,
                fontWeight: "900",
                textTransform: "capitalize",
                fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                marginBottom: 6,
              }}
            >
              #{tagName}
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 14, marginBottom: 20 }}>
              {tagData?.description || `Explore classic ebooks and audiobooks tagged with #${tagName}`}
            </Text>

            {/* Filter Search input */}
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
                placeholder={`Search within #${tagName} books...`}
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

          {/* Book Catalog Grid */}
          {loading ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#A855F7" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading books tagged with #{tagName}...
              </Text>
            </View>
          ) : filteredBooks.length === 0 ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <BookOpen size={48} color="#64748B" />
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginTop: 16 }}>
                No books found for #{tagName}
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
              {filteredBooks.map((book) => {
                const titleStr = getLocalizedText(book.title);
                const authorStr = book.author || book.authorName || "Classic Author";
                const hasAudio = book.hasAudio || book.isAudiobook || book.contentType === "audiobook" || book.contentType === "both";

                return (
                  <Pressable
                    key={book._id || book.slug}
                    onPress={() => router.push(`/details/${book.slug}`)}
                    style={({ hovered }: any) => ({
                      width: cardWidth as any,
                      backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                      borderWidth: 1,
                      borderColor: hovered ? "rgba(168, 85, 247, 0.5)" : "rgba(255, 255, 255, 0.08)",
                      borderRadius: 20,
                      padding: 12,
                      transform: hovered ? [{ translateY: -4 }] : [],
                    })}
                  >
                    <View style={{ position: "relative", marginBottom: 10 }}>
                      {book.coverImageUrl ? (
                        <Image
                          source={{ uri: book.coverImageUrl }}
                          style={{
                            width: "100%",
                            height: isWeb ? 240 : 200,
                            borderRadius: 14,
                            backgroundColor: "#1E293B",
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            height: isWeb ? 240 : 200,
                            borderRadius: 14,
                            backgroundColor: "rgba(168, 85, 247, 0.15)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <BookOpen size={36} color="#A855F7" />
                        </View>
                      )}

                      {/* Top Overlay Badges */}
                      <View style={{ position: "absolute", top: 8, left: 8, right: 8, flexDirection: "row", justifyContent: "space-between" }}>
                        {book.difficultyLevel ? (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.4)" }}>
                            <Text style={{ color: "#38BDF8", fontSize: 10, fontWeight: "800" }}>
                              {book.difficultyLevel}
                            </Text>
                          </View>
                        ) : <View />}

                        {hasAudio ? (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(168, 85, 247, 0.4)", flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Headphones size={11} color="#C084FC" />
                            <Text style={{ color: "#C084FC", fontSize: 10, fontWeight: "800" }}>AUDIO</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <Text
                      numberOfLines={2}
                      style={{
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: "700",
                        lineHeight: 19,
                        marginBottom: 4,
                        fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                      }}
                    >
                      {titleStr}
                    </Text>

                    <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 12, fontWeight: "500" }}>
                      {authorStr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
