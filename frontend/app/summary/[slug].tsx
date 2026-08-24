import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Sparkles, Clock, Play, Pause, ChevronRight, BookOpen, Quote, Share2 } from "lucide-react-native";
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
      AudioManager.pauseAudio();
      setIsPlayingAudio(false);
    } else {
      AudioManager.playAudio(data.summary.summaryAudioUrl, () => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    }
  };

  const currentTakeaway = data?.summary?.keyTakeaways?.[activeTakeawayIdx];
  const totalTakeaways = data?.summary?.keyTakeaways?.length || 5;

  return (
    <View className="flex-1 bg-slate-950 px-4 pt-12">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2.5 rounded-full bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>

        <View className="flex-row items-center space-x-2 bg-amber-500/20 px-3.5 py-1.5 rounded-full border border-amber-500/40">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <Text className="text-amber-400 font-extrabold text-xs">BLINKIST MODE</Text>
        </View>

        <TouchableOpacity onPress={() => router.push(`/read/${slug}`)} className="p-2.5 rounded-full bg-indigo-600">
          <BookOpen className="w-5 h-5 text-white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#818CF8" className="my-20" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero Summary Book Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
            <View className="flex-row items-center space-x-4 mb-4">
              <Image
                source={{ uri: data?.story?.coverImageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300" }}
                className="w-16 h-22 rounded-xl bg-slate-800"
              />
              <View className="flex-1">
                <Text className="text-white text-lg font-bold mb-1" numberOfLines={1}>
                  {data?.story?.title?.en || data?.story?.title}
                </Text>
                <Text className="text-slate-400 text-xs mb-2">by {data?.story?.author}</Text>
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <Text className="text-amber-400 text-xs font-bold">{data?.summary?.estimatedAudioMinutes || 12} Min Audio</Text>
                  </View>
                  <Text className="text-slate-500 text-xs">• {totalTakeaways} Blinks</Text>
                </View>
              </View>
            </View>

            <Text className="text-slate-300 text-xs leading-relaxed mb-4">{data?.summary?.overview}</Text>

            {/* 15-Min Audio Summary Player */}
            <TouchableOpacity
              onPress={handleToggleAudio}
              className="bg-amber-500 p-3.5 rounded-2xl flex-row items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4 text-slate-950" /> : <Play className="w-4 h-4 text-slate-950 ml-0.5" />}
              <Text className="text-slate-950 font-extrabold text-xs">
                {isPlayingAudio ? "Pause 15-Min Audio Summary" : "Listen to 15-Min Audio Summary"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Indicators */}
          <View className="flex-row space-x-1.5 mb-6">
            {data?.summary?.keyTakeaways?.map((_: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveTakeawayIdx(idx)}
                style={{ width: `${100 / totalTakeaways - 2}%` }}
                className={`h-1.5 rounded-full ${
                  idx === activeTakeawayIdx ? "bg-amber-400" : idx < activeTakeawayIdx ? "bg-slate-700" : "bg-slate-800"
                }`}
              />
            ))}
          </View>

          {/* Key Takeaway Card */}
          {currentTakeaway && (
            <View className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-amber-400 font-extrabold text-xs tracking-widest uppercase">
                  KEY TAKEAWAY #{currentTakeaway.takeawayNumber} OF {totalTakeaways}
                </Text>
              </View>

              <Text className="text-white text-xl font-bold mb-3">{currentTakeaway.title}</Text>
              <Text className="text-slate-300 text-sm leading-relaxed mb-6">{currentTakeaway.content}</Text>

              {/* Quote Pill */}
              {currentTakeaway.quote && (
                <View className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex-row items-start space-x-3 mb-4">
                  <Quote className="w-5 h-5 text-amber-400" />
                  <Text className="text-slate-300 italic text-xs leading-relaxed flex-1 font-medium">
                    "{currentTakeaway.quote}"
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom Controls */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setActiveTakeawayIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeTakeawayIdx === 0}
              className={`px-5 py-3 rounded-2xl border ${
                activeTakeawayIdx === 0 ? "bg-slate-900/40 border-slate-800/40 opacity-40" : "bg-slate-900 border-slate-800"
              }`}
            >
              <Text className="text-white font-bold text-xs">Previous Blink</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (activeTakeawayIdx < totalTakeaways - 1) {
                  setActiveTakeawayIdx((prev) => prev + 1);
                } else {
                  router.push(`/read/${slug}`);
                }
              }}
              className="bg-indigo-600 px-6 py-3 rounded-2xl flex-row items-center space-x-2"
            >
              <Text className="text-white font-bold text-xs">
                {activeTakeawayIdx < totalTakeaways - 1 ? "Next Blink" : "Read Full Book"}
              </Text>
              <ChevronRight className="w-4 h-4 text-white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
