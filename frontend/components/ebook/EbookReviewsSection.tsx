import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable, Modal, TextInput, ActivityIndicator } from "react-native";
import { Star, ThumbsUp, MessageSquare, Plus, CheckCircle, X } from "lucide-react-native";

interface ReviewItem {
  _id: string;
  authorName: string;
  authorAvatarUrl: string;
  rating: number;
  reviewText: string;
  source: "user" | "goodreads" | "editorial";
  likesCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  goodreadsCount: number;
  userCount: number;
  distribution: Record<number, number>;
}

interface EbookReviewsSectionProps {
  storySlug: string;
  isDark?: boolean;
}

export const EbookReviewsSection: React.FC<EbookReviewsSectionProps> = ({
  storySlug,
  isDark = true,
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "goodreads" | "user">("all");

  // Write Review Modal
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [newAuthorName, setNewAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const filterParam = activeFilter !== "all" ? `&source=${activeFilter}` : "";
      const res = await fetch(`${apiBase}/stories/slug/${storySlug}/reviews?limit=10${filterParam}`);
      const json = await res.json();

      if (json.success) {
        setReviews(json.data || []);
        setSummary(json.summary || null);
      }
    } catch (e) {
      console.warn("Failed to fetch book reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [storySlug, activeFilter]);

  const handleLike = async (reviewId: string) => {
    try {
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, likesCount: r.likesCount + 1 } : r))
      );
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      await fetch(`${apiBase}/stories/reviews/${reviewId}/like`, { method: "POST" });
    } catch {}
  };

  const handlePublishReview = async () => {
    if (!newReviewText.trim()) return;
    try {
      setIsSubmitting(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/slug/${storySlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: newRating,
          reviewText: newReviewText,
          authorName: newAuthorName.trim() || "Community Reader",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsWriteModalOpen(false);
        setNewReviewText("");
        fetchReviews();
      }
    } catch (e) {
      console.error("Error publishing review:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ marginTop: 32, paddingTop: 32, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.1)" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <MessageSquare size={22} color="#F59E0B" />
          <Text style={{ color: "#F8FAFC", fontSize: 20, fontWeight: "800" }}>
            Community & Goodreads Reviews
          </Text>
        </View>

        <Pressable
          onPress={() => setIsWriteModalOpen(true)}
          style={({ pressed }) => ({
            backgroundColor: "#4F46E5",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Write Review</Text>
        </Pressable>
      </View>

      {/* Summary Rating Box */}
      {summary && (
        <View style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: 24, padding: 20, marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
          <View style={{ alignItems: "center", paddingRight: 24, borderRightWidth: 1, borderRightColor: "rgba(255, 255, 255, 0.1)" }}>
            <Text style={{ color: "#F8FAFC", fontSize: 36, fontWeight: "800" }}>
              {summary.averageRating}
            </Text>
            <View style={{ flexDirection: "row", gap: 3, marginVertical: 6 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  color={star <= Math.round(summary.averageRating) ? "#F59E0B" : "#334155"}
                  fill={star <= Math.round(summary.averageRating) ? "#F59E0B" : "transparent"}
                />
              ))}
            </View>
            <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "600" }}>
              {summary.totalReviews} Ratings
            </Text>
          </View>

          {/* Rating Breakdown Bars */}
          <View style={{ flex: 1, paddingLeft: 24, gap: 6 }}>
            {[5, 4, 3, 2, 1].map((ratingNum) => {
              const count = summary.distribution[ratingNum] || 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <View key={ratingNum} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: "#CBD5E1", fontSize: 12, fontWeight: "700", width: 12 }}>
                    {ratingNum}
                  </Text>
                  <View style={{ flex: 1, height: 8, backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <View style={{ width: `${pct}%`, height: "100%", backgroundColor: "#F59E0B", borderRadius: 4 }} />
                  </View>
                  <Text style={{ color: "#94A3B8", fontSize: 11, width: 24, textAlign: "right", fontWeight: "600" }}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
        {[
          { key: "all", label: "All Reviews" },
          { key: "goodreads", label: "Goodreads Reviews 📚" },
          { key: "user", label: "Community" },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key as any)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 100,
                backgroundColor: isActive ? "rgba(139, 92, 246, 0.22)" : "rgba(255, 255, 255, 0.05)",
                borderWidth: 1.5,
                borderColor: isActive ? "#8B5CF6" : "rgba(255, 255, 255, 0.1)",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ color: isActive ? "#C084FC" : "#94A3B8", fontSize: 12.5, fontWeight: "700" }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Reviews List */}
      {loading ? (
        <ActivityIndicator size="small" color="#818CF8" style={{ marginVertical: 32 }} />
      ) : reviews.length === 0 ? (
        <View style={{ padding: 28, borderRadius: 20, backgroundColor: "rgba(15, 23, 42, 0.95)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", alignItems: "center" }}>
          <MessageSquare size={28} color="#64748B" style={{ marginBottom: 10 }} />
          <Text style={{ color: "#F8FAFC", fontWeight: "700", fontSize: 15, marginBottom: 4 }}>
            No Reviews Yet
          </Text>
          <Text style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", marginBottom: 16 }}>
            Be the first reader to share your thoughts or review for this masterwork!
          </Text>
          <Pressable
            onPress={() => setIsWriteModalOpen(true)}
            style={({ pressed }) => ({
              backgroundColor: "rgba(99,102,241,0.15)",
              borderWidth: 1,
              borderColor: "#6366F1",
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: "#818CF8", fontSize: 13, fontWeight: "700" }}>Write a Review ✨</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {reviews.map((rev) => (
            <View key={rev._id} style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: 20, padding: 18 }}>
              {/* Author Row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Image
                    source={{ uri: rev.authorAvatarUrl }}
                    style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#1E293B" }}
                  />
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: "#F8FAFC", fontWeight: "700", fontSize: 14 }}>
                        {rev.authorName}
                      </Text>
                      {rev.source === "goodreads" && (
                        <View style={{ backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "800" }}>Goodreads</Text>
                        </View>
                      )}
                    </View>
                    {rev.isVerifiedPurchase && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <CheckCircle size={12} color="#10B981" />
                        <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "600" }}>Verified Reader</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Rating Stars */}
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={star <= rev.rating ? "#F59E0B" : "#334155"}
                      fill={star <= rev.rating ? "#F59E0B" : "transparent"}
                    />
                  ))}
                </View>
              </View>

              {/* Review Content */}
              <Text style={{ color: "#E2E8F0", fontSize: 13.5, lineHeight: 20, marginBottom: 14 }}>
                {rev.reviewText}
              </Text>

              {/* Footer Actions */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 10 }}>
                <Pressable
                  onPress={() => handleLike(rev._id)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <ThumbsUp size={14} color="#94A3B8" />
                  <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "600" }}>
                    {rev.likesCount} Helpful
                  </Text>
                </Pressable>

                <Text style={{ color: "#64748B", fontSize: 11 }}>
                  {new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Write Review Modal */}
      <Modal visible={isWriteModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 480, backgroundColor: "#0F172A", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: "800" }}>Write a Book Review</Text>
              <Pressable onPress={() => setIsWriteModalOpen(false)}>
                <X size={20} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Rating Stars Selector */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setNewRating(star)}>
                  <Star
                    size={28}
                    color={star <= newRating ? "#F59E0B" : "#334155"}
                    fill={star <= newRating ? "#F59E0B" : "transparent"}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={newAuthorName}
              onChangeText={setNewAuthorName}
              placeholder="Your Name (Optional)"
              placeholderTextColor="#64748B"
              style={{ backgroundColor: "rgba(30, 41, 59, 0.9)", borderRadius: 14, padding: 14, color: "#F8FAFC", fontSize: 13, marginBottom: 12 }}
            />

            <TextInput
              value={newReviewText}
              onChangeText={setNewReviewText}
              placeholder="What did you think of the story, prose, and audio narration?"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              style={{ backgroundColor: "rgba(30, 41, 59, 0.9)", borderRadius: 14, padding: 14, color: "#F8FAFC", fontSize: 13, minHeight: 100, marginBottom: 20, textAlignVertical: "top" }}
            />

            <Pressable
              onPress={handlePublishReview}
              disabled={isSubmitting || !newReviewText.trim()}
              style={{ backgroundColor: "#4F46E5", paddingVertical: 14, borderRadius: 14, alignItems: "center", opacity: isSubmitting || !newReviewText.trim() ? 0.5 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>Submit Review</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
