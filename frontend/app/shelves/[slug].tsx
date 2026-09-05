import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  Trash2,
  Bookmark,
  Heart,
  Sparkles
} from "lucide-react-native";

const API_BASE = "http://127.0.0.1:5012/api/v1";

export default function SingleShelfDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [shelf, setShelf] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchShelfDetails();
    }
  }, [slug]);

  const fetchShelfDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/collections/slug/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setShelf(json.data);
      }
    } catch (e) {
      console.error("Error fetching shelf details:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStory = async (storyId: string) => {
    if (!shelf) return;
    try {
      await fetch(`${API_BASE}/collections/${shelf._id}/stories/${storyId}`, {
        method: "DELETE"
      });
      fetchShelfDetails();
    } catch (e) {
      console.error("Error removing story from shelf:", e);
    }
  };

  const handleDeleteShelf = async () => {
    if (!shelf || shelf.isSystem) return;
    try {
      const res = await fetch(`${API_BASE}/collections/${shelf._id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        router.back();
      }
    } catch (e) {
      console.error("Error deleting shelf:", e);
    }
  };

  const getShelfIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case "heart":
        return <Heart size={24} color={color} fill={color} />;
      case "book-open":
        return <BookOpen size={24} color={color} />;
      case "sparkles":
        return <Sparkles size={24} color={color} />;
      case "bookmark":
      default:
        return <Bookmark size={24} color={color} fill={color} />;
    }
  };

  const isWide = width > 768;
  const numColumns = isWide ? (width > 1100 ? 3 : 2) : 1;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loaderText}>Loading bookshelf...</Text>
      </View>
    );
  }

  if (!shelf) {
    return (
      <View style={[styles.container, styles.center]}>
        <Bookmark size={40} color="#64748B" />
        <Text style={styles.notFoundText}>Bookshelf not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backHomeBtn}>
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stories = shelf.stories || [];

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.navTitle}>
          {shelf.name}
        </Text>
        {!shelf.isSystem ? (
          <TouchableOpacity onPress={handleDeleteShelf} style={styles.deleteShelfBtn}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shelf Hero Header */}
        <View style={[styles.heroHeader, { borderColor: `${shelf.color}40` }]}>
          <View style={[styles.shelfIconLarge, { backgroundColor: `${shelf.color}20` }]}>
            {getShelfIcon(shelf.icon, shelf.color)}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{shelf.name}</Text>
            <Text style={styles.heroMeta}>
              {stories.length} {stories.length === 1 ? "Book" : "Books"} • {shelf.isSystem ? "System Shelf" : "Custom Shelf"}
            </Text>
            {shelf.description ? (
              <Text style={styles.heroDescription}>{shelf.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Stories List / Grid */}
        {stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookOpen size={48} color="#475569" />
            <Text style={styles.emptyTitle}>This bookshelf is empty</Text>
            <Text style={styles.emptySubtext}>
              Explore our world classics catalog and tap "Add to Bookshelf" to curate your library.
            </Text>
            <TouchableOpacity onPress={() => router.push("/explore")} style={styles.exploreBtn}>
              <Text style={styles.exploreBtnText}>Explore Classics</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.grid, isWide && { flexDirection: "row", flexWrap: "wrap", gap: 16 }]}>
            {stories.map((st: any) => {
              const cardWidth = isWide ? `${Math.floor(100 / numColumns) - 2}%` : "100%";

              return (
                <View
                  key={st._id}
                  style={[styles.bookCard, isWide && { width: cardWidth as any }]}
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/details/${st.slug}`)}
                    style={styles.bookCardLeft}
                  >
                    {st.coverImageUrl ? (
                      <Image source={{ uri: st.coverImageUrl }} style={styles.bookCover} resizeMode="cover" />
                    ) : (
                      <View style={styles.bookCoverPlaceholder}>
                        <BookOpen size={20} color="#64748B" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.bookCardRight}>
                    <View>
                      <View style={styles.genreBadge}>
                        <Text style={styles.genreBadgeText}>{st.category || "Classic"}</Text>
                      </View>
                      <TouchableOpacity onPress={() => router.push(`/details/${st.slug}`)}>
                        <Text numberOfLines={2} style={styles.bookTitle}>
                          {st.title}
                        </Text>
                      </TouchableOpacity>
                      <Text numberOfLines={1} style={styles.authorName}>
                        {st.authorName || "Classic Author"}
                      </Text>
                      <Text style={styles.chaptersCount}>
                        {st.totalChapters || 1} Chapters {st.hasAudio && "• 🎧 Audiobook"}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.bookActionsRow}>
                      <TouchableOpacity
                        onPress={() => router.push(`/read/${st.slug}`)}
                        style={styles.readBtn}
                      >
                        <BookOpen size={14} color="#FFFFFF" />
                        <Text style={styles.readBtnText}>Read</Text>
                      </TouchableOpacity>

                      {st.hasAudio && (
                        <TouchableOpacity
                          onPress={() => router.push(`/read/${st.slug}?audio=true`)}
                          style={styles.listenBtn}
                        >
                          <Headphones size={14} color="#38BDF8" />
                          <Text style={styles.listenBtnText}>Listen</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => handleRemoveStory(st._id)}
                        style={styles.removeBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={16} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712"
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20
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
  deleteShelfBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#0F172A",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24
  },
  shelfIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC"
  },
  heroMeta: {
    fontSize: 13,
    color: "#38BDF8",
    fontWeight: "600",
    marginTop: 2
  },
  heroDescription: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 6,
    lineHeight: 18
  },
  loaderText: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 12
  },
  notFoundText: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20
  },
  backHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0284C7"
  },
  backHomeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0284C7"
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  grid: {
    gap: 14
  },
  bookCard: {
    flexDirection: "row",
    backgroundColor: "#0B1329",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 14,
    gap: 14
  },
  bookCardLeft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  bookCover: {
    width: 75,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#1E293B"
  },
  bookCoverPlaceholder: {
    width: 75,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  bookCardRight: {
    flex: 1,
    justifyContent: "space-between"
  },
  genreBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4
  },
  genreBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#38BDF8"
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    lineHeight: 20
  },
  authorName: {
    fontSize: 12.5,
    color: "#94A3B8",
    marginTop: 2
  },
  chaptersCount: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  bookActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },
  readBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#0284C7"
  },
  readBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  listenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  listenBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8"
  },
  removeBtn: {
    marginLeft: "auto",
    padding: 6
  }
});
