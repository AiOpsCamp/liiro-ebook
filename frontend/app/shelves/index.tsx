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
  Platform,
  TextInput
} from "react-native";
import { useRouter } from "expo-router";
import {
  Library,
  ArrowLeft,
  Plus,
  Bookmark,
  Heart,
  BookOpen,
  Sparkles,
  Folder,
  ChevronRight,
  Trash2,
  Lock
} from "lucide-react-native";

const API_BASE = "http://127.0.0.1:5012/api/v1";
const PALETTE = ["#38BDF8", "#F59E0B", "#EC4899", "#10B981", "#8B5CF6", "#F43F5E", "#06B6D4"];

export default function ShelvesOverviewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [shelves, setShelves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [newShelfDesc, setNewShelfDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);

  useEffect(() => {
    fetchShelves();
  }, []);

  const fetchShelves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/collections`);
      const json = await res.json();
      if (json.success && json.data) {
        setShelves(json.data);
      }
    } catch (e) {
      console.error("Error fetching shelves:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShelf = async () => {
    if (!newShelfName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newShelfName.trim(),
          description: newShelfDesc.trim(),
          color: selectedColor,
          icon: "folder"
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewShelfName("");
        setNewShelfDesc("");
        setShowCreateModal(false);
        fetchShelves();
      }
    } catch (e) {
      console.error("Error creating shelf:", e);
    }
  };

  const getShelfIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case "heart":
        return <Heart size={20} color={color} fill={color} />;
      case "book-open":
        return <BookOpen size={20} color={color} />;
      case "sparkles":
        return <Sparkles size={20} color={color} />;
      case "bookmark":
      default:
        return <Bookmark size={20} color={color} fill={color} />;
    }
  };

  const isWide = width > 768;
  const numColumns = isWide ? 2 : 1;

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.navTitleRow}>
          <Library size={20} color="#38BDF8" />
          <Text style={styles.navTitle}>My Bookshelves & Shelves</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Bookmark size={14} color="#38BDF8" />
            <Text style={styles.heroBadgeText}>PERSONAL LIBRARY</Text>
          </View>
          <Text style={styles.heroHeading}>Curated Bookshelves</Text>
          <Text style={styles.heroSubtext}>
            Organize your reading journey. Track what you're currently reading, queue up future classics, and build customized themed collections.
          </Text>
        </View>

        {/* Shelves Grid */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loaderText}>Loading your library shelves...</Text>
          </View>
        ) : (
          <View style={[styles.grid, isWide && { flexDirection: "row", flexWrap: "wrap", gap: 16 }]}>
            {shelves.map((shelf) => {
              const cardWidth = isWide ? "48.5%" : "100%";
              const previewCovers = (shelf.stories || []).slice(0, 4);

              return (
                <TouchableOpacity
                  key={shelf._id}
                  onPress={() => router.push(`/shelves/${shelf.slug}` as any)}
                  style={[
                    styles.shelfCard,
                    isWide && { width: cardWidth as any },
                    { borderColor: `${shelf.color}40` }
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.shelfIconBadge, { backgroundColor: `${shelf.color}20` }]}>
                        {getShelfIcon(shelf.icon, shelf.color)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shelfTitle}>{shelf.name}</Text>
                        <Text style={styles.shelfSubtitle}>
                          {shelf.totalBooks} {shelf.totalBooks === 1 ? "Book" : "Books"}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#64748B" />
                  </View>

                  {shelf.description ? (
                    <Text numberOfLines={2} style={styles.shelfDescription}>
                      {shelf.description}
                    </Text>
                  ) : null}

                  {/* Book Covers Preview Collage */}
                  <View style={styles.coversRow}>
                    {previewCovers.length > 0 ? (
                      previewCovers.map((st: any, idx: number) => (
                        <View key={st._id || idx} style={styles.coverThumbWrapper}>
                          {st.coverImageUrl ? (
                            <Image source={{ uri: st.coverImageUrl }} style={styles.coverThumb} resizeMode="cover" />
                          ) : (
                            <View style={styles.coverPlaceholder}>
                              <BookOpen size={12} color="#64748B" />
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyShelfPreview}>
                        <Text style={styles.emptyShelfText}>No books added yet — tap to explore</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Shelf Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Bookshelf</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <ArrowLeft size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Bookshelf Name (e.g. Victorian Classics)"
              placeholderTextColor="#64748B"
              value={newShelfName}
              onChangeText={setNewShelfName}
              autoFocus
            />

            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: "top" }]}
              placeholder="Description (optional)"
              placeholderTextColor="#64748B"
              value={newShelfDesc}
              onChangeText={setNewShelfDesc}
              multiline
            />

            {/* Color Palette */}
            <Text style={styles.paletteLabel}>SELECT SHELF COLOR</Text>
            <View style={styles.paletteRow}>
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotSelected
                  ]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateShelf}
                style={[styles.confirmBtn, !newShelfName.trim() && styles.confirmBtnDisabled]}
                disabled={!newShelfName.trim()}
              >
                <Text style={styles.confirmBtnText}>Create Shelf</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0284C7",
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
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    marginBottom: 12
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38BDF8",
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
  loaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12
  },
  loaderText: {
    color: "#94A3B8",
    fontSize: 14
  },
  grid: {
    gap: 16
  },
  shelfCard: {
    backgroundColor: "#0B1329",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    justifyContent: "space-between"
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  shelfIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  shelfTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  shelfSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2
  },
  shelfDescription: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
    lineHeight: 18
  },
  coversRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  coverThumbWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  coverThumb: {
    width: 50,
    height: 72,
    borderRadius: 6,
    backgroundColor: "#1E293B"
  },
  coverPlaceholder: {
    width: 50,
    height: 72,
    borderRadius: 6,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyShelfPreview: {
    paddingVertical: 12,
    width: "100%"
  },
  emptyShelfText: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic"
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 100
  },
  modalContent: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#0B1329",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 24
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  modalInput: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#F8FAFC",
    marginBottom: 12
  },
  paletteLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 10
  },
  paletteRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center"
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8"
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0284C7",
    alignItems: "center"
  },
  confirmBtnDisabled: {
    opacity: 0.5
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  }
});
