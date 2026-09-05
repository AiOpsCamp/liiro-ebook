import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Platform
} from "react-native";
import {
  Trophy,
  Target,
  BookOpen,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Edit3,
  Plus,
  Minus,
  X,
  Flame,
  Clock
} from "lucide-react-native";
import { useRouter } from "expo-router";

const API_BASE = "http://127.0.0.1:5012/api/v1";

export function AnnualReadingGoalCard() {
  const router = useRouter();
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTarget, setNewTarget] = useState(25);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, []);

  const fetchGoal = async () => {
    try {
      const res = await fetch(`${API_BASE}/goals/current`);
      const json = await res.json();
      if (json.success && json.data) {
        setGoal(json.data);
        setNewTarget(json.data.targetBooks || 25);
      }
    } catch (e) {
      console.error("Error loading reading goal:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/goals/target`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetBooks: newTarget })
      });
      const json = await res.json();
      if (json.success) {
        setIsEditModalOpen(false);
        fetchGoal();
      }
    } catch (e) {
      console.error("Error updating goal target:", e);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="small" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading 2026 Reading Challenge...</Text>
      </View>
    );
  }

  if (!goal) return null;

  const {
    year = 2026,
    targetBooks = 25,
    completedCount = 0,
    percent = 0,
    booksRemaining = 25,
    paceMessage,
    completedMinutes = 0,
    completedBooks = []
  } = goal;

  const hoursRead = Math.round((completedMinutes / 60) * 10) / 10;

  return (
    <View style={styles.card}>
      {/* Top Banner Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadgeRow}>
          <View style={styles.trophyIconBg}>
            <Trophy size={18} color="#F59E0B" />
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.cardTitle}>{year} Reading Challenge</Text>
              <View style={styles.liveYearBadge}>
                <Text style={styles.liveYearText}>ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              Track your literary journey across world classics
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsEditModalOpen(true)}
          style={styles.editTargetBtn}
        >
          <Edit3 size={13} color="#38BDF8" />
          <Text style={styles.editTargetText}>Edit Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Main Stats Row: Circular Progress & Numbers */}
      <View style={styles.statsContainer}>
        {/* Progress Display */}
        <View style={styles.progressCircleWrapper}>
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              <Text style={styles.percentNumber}>{percent}%</Text>
              <Text style={styles.percentLabel}>DONE</Text>
            </View>
          </View>
        </View>

        {/* Counter Details */}
        <View style={styles.statsDetails}>
          <View style={styles.counterNumbersRow}>
            <Text style={styles.largeCount}>{completedCount}</Text>
            <Text style={styles.targetDivider}>/</Text>
            <Text style={styles.targetCount}>{targetBooks}</Text>
            <Text style={styles.booksLabel}>Books Completed</Text>
          </View>

          {/* Linear Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(4, percent))}%` }]} />
          </View>

          {/* Quick Metrics (Hours Read & Books Left) */}
          <View style={styles.subMetricsRow}>
            <View style={styles.subMetricItem}>
              <Clock size={12} color="#94A3B8" />
              <Text style={styles.subMetricText}>{hoursRead}h Listened / Read</Text>
            </View>
            <View style={styles.subMetricItem}>
              <Target size={12} color="#38BDF8" />
              <Text style={styles.subMetricText}>{booksRemaining} books left</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pace Message Callout */}
      {paceMessage ? (
        <View style={styles.paceBanner}>
          <Text style={styles.paceText}>{paceMessage}</Text>
        </View>
      ) : null}

      {/* Completed Books Shelf Thumbnails */}
      {completedBooks && completedBooks.length > 0 ? (
        <View style={styles.completedShelfSection}>
          <View style={styles.shelfTitleRow}>
            <Text style={styles.shelfTitle}>RECENTLY FINISHED CLASSICS</Text>
            <TouchableOpacity onPress={() => router.push("/shelves/currently-reading" as any)}>
              <Text style={styles.viewShelvesLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfThumbnailsRow}>
            {completedBooks.slice(0, 6).map((book: any, idx: number) => (
              <TouchableOpacity
                key={book.storyId || idx}
                onPress={() => router.push(`/details/${book.slug}`)}
                style={styles.bookThumbCard}
              >
                <View style={styles.thumbImageWrapper}>
                  {book.coverImageUrl ? (
                    <Image source={{ uri: book.coverImageUrl }} style={styles.thumbImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <BookOpen size={16} color="#64748B" />
                    </View>
                  )}
                  <View style={styles.checkBadge}>
                    <CheckCircle2 size={14} color="#10B981" />
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.thumbTitle}>
                  {book.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Edit Target Goal Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="fade" onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Trophy size={20} color="#F59E0B" />
                <Text style={styles.modalTitle}>Set {year} Reading Goal</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              How many books do you want to read & listen to in {year}? Challenge yourself with world classics!
            </Text>

            {/* Stepper Counter */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() => setNewTarget((prev) => Math.max(1, prev - 5))}
                style={styles.stepperBtn}
              >
                <Minus size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.stepperDisplay}>
                <Text style={styles.stepperNumber}>{newTarget}</Text>
                <Text style={styles.stepperLabel}>Books</Text>
              </View>

              <TouchableOpacity
                onPress={() => setNewTarget((prev) => Math.min(500, prev + 5))}
                style={styles.stepperBtn}
              >
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Quick Target Presets */}
            <View style={styles.presetRow}>
              {[12, 25, 52, 100].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setNewTarget(preset)}
                  style={[styles.presetBtn, newTarget === preset && styles.presetBtnSelected]}
                >
                  <Text style={[styles.presetText, newTarget === preset && styles.presetTextSelected]}>
                    {preset} Books
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateTarget} disabled={updating} style={styles.modalSaveBtn}>
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Goal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0B1329",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    padding: 22,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8
  },
  loadingCard: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 13
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  trophyIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F8FAFC",
    fontFamily: Platform.OS === "web" ? "Playfair Display, Georgia, serif" : undefined
  },
  liveYearBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)"
  },
  liveYearText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#10B981"
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2
  },
  editTargetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  editTargetText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8"
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    marginBottom: 14
  },
  progressCircleWrapper: {
    alignItems: "center",
    justifyContent: "center"
  },
  circleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 3,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center"
  },
  circleInner: {
    alignItems: "center",
    justifyContent: "center"
  },
  percentNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC"
  },
  percentLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5
  },
  statsDetails: {
    flex: 1,
    gap: 8
  },
  counterNumbersRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4
  },
  largeCount: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F8FAFC"
  },
  targetDivider: {
    fontSize: 18,
    color: "#64748B",
    marginHorizontal: 2
  },
  targetCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#94A3B8"
  },
  booksLabel: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E293B",
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#38BDF8"
  },
  subMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 2
  },
  subMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  subMetricText: {
    fontSize: 11,
    color: "#94A3B8"
  },
  paceBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16
  },
  paceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FCD34D"
  },
  completedShelfSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 14
  },
  shelfTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  shelfTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8
  },
  viewShelvesLink: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8"
  },
  shelfThumbnailsRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 2
  },
  bookThumbCard: {
    width: 65,
    alignItems: "center"
  },
  thumbImageWrapper: {
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  thumbImage: {
    width: 55,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#1E293B"
  },
  thumbPlaceholder: {
    width: 55,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  checkBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#0B1329",
    borderRadius: 8,
    padding: 1
  },
  thumbTitle: {
    fontSize: 10,
    color: "#CBD5E1",
    marginTop: 4,
    textAlign: "center"
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
    maxWidth: 400,
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
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F8FAFC"
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  modalDesc: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
    marginBottom: 20
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20
  },
  stepperBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155"
  },
  stepperDisplay: {
    alignItems: "center"
  },
  stepperNumber: {
    fontSize: 36,
    fontWeight: "900",
    color: "#38BDF8"
  },
  stepperLabel: {
    fontSize: 12,
    color: "#94A3B8"
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center"
  },
  presetBtnSelected: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "#38BDF8"
  },
  presetText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8"
  },
  presetTextSelected: {
    color: "#38BDF8",
    fontWeight: "700"
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12
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
