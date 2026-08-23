import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { ArrowLeft, Search, X, BookOpen, User, Award, LayoutGrid, List } from "lucide-react-native";

import { AppText as Text } from "@/components/ui/AppText";
import { selectIsDark, selectThemeTokens } from "@/redux/features/themeSlice";
import { useGetAuthorBySlugQuery } from "@/api/storiesQuery";
import StoryCard from "@/components/ebook/StoryCard";
import { getLocalizedText } from "@/utils/getLocalizedText";

export default function AuthorDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const tokens = useSelector(selectThemeTokens);
  const isDark = useSelector(selectIsDark);
  const { width } = useWindowDimensions();
  const maxW = Math.min(width, 1200);

  const { data: author, isLoading } = useGetAuthorBySlugQuery(slug || "");

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBooks = useMemo(() => {
    if (!author?.books) return [];
    if (!searchQuery.trim()) return author.books;
    const q = searchQuery.toLowerCase().trim();
    return author.books.filter(
      (b) =>
        getLocalizedText(b.title).toLowerCase().includes(q) ||
        (b.tags && b.tags.some((t) => getLocalizedText(t).toLowerCase().includes(q)))
    );
  }, [author, searchQuery]);

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

        <Text weight="Bold" style={{ fontSize: 17, color: textColor }}>
          Author Collection
        </Text>

        <Pressable
          onPress={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
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
          {viewMode === "grid" ? <List size={18} color={accentColor} /> : <LayoutGrid size={18} color={accentColor} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ width: "100%", maxWidth: maxW, flex: 1, alignSelf: "center" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 }}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 80, alignItems: "center" }}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : author ? (
          <>
            {/* Author Profile Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                padding: 24,
                borderRadius: 24,
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: accentColor + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: accentColor,
                }}
              >
                <Text weight="Bold" style={{ color: accentColor, fontSize: 24 }}>
                  {author.name.charAt(0)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text weight="Bold" style={{ fontSize: 22, color: textColor, marginBottom: 4 }}>
                  {author.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Award size={14} color={accentColor} />
                  <Text weight="SemiBold" style={{ fontSize: 13, color: accentColor }}>
                    {author.bookCount} Classic {author.bookCount === 1 ? "Masterwork" : "Masterworks"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Search within Author Books */}
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
                marginBottom: 20,
              }}
            >
              <Search size={16} color={textSubColor} />
              <TextInput
                placeholder={`Search books by ${author.name}…`}
                placeholderTextColor={textSubColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, fontSize: 14, color: textColor, marginLeft: 10, padding: 0 }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <X size={14} color={textSubColor} />
                </Pressable>
              )}
            </View>

            {/* Books Grid */}
            {filteredBooks.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                {filteredBooks.map((story) => {
                  const cols = viewMode === "grid" ? (width >= 1024 ? 4 : width >= 768 ? 3 : 2) : 1;
                  return (
                    <View key={story._id || story.slug} style={{ width: `${100 / cols}%`, paddingHorizontal: 6, paddingBottom: 14 }}>
                      <StoryCard
                        story={story}
                        onPress={(slug) => router.push(`/details/${slug}`)}
                        variant="standard"
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ paddingVertical: 60, alignItems: "center", gap: 10 }}>
                <BookOpen size={36} color={textSubColor} />
                <Text weight="Bold" style={{ fontSize: 16, color: textColor }}>
                  No books found matching search
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <Text weight="Bold" style={{ fontSize: 16, color: textColor }}>
              Author not found
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
