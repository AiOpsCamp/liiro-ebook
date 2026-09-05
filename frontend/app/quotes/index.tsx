import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
  useWindowDimensions,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import {
  Sparkles,
  Quote as QuoteIcon,
  Heart,
  Share2,
  BookOpen,
  ArrowLeft,
  Compass,
  Flame,
  Search
} from "lucide-react-native";
import { QuoteCardShareModal, QuoteCardData } from "../../components/ebook/social/QuoteCardShareModal";

const CATEGORIES = [
  "All",
  "Wisdom",
  "Adventure",
  "Love & Romance",
  "Philosophy",
  "Mystery",
  "Life & Hope",
  "Courage"
];

const API_BASE = "http://127.0.0.1:5012/api/v1";

export default function QuotesDiscoveryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShareQuote, setActiveShareQuote] = useState<QuoteCardData | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchQuotes();
  }, [selectedCategory]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const url = `${API_BASE}/quotes?category=${selectedCategory}&limit=30`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setQuotes(json.data);
      }
    } catch (e) {
      console.error("Error fetching quotes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (quoteId: string) => {
    setLikedMap((prev) => ({ ...prev, [quoteId]: !prev[quoteId] }));
    setQuotes((prev) =>
      prev.map((q) => {
        if (q._id === quoteId) {
          const isLiked = likedMap[quoteId];
          return { ...q, likesCount: isLiked ? q.likesCount - 1 : q.likesCount + 1 };
        }
        return q;
      })
    );
    try {
      await fetch(`${API_BASE}/quotes/${quoteId}/like`, { method: "POST" });
    } catch (_) {}
  };

  const isWide = width > 768;
  const numColumns = isWide ? (width > 1100 ? 3 : 2) : 1;

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.navTitleRow}>
          <Sparkles size={20} color="#38BDF8" />
          <Text style={styles.navTitle}>Literary Quotes & Wisdom</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Header Banner */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Flame size={14} color="#F59E0B" />
            <Text style={styles.heroBadgeText}>VIRAL QUOTE CARDS</Text>
          </View>
          <Text style={styles.heroHeading}>Inspiring Words from World Classics</Text>
          <Text style={styles.heroSubtext}>
            Discover timeless philosophy, courage, and beauty from history’s greatest writers. Generate and share custom quote cards directly to your story.
          </Text>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Quotes Grid */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loaderText}>Loading inspiring quotes...</Text>
          </View>
        ) : quotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <QuoteIcon size={40} color="#64748B" />
            <Text style={styles.emptyText}>No quotes found in this category.</Text>
          </View>
        ) : (
          <View style={[styles.quotesGrid, isWide && { flexDirection: "row", flexWrap: "wrap", gap: 16 }]}>
            {quotes.map((q) => {
              const isLiked = likedMap[q._id];
              const cardWidth = isWide ? `${Math.floor(100 / numColumns) - 2}%` : "100%";

              return (
                <View key={q._id} style={[styles.quoteCardContainer, isWide && { width: cardWidth as any }]}>
                  <View style={styles.quoteCardHeader}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{q.category || "Classic"}</Text>
                    </View>
                    <QuoteIcon size={20} color="#38BDF8" opacity={0.6} />
                  </View>

                  <Text style={styles.quoteText}>"{q.quoteText}"</Text>

                  {/* Book & Author Info */}
                  <View style={styles.authorRow}>
                    {q.coverUrl ? (
                      <Image source={{ uri: q.coverUrl }} style={styles.bookCoverThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.bookCoverPlaceholder}>
                        <BookOpen size={14} color="#38BDF8" />
                      </View>
                    )}
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{q.authorName}</Text>
                      <Text style={styles.storyTitle} numberOfLines={1}>
                        {q.storyTitle}
                      </Text>
                    </View>
                  </View>

                  {/* Card Bottom Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => handleLike(q._id)}
                      style={[styles.actionIconBtn, isLiked && styles.actionIconBtnLiked]}
                    >
                      <Heart size={16} color={isLiked ? "#EF4444" : "#94A3B8"} fill={isLiked ? "#EF4444" : "none"} />
                      <Text style={[styles.actionCountText, isLiked && { color: "#EF4444" }]}>
                        {q.likesCount || 0}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.rightActionBtns}>
                      <TouchableOpacity
                        onPress={() =>
                          setActiveShareQuote({
                            quoteText: q.quoteText,
                            storyTitle: q.storyTitle,
                            storySlug: q.storySlug,
                            authorName: q.authorName,
                            category: q.category,
                            coverUrl: q.coverUrl
                          })
                        }
                        style={styles.shareCardBtn}
                      >
                        <Share2 size={14} color="#38BDF8" />
                        <Text style={styles.shareCardBtnText}>Create Card</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => router.push(`/read/${q.storySlug}`)}
                        style={styles.readBookBtn}
                      >
                        <BookOpen size={14} color="#FFFFFF" />
                        <Text style={styles.readBookBtnText}>Read</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Share Modal */}
      <QuoteCardShareModal
        visible={!!activeShareQuote}
        onClose={() => setActiveShareQuote(null)}
        quoteData={activeShareQuote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712"
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 48 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#0B1329"
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  navTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  heroSection: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 24,
    marginBottom: 20
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 12
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 1
  },
  heroHeading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 8
  },
  heroSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 22
  },
  categoriesScroll: {
    gap: 8,
    paddingBottom: 16
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B"
  },
  categoryPillActive: {
    backgroundColor: "#0369A1",
    borderColor: "#38BDF8"
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8"
  },
  categoryPillTextActive: {
    color: "#FFFFFF"
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12
  },
  loaderText: {
    color: "#94A3B8",
    fontSize: 14
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12
  },
  emptyText: {
    color: "#64748B",
    fontSize: 15
  },
  quotesGrid: {
    gap: 16
  },
  quoteCardContainer: {
    backgroundColor: "#0B1329",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 20,
    justifyContent: "space-between"
  },
  quoteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  categoryBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)"
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8"
  },
  quoteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    fontStyle: "italic",
    lineHeight: 25,
    marginBottom: 16
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B"
  },
  bookCoverThumb: {
    width: 32,
    height: 46,
    borderRadius: 4,
    backgroundColor: "#1E293B"
  },
  bookCoverPlaceholder: {
    width: 32,
    height: 46,
    borderRadius: 4,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  authorInfo: {
    flex: 1
  },
  authorName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  storyTitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12
  },
  actionIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#0F172A"
  },
  actionIconBtnLiked: {
    backgroundColor: "rgba(239, 68, 68, 0.12)"
  },
  actionCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8"
  },
  rightActionBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  shareCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  shareCardBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8"
  },
  readBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#0284C7"
  },
  readBookBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF"
  }
});
