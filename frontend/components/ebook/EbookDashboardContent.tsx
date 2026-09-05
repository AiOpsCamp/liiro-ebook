import React, { useState, useEffect, useMemo } from "react";
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
import { useRouter } from "expo-router";
import {
  BookOpen,
  Headphones,
  Layers,
  User,
  Sparkles,
  Flame,
  Search,
  Star,
  Compass,
  Award,
  ArrowRight,
  Play,
  Clock,
  PlusCircle,
  TrendingUp,
  Bookmark,
  Eye,
  Video,
  ChevronRight,
  Quote as QuoteIcon,
  Library
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";
import StoryCard from "@/components/ebook/StoryCard";
import { QuoteCardShareModal, QuoteCardData } from "@/components/ebook/social/QuoteCardShareModal";
import { AnnualReadingGoalCard } from "@/components/ebook/goals/AnnualReadingGoalCard";

export default function EbookDashboardContent() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1140);
  const cardWidth = isWeb ? (width > 1024 ? 180 : width > 640 ? 160 : 140) : 140;

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [featuredQuotes, setFeaturedQuotes] = useState<any[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [shareQuoteData, setShareQuoteData] = useState<QuoteCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/home-dashboard`);
      const json = await res.json();
      if (json.success && json.data) {
        let data = json.data;
        if (!data.reels || data.reels.length === 0) {
          try {
            const reelsRes = await fetch(`${apiBase}/reels`);
            const reelsJson = await reelsRes.json();
            if (reelsJson.success && reelsJson.data) {
              data.reels = reelsJson.data;
            }
          } catch {}
        }

        try {
          const quotesRes = await fetch(`${apiBase}/quotes?featured=true&limit=10`);
          const quotesJson = await quotesRes.json();
          if (quotesJson.success && quotesJson.data) {
            setFeaturedQuotes(quotesJson.data);
          }
        } catch {}

        try {
          const colRes = await fetch(`${apiBase}/collections`);
          const colJson = await colRes.json();
          if (colJson.success && colJson.data) {
            setShelves(colJson.data);
          }
        } catch {}

        setDashboardData(data);
      }
    } catch (e) {
      console.warn("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getTitleText = (titleObj: any) => {
    if (!titleObj) return "Untitled Book";
    if (typeof titleObj === "string") return titleObj;
    return titleObj.en || titleObj.bn || Object.values(titleObj)[0] || "Untitled Book";
  };

  const featuredAudiobooksList = useMemo(() => {
    if (!dashboardData) return [];
    const list = dashboardData.featuredAudiobooks || dashboardData.audiobooks || dashboardData.allPublished || [];
    const audioOnly = list.filter((s: any) => !!(s.hasAudio || s.isAudiobook));
    return audioOnly.slice(0, 8);
  }, [dashboardData]);

  return (
    <View style={{ flex: 1, backgroundColor: "#020617" }}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP FLOATING / STICKY NAVBAR HEADER */}
      {/* ───────────────────────────────────────────────────────────── */}
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
                Public Domain Classics
              </Text>
            </View>
          </Pressable>

          {/* Desktop Web Navigation Links */}
          {isWeb ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={{ color: "#818CF8", fontSize: 13.5, fontWeight: "700" }}>Home</Text>
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
              <TouchableOpacity onPress={() => router.push("/reels")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Book Reels</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* User Controls: Search, Streak, Profile */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push("/explore")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Search size={16} color="#CBD5E1" />
            </TouchableOpacity>

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

      {/* Main Content Body */}
      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: isWeb ? 24 : 16,
          paddingTop: 24,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth }}>
          {loading ? (
            <View style={{ paddingVertical: 120, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#818CF8" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading Liiro master classic library...
              </Text>
            </View>
          ) : !dashboardData ? (
            <View style={{ paddingVertical: 60, alignItems: "center" }}>
              <Text style={{ color: "#F87171", fontSize: 16, fontWeight: "600" }}>
                Failed to load library catalog.
              </Text>
            </View>
          ) : (
            <>
              {/* ───────────────────────────────────────────────────────────── */}
              {/* FACEBOOK / INSTAGRAM STORIES STYLE BOOK REELS BAR */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.reels && dashboardData.reels.length > 0 ? (
                <View style={{ marginBottom: 28 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      paddingHorizontal: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 10,
                          backgroundColor: "rgba(244, 63, 94, 0.2)",
                          borderWidth: 1,
                          borderColor: "rgba(244, 63, 94, 0.5)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Video size={16} color="#F43F5E" />
                      </View>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 17,
                          fontWeight: "800",
                          fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                        }}
                      >
                        Book Stories & Reels 🎬
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/reels")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 20,
                        backgroundColor: "rgba(244, 63, 94, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(244, 63, 94, 0.35)",
                      }}
                    >
                      <Text style={{ color: "#F43F5E", fontSize: 12, fontWeight: "800" }}>
                        Watch All ({dashboardData.reels.length})
                      </Text>
                      <ArrowRight size={13} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>

                  {/* Facebook Story Card Horizontal Bubble List */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 14, paddingHorizontal: 2 }}
                  >
                    {dashboardData.reels.map((reel: any, idx: number) => (
                      <Pressable
                        key={reel._id || idx}
                        onPress={() => router.push(`/reels?index=${idx}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 110 : 96,
                          height: isWeb ? 160 : 140,
                          borderRadius: 18,
                          backgroundColor: "#0F172A",
                          borderWidth: 2,
                          borderColor: hovered ? "#F43F5E" : "#A855F7",
                          overflow: "hidden",
                          position: "relative",
                          transform: hovered ? [{ translateY: -4 }, { scale: 1.03 }] : [],
                          shadowColor: "#F43F5E",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: hovered ? 0.4 : 0.1,
                          shadowRadius: 8,
                        })}
                      >
                        {/* Background Story Cover Image */}
                        {reel.coverImageUrl ? (
                          <Image
                            source={{ uri: reel.coverImageUrl }}
                            style={{
                              position: "absolute",
                              width: "100%",
                              height: "100%",
                              opacity: 0.85,
                            }}
                            resizeMode="cover"
                          />
                        ) : null}

                        {/* Story Vignette Gradient Overlay */}
                        <LinearGradient
                          colors={["rgba(244, 63, 94, 0.3)", "transparent", "rgba(2, 6, 23, 0.95)"]}
                          style={{ position: "absolute", inset: 0 }}
                        />

                        {/* Top Story Avatar Circle */}
                        <View style={{ position: "absolute", top: 8, left: 8 }}>
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: "#F43F5E",
                              borderWidth: 1.5,
                              borderColor: "#FFFFFF",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Play size={11} color="#FFFFFF" style={{ marginLeft: 1 }} />
                          </View>
                        </View>

                        {/* Bottom Story Title */}
                        <View style={{ position: "absolute", bottom: 8, left: 6, right: 6 }}>
                          <Text
                            numberOfLines={2}
                            style={{
                              color: "#FFFFFF",
                              fontSize: 11,
                              fontWeight: "800",
                              lineHeight: 14,
                              textShadowColor: "rgba(0,0,0,0.8)",
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                            }}
                          >
                            {reel.title || reel.bookTitle}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* FEATURED AUDIOBOOKS RAIL (TOP DASHBOARD HIGHLIGHT) */}
              {/* ───────────────────────────────────────────────────────────── */}
              {featuredAudiobooksList.length > 0 ? (
                <View style={{ marginBottom: 32 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      paddingHorizontal: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          backgroundColor: "rgba(168, 85, 247, 0.2)",
                          borderWidth: 1.5,
                          borderColor: "rgba(168, 85, 247, 0.6)",
                          justifyContent: "center",
                          alignItems: "center",
                          boxShadow: "0 0 15px rgba(168, 85, 247, 0.4)",
                        }}
                      >
                        <Headphones size={18} color="#C084FC" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 18,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Featured Audiobooks 🎧
                        </Text>
                        <Text style={{ color: "#CBD5E1", fontSize: 11.5, fontWeight: "500" }}>
                          Curated masterworks with full audio narration
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/audiobooks")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 100,
                        backgroundColor: "rgba(168, 85, 247, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(168, 85, 247, 0.35)",
                      }}
                    >
                      <Text style={{ color: "#E9D5FF", fontSize: 12, fontWeight: "700" }}>View All</Text>
                      <ChevronRight size={14} color="#C084FC" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 16 }}
                  >
                    {featuredAudiobooksList.map((story: any) => (
                      <View key={story._id || story.slug} style={{ width: cardWidth }}>
                        <StoryCard
                          story={story}
                          onPress={(sSlug) => router.push(`/details/${sSlug}`)}
                          variant="standard"
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* ANNUAL READING GOAL & CHALLENGE WIDGET (GOODREADS-STYLE) */}
              {/* ───────────────────────────────────────────────────────────── */}
              <AnnualReadingGoalCard />

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 1. CONTINUE READING & QUICK RESUME RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.continueReading ? (
                <View
                  style={{
                    borderRadius: 22,
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    borderWidth: 1,
                    borderColor: "rgba(129, 140, 248, 0.3)",
                    padding: 16,
                    marginBottom: 28,
                    flexDirection: isWeb ? "row" : "column",
                    alignItems: isWeb ? "center" : "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
                    {dashboardData.continueReading.coverImageUrl ? (
                      <Image
                        source={{ uri: dashboardData.continueReading.coverImageUrl }}
                        style={{ width: 48, height: 70, borderRadius: 8, backgroundColor: "#1E293B" }}
                        resizeMode="cover"
                      />
                    ) : null}

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Clock size={13} color="#818CF8" />
                        <Text style={{ color: "#818CF8", fontSize: 11, fontWeight: "700" }}>
                          CONTINUE READING
                        </Text>
                      </View>

                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#FFFFFF",
                          fontSize: 16,
                          fontWeight: "700",
                          fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                        }}
                      >
                        {dashboardData.continueReading.title}
                      </Text>

                      <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>
                        {dashboardData.continueReading.lastReadChapter || "Chapter 1: The Adventure Begins"}
                      </Text>

                      {/* Progress Bar */}
                      <View
                        style={{
                          width: "100%",
                          maxWidth: 260,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${dashboardData.continueReading.progressPercent || 42}%`,
                            height: "100%",
                            backgroundColor: "#818CF8",
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push(`/read/${dashboardData.continueReading.slug}`)}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: "#6366F1",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Resume</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STARTED READING & IN-PROGRESS RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.startedReading && dashboardData.startedReading.length > 0 ? (
                <View style={{ marginBottom: 36 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(99, 102, 241, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(99, 102, 241, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Play size={18} color="#6366F1" fill="#6366F1" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Started Reading & In Progress
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Pick up right where you left off
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/explore")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(99, 102, 241, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(99, 102, 241, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#818CF8", fontSize: 12.5, fontWeight: "700" }}>
                        View Progress
                      </Text>
                      <ArrowRight size={14} color="#818CF8" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dashboardData.startedReading.map((book: any) => (
                      <Pressable
                        key={book._id || book.slug}
                        onPress={() => router.push(`/read/${book.slug}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 170 : 140,
                          backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                          borderWidth: 1,
                          borderColor: hovered ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.08)",
                          borderRadius: 18,
                          padding: 12,
                          transform: hovered ? [{ translateY: -4 }] : [],
                        })}
                      >
                        <View style={{ position: "relative", width: "100%", height: isWeb ? 230 : 190, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
                          {book.coverImageUrl ? (
                            <Image
                              source={{ uri: book.coverImageUrl }}
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#1E293B",
                              }}
                              resizeMode="cover"
                            />
                          ) : null}

                          {/* Top-Left Format Badges: [📖 Ebook] + [🎧 Audio] */}
                          <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.6)" }}>
                              <BookOpen size={9} color="#38BDF8" />
                              <Text style={{ color: "#38BDF8", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Ebook</Text>
                            </View>
                            {(book.hasAudio || book.isAudiobook || book.contentType === "both" || book.contentType === "audiobook" || (book.totalDurationSeconds && book.totalDurationSeconds > 0)) ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.6)" }}>
                                <Headphones size={9} color="#C084FC" />
                                <Text style={{ color: "#C084FC", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Audio</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        {/* Progress bar */}
                        <View
                          style={{
                            width: "100%",
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            overflow: "hidden",
                            marginBottom: 8,
                          }}
                        >
                          <View
                            style={{
                              width: `${book.progressPercent || 50}%`,
                              height: "100%",
                              backgroundColor: "#6366F1",
                            }}
                          />
                        </View>

                        <Text
                          numberOfLines={2}
                          style={{
                            color: "#FFFFFF",
                            fontSize: 13.5,
                            fontWeight: "700",
                            lineHeight: 18,
                            marginBottom: 4,
                          }}
                        >
                          {getTitleText(book.title)}
                        </Text>

                        <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: "500" }}>
                          {book.progressPercent}% completed
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* BOOK REELS SAGAS CAROUSEL RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.reels && dashboardData.reels.length > 0 ? (
                <View style={{ marginBottom: 40 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(244, 63, 94, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(244, 63, 94, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Video size={18} color="#F43F5E" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Book Reels Sagas 🎬
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Short cinematic quotes & visual teasers of classic stories
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/reels")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(244, 63, 94, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(244, 63, 94, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#F43F5E", fontSize: 12.5, fontWeight: "700" }}>
                        Watch All Reels
                      </Text>
                      <ArrowRight size={14} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dashboardData.reels.map((reel: any, idx: number) => (
                      <Pressable
                        key={reel._id || idx}
                        onPress={() => router.push(`/reels?index=${idx}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 200 : 160,
                          height: isWeb ? 300 : 250,
                          borderRadius: 20,
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          borderWidth: 1,
                          borderColor: hovered ? "rgba(244, 63, 94, 0.6)" : "rgba(255, 255, 255, 0.12)",
                          overflow: "hidden",
                          position: "relative",
                          transform: hovered ? [{ translateY: -4 }] : [],
                        })}
                      >
                        {/* Background Cover Image */}
                        {reel.coverImageUrl ? (
                          <Image
                            source={{ uri: reel.coverImageUrl }}
                            style={{
                              position: "absolute",
                              width: "100%",
                              height: "100%",
                              opacity: 0.55,
                            }}
                            resizeMode="cover"
                          />
                        ) : null}

                        <LinearGradient
                          colors={["transparent", "rgba(2, 6, 23, 0.6)", "rgba(2, 6, 23, 0.95)"]}
                          style={{ position: "absolute", inset: 0 }}
                        />

                        {/* Top Play Badge */}
                        <View style={{ position: "absolute", top: 12, right: 12 }}>
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: "rgba(244, 63, 94, 0.9)",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Play size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                          </View>
                        </View>

                        {/* Bottom Reel Details */}
                        <View style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                          <Text
                            numberOfLines={2}
                            style={{
                              color: "#FFFFFF",
                              fontSize: 13,
                              fontWeight: "800",
                              lineHeight: 17,
                              marginBottom: 4,
                            }}
                          >
                            {reel.title || reel.caption}
                          </Text>
                          <Text numberOfLines={1} style={{ color: "#FDA4AF", fontSize: 11, fontWeight: "600" }}>
                            {reel.bookTitle}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* MY BOOKSHELVES & READING LISTS RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {shelves && shelves.length > 0 ? (
                <View style={{ marginBottom: 36 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(56, 189, 248, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(56, 189, 248, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Library size={18} color="#38BDF8" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          My Bookshelves & Shelves
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Your curated reading queues, favorites, and custom lists
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/shelves" as any)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(56, 189, 248, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#38BDF8", fontSize: 12.5, fontWeight: "700" }}>
                        View All Shelves
                      </Text>
                      <ChevronRight size={14} color="#38BDF8" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 14, paddingVertical: 4 }}
                  >
                    {shelves.map((sh) => (
                      <TouchableOpacity
                        key={sh._id}
                        onPress={() => router.push(`/shelves/${sh.slug}` as any)}
                        style={{
                          width: isWeb ? 230 : 200,
                          backgroundColor: "#0F172A",
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: `${sh.color}40`,
                          padding: 16,
                          justifyContent: "space-between"
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${sh.color}20`, alignItems: "center", justifyContent: "center" }}>
                            <Bookmark size={16} color={sh.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>{sh.name}</Text>
                            <Text style={{ color: "#94A3B8", fontSize: 11 }}>{sh.totalBooks} {sh.totalBooks === 1 ? "Book" : "Books"}</Text>
                          </View>
                        </View>
                        <Text numberOfLines={2} style={{ color: "#64748B", fontSize: 11.5, lineHeight: 16 }}>
                          {sh.description || "Curated bookshelf"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* VIRAL LITERARY QUOTES & SHARE CARDS RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {featuredQuotes && featuredQuotes.length > 0 ? (
                <View style={{ marginBottom: 36 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(245, 158, 11, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(245, 158, 11, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Sparkles size={18} color="#F59E0B" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Inspiring Quotes & Share Cards
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Timeless wisdom from world classics — tap to create quote card
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/quotes" as any)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#F59E0B", fontSize: 12.5, fontWeight: "700" }}>
                        View All
                      </Text>
                      <ChevronRight size={14} color="#F59E0B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 16, paddingVertical: 4 }}
                  >
                    {featuredQuotes.map((q) => (
                      <TouchableOpacity
                        key={q._id}
                        onPress={() =>
                          setShareQuoteData({
                            quoteText: q.quoteText,
                            storyTitle: q.storyTitle,
                            storySlug: q.storySlug,
                            authorName: q.authorName,
                            category: q.category,
                            coverUrl: q.coverUrl
                          })
                        }
                        style={{
                          width: isWeb ? 290 : 250,
                          backgroundColor: "#0F172A",
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: "rgba(245, 158, 11, 0.25)",
                          padding: 18,
                          justifyContent: "space-between",
                          position: "relative"
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <View style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                            <Text style={{ color: "#F59E0B", fontSize: 10.5, fontWeight: "700" }}>{q.category || "Wisdom"}</Text>
                          </View>
                          <QuoteIcon size={16} color="#F59E0B" opacity={0.6} />
                        </View>

                        <Text
                          numberOfLines={3}
                          style={{
                            color: "#F8FAFC",
                            fontSize: 14,
                            fontWeight: "600",
                            fontStyle: "italic",
                            lineHeight: 20,
                            marginBottom: 12
                          }}
                        >
                          "{q.quoteText}"
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.08)", paddingTop: 10 }}>
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>{q.authorName}</Text>
                            <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 10.5 }}>{q.storyTitle}</Text>
                          </View>
                          <View style={{ backgroundColor: "#0284C7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>Share</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* Social Quote Card Share Modal */}
              <QuoteCardShareModal
                visible={!!shareQuoteData}
                onClose={() => setShareQuoteData(null)}
                quoteData={shareQuoteData}
              />

              {/* ───────────────────────────────────────────────────────────── */}
              {/* RECENTLY VIEWED CLASSICS RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.recentlyViewed && dashboardData.recentlyViewed.length > 0 ? (
                <View style={{ marginBottom: 36 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(56, 189, 248, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(56, 189, 248, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Eye size={18} color="#38BDF8" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Recently Viewed Classics
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Books you recently opened or explored
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/explore")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(56, 189, 248, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#38BDF8", fontSize: 12.5, fontWeight: "700" }}>
                        View History
                      </Text>
                      <ArrowRight size={14} color="#38BDF8" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dashboardData.recentlyViewed.map((book: any) => (
                      <Pressable
                        key={book._id || book.slug}
                        onPress={() => router.push(`/details/${book.slug}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 170 : 140,
                          backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                          borderWidth: 1,
                          borderColor: hovered ? "rgba(56, 189, 248, 0.5)" : "rgba(255, 255, 255, 0.08)",
                          borderRadius: 18,
                          padding: 12,
                          transform: hovered ? [{ translateY: -4 }] : [],
                        })}
                      >
                        <View style={{ position: "relative", width: "100%", height: isWeb ? 230 : 190, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
                          {book.coverImageUrl ? (
                            <Image
                              source={{ uri: book.coverImageUrl }}
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#1E293B",
                              }}
                              resizeMode="cover"
                            />
                          ) : null}

                          {/* Top-Left Format Badges: [📖 Ebook] + [🎧 Audio] */}
                          <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.6)" }}>
                              <BookOpen size={9} color="#38BDF8" />
                              <Text style={{ color: "#38BDF8", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Ebook</Text>
                            </View>
                            {(book.hasAudio || book.isAudiobook || book.contentType === "both" || book.contentType === "audiobook" || (book.totalDurationSeconds && book.totalDurationSeconds > 0)) ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.6)" }}>
                                <Headphones size={9} color="#C084FC" />
                                <Text style={{ color: "#C084FC", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Audio</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <Text
                          numberOfLines={2}
                          style={{
                            color: "#FFFFFF",
                            fontSize: 13.5,
                            fontWeight: "700",
                            lineHeight: 18,
                            marginBottom: 4,
                          }}
                        >
                          {getTitleText(book.title)}
                        </Text>

                        <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: "500" }}>
                          {book.author}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
              {/* ───────────────────────────────────────────────────────────── */}
              {/* 7. CATEGORY MENTION QUICK SLIDER (2 ROWS OF CATEGORIES) */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.categories && dashboardData.categories.length > 0 ? (
                <View style={{ marginBottom: 40 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(129, 140, 248, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(129, 140, 248, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Compass size={18} color="#818CF8" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Explore Book Categories
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Browse classics by genre, theme & literary period
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/category")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(129, 140, 248, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(129, 140, 248, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#818CF8", fontSize: 12.5, fontWeight: "700" }}>
                        All Categories
                      </Text>
                      <ArrowRight size={14} color="#818CF8" />
                    </TouchableOpacity>
                  </View>

                  {/* 2-ROW HORIZONTAL SCROLLABLE CATEGORY SLIDER */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: "column", gap: 12 }}>
                      {/* Row 1 */}
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        {dashboardData.categories.slice(0, Math.ceil(dashboardData.categories.length / 2)).map((cat: any) => (
                          <Pressable
                            key={`row1-${cat._id || cat.slug}`}
                            onPress={() => router.push(`/category/${cat.slug}`)}
                            style={({ hovered }: any) => ({
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              borderRadius: 16,
                              backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.85)",
                              borderWidth: 1,
                              borderColor: hovered ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)",
                              transform: hovered ? [{ translateY: -2 }] : [],
                            })}
                          >
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                backgroundColor: "rgba(129, 140, 248, 0.2)",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <BookOpen size={16} color="#818CF8" />
                            </View>
                            <View>
                              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                                {cat.name}
                              </Text>
                              <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                                {cat.bookCount || 5} Books
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>

                      {/* Row 2 */}
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        {dashboardData.categories.slice(Math.ceil(dashboardData.categories.length / 2)).map((cat: any) => (
                          <Pressable
                            key={`row2-${cat._id || cat.slug}`}
                            onPress={() => router.push(`/category/${cat.slug}`)}
                            style={({ hovered }: any) => ({
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              borderRadius: 16,
                              backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.85)",
                              borderWidth: 1,
                              borderColor: hovered ? "rgba(56, 189, 248, 0.5)" : "rgba(255, 255, 255, 0.1)",
                              transform: hovered ? [{ translateY: -2 }] : [],
                            })}
                          >
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                backgroundColor: "rgba(56, 189, 248, 0.2)",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Layers size={16} color="#38BDF8" />
                            </View>
                            <View>
                              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                                {cat.name}
                              </Text>
                              <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                                {cat.bookCount || 5} Books
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 2. HERO SHOWCASE BANNER */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.hero ? (
                <View
                  style={{
                    borderRadius: 28,
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    padding: isWeb ? 32 : 20,
                    marginBottom: 36,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <LinearGradient
                    colors={["rgba(129, 140, 248, 0.25)", "rgba(139, 92, 246, 0.08)", "transparent"]}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  />

                  <View
                    style={{
                      flexDirection: isWeb ? "row" : "column",
                      alignItems: isWeb ? "center" : "flex-start",
                      gap: isWeb ? 32 : 20,
                    }}
                  >
                    {dashboardData.hero.coverImageUrl ? (
                      <Image
                        source={{ uri: dashboardData.hero.coverImageUrl }}
                        style={{
                          width: isWeb ? 150 : 120,
                          height: isWeb ? 225 : 180,
                          borderRadius: 16,
                          backgroundColor: "#1E293B",
                        }}
                        resizeMode="cover"
                      />
                    ) : null}

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 20,
                            backgroundColor: "rgba(129, 140, 248, 0.2)",
                            borderWidth: 1,
                            borderColor: "rgba(129, 140, 248, 0.4)",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Sparkles size={13} color="#818CF8" />
                          <Text style={{ color: "#C7D2FE", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                            FEATURED CLASSIC
                          </Text>
                        </View>

                        {dashboardData.hero.hasArtworks ? (
                          <View
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 20,
                              backgroundColor: "rgba(236, 72, 153, 0.2)",
                              borderWidth: 1,
                              borderColor: "rgba(236, 72, 153, 0.4)",
                            }}
                          >
                            <Text style={{ color: "#F472B6", fontSize: 11, fontWeight: "700" }}>
                              🎨 ARTWORKS EDITION
                            </Text>
                          </View>
                        ) : null}
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
                        {getTitleText(dashboardData.hero.title)}
                      </Text>

                      <Text style={{ color: "#94A3B8", fontSize: 15, fontWeight: "600", marginBottom: 12 }}>
                        By {dashboardData.hero.author}
                      </Text>

                      {dashboardData.hero.synopsis ? (
                        <Text
                          numberOfLines={3}
                          style={{ color: "#CBD5E1", fontSize: 13.5, lineHeight: 22, marginBottom: 20 }}
                        >
                          {dashboardData.hero.synopsis}
                        </Text>
                      ) : null}

                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                        <TouchableOpacity
                          onPress={() => router.push(`/read/${dashboardData.hero.slug}`)}
                          style={{
                            paddingHorizontal: 22,
                            paddingVertical: 12,
                            borderRadius: 16,
                            backgroundColor: "#6366F1",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <BookOpen size={16} color="#FFFFFF" />
                          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                            Start Reading Now
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => router.push(`/details/${dashboardData.hero.slug}`)}
                          style={{
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 16,
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            borderWidth: 1,
                            borderColor: "rgba(255, 255, 255, 0.15)",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Headphones size={16} color="#38BDF8" />
                          <Text style={{ color: "#E2E8F0", fontSize: 14, fontWeight: "600" }}>
                            Audiobook Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 3. TOP 100 EBOOKS MASTERWORKS RANKED RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.top100 && dashboardData.top100.length > 0 ? (
                <View style={{ marginBottom: 40 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(245, 158, 11, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(245, 158, 11, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Award size={18} color="#F59E0B" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Top 100 Ebooks & Ranked Masterworks
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Highest Rated World Literature & All-Time Classics
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/explore")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#F59E0B", fontSize: 12.5, fontWeight: "700" }}>
                        View All Top 100
                      </Text>
                      <ArrowRight size={14} color="#F59E0B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dashboardData.top100.map((book: any) => (
                      <Pressable
                        key={book._id || book.slug}
                        onPress={() => router.push(`/details/${book.slug}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 170 : 140,
                          backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                          borderWidth: 1,
                          borderColor: hovered ? "rgba(245, 158, 11, 0.5)" : "rgba(255, 255, 255, 0.08)",
                          borderRadius: 18,
                          padding: 12,
                          position: "relative",
                          transform: hovered ? [{ translateY: -4 }] : [],
                        })}
                      >
                        {/* Rank Badge */}
                        <View
                          style={{
                            position: "absolute",
                            top: 18,
                            left: 18,
                            zIndex: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 10,
                            backgroundColor: "#F59E0B",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.5,
                            shadowRadius: 4,
                          }}
                        >
                          <Text style={{ color: "#0F172A", fontSize: 11, fontWeight: "900" }}>
                            #{book.rank}
                          </Text>
                        </View>

                        <View style={{ position: "relative", width: "100%", height: isWeb ? 230 : 190, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
                          {book.coverImageUrl ? (
                            <Image
                              source={{ uri: book.coverImageUrl }}
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#1E293B",
                              }}
                              resizeMode="cover"
                            />
                          ) : null}

                          {/* Top-Left Format Badges: [📖 Ebook] + [🎧 Audio] */}
                          <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.6)" }}>
                              <BookOpen size={9} color="#38BDF8" />
                              <Text style={{ color: "#38BDF8", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Ebook</Text>
                            </View>
                            {(book.hasAudio || book.isAudiobook || book.contentType === "both" || book.contentType === "audiobook" || (book.totalDurationSeconds && book.totalDurationSeconds > 0)) ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.6)" }}>
                                <Headphones size={9} color="#C084FC" />
                                <Text style={{ color: "#C084FC", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Audio</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <Text
                          numberOfLines={2}
                          style={{
                            color: "#FFFFFF",
                            fontSize: 13.5,
                            fontWeight: "700",
                            lineHeight: 18,
                            marginBottom: 4,
                          }}
                        >
                          {getTitleText(book.title)}
                        </Text>

                        <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: "500" }}>
                          {book.author}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 4. NEWLY ADDED EBOOKS & FRESH CLASSICS RAIL */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.newlyAdded && dashboardData.newlyAdded.length > 0 ? (
                <View style={{ marginBottom: 40 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(16, 185, 129, 0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(16, 185, 129, 0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <PlusCircle size={18} color="#10B981" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Newly Added Ebooks & Fresh Ingestions
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Recently Processed Standard Ebooks Repositories
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/explore")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#10B981", fontSize: 12.5, fontWeight: "700" }}>
                        View All New
                      </Text>
                      <ArrowRight size={14} color="#10B981" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dashboardData.newlyAdded.map((book: any) => (
                      <Pressable
                        key={book._id || book.slug}
                        onPress={() => router.push(`/details/${book.slug}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 170 : 140,
                          backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                          borderWidth: 1,
                          borderColor: hovered ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.08)",
                          borderRadius: 18,
                          padding: 12,
                          position: "relative",
                          transform: hovered ? [{ translateY: -4 }] : [],
                        })}
                      >
                        <View
                          style={{
                            position: "absolute",
                            top: 18,
                            right: 18,
                            zIndex: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: "#10B981",
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "900" }}>NEW</Text>
                        </View>

                        <View style={{ position: "relative", width: "100%", height: isWeb ? 230 : 190, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
                          {book.coverImageUrl ? (
                            <Image
                              source={{ uri: book.coverImageUrl }}
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#1E293B",
                              }}
                              resizeMode="cover"
                            />
                          ) : null}

                          {/* Top-Left Format Badges: [📖 Ebook] + [🎧 Audio] */}
                          <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.6)" }}>
                              <BookOpen size={9} color="#38BDF8" />
                              <Text style={{ color: "#38BDF8", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Ebook</Text>
                            </View>
                            {(book.hasAudio || book.isAudiobook || book.contentType === "both" || book.contentType === "audiobook" || (book.totalDurationSeconds && book.totalDurationSeconds > 0)) ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.6)" }}>
                                <Headphones size={9} color="#C084FC" />
                                <Text style={{ color: "#C084FC", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Audio</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <Text
                          numberOfLines={2}
                          style={{
                            color: "#FFFFFF",
                            fontSize: 13.5,
                            fontWeight: "700",
                            lineHeight: 18,
                            marginBottom: 4,
                          }}
                        >
                          {getTitleText(book.title)}
                        </Text>

                        <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: "500" }}>
                          {book.author}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 5. CATEGORY-WISE BOOK RAILS (Top Categories) */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.categories && dashboardData.categories.length > 0 ? (
                dashboardData.categories.map((category: any) => (
                  <View key={category._id || category.slug} style={{ marginBottom: 36 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            backgroundColor: "rgba(129, 140, 248, 0.15)",
                            borderWidth: 1,
                            borderColor: "rgba(129, 140, 248, 0.3)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <BookOpen size={18} color="#818CF8" />
                        </View>
                        <View>
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 19,
                              fontWeight: "800",
                              fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                            }}
                          >
                            {category.name}
                          </Text>
                          <Text style={{ color: "#64748B", fontSize: 12 }}>
                            {category.bookCount || category.books?.length || 5} Masterwork Volumes
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => router.push(`/category/${category.slug}`)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          borderWidth: 1,
                          borderColor: "rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <Text style={{ color: "#38BDF8", fontSize: 12.5, fontWeight: "700" }}>
                          View All
                        </Text>
                        <ArrowRight size={14} color="#38BDF8" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                      {category.books.map((book: any) => {
                        const title = getTitleText(book.title);
                        const isAudio = !!(book.hasAudio || book.isAudiobook);

                        return (
                          <Pressable
                            key={book._id || book.slug}
                            onPress={() => router.push(`/details/${book.slug}`)}
                            style={({ hovered }: any) => ({
                              width: isWeb ? 170 : 140,
                              backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                              borderWidth: 1,
                              borderColor: hovered ? "rgba(129, 140, 248, 0.4)" : "rgba(255, 255, 255, 0.08)",
                              borderRadius: 18,
                              padding: 12,
                              transform: hovered ? [{ translateY: -4 }] : [],
                            })}
                          >
                            <View style={{ position: "relative", width: "100%", height: isWeb ? 230 : 190, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
                              {book.coverImageUrl ? (
                                <Image
                                  source={{ uri: book.coverImageUrl }}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "#1E293B",
                                  }}
                                  resizeMode="cover"
                                />
                              ) : null}

                              {/* Top-Left Format Badges: [📖 Ebook] + [🎧 Audio] */}
                              <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.6)" }}>
                                  <BookOpen size={9} color="#38BDF8" />
                                  <Text style={{ color: "#38BDF8", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Ebook</Text>
                                </View>
                                {isAudio ? (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.6)" }}>
                                    <Headphones size={9} color="#C084FC" />
                                    <Text style={{ color: "#C084FC", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Audio</Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                              <View
                                style={{
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderRadius: 4,
                                  backgroundColor: isAudio ? "rgba(139, 92, 246, 0.2)" : "rgba(56, 189, 248, 0.15)",
                                  borderWidth: 0.5,
                                  borderColor: isAudio ? "rgba(139, 92, 246, 0.4)" : "rgba(56, 189, 248, 0.3)",
                                }}
                              >
                                <Text
                                  style={{
                                    color: isAudio ? "#C084FC" : "#38BDF8",
                                    fontSize: 8.5,
                                    fontWeight: "700",
                                  }}
                                >
                                  {isAudio ? "AUDIOBOOK" : "EBOOK"}
                                </Text>
                              </View>

                              {book.hasArtworks ? (
                                <View
                                  style={{
                                    paddingHorizontal: 5,
                                    paddingVertical: 1.5,
                                    borderRadius: 4,
                                    backgroundColor: "rgba(236, 72, 153, 0.2)",
                                    borderWidth: 0.5,
                                    borderColor: "rgba(236, 72, 153, 0.4)",
                                  }}
                                >
                                  <Text style={{ color: "#F472B6", fontSize: 8.5, fontWeight: "700" }}>
                                    ARTWORKS
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <Text
                              numberOfLines={2}
                              style={{
                                color: "#FFFFFF",
                                fontSize: 13.5,
                                fontWeight: "700",
                                lineHeight: 18,
                                marginBottom: 4,
                              }}
                            >
                              {title}
                            </Text>

                            {book.author ? (
                              <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: "500" }}>
                                {book.author}
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ))
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 6. EXPLORE BOOK SERIES SAGAS */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.series && dashboardData.series.length > 0 ? (
                <View style={{ marginBottom: 40 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          borderWidth: 1,
                          borderColor: "rgba(245, 158, 11, 0.35)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Layers size={18} color="#F59E0B" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Explore Masterwork Book Series
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Chronological Multivolume Sagas & Collections
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/series")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#F59E0B", fontSize: 12.5, fontWeight: "700" }}>
                        View All Series
                      </Text>
                      <ArrowRight size={14} color="#F59E0B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dashboardData.series.map((s: any) => (
                      <Pressable
                        key={s._id || s.slug}
                        onPress={() => router.push(`/series/${s.slug}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 260 : 210,
                          backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                          borderWidth: 1,
                          borderColor: hovered ? "rgba(245, 158, 11, 0.5)" : "rgba(255, 255, 255, 0.08)",
                          borderRadius: 22,
                          padding: 16,
                          transform: hovered ? [{ translateY: -4 }] : [],
                        })}
                      >
                        {s.coverImageUrl ? (
                          <Image
                            source={{ uri: s.coverImageUrl }}
                            style={{
                              width: "100%",
                              height: 140,
                              borderRadius: 12,
                              backgroundColor: "#1E293B",
                              marginBottom: 12,
                            }}
                            resizeMode="cover"
                          />
                        ) : null}

                        <View
                          style={{
                            alignSelf: "flex-start",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            borderWidth: 0.5,
                            borderColor: "rgba(245, 158, 11, 0.3)",
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "700" }}>
                            {s.bookCount} VOLUMES SAGA
                          </Text>
                        </View>

                        <Text
                          numberOfLines={1}
                          style={{
                            color: "#FFFFFF",
                            fontSize: 16,
                            fontWeight: "700",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                            marginBottom: 3,
                          }}
                        >
                          {s.title}
                        </Text>

                        {s.author ? (
                          <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 12, fontWeight: "500" }}>
                            By {s.author}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 7. POPULAR AUTHORS SPOTLIGHT */}
              {/* ───────────────────────────────────────────────────────────── */}
              {dashboardData.authors && dashboardData.authors.length > 0 ? (
                <View style={{ marginBottom: 40 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "rgba(139, 92, 246, 0.15)",
                          borderWidth: 1,
                          borderColor: "rgba(139, 92, 246, 0.35)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <User size={18} color="#C084FC" />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: "800",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                          }}
                        >
                          Famous Authors & Mastermind Writers
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          Legendary Literary Creators & Catalogs
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/author")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: "rgba(139, 92, 246, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      <Text style={{ color: "#C084FC", fontSize: 12.5, fontWeight: "700" }}>
                        View All Authors
                      </Text>
                      <ArrowRight size={14} color="#C084FC" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {dashboardData.authors.map((author: any) => (
                      <Pressable
                        key={author._id || author.slug}
                        onPress={() => router.push(`/author/${author.slug}`)}
                        style={({ hovered }: any) => ({
                          width: isWeb ? 220 : 180,
                          backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                          borderWidth: 1,
                          borderColor: hovered ? "rgba(192, 132, 252, 0.5)" : "rgba(255, 255, 255, 0.08)",
                          borderRadius: 22,
                          padding: 16,
                          alignItems: "center",
                          transform: hovered ? [{ translateY: -4 }] : [],
                        })}
                      >
                        <View
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: "rgba(139, 92, 246, 0.2)",
                            borderWidth: 1,
                            borderColor: "rgba(139, 92, 246, 0.4)",
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: 10,
                          }}
                        >
                          <User size={26} color="#C084FC" />
                        </View>

                        <Text
                          numberOfLines={1}
                          style={{
                            color: "#FFFFFF",
                            fontSize: 15,
                            fontWeight: "700",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                            marginBottom: 4,
                            textAlign: "center",
                          }}
                        >
                          {author.name}
                        </Text>

                        <Text style={{ color: "#38BDF8", fontSize: 12, fontWeight: "600" }}>
                          {author.bookCount} Masterworks
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
