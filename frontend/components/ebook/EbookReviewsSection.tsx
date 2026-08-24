import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import { Star, ThumbsUp, MessageSquare, Plus, CheckCircle, ExternalLink, Filter } from "lucide-react-native";

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
    <View className="mt-8 border-t border-slate-800/80 pt-8">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <Text className="text-white text-xl font-bold">Community & Goodreads Reviews</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsWriteModalOpen(true)}
          className="bg-indigo-600 px-3.5 py-2 rounded-xl flex-row items-center space-x-1.5"
        >
          <Plus className="w-4 h-4 text-white" />
          <Text className="text-white text-xs font-bold">Write Review</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Rating Box */}
      {summary && (
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 flex-row items-center justify-between">
          <View className="items-center pr-6 border-r border-slate-800">
            <Text className="text-white text-4xl font-extrabold">{summary.averageRating}</Text>
            <View className="flex-row my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(summary.averageRating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-700"
                  }`}
                />
              ))}
            </View>
            <Text className="text-slate-400 text-[11px] font-medium">{summary.totalReviews} Ratings</Text>
          </View>

          {/* Rating Breakdown Bars */}
          <View className="flex-1 pl-6 space-y-1">
            {[5, 4, 3, 2, 1].map((ratingNum) => {
              const count = summary.distribution[ratingNum] || 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <View key={ratingNum} className="flex-row items-center space-x-2">
                  <Text className="text-slate-400 text-xs font-bold w-3">{ratingNum}</Text>
                  <View className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <View
                      style={{ width: `${pct}%` }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </View>
                  <Text className="text-slate-500 text-[10px] w-6 text-right font-medium">{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View className="flex-row space-x-2 mb-6">
        {[
          { key: "all", label: "All Reviews" },
          { key: "goodreads", label: "Goodreads Reviews 📚" },
          { key: "user", label: "Community" },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-full border ${
                isActive
                  ? "bg-indigo-600/20 border-indigo-500"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isActive ? "text-indigo-400" : "text-slate-400"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Reviews List */}
      {loading ? (
        <ActivityIndicator size="small" color="#818CF8" className="my-8" />
      ) : (
        <View className="space-y-4">
          {reviews.map((rev) => (
            <View key={rev._id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
              {/* Author Row */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center space-x-3">
                  <Image
                    source={{ uri: rev.authorAvatarUrl }}
                    className="w-9 h-9 rounded-full bg-slate-800"
                  />
                  <View>
                    <View className="flex-row items-center space-x-1.5">
                      <Text className="text-white font-bold text-sm">{rev.authorName}</Text>
                      {rev.source === "goodreads" && (
                        <View className="bg-amber-950/80 border border-amber-700/50 px-1.5 py-0.5 rounded">
                          <Text className="text-amber-400 text-[9px] font-bold">Goodreads</Text>
                        </View>
                      )}
                    </View>
                    {rev.isVerifiedPurchase && (
                      <View className="flex-row items-center space-x-1 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <Text className="text-emerald-400 text-[10px] font-medium">Verified Reader</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Rating Stars */}
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"
                      }`}
                    />
                  ))}
                </View>
              </View>

              {/* Review Content */}
              <Text className="text-slate-300 text-sm leading-relaxed mb-3">{rev.reviewText}</Text>

              {/* Footer Actions */}
              <View className="flex-row items-center justify-between border-t border-slate-800/50 pt-2">
                <TouchableOpacity
                  onPress={() => handleLike(rev._id)}
                  className="flex-row items-center space-x-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                  <Text className="text-slate-400 text-xs font-semibold">{rev.likesCount || 0} Helpful</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Write Review Modal */}
      <Modal visible={isWriteModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70 p-6">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <Text className="text-white text-xl font-bold mb-4">Write a Book Review</Text>

            <Text className="text-slate-400 text-xs font-semibold mb-2">YOUR RATING</Text>
            <View className="flex-row space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                  <Star
                    className={`w-8 h-8 ${
                      star <= newRating ? "text-amber-400 fill-amber-400" : "text-slate-700"
                    }`}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-slate-400 text-xs font-semibold mb-2">YOUR NAME (OPTIONAL)</Text>
            <TextInput
              value={newAuthorName}
              onChangeText={setNewAuthorName}
              placeholder="e.g. Sarah M."
              placeholderTextColor="#64748B"
              className="bg-slate-800 text-white p-3.5 rounded-xl mb-4 font-semibold border border-slate-700 text-sm"
            />

            <Text className="text-slate-400 text-xs font-semibold mb-2">YOUR REVIEW</Text>
            <TextInput
              value={newReviewText}
              onChangeText={setNewReviewText}
              placeholder="What did you think of the narration and story?"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              className="bg-slate-800 text-white p-3.5 rounded-xl mb-6 font-semibold border border-slate-700 text-sm h-28"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setIsWriteModalOpen(false)}
                className="flex-1 bg-slate-800 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-300 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePublishReview}
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 py-3.5 rounded-xl items-center"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Publish Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
