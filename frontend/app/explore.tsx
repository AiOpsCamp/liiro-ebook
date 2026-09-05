import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  TouchableOpacity
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Search,
  X,
  BookOpen,
  Sparkles,
  Layers,
  Award,
  Headphones,
  Compass,
  Flame,
  Globe,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
  Zap,
  Play,
  Star
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppText as Text } from "@/components/ui/AppText";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import { useGetStoriesQuery } from "@/api/storiesQuery";
import ProfileNavbarMenu from "@/components/ebook/ProfileNavbarMenu";
import { getLocalizedText } from "@/utils/getLocalizedText";

type GenreKey =
  | "all"
  | "childrens-classics"
  | "science-fiction-and-space"
  | "fantasy-and-magic"
  | "mystery-and-detective"
  | "gothic-and-dark-fantasy"
  | "high-adventure-and-survival"
  | "philosophy-and-ethics"
  | "world-literature-masterworks"
  | "plays-and-drama"
  | "poetry-and-epics"
  | "audiobooks";

const GENRES: { key: GenreKey; label: string; icon: any; color: string }[] = [
  { key: "all", label: "All Masterworks", icon: Compass, color: "#0EA5E9" },
  { key: "science-fiction-and-space", label: "Sci-Fi & Space", icon: Zap, color: "#38BDF8" },
  { key: "mystery-and-detective", label: "Mystery & Detective", icon: Search, color: "#EC4899" },
  { key: "high-adventure-and-survival", label: "High Adventure", icon: Compass, color: "#10B981" },
  { key: "fantasy-and-magic", label: "Fantasy & Magic", icon: Sparkles, color: "#A855F7" },
  { key: "gothic-and-dark-fantasy", label: "Gothic & Horror", icon: Flame, color: "#F43F5E" },
  { key: "philosophy-and-ethics", label: "Philosophy & Ethics", icon: BookOpen, color: "#6366F1" },
  { key: "world-literature-masterworks", label: "World Masterworks", icon: Globe, color: "#818CF8" },
  { key: "plays-and-drama", label: "Plays & Drama", icon: Layers, color: "#EF4444" },
  { key: "poetry-and-epics", label: "Poetry & Epics", icon: Award, color: "#F59E0B" },
  { key: "childrens-classics", label: "Children's Classics", icon: Heart, color: "#F472B6" },
  { key: "audiobooks", label: "Audiobooks 🎙️", icon: Headphones, color: "#C084FC" },
];

const CEFR_LEVELS = ["All Levels", "A1-A2", "B1-B2", "C1-C2"];

export default function ExploreAllBooksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ genre?: string; tag?: string; search?: string }>();
  const insets = useSafeAreaInsets();
  const tokens = useSelector(selectThemeTokens);
  const isDark = useSelector(selectIsDark);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const contentWidth = Math.min(width, 1200);

  const { data: storiesResp, isLoading } = useGetStoriesQuery({ limit: 1000 });
  const allStories = useMemo(() => storiesResp?.data || [], [storiesResp]);

  const [searchQuery, setSearchQuery] = useState(params.search || "");
  const [selectedGenre, setSelectedGenre] = useState<GenreKey>(
    (params.genre as GenreKey) || "all"
  );
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  React.useEffect(() => {
    if (params.search) {
      setSearchQuery(params.search);
      setPage(1);
    }
  }, [params.search]);

  const filteredStories = useMemo(() => {
    return allStories.filter((story) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();

        // Special keyword matching for Artworks / Illustrations
        if (["artwork", "artworks", "illustrated", "illustration", "illustrations", "pictures"].includes(q)) {
          if (story.hasArtworks || story.isIllustrated || (story.illustrationsCount && story.illustrationsCount > 0)) {
            return true;
          }
        }

        // Special keyword matching for Audiobooks
        if (["audio", "audiobook", "audiobooks", "narration", "voice"].includes(q)) {
          if (story.hasAudio || story.isAudiobook || story.contentType === "audiobook" || story.contentType === "both") {
            return true;
          }
        }

        const titleText = getLocalizedText(story.title).toLowerCase();
        const authorText = (story.author || story.authorName || "").toLowerCase();
        const synopsisText = (story.synopsis || story.description || story.summary || "").toLowerCase();
        const tagsText = (story.tags || [])
          .map((t) => (typeof t === "object" ? t.name || t.slug : String(t)))
          .join(" ")
          .toLowerCase();
        const catText = (typeof story.category === "object" ? story.category?.name || story.category?.slug : String(story.category || "")).toLowerCase();
        
        if (!titleText.includes(q) && !authorText.includes(q) && !synopsisText.includes(q) && !tagsText.includes(q) && !catText.includes(q)) {
          return false;
        }
      }

      // 2. Genre Filter
      if (selectedGenre !== "all") {
        if (selectedGenre === "audiobooks") {
          if (!story.hasAudio && !story.isAudiobook && story.contentType !== "audiobook" && story.contentType !== "both") {
            return false;
          }
        } else {
          const catSlug = (typeof story.category === "object" ? story.category?.slug : story.category || "").toLowerCase();
          const tagsStr = (story.tags || []).map((t) => (typeof t === "object" ? t.slug || t.name : String(t))).join(" ").toLowerCase();
          const matchTarget = selectedGenre.toLowerCase();

          if (!catSlug.includes(matchTarget) && !tagsStr.includes(matchTarget)) {
            const keyMap: Record<string, string[]> = {
              "science-fiction-and-space": ["scifi", "science", "space", "robot", "time"],
              "mystery-and-detective": ["mystery", "detective", "crime", "sherlock"],
              "high-adventure-and-survival": ["adventure", "survival", "sea", "pirate"],
              "fantasy-and-magic": ["fantasy", "magic", "dragon", "fairy"],
              "gothic-and-dark-fantasy": ["gothic", "horror", "vampire", "dark"],
              "philosophy-and-ethics": ["philosophy", "ethic", "logic"],
              "plays-and-drama": ["play", "drama", "tragedy"],
              "poetry-and-epics": ["poetry", "poem", "epic"],
              "childrens-classics": ["children", "fables", "nursery"]
            };
            const altKeys = keyMap[selectedGenre] || [];
            const hasAltMatch = altKeys.some((k) => catSlug.includes(k) || tagsStr.includes(k));
            if (!hasAltMatch) return false;
          }
        }
      }

      // 3. Level Filter
      if (selectedLevel !== "All Levels") {
        const lvl = story.difficultyLevel || "";
        if (selectedLevel === "A1-A2" && !/A1|A2|Beginner/i.test(lvl)) return false;
        if (selectedLevel === "B1-B2" && !/B1|B2|Intermediate/i.test(lvl)) return false;
        if (selectedLevel === "C1-C2" && !/C1|C2|Advanced/i.test(lvl)) return false;
      }

      return true;
    });
  }, [allStories, searchQuery, selectedGenre, selectedLevel]);

  const totalPages = Math.ceil(filteredStories.length / PAGE_SIZE) || 1;
  const paginatedStories = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStories.slice(start, start + PAGE_SIZE);
  }, [filteredStories, page]);

  // Card Column width
  const cardWidth = isWeb
    ? width > 1100
      ? "23%"
      : width > 768
      ? "31%"
      : "48%"
    : "48%";

  return (
    <View style={{ flex: 1, backgroundColor: "#020617" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

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
                Public Domain Catalog
              </Text>
            </View>
          </Pressable>

          {/* Desktop Web Navigation Links */}
          {isWeb ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: "600" }}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/explore")}>
                <Text style={{ color: "#818CF8", fontSize: 13.5, fontWeight: "700" }}>Explore Catalog</Text>
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

          {/* User Controls: Streak & Profile Menu */}
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
      {/* MAIN BODY CONTENT */}
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
          {/* Hero Explore Banner Showcase */}
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
              colors={["rgba(14, 165, 233, 0.22)", "rgba(139, 92, 246, 0.08)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 100,
                  backgroundColor: "rgba(14, 165, 233, 0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(14, 165, 233, 0.4)",
                }}
              >
                <Text style={{ color: "#38BDF8", fontSize: 11, fontWeight: "800" }}>
                  EXPLORE 1,400+ MASTERWORKS
                </Text>
              </View>
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
              Discover Timeless Ebooks & Audiobooks
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 13.5, marginBottom: 20 }}>
              Search across classic literature, science fiction, mystery sagas, philosophy, and high adventures
            </Text>

            {/* Live Search Bar */}
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
                onChangeText={(t) => {
                  setSearchQuery(t);
                  setPage(1);
                }}
                placeholder="Search masterworks by title, author, genre or tags..."
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

          {/* Genre Chips Slider Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          >
            {GENRES.map((g) => {
              const isActive = selectedGenre === g.key;
              const Icon = g.icon;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => {
                    setSelectedGenre(g.key);
                    setPage(1);
                  }}
                  style={({ hovered }: any) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 100,
                    backgroundColor: isActive
                      ? g.color
                      : hovered
                      ? "rgba(30, 41, 59, 0.9)"
                      : "rgba(15, 23, 42, 0.8)",
                    borderWidth: 1,
                    borderColor: isActive
                      ? g.color
                      : hovered
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(255, 255, 255, 0.08)",
                    gap: 8,
                  })}
                >
                  <Icon size={15} color={isActive ? "#FFFFFF" : "#94A3B8"} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? "800" : "600",
                      color: isActive ? "#FFFFFF" : "#CBD5E1",
                    }}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Level Filter & View Controls Bar */}
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
            {/* Level Pills */}
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Text style={{ color: "#64748B", fontSize: 12.5, fontWeight: "600", marginRight: 4 }}>
                CEFR Level:
              </Text>
              {CEFR_LEVELS.map((lvl) => {
                const isActive = selectedLevel === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => {
                      setSelectedLevel(lvl);
                      setPage(1);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 100,
                      backgroundColor: isActive
                        ? "rgba(14, 165, 233, 0.2)"
                        : "rgba(15, 23, 42, 0.8)",
                      borderWidth: 1,
                      borderColor: isActive
                        ? "#0EA5E9"
                        : "rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? "800" : "600",
                        color: isActive ? "#38BDF8" : "#94A3B8",
                      }}
                    >
                      {lvl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Results count & View Mode Toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: "600" }}>
                Showing <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{filteredStories.length}</Text> books
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

          {/* Loading Indicator */}
          {isLoading ? (
            <View style={{ paddingVertical: 100, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#818CF8" />
              <Text style={{ color: "#94A3B8", marginTop: 16, fontSize: 14 }}>
                Loading masterwork catalog...
              </Text>
            </View>
          ) : paginatedStories.length === 0 ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <BookOpen size={48} color="#64748B" />
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginTop: 16 }}>
                No masterworks found
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>
                Try adjusting your search query or genre filter
              </Text>
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setSelectedGenre("all");
                  setSelectedLevel("All Levels");
                }}
                style={{
                  marginTop: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 100,
                  backgroundColor: "rgba(129, 140, 248, 0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(129, 140, 248, 0.4)",
                }}
              >
                <Text style={{ color: "#818CF8", fontSize: 13, fontWeight: "700" }}>Clear Filters</Text>
              </Pressable>
            </View>
          ) : (
            /* Catalog Grid / List */
            <View
              style={
                viewMode === "grid"
                  ? {
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 16,
                      marginBottom: 40,
                    }
                  : { flexDirection: "column", gap: 12, marginBottom: 40 }
              }
            >
              {paginatedStories.map((book) => {
                const titleStr = getLocalizedText(book.title);
                const authorStr = book.author || book.authorName || "Classic Author";
                const hasAudio = book.hasAudio || book.isAudiobook || book.contentType === "audiobook" || book.contentType === "both";

                if (viewMode === "list") {
                  return (
                    <Pressable
                      key={book._id || book.slug}
                      onPress={() => router.push(`/details/${book.slug}`)}
                      style={({ hovered }: any) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16,
                        padding: 14,
                        borderRadius: 18,
                        backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.8)",
                        borderWidth: 1,
                        borderColor: hovered ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.08)",
                        transform: hovered ? [{ translateY: -2 }] : [],
                      })}
                    >
                      {book.coverImageUrl ? (
                        <Image
                          source={{ uri: book.coverImageUrl }}
                          style={{
                            width: 60,
                            height: 85,
                            borderRadius: 10,
                            backgroundColor: "#1E293B",
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 60,
                            height: 85,
                            borderRadius: 10,
                            backgroundColor: "rgba(129, 140, 248, 0.15)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <BookOpen size={24} color="#818CF8" />
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {book.difficultyLevel ? (
                            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "rgba(14, 165, 233, 0.2)" }}>
                              <Text style={{ color: "#38BDF8", fontSize: 10.5, fontWeight: "800" }}>
                                {book.difficultyLevel}
                              </Text>
                            </View>
                          ) : null}
                          {hasAudio ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "rgba(168, 85, 247, 0.2)" }}>
                              <Headphones size={11} color="#C084FC" />
                              <Text style={{ color: "#C084FC", fontSize: 10.5, fontWeight: "800" }}>AUDIO</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text
                          numberOfLines={1}
                          style={{
                            color: "#FFFFFF",
                            fontSize: 16,
                            fontWeight: "700",
                            fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                            marginBottom: 2,
                          }}
                        >
                          {titleStr}
                        </Text>
                        <Text style={{ color: "#94A3B8", fontSize: 13 }}>{authorStr}</Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => router.push(`/read/${book.slug}`)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 12,
                            backgroundColor: "#6366F1",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: "700" }}>Read</Text>
                        </TouchableOpacity>
                      </View>
                    </Pressable>
                  );
                }

                return (
                  <Pressable
                    key={book._id || book.slug}
                    onPress={() => router.push(`/details/${book.slug}`)}
                    style={({ hovered }: any) => ({
                      width: cardWidth as any,
                      backgroundColor: hovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.85)",
                      borderWidth: 1,
                      borderColor: hovered ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.08)",
                      borderRadius: 18,
                      padding: 12,
                      transform: hovered ? [{ translateY: -4 }] : [],
                      boxShadow: hovered ? "0 10px 25px rgba(0,0,0,0.4)" : "none",
                    })}
                  >
                    <View style={{ position: "relative", width: "100%", aspectRatio: 2 / 3, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
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
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(129, 140, 248, 0.15)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <BookOpen size={36} color="#818CF8" />
                        </View>
                      )}

                      {/* Top-Left Format Badges Overlay: [📖 Ebook] + [🎧 Audio] */}
                      <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, zIndex: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(14, 165, 233, 0.6)" }}>
                          <BookOpen size={9} color="#38BDF8" />
                          <Text style={{ color: "#38BDF8", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Ebook</Text>
                        </View>
                        {hasAudio ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.6)" }}>
                            <Headphones size={9} color="#C084FC" />
                            <Text style={{ color: "#C084FC", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2 }}>Audio</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Top-Right CEFR Level Pill Overlay */}
                      {book.difficultyLevel ? (
                        <View style={{ position: "absolute", top: 8, right: 8, zIndex: 10, paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(2, 6, 23, 0.85)", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.5)" }}>
                          <Text style={{ color: "#10B981", fontSize: 8.5, fontWeight: "800" }}>
                            {book.difficultyLevel}
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
                        fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined,
                      }}
                    >
                      {titleStr}
                    </Text>

                    <Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: "500" }}>
                      {authorStr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginTop: 20,
                marginBottom: 40,
              }}
            >
              <Pressable
                disabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: page === 1 ? "rgba(255, 255, 255, 0.05)" : "rgba(129, 140, 248, 0.2)",
                  borderWidth: 1,
                  borderColor: page === 1 ? "transparent" : "rgba(129, 140, 248, 0.4)",
                  opacity: page === 1 ? 0.4 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ChevronLeft size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Previous</Text>
              </Pressable>

              <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600" }}>
                Page <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{page}</Text> of {totalPages}
              </Text>

              <Pressable
                disabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: page === totalPages ? "rgba(255, 255, 255, 0.05)" : "rgba(129, 140, 248, 0.2)",
                  borderWidth: 1,
                  borderColor: page === totalPages ? "transparent" : "rgba(129, 140, 248, 0.4)",
                  opacity: page === totalPages ? 0.4 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Next</Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
