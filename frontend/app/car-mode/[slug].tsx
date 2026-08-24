import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { X, Play, Pause, RotateCcw, RotateCw, Bookmark, Mic, Car } from "lucide-react-native";
import { AudioManager } from "@/lib/utils/audioManager";

export default function CarModeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [bookmarkSaved, setBookmarkSaved] = useState(false);
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    fetchStory();
  }, [slug]);

  const fetchStory = async () => {
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/slug/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setStory(json.data);
      }
    } catch {}
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      AudioManager.getInstance().pauseAudio();
    } else {
      AudioManager.getInstance().resumeAudio();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeekBackward = () => {
    AudioManager.getInstance().seekTo(Math.max(0, AudioManager.getInstance().getPosition() - 15));
  };

  const handleSeekForward = () => {
    AudioManager.getInstance().seekTo(AudioManager.getInstance().getPosition() + 15);
  };

  const handleAddBookmark = () => {
    setBookmarkSaved(true);
    setTimeout(() => setBookmarkSaved(false), 2000);
  };

  const handleSpeedCycle = () => {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    AudioManager.getInstance().setPlaybackRate(nextSpeed);
  };

  const handleExitCarMode = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/details/${slug}`);
    }
  };

  const titleStr = story?.title?.en || story?.title || "Alice’s Adventures in Wonderland";
  const authorStr = story?.author || "Lewis Carroll";
  const coverUrl = story?.coverImageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600";

  return (
    <View style={{ flex: 1, backgroundColor: "#020617", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 40, justifyContent: "space-between" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justify: "space-between" }}>
        <Pressable
          onPress={handleExitCarMode}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 100,
            backgroundColor: "#0F172A",
            borderWidth: 1.5,
            borderColor: "#1E293B",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <X size={20} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>Exit Car Mode</Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(245,158,11,0.18)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1.5, borderColor: "#F59E0B" }}>
          <Car size={16} color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 13, letterSpacing: 1 }}>AUDIBLE CAR MODE</Text>
        </View>
      </View>

      {/* Centerpiece Book & Chapter Details */}
      <View style={{ alignItems: "center", marginVertical: 20 }}>
        <Image
          source={{ uri: coverUrl }}
          style={{ width: 140, height: 180, borderRadius: 20, borderWidth: 2, borderColor: "#1E293B", marginBottom: 20 }}
          resizeMode="cover"
        />

        <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 6, lineHeight: 32 }} numberOfLines={2}>
          {titleStr}
        </Text>

        <Text style={{ color: "#94A3B8", fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 12 }}>
          by {authorStr}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0F172A", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: "#1E293B" }}>
          <Mic size={14} color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "800" }}>Chapter 1 • Narrated by Adam</Text>
        </View>
      </View>

      {/* Extra-Large Driving Controls (88px Play/Pause + 72px Skip) */}
      <View style={{ gap: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
          {/* Rewind 15s */}
          <Pressable
            onPress={handleSeekBackward}
            style={({ pressed }) => ({
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: "#0F172A",
              borderWidth: 2,
              borderColor: "#1E293B",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <RotateCcw size={28} color="#FFFFFF" />
            <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "800", marginTop: 2 }}>15s</Text>
          </Pressable>

          {/* Giant Centerpiece Play / Pause Button (88px) */}
          <Pressable
            onPress={handleTogglePlay}
            style={({ pressed }) => ({
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: "#F59E0B",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
            })}
          >
            {isPlaying ? <Pause size={44} color="#020617" /> : <Play size={44} color="#020617" style={{ marginLeft: 4 }} />}
          </Pressable>

          {/* Forward 15s */}
          <Pressable
            onPress={handleSeekForward}
            style={({ pressed }) => ({
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: "#0F172A",
              borderWidth: 2,
              borderColor: "#1E293B",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <RotateCw size={28} color="#FFFFFF" />
            <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "800", marginTop: 2 }}>15s</Text>
          </Pressable>
        </View>

        {/* Bottom Utility Driving Controls */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Quick Bookmark Pin */}
          <Pressable
            onPress={handleAddBookmark}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 16,
              borderRadius: 20,
              backgroundColor: bookmarkSaved ? "rgba(16,185,129,0.2)" : "#0F172A",
              borderWidth: 1.5,
              borderColor: bookmarkSaved ? "#10B981" : "#1E293B",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Bookmark size={20} color={bookmarkSaved ? "#10B981" : "#F59E0B"} />
            <Text style={{ color: bookmarkSaved ? "#10B981" : "#FFFFFF", fontWeight: "800", fontSize: 14 }}>
              {bookmarkSaved ? "Bookmark Saved! 📌" : "Add Bookmark"}
            </Text>
          </Pressable>

          {/* Speed Selector */}
          <Pressable
            onPress={handleSpeedCycle}
            style={({ pressed }) => ({
              width: 90,
              paddingVertical: 16,
              borderRadius: 20,
              backgroundColor: "#0F172A",
              borderWidth: 1.5,
              borderColor: "#1E293B",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 15 }}>{playbackSpeed}x</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
