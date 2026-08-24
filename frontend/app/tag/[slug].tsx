import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Tag as TagIcon, BookOpen, Star } from "lucide-react-native";

export default function TagDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [tagData, setTagData] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTag();
  }, [slug]);

  const fetchTag = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/tags/${slug}`);
      const json = await res.json();
      if (json.success) {
        setTagData(json.data?.tag || { name: slug });
        setStories(json.data?.stories || json.data || []);
      }
    } catch (e) {
      console.warn("Failed to fetch tag detail:", e);
    } finally {
      setLoading(false);
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
        <View className="flex-1 flex-row items-center space-x-2">
          <TagIcon className="w-5 h-5 text-indigo-400" />
          <Text className="text-white text-xl font-bold capitalize">#{slug}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#818CF8" className="my-20" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-slate-400 text-xs mb-4 font-medium">
            Showing {stories.length} books tagged with #{slug}
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {stories.map((story) => (
              <TouchableOpacity
                key={story._id || story.slug}
                onPress={() => router.push(`/details/${story.slug}`)}
                className="w-[48%] bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mb-4"
              >
                <Image
                  source={{ uri: story.coverImageUrl }}
                  className="w-full h-48 rounded-xl bg-slate-800 mb-3"
                  resizeMode="cover"
                />
                <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>
                  {story.title?.en || story.title}
                </Text>
                <Text className="text-slate-400 text-xs mb-2" numberOfLines={1}>
                  {story.author}
                </Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <Text className="text-amber-400 text-xs font-bold">4.9</Text>
                  </View>
                  <Text className="text-slate-500 text-[10px] uppercase font-bold">{story.level || "B1"}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
