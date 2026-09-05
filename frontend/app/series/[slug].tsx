import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  useWindowDimensions,
  Pressable
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Layers, BookOpen, ChevronRight, Star, Sparkles, Headphones } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SeriesDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 900);

  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, [slug]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/series/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSeries(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch series detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const getTitleText = (titleObj: any) => {
    if (!titleObj) return "Untitled Book";
    if (typeof titleObj === "string") return titleObj;
    return titleObj.en || titleObj.bn || Object.values(titleObj)[0] || "Untitled Book";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#020617" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: isWeb ? 24 : 16,
          paddingTop: isWeb ? 32 : 52,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth }}>
          {/* Header Navigation */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}>
              Book Series Collection
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 100, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#818CF8" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading series collection...
              </Text>
            </View>
          ) : !series ? (
            <View style={{ paddingVertical: 60, alignItems: "center" }}>
              <Text style={{ color: "#F87171", fontSize: 16, fontWeight: "600" }}>
                Book series collection not found.
              </Text>
            </View>
          ) : (
            <>
              {/* Series Hero Banner Card */}
              <View
                style={{
                  borderRadius: 24,
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  padding: 24,
                  marginBottom: 28,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <LinearGradient
                  colors={["rgba(139, 92, 246, 0.25)", "transparent"]}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140 }}
                />

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: "rgba(245, 158, 11, 0.2)",
                      borderWidth: 1,
                      borderColor: "rgba(245, 158, 11, 0.4)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Layers size={13} color="#F59E0B" />
                    <Text style={{ color: "#FDE68A", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                      MASTERWORK SAGA
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: isWeb ? 28 : 22,
                    fontWeight: "800",
                    fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                    marginBottom: 6,
                  }}
                >
                  {typeof series.title === "object" ? series.title.en || series.name : series.title || series.name}
                </Text>

                {series.author ? (
                  <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "500", marginBottom: 14 }}>
                    By {series.author}
                  </Text>
                ) : null}

                {series.description ? (
                  <Text style={{ color: "#CBD5E1", fontSize: 13.5, lineHeight: 22, marginBottom: 18 }}>
                    {typeof series.description === "object" ? series.description.en || "" : series.description}
                  </Text>
                ) : null}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: "rgba(2, 6, 23, 0.6)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: "600" }}>
                    Chronological Reading Order:
                  </Text>
                  <Text style={{ color: "#38BDF8", fontSize: 13, fontWeight: "800" }}>
                    {series.books?.length || series.bookCount || 0} Volumes Available
                  </Text>
                </View>
              </View>

              {/* Reading Order List Header */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
                  Chronological Reading Order
                </Text>
                <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "600" }}>
                  Tap volume to read
                </Text>
              </View>

              {/* Books List Cards */}
              {series.books && series.books.length > 0 ? (
                series.books.map((book: any, idx: number) => {
                  const title = getTitleText(book.title);
                  const isAudio = !!(book.hasAudio || book.isAudiobook);

                  return (
                    <Pressable
                      key={book._id || book.slug || idx}
                      onPress={() => router.push(`/details/${book.slug}`)}
                      style={({ hovered }: any) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 14,
                        borderRadius: 18,
                        backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                        borderWidth: 1,
                        borderColor: hovered ? "rgba(129, 140, 248, 0.4)" : "rgba(255, 255, 255, 0.08)",
                        marginBottom: 12,
                        transform: hovered ? [{ translateY: -2 }] : [],
                      })}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1, paddingRight: 12 }}>
                        {/* Order badge pill */}
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            borderWidth: 1,
                            borderColor: "rgba(245, 158, 11, 0.4)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 12 }}>
                            #{idx + 1}
                          </Text>
                        </View>

                        {/* Thumbnail cover */}
                        {book.coverImageUrl ? (
                          <Image
                            source={{ uri: book.coverImageUrl }}
                            style={{ width: 44, height: 62, borderRadius: 8, backgroundColor: "#1E293B" }}
                            resizeMode="cover"
                          />
                        ) : null}

                        {/* Info block */}
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginBottom: 3 }}
                          >
                            {title}
                          </Text>
                          {book.author ? (
                            <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "500", marginBottom: 4 }}>
                              {book.author}
                            </Text>
                          ) : null}

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <View
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                backgroundColor: isAudio ? "rgba(139, 92, 246, 0.2)" : "rgba(56, 189, 248, 0.15)",
                                borderWidth: 0.5,
                                borderColor: isAudio ? "rgba(139, 92, 246, 0.4)" : "rgba(56, 189, 248, 0.3)",
                              }}
                            >
                              <Text
                                style={{
                                  color: isAudio ? "#C084FC" : "#38BDF8",
                                  fontSize: 9.5,
                                  fontWeight: "700",
                                }}
                              >
                                {isAudio ? "AUDIOBOOK" : "EBOOK"}
                              </Text>
                            </View>

                            {book.isIllustrated || book.hasArtworks ? (
                              <View
                                style={{
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                  backgroundColor: "rgba(236, 72, 153, 0.2)",
                                  borderWidth: 0.5,
                                  borderColor: "rgba(236, 72, 153, 0.4)",
                                }}
                              >
                                <Text style={{ color: "#F472B6", fontSize: 9.5, fontWeight: "700" }}>
                                  ARTWORKS
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      <ChevronRight size={18} color="#64748B" />
                    </Pressable>
                  );
                })
              ) : (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                    No books in this series catalog yet.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
