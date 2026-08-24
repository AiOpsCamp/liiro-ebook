import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Sparkles, Clock, Play, Pause, ChevronRight, BookOpen, Quote } from "lucide-react-native";
import { AudioManager } from "@/lib/utils/audioManager";

export default function BlinksSummaryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTakeawayIdx, setActiveTakeawayIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [slug]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/slug/${slug}/summary`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch summary:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAudio = () => {
    if (!data?.summary?.summaryAudioUrl) return;
    if (isPlayingAudio) {
      AudioManager.getInstance().pauseAudio();
      setIsPlayingAudio(false);
    } else {
      AudioManager.getInstance().playAudio(data.summary.summaryAudioUrl, () => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/details/${slug}`);
    }
  };

  const currentTakeaway = data?.summary?.keyTakeaways?.[activeTakeawayIdx];
  const totalTakeaways = data?.summary?.keyTakeaways?.length || 5;

  return (
    <View style={{ flex: 1, backgroundColor: "#080E1A", paddingHorizontal: 16, paddingTop: 48 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => ({
            padding: 10,
            borderRadius: 100,
            backgroundColor: "#0F172A",
            borderWidth: 1,
            borderColor: "#1E293B",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(245,158,11,0.15)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: "rgba(245,158,11,0.35)" }}>
          <Sparkles size={14} color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 }}>BLINKIST MODE ⚡</Text>
        </View>

        <Pressable
          onPress={() => router.push(`/read/${slug}`)}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 100,
            backgroundColor: "#4F46E5",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <BookOpen size={14} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 12 }}>Full Book</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#818CF8" style={{ marginTop: 80 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero Summary Book Card */}
          <View style={{ backgroundColor: "#0F172A", borderWidth: 1, borderColor: "#1E293B", borderRadius: 24, padding: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <Image
                source={{ uri: data?.story?.coverImageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300" }}
                style={{ width: 68, height: 96, borderRadius: 12, backgroundColor: "#1E293B" }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 4 }} numberOfLines={1}>
                  {data?.story?.title?.en || data?.story?.title}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 8 }}>by {data?.story?.author}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Clock size={13} color="#F59E0B" />
                  <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700" }}>{data?.summary?.estimatedAudioMinutes || 12} Min Audio</Text>
                  <Text style={{ color: "#64748B", fontSize: 12 }}>• {totalTakeaways} Blinks</Text>
                </View>
              </View>
            </View>

            <Text style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 19, marginBottom: 16 }}>{data?.summary?.overview}</Text>

            {/* 15-Min Audio Summary Player */}
            <Pressable
              onPress={handleToggleAudio}
              style={({ pressed }) => ({
                backgroundColor: "#F59E0B",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {isPlayingAudio ? <Pause size={16} color="#0F172A" /> : <Play size={16} color="#0F172A" style={{ marginLeft: 2 }} />}
              <Text style={{ color: "#0F172A", fontWeight: "800", fontSize: 13 }}>
                {isPlayingAudio ? "Pause 15-Min Audio Summary" : "Listen to 15-Min Audio Summary"}
              </Text>
            </Pressable>
          </View>

          {/* Progress Indicators */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
            {data?.summary?.keyTakeaways?.map((_: any, idx: number) => (
              <Pressable
                key={idx}
                onPress={() => setActiveTakeawayIdx(idx)}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: idx === activeTakeawayIdx ? "#F59E0B" : idx < activeTakeawayIdx ? "#334155" : "#1E293B",
                }}
              />
            ))}
          </View>

          {/* Key Takeaway Card */}
          {currentTakeaway && (
            <View style={{ backgroundColor: "#0F172A", borderWidth: 1.5, borderColor: "#1E293B", borderRadius: 24, padding: 24, marginBottom: 24 }}>
              <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                KEY TAKEAWAY #{currentTakeaway.takeawayNumber} OF {totalTakeaways}
              </Text>

              <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginBottom: 12, lineHeight: 28 }}>
                {currentTakeaway.title}
              </Text>

              <Text style={{ color: "#E2E8F0", fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
                {currentTakeaway.content}
              </Text>

              {/* Quote Pill */}
              {currentTakeaway.quote && (
                <View style={{ backgroundColor: "#030712", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", padding: 16, borderRadius: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <Quote size={18} color="#F59E0B" />
                  <Text style={{ color: "#FBBF24", fontStyle: "italic", fontSize: 13, lineHeight: 19, flex: 1, fontWeight: "500" }}>
                    "{currentTakeaway.quote}"
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Pressable
              onPress={() => setActiveTakeawayIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeTakeawayIdx === 0}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#0F172A",
                borderWidth: 1,
                borderColor: "#1E293B",
                alignItems: "center",
                opacity: activeTakeawayIdx === 0 ? 0.3 : pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>Previous Blink</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (activeTakeawayIdx < totalTakeaways - 1) {
                  setActiveTakeawayIdx((prev) => prev + 1);
                } else {
                  router.push(`/read/${slug}`);
                }
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#4F46E5",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>
                {activeTakeawayIdx < totalTakeaways - 1 ? "Next Blink" : "Read Full Book"}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
