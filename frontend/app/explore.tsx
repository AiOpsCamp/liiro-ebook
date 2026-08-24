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
  Sparkles,
  Layers,
  Award,
  Headphones,
  Compass,
  Flame,
  Globe,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
  Zap,
} from "lucide-react-native";

import { AppText as Text } from "@/components/ui/AppText";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import { useGetStoriesQuery, useGetStoriesDashboardQuery, Story } from "@/api/storiesQuery";
import StoryCard from "@/components/ebook/StoryCard";
import { getLocalizedText } from "@/utils/getLocalizedText";

type GenreKey =
  | "all"
  | "philosophy"
  | "comedy"
  | "fantasy"
  | "horror"
  | "thriller"
  | "gothic"
  | "drama"
  | "biography"
  | "nature"
  | "victorian"
  | "russian"
  | "french"
  | "adventure"
  | "romance"
  | "scifi"
  | "mystery"
  | "classic"
  | "audiobooks";

const GENRES: { key: GenreKey; label: string; icon: any; color: string }[] = [
  { key: "all",        label: "All Masterworks",   icon: Compass,            color: "#0EA5E9" },
  { key: "philosophy", label: "Philosophy & Thought",icon: Sparkles,         color: "#F59E0B" },
  { key: "comedy",     label: "Comedy & Satire",   icon: Flame,              color: "#EF4444" },
  { key: "fantasy",    label: "Fantasy & Magic",   icon: Layers,             color: "#8B5CF6" },
  { key: "horror",     label: "Horror & Weird",    icon: Flame,              color: "#A855F7" },
  { key: "thriller",   label: "Spy & Mystery",     icon: Search,             color: "#3B82F6" },
  { key: "gothic",     label: "Gothic Classics",   icon: Shield,             color: "#6366F1" },
  { key: "drama",      label: "Drama & Plays",     icon: BookOpen,           color: "#10B981" },
  { key: "biography",  label: "Biographies & History",icon: Award,         color: "#EC4899" },
  { key: "nature",     label: "Science & Nature",  icon: Compass,            color: "#84CC16" },
  { key: "victorian",  label: "Victorian Classics",icon: Award,              color: "#EAB308" },
  { key: "russian",    label: "Russian Classics 🇷🇺",icon: Globe,            color: "#DC2626" },
  { key: "french",     label: "French Classics 🇫🇷",icon: Globe,             color: "#2563EB" },
  { key: "adventure",  label: "High Adventure",    icon: Zap,                color: "#059669" },
  { key: "romance",    label: "Romance",           icon: Heart,              color: "#F43F5E" },
  { key: "scifi",      label: "Sci-Fi & Dystopian",icon: Layers,             color: "#0891B2" },
  { key: "audiobooks", label: "Audiobooks Included",icon: Headphones,        color: "#9333EA" },
];

const CEFR_LEVELS = ["All Levels", "A1-A2", "B1-B2", "C1-C2"];

export default function ExploreAllBooksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ genre?: string; tag?: string }>();
  const insets = useSafeAreaInsets();
  const tokens = useSelector(selectThemeTokens);
  const isDark = useSelector(selectIsDark);
  const { width } = useWindowDimensions();
  const maxW = Math.min(width, 1280);

  const { data: storiesResp, isLoading } = useGetStoriesQuery({ limit: 1000 });
  const allStories = useMemo(() => storiesResp?.data || [], [storiesResp]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<GenreKey>(
    (params.genre as GenreKey) || "all"
  );
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [sortOption, setSortOption] = useState("title_asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  const filteredStories = useMemo(() => {
    return allStories.filter((story) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleText = getLocalizedText(story.title).toLowerCase();
        const authorText = (story.author || "").toLowerCase();
        const tagsText = (story.tags || []).map((t) => getLocalizedText(t).toLowerCase()).join(" ");
        if (!titleText.includes(q) && !authorText.includes(q) && !tagsText.includes(q)) {
          return false;
        }
      }

      // 2. Genre Filter
      if (selectedGenre !== "all") {
        if (selectedGenre === "audiobooks") {
          if (story.contentType !== "audiobook" && story.contentType !== "both") return false;
        } else {
          const tagStr = (story.tags || []).map((t) => getLocalizedText(t).toLowerCase()).join(" ");
          const keyMap: Record<string, string[]> = {
            philosophy: ["philosophy", "stoicism", "ethics", "non-fiction"],
            comedy: ["comedy", "humor", "satire"],
            fantasy: ["fantasy", "magic"],
            horror: ["horror", "weird"],
            thriller: ["thriller", "spy", "detective", "mystery"],
            gothic: ["gothic"],
            drama: ["drama", "play"],
            biography: ["biography", "memoir", "history"],
            nature: ["nature", "science"],
            victorian: ["victorian"],
            russian: ["russian"],
            french: ["french"],
            adventure: ["adventure", "sea", "pirates"],
            romance: ["romance"],
            scifi: ["sci-fi", "scifi", "dystopian"],
          };
          const matchKeywords = keyMap[selectedGenre] || [selectedGenre];
          const hasMatch = matchKeywords.some((kw) => tagStr.includes(kw));
          if (!hasMatch) return false;
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

  const sortedStories = useMemo(() => {
    return [...filteredStories].sort((a, b) => {
      if (sortOption === "title_asc") {
        return getLocalizedText(a.title).localeCompare(getLocalizedText(b.title));
      }
      if (sortOption === "title_desc") {
        return getLocalizedText(b.title).localeCompare(getLocalizedText(a.title));
      }
      if (sortOption === "level_asc") {
        return (a.difficultyLevel || "B2").localeCompare(b.difficultyLevel || "B2");
      }
      return 0;
    });
  }, [filteredStories, sortOption]);

  const totalPages = Math.ceil(sortedStories.length / PAGE_SIZE) || 1;
  const paginatedStories = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedStories.slice(start, start + PAGE_SIZE);
  }, [sortedStories, page]);

  const handleStoryPress = useCallback(
    (slug: string) => {
      router.push(`/details/${slug}`);
    },
    [router]
  );

  const surfaceBg = isDark ? "#080E1A" : "#F8FAFC";
  const textColor = isDark ? "#F1F5F9" : "#0F172A";
  const textSubColor = isDark ? "#64748B" : "#94A3B8";
  const accentColor = tokens?.accentPrimary || "#0EA5E9";

  return (
    <View style={{ flex: 1, width: "100%", backgroundColor: surfaceBg }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          width: "100%",
          maxWidth: maxW,
          alignSelf: "center",
          paddingTop: Math.max(insets.top + 6, 16),
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        }}
      >
        <Pressable
          onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace("/"); } }}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ArrowLeft size={18} color={textColor} />
        </Pressable>

        <View style={{ alignItems: "center" }}>
          <Text weight="Bold" style={{ fontSize: 18, color: textColor, letterSpacing: -0.3 }}>
            Explore Library
          </Text>
          <Text style={{ fontSize: 12, color: textSubColor, marginTop: 1 }}>
            {filteredStories.length} masterworks available
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={() => setViewMode((m) => (m === "grid" ? "list" : "grid"))}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            {viewMode === "grid" ? <List size={18} color={accentColor} /> : <LayoutGrid size={18} color={accentColor} />}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        style={{ flex: 1, width: "100%", height: "100%" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 }}
      >
        <View style={{ width: "100%", maxWidth: maxW, alignSelf: "center" }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            marginBottom: 16,
          }}
        >
          <Search size={16} color={textSubColor} />
          <TextInput
            placeholder="Search classic ebooks by title, author, genre…"
            placeholderTextColor={textSubColor}
            value={searchQuery}
            onChangeText={(t) => { setSearchQuery(t); setPage(1); }}
            style={{ flex: 1, fontSize: 14, color: textColor, marginLeft: 10, padding: 0 }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <X size={14} color={textSubColor} />
            </Pressable>
          )}
        </View>

        {/* Genre Chips Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
        >
          {GENRES.map((g) => {
            const isActive = selectedGenre === g.key;
            const Icon = g.icon;
            return (
              <Pressable
                key={g.key}
                onPress={() => { setSelectedGenre(g.key); setPage(1); }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 100,
                  backgroundColor: isActive ? g.color : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  gap: 6,
                }}
              >
                <Icon size={13} color={isActive ? "#FFFFFF" : textSubColor} />
                <Text
                  weight="SemiBold"
                  style={{ fontSize: 12.5, color: isActive ? "#FFFFFF" : textColor }}
                >
                  {g.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Level Filters & Sort Options */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {CEFR_LEVELS.map((lvl) => {
              const isActive = selectedLevel === lvl;
              return (
                <Pressable
                  key={lvl}
                  onPress={() => { setSelectedLevel(lvl); setPage(1); }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 100,
                    backgroundColor: isActive ? accentColor + "20" : "transparent",
                    borderWidth: 1,
                    borderColor: isActive ? accentColor : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  }}
                >
                  <Text weight="SemiBold" style={{ fontSize: 11.5, color: isActive ? accentColor : textSubColor }}>
                    {lvl}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text weight="Regular" style={{ fontSize: 12, color: textSubColor }}>
            Showing {paginatedStories.length} of {sortedStories.length}
          </Text>
        </View>

        {/* Ebooks List or Grid */}
        {isLoading ? (
          <View style={{ paddingVertical: 80, alignItems: "center" }}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : paginatedStories.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
            {paginatedStories.map((story) => {
              const cols = viewMode === "grid" ? (width >= 1024 ? 4 : width >= 768 ? 3 : 2) : 1;
              const itemWidth = cols === 1 ? "100%" : cols === 2 ? "50%" : cols === 3 ? "33.33%" : "25%";
              return (
                <View key={story._id} style={{ width: itemWidth, flexGrow: 0, flexShrink: 0, paddingHorizontal: 6, paddingBottom: 14 }}>
                  <StoryCard story={story} onPress={handleStoryPress} variant="standard" />
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ paddingVertical: 80, alignItems: "center", gap: 10 }}>
            <BookOpen size={36} color={textSubColor} />
            <Text weight="Bold" style={{ fontSize: 18, color: textColor }}>
              No Ebooks Found
            </Text>
            <Text style={{ fontSize: 13, color: textSubColor, textAlign: "center", maxWidth: 280 }}>
              Try searching for a different title or resetting your category filters.
            </Text>
            <Pressable
              onPress={() => {
                setSearchQuery("");
                setSelectedGenre("all");
                setSelectedLevel("All Levels");
                setPage(1);
              }}
              style={{
                marginTop: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 100,
                backgroundColor: accentColor,
              }}
            >
              <Text weight="SemiBold" style={{ color: "#FFFFFF", fontSize: 13 }}>
                Reset All Filters
              </Text>
            </Pressable>
          </View>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 24,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            }}
          >
            <Pressable
              disabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: page === 1 ? 0.4 : pressed ? 0.7 : 1,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 100,
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              })}
            >
              <ChevronLeft size={16} color={textColor} />
              <Text weight="SemiBold" style={{ fontSize: 13, color: textColor }}>
                Previous
              </Text>
            </Pressable>

            <Text weight="Bold" style={{ fontSize: 14, color: accentColor }}>
              Page {page} of {totalPages}
            </Text>

            <Pressable
              disabled={page === totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: page === totalPages ? 0.4 : pressed ? 0.7 : 1,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 100,
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              })}
            >
              <Text weight="SemiBold" style={{ fontSize: 13, color: textColor }}>
                Next
              </Text>
              <ChevronRight size={16} color={textColor} />
            </Pressable>
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
}
