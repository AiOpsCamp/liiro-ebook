import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Mic, Play, Pause, Headphones, Star } from "lucide-react-native";
import { AudioManager } from "@/lib/utils/audioManager";

export default function NarratorDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [narrator, setNarrator] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  useEffect(() => {
    fetchNarrator();
  }, [slug]);

  const fetchNarrator = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/metadata/narrators`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find((n: any) => n.slug === slug || n.voiceId === slug);
        setNarrator(found || {
          name: slug === "adam" ? "Adam (US Male Neural)" : slug === "michael" ? "Michael (UK Male)" : "Bella (US Female)",
          bio: "Professional AI voice actor producing crystal-clear literature narrations.",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
        });
      }
    } catch (e) {
      console.warn("Failed to fetch narrator:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSample = () => {
    if (isPlayingSample) {
      AudioManager.pauseAudio();
      setIsPlayingSample(false);
    } else {
      AudioManager.playAudio("https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/audio/alices-adventures-in-wonderland/voices/adam/chapter_1.mp3");
      setIsPlayingSample(true);
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-4 pt-12">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center space-x-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2.5 rounded-full bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Voice Actor Profile</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#818CF8" className="my-20" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Profile Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 items-center">
            <Image
              source={{ uri: narrator?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300" }}
              className="w-24 h-24 rounded-full mb-4 border-2 border-amber-500/50"
            />
            <Text className="text-white text-2xl font-extrabold mb-1">{narrator?.name}</Text>
            <View className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 mb-3 flex-row items-center space-x-1">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <Text className="text-amber-400 text-xs font-bold uppercase">{slug} Voice</Text>
            </View>
            <Text className="text-slate-300 text-xs text-center leading-relaxed mb-5">
              {narrator?.bio || "Official Kokoro ONNX neural voice narrator specialized in classic audiobooks."}
            </Text>

            {/* Voice Sample Player Button */}
            <TouchableOpacity
              onPress={handleToggleSample}
              className="bg-indigo-600 px-5 py-3 rounded-2xl flex-row items-center space-x-2 shadow-lg shadow-indigo-500/30"
            >
              {isPlayingSample ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
              <Text className="text-white font-bold text-xs">
                {isPlayingSample ? "Pause Voice Sample" : "Play Voice Sample (15s)"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Narrated Audiobooks Catalog */}
          <View className="flex-row items-center space-x-2 mb-4">
            <Headphones className="w-5 h-5 text-indigo-400" />
            <Text className="text-white text-lg font-bold">Narrated Audiobooks</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/details/alices-adventures-in-wonderland")}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-row items-center space-x-4 mb-4"
          >
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300" }}
              className="w-16 h-20 rounded-xl bg-slate-800"
            />
            <View className="flex-1">
              <Text className="text-white font-bold text-base mb-1">Alice’s Adventures in Wonderland</Text>
              <Text className="text-slate-400 text-xs mb-2">by Lewis Carroll</Text>
              <View className="flex-row items-center space-x-2">
                <View className="flex-row items-center space-x-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <Text className="text-amber-400 text-xs font-bold">4.9</Text>
                </View>
                <Text className="text-slate-500 text-xs">• 2h 45m</Text>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
