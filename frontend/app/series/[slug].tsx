import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Layers, BookOpen, ChevronRight, Star } from "lucide-react-native";

export default function SeriesDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, [slug]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/stories/series/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSeries(json.data);
      } else {
        setSeries({
          title: "Sherlock Holmes Collection",
          author: "Arthur Conan Doyle",
          description: "Follow the master detective Sherlock Holmes and Dr. John Watson through mystery classics.",
          booksCount: 4,
          books: [
            { _id: "s1", slug: "the-adventures-of-sherlock-holmes", title: "The Adventures of Sherlock Holmes", seriesOrder: 1 },
            { _id: "s2", slug: "the-hound-of-the-baskervilles", title: "The Hound of the Baskervilles", seriesOrder: 2 },
          ],
        });
      }
    } catch (e) {
      console.warn("Failed to fetch series detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-4 pt-12">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center space-x-3 mb-6">
        <TouchableOpacity onPress={handleBack} className="p-2.5 rounded-full bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Book Series Collection</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#818CF8" className="my-20" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Series Hero Banner */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
            <View className="flex-row items-center space-x-2 mb-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <Text className="text-amber-400 text-xs font-bold uppercase">Series Collection</Text>
            </View>

            <Text className="text-white text-2xl font-extrabold mb-1">{series?.title}</Text>
            <Text className="text-slate-400 text-sm mb-4">by {series?.author}</Text>
            <Text className="text-slate-300 text-xs leading-relaxed mb-4">{series?.description}</Text>

            <View className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex-row justify-between items-center">
              <Text className="text-slate-400 text-xs font-semibold">Total Volumes in Order:</Text>
              <Text className="text-white font-bold text-xs">{series?.books?.length || 2} Books</Text>
            </View>
          </View>

          {/* Reading Order List */}
          <Text className="text-white text-lg font-bold mb-4">Chronological Reading Order</Text>

          {series?.books?.map((book: any, idx: number) => (
            <TouchableOpacity
              key={book._id || book.slug}
              onPress={() => router.push(`/details/${book.slug}`)}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center space-x-3 flex-1 pr-4">
                <View className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 justify-center items-center">
                  <Text className="text-amber-400 font-extrabold text-xs">#{idx + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm mb-0.5" numberOfLines={1}>
                    {book.title?.en || book.title}
                  </Text>
                  <Text className="text-slate-400 text-xs">Book #{book.seriesOrder || idx + 1}</Text>
                </View>
              </View>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
