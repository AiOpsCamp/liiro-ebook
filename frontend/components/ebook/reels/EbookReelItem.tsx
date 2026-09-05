import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Heart, MessageCircle, Share2, Bookmark, BookOpen, Volume2, VolumeX, Sparkles, CheckCircle } from "lucide-react-native";
import { AudioManager } from "@/lib/utils/audioManager";

export interface BookReelData {
  _id: string;
  storySlug?: string;
  storyTitle: string;
  bookTitlePill: string;
  creatorName: string;
  creatorAvatarUrl: string;
  mediaType: "video" | "image";
  mediaUrl: string;
  posterUrl?: string;
  audioUrl?: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  tags?: string[];
}

interface EbookReelItemProps {
  reel: BookReelData;
  isActive: boolean;
  containerWidth?: number;
  containerHeight?: number;
}

export const EbookReelItem: React.FC<EbookReelItemProps> = ({
  reel,
  isActive,
  containerWidth,
  containerHeight
}) => {
  const router = useRouter();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const width = containerWidth || winWidth;
  const height = containerHeight || winHeight;

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Sync Audio Playback based on Viewport Visibility (Active Viewport Tracking)
  useEffect(() => {
    if (isActive && reel.audioUrl && !isMuted) {
      AudioManager.getInstance().playAudio(reel.audioUrl);
    } else {
      AudioManager.getInstance().pauseAudio();
    }
  }, [isActive, isMuted, reel.audioUrl]);

  const handleToggleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));

    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      await fetch(`${apiBase}/reels/${reel._id}/like`, { method: "POST" });
    } catch {}
  };

  const handleOpenBook = () => {
    if (reel.storySlug) {
      router.push(`/details/${reel.storySlug}`);
    } else {
      router.push("/");
    }
  };

  return (
    <View style={{ width, height, backgroundColor: "#020617", position: "relative", overflow: "hidden" }}>
      {/* Background Media Container (Image or Video) */}
      <Image
        source={{ uri: reel.posterUrl || reel.coverImageUrl || reel.mediaUrl }}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
      />

      {/* Dark Ambient Vignette Overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(2, 6, 23, 0.55)",
        }}
      />

      {/* Top Header Controls (Volume Mute Toggle) */}
      <View style={{ position: "absolute", top: 48, right: 20, zIndex: 30 }}>
        {reel.audioUrl && (
          <Pressable
            onPress={() => setIsMuted(!isMuted)}
            style={({ pressed }) => ({
              padding: 10,
              borderRadius: 100,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {isMuted ? <VolumeX size={18} color="#FFFFFF" /> : <Volume2 size={18} color="#F59E0B" />}
          </Pressable>
        )}
      </View>

      {/* Right Social Action Rail */}
      <View style={{ position: "absolute", right: 16, bottom: 120, alignItems: "center", gap: 20, zIndex: 30 }}>
        {/* Like Heart Button */}
        <Pressable onPress={handleToggleLike} style={{ alignItems: "center", gap: 4 }}>
          <View
            style={{
              padding: 12,
              borderRadius: 100,
              backgroundColor: isLiked ? "rgba(239, 68, 68, 0.25)" : "rgba(15, 23, 42, 0.65)",
              borderWidth: 1,
              borderColor: isLiked ? "#EF4444" : "rgba(255, 255, 255, 0.2)",
            }}
          >
            <Heart size={24} color={isLiked ? "#EF4444" : "#FFFFFF"} fill={isLiked ? "#EF4444" : "transparent"} />
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>{likesCount}</Text>
        </Pressable>

        {/* Comment Button */}
        <View style={{ alignItems: "center", gap: 4 }}>
          <View style={{ padding: 12, borderRadius: 100, backgroundColor: "rgba(15, 23, 42, 0.65)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)" }}>
            <MessageCircle size={24} color="#FFFFFF" />
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>{reel.commentsCount || 142}</Text>
        </View>

        {/* Bookmark Button */}
        <Pressable onPress={() => setIsBookmarked(!isBookmarked)} style={{ alignItems: "center", gap: 4 }}>
          <View style={{ padding: 12, borderRadius: 100, backgroundColor: isBookmarked ? "rgba(245, 158, 11, 0.25)" : "rgba(15, 23, 42, 0.65)", borderWidth: 1, borderColor: isBookmarked ? "#F59E0B" : "rgba(255, 255, 255, 0.2)" }}>
            <Bookmark size={24} color={isBookmarked ? "#F59E0B" : "#FFFFFF"} fill={isBookmarked ? "#F59E0B" : "transparent"} />
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>Save</Text>
        </Pressable>

        {/* Share Button */}
        <View style={{ alignItems: "center", gap: 4 }}>
          <View style={{ padding: 12, borderRadius: 100, backgroundColor: "rgba(15, 23, 42, 0.65)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)" }}>
            <Share2 size={24} color="#FFFFFF" />
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>{reel.sharesCount || 88}</Text>
        </View>
      </View>

      {/* Bottom Overlay Content (Creator Info, Caption, & 1-Tap Read Book CTA) */}
      <View style={{ position: "absolute", left: 16, right: 80, bottom: 40, zIndex: 30, gap: 12 }}>
        {/* Creator Info Pill */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {reel.creatorAvatarUrl || reel.coverImageUrl ? (
            <Image source={{ uri: reel.creatorAvatarUrl || reel.coverImageUrl }} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: "#F59E0B" }} />
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>{reel.authorName || reel.creatorName || "Classic Narrator"}</Text>
            <CheckCircle size={14} color="#38BDF8" fill="#38BDF8" />
          </View>
        </View>

        {/* Caption Text */}
        <Text style={{ color: "#E2E8F0", fontSize: 15, lineHeight: 22, fontWeight: "600" }} numberOfLines={3}>
          {reel.caption || reel.quoteText}
        </Text>

        {/* Book Title Pill & Direct CTA Button ("📖 Read Full Book") */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
          <Pressable
            onPress={handleOpenBook}
            style={({ pressed }) => ({
              backgroundColor: "#F43F5E",
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 100,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <BookOpen size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>Read Full Book ❯</Text>
          </Pressable>

          <View style={{ backgroundColor: "rgba(15, 23, 42, 0.85)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100 }}>
            <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 12 }} numberOfLines={1}>
              {reel.bookTitle || reel.bookTitlePill}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
