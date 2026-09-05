import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  useWindowDimensions,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import {
  ShieldCheck,
  Search,
  Star,
  BookOpen,
  Headphones,
  Edit3,
  Layers,
  ArrowLeft,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react-native";

const API_BASE = "http://127.0.0.1:5012/api/v1";
const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "x-admin-key": "LIIRO_ADMIN_SECRET_2026"
};

const CATEGORIES = [
  "all",
  "Fantasy And Magic",
  "Adventure",
  "Mystery",
  "Children's Literature",
  "Science Fiction",
  "Gothic",
  "Romance"
];

const DIFFICULTY_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Standard"];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  const [stats, setStats] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAudioStatus, setSelectedAudioStatus] = useState("all");
  const [selectedFeatured, setSelectedFeatured] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Edit Metadata Modal State
  const [editingStory, setEditingStory] = useState<any>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("Standard");
  const [editPublished, setEditPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStories();
  }, [page, search, selectedCategory, selectedAudioStatus, selectedFeatured]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, { headers: ADMIN_HEADERS });
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (e) {
      console.error("Error loading admin stats:", e);
    }
  };

  const fetchStories = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "15",
        search,
        category: selectedCategory,
        audioStatus: selectedAudioStatus,
        featured: selectedFeatured
      });
      const res = await fetch(`${API_BASE}/admin/stories?${queryParams.toString()}`, {
        headers: ADMIN_HEADERS
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStories(json.data.stories || []);
        setPagination(json.data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error("Error loading admin stories:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (story: any) => {
    const currentFeatured = story.isFeatured;
    // Optimistic UI update
    setStories((prev) =>
      prev.map((s) => (s._id === story._id ? { ...s, isFeatured: !currentFeatured } : s))
    );

    try {
      await fetch(`${API_BASE}/admin/stories/${story._id}/toggle-feature`, {
        method: "PATCH",
        headers: ADMIN_HEADERS
      });
      fetchStats();
    } catch (e) {
      console.error("Error toggling featured status:", e);
      // Revert on failure
      setStories((prev) =>
        prev.map((s) => (s._id === story._id ? { ...s, isFeatured: currentFeatured } : s))
      );
    }
  };

  const handleOpenEdit = (story: any) => {
    setEditingStory(story);
    setEditCategory(story.category || "Fantasy And Magic");
    setEditAuthor(story.author || "Classic Author");
    setEditDifficulty(story.difficultyLevel || "Standard");
    setEditPublished(Boolean(story.isPublished));
  };

  const handleSaveEdit = async () => {
    if (!editingStory) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/admin/stories/${editingStory._id}/metadata`, {
        method: "PATCH",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          category: editCategory,
          authorName: editAuthor,
          difficultyLevel: editDifficulty,
          isPublished: editPublished
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditingStory(null);
        fetchStories();
      }
    } catch (e) {
      console.error("Error saving story metadata:", e);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Admin Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.navBackBtn}>
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <View style={styles.adminBadge}>
            <ShieldCheck size={14} color="#38BDF8" />
            <Text style={styles.adminBadgeText}>ADMIN CMS</Text>
          </View>
          <Text style={styles.navTitle}>Liiro Catalog & Content Engine</Text>
        </View>
        <TouchableOpacity onPress={() => { fetchStats(); fetchStories(); }} style={styles.refreshBtn}>
          <Sparkles size={16} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Metric Cards */}
        {stats ? (
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderColor: "rgba(56, 189, 248, 0.3)" }]}>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                <BookOpen size={18} color="#38BDF8" />
              </View>
              <Text style={styles.kpiValue}>{stats.totalStories?.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Total Catalog Titles</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: "rgba(16, 185, 129, 0.3)" }]}>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                <Headphones size={18} color="#10B981" />
              </View>
              <Text style={styles.kpiValue}>{stats.audioStories} Audiobooks</Text>
              <Text style={styles.kpiLabel}>Studio Multi-Voice Ready</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: "rgba(245, 158, 11, 0.3)" }]}>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                <Star size={18} color="#F59E0B" fill="#F59E0B" />
              </View>
              <Text style={styles.kpiValue}>{stats.featuredStories} Featured</Text>
              <Text style={styles.kpiLabel}>Dashboard Showcase</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: "rgba(168, 85, 247, 0.3)" }]}>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                <Layers size={18} color="#C084FC" />
              </View>
              <Text style={styles.kpiValue}>{stats.totalChapters?.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Total Book Chapters</Text>
            </View>
          </View>
        ) : null}

        {/* Search & Filtering Bar */}
        <View style={styles.filterSection}>
          <View style={styles.searchBarWrapper}>
            <Search size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by book title, author, or slug..."
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setPage(1);
              }}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
            {/* Audio Filters */}
            <TouchableOpacity
              onPress={() => { setSelectedAudioStatus("all"); setPage(1); }}
              style={[styles.filterPill, selectedAudioStatus === "all" && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, selectedAudioStatus === "all" && styles.filterPillTextActive]}>
                All Audio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedAudioStatus("hasAudio"); setPage(1); }}
              style={[styles.filterPill, selectedAudioStatus === "hasAudio" && styles.filterPillActive]}
            >
              <Headphones size={12} color={selectedAudioStatus === "hasAudio" ? "#38BDF8" : "#94A3B8"} />
              <Text style={[styles.filterPillText, selectedAudioStatus === "hasAudio" && styles.filterPillTextActive]}>
                Audio Ready
              </Text>
            </TouchableOpacity>

            {/* Featured Filters */}
            <TouchableOpacity
              onPress={() => { setSelectedFeatured("featured"); setPage(1); }}
              style={[styles.filterPill, selectedFeatured === "featured" && styles.filterPillActive]}
            >
              <Star size={12} color={selectedFeatured === "featured" ? "#F59E0B" : "#94A3B8"} fill={selectedFeatured === "featured" ? "#F59E0B" : "none"} />
              <Text style={[styles.filterPillText, selectedFeatured === "featured" && styles.filterPillTextActive]}>
                Featured Only
              </Text>
            </TouchableOpacity>

            {/* Category Dropdown Pills */}
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => { setSelectedCategory(cat); setPage(1); }}
                style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, selectedCategory === cat && styles.filterPillTextActive]}>
                  {cat === "all" ? "All Categories" : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stories Listing Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderTitle}>
              Book Catalog ({pagination.total?.toLocaleString()} Titles)
            </Text>
            <Text style={styles.tableHeaderSubtitle}>
              Page {pagination.page} of {pagination.totalPages}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#38BDF8" />
              <Text style={styles.loaderText}>Filtering & loading catalog titles...</Text>
            </View>
          ) : stories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BookOpen size={40} color="#475569" />
              <Text style={styles.emptyText}>No books matched the filter criteria.</Text>
            </View>
          ) : (
            <View style={styles.storiesList}>
              {stories.map((st) => (
                <View key={st._id} style={styles.storyRow}>
                  {/* Cover Artwork */}
                  <TouchableOpacity
                    onPress={() => router.push(`/details/${st.slug}`)}
                    style={styles.storyCoverWrapper}
                  >
                    {st.coverImageUrl ? (
                      <Image source={{ uri: st.coverImageUrl }} style={styles.storyCover} resizeMode="cover" />
                    ) : (
                      <View style={styles.storyCoverPlaceholder}>
                        <BookOpen size={16} color="#64748B" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Story Info */}
                  <View style={styles.storyInfo}>
                    <View style={styles.storyBadgeRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{st.category || "Classic"}</Text>
                      </View>
                      <View style={[styles.diffPill, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
                        <Text style={styles.diffPillText}>{st.difficultyLevel || "B2"}</Text>
                      </View>
                      {st.hasAudio && (
                        <View style={styles.audioReadyPill}>
                          <Headphones size={11} color="#10B981" />
                          <Text style={styles.audioReadyText}>Audio Live</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity onPress={() => router.push(`/details/${st.slug}`)}>
                      <Text numberOfLines={1} style={styles.storyTitle}>
                        {st.title}
                      </Text>
                    </TouchableOpacity>

                    <Text numberOfLines={1} style={styles.storyAuthor}>
                      by {st.author} • {st.totalChapters} Chapters • {st.readTimeMinutes} min
                    </Text>
                  </View>

                  {/* Actions Column */}
                  <View style={styles.storyActions}>
                    {/* Featured Toggle Button */}
                    <TouchableOpacity
                      onPress={() => handleToggleFeature(st)}
                      style={[
                        styles.actionFeatureBtn,
                        st.isFeatured && styles.actionFeatureBtnActive
                      ]}
                    >
                      <Star
                        size={15}
                        color={st.isFeatured ? "#F59E0B" : "#64748B"}
                        fill={st.isFeatured ? "#F59E0B" : "none"}
                      />
                      <Text style={[styles.actionFeatureText, st.isFeatured && styles.actionFeatureTextActive]}>
                        {st.isFeatured ? "Featured" : "Feature"}
                      </Text>
                    </TouchableOpacity>

                    {/* Edit Metadata Modal Trigger */}
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(st)}
                      style={styles.actionEditBtn}
                    >
                      <Edit3 size={15} color="#38BDF8" />
                      <Text style={styles.actionEditText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Pagination Controls */}
          <View style={styles.paginationFooter}>
            <TouchableOpacity
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
            >
              <ChevronLeft size={16} color={page <= 1 ? "#475569" : "#F8FAFC"} />
              <Text style={[styles.pageBtnText, page <= 1 && { color: "#475569" }]}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicatorText}>
              Page {pagination.page} / {pagination.totalPages}
            </Text>

            <TouchableOpacity
              onPress={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              style={[styles.pageBtn, page >= pagination.totalPages && styles.pageBtnDisabled]}
            >
              <Text style={[styles.pageBtnText, page >= pagination.totalPages && { color: "#475569" }]}>Next</Text>
              <ChevronRight size={16} color={page >= pagination.totalPages ? "#475569" : "#F8FAFC"} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Story Metadata Modal */}
      {editingStory && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setEditingStory(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.modalTitle}>
                    Edit: {editingStory.title}
                  </Text>
                  <Text style={styles.modalSubtitle}>Slug: {editingStory.slug}</Text>
                </View>
                <TouchableOpacity onPress={() => setEditingStory(null)} style={styles.modalCloseBtn}>
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Form Inputs */}
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {/* Author Input */}
                <Text style={styles.inputLabel}>AUTHOR NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editAuthor}
                  onChangeText={setEditAuthor}
                  placeholder="Author Name"
                  placeholderTextColor="#64748B"
                />

                {/* Category Picker Pills */}
                <Text style={styles.inputLabel}>CATEGORY / GENRE</Text>
                <View style={styles.categoryPillsWrapper}>
                  {CATEGORIES.filter((c) => c !== "all").map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setEditCategory(cat)}
                      style={[
                        styles.catSelectPill,
                        editCategory === cat && styles.catSelectPillActive
                      ]}
                    >
                      <Text style={[styles.catSelectText, editCategory === cat && styles.catSelectTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Difficulty Level */}
                <Text style={styles.inputLabel}>DIFFICULTY LEVEL (CEFR)</Text>
                <View style={styles.diffRow}>
                  {DIFFICULTY_LEVELS.map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setEditDifficulty(lvl)}
                      style={[
                        styles.diffSelectPill,
                        editDifficulty === lvl && styles.diffSelectPillActive
                      ]}
                    >
                      <Text style={[styles.diffSelectText, editDifficulty === lvl && styles.diffSelectTextActive]}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Publish Toggle */}
                <TouchableOpacity
                  onPress={() => setEditPublished(!editPublished)}
                  style={styles.publishToggleRow}
                >
                  <Text style={styles.publishToggleText}>Publication Status</Text>
                  <View style={[styles.publishBadge, editPublished ? styles.publishBadgeLive : styles.publishBadgeDraft]}>
                    <Text style={[styles.publishBadgeText, editPublished ? { color: "#10B981" } : { color: "#F59E0B" }]}>
                      {editPublished ? "PUBLISHED (LIVE)" : "DRAFT (HIDDEN)"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditingStory(null)} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit} disabled={savingEdit} style={styles.modalSaveBtn}>
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 48 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#0B1329"
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  navTitleContainer: {
    alignItems: "center"
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    marginBottom: 4
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 1
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC"
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60
  },
  kpiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 24
  },
  kpiCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "#0B1329",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 6
  },
  kpiIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F8FAFC"
  },
  kpiLabel: {
    fontSize: 12,
    color: "#94A3B8"
  },
  filterSection: {
    backgroundColor: "#0B1329",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
    marginBottom: 20,
    gap: 12
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#F8FAFC"
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155"
  },
  filterPillActive: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "#38BDF8"
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8"
  },
  filterPillTextActive: {
    color: "#38BDF8",
    fontWeight: "700"
  },
  tableCard: {
    backgroundColor: "#0B1329",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden"
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B"
  },
  tableHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC"
  },
  tableHeaderSubtitle: {
    fontSize: 12,
    color: "#64748B"
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12
  },
  loaderText: {
    fontSize: 13,
    color: "#94A3B8"
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B"
  },
  storiesList: {
    padding: 12,
    gap: 10
  },
  storyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 12,
    gap: 14
  },
  storyCoverWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  storyCover: {
    width: 48,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#1E293B"
  },
  storyCoverPlaceholder: {
    width: 48,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  storyInfo: {
    flex: 1,
    gap: 4
  },
  storyBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  categoryPill: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38BDF8"
  },
  diffPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  diffPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#C084FC"
  },
  audioReadyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  audioReadyText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981"
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  storyAuthor: {
    fontSize: 12,
    color: "#94A3B8"
  },
  storyActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  actionFeatureBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155"
  },
  actionFeatureBtnActive: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B"
  },
  actionFeatureText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8"
  },
  actionFeatureTextActive: {
    color: "#F59E0B",
    fontWeight: "700"
  },
  actionEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  actionEditText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#38BDF8"
  },
  paginationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#1E293B"
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#1E293B"
  },
  pageBtnDisabled: {
    opacity: 0.5
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F8FAFC"
  },
  pageIndicatorText: {
    fontSize: 12,
    color: "#94A3B8"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#0B1329",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 24
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F8FAFC"
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6
  },
  modalInput: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#F8FAFC"
  },
  categoryPillsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  catSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155"
  },
  catSelectPillActive: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "#38BDF8"
  },
  catSelectText: {
    fontSize: 12,
    color: "#94A3B8"
  },
  catSelectTextActive: {
    color: "#38BDF8",
    fontWeight: "700"
  },
  diffRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap"
  },
  diffSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155"
  },
  diffSelectPillActive: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderColor: "#C084FC"
  },
  diffSelectText: {
    fontSize: 12,
    color: "#94A3B8"
  },
  diffSelectTextActive: {
    color: "#C084FC",
    fontWeight: "700"
  },
  publishToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    marginTop: 16
  },
  publishToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  publishBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  publishBadgeLive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)"
  },
  publishBadgeDraft: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)"
  },
  publishBadgeText: {
    fontSize: 11,
    fontWeight: "800"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center"
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8"
  },
  modalSaveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0284C7",
    alignItems: "center"
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  }
});
