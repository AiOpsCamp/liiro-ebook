import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, FlatList, useWindowDimensions, ActivityIndicator, Pressable, ViewToken } from "react-native";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Film, Sparkles } from "lucide-react-native";
import { EbookReelItem, BookReelData } from "@/components/ebook/reels/EbookReelItem";
import { useGetReelsQuery } from "@/api/storiesQuery";

export default function BookReelsFeedScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [activeIdx, setActiveIdx] = useState(0);

  const { data: reels = [], isLoading: loading } = useGetReelsQuery(20);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // High-Performance Viewport Visibility Tracking (Only focused reel plays audio/video)
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIdx(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: "#020617" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Top Nav Bar */}
      <View style={{ position: "absolute", top: 48, left: 16, right: 16, zIndex: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => ({
            padding: 10,
            borderRadius: 100,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(245, 158, 11, 0.2)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.4)" }}>
          <Film size={14} color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 12, letterSpacing: 1 }}>BOOK REELS 🎥</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#818CF8" />
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <EbookReelItem reel={item} isActive={index === activeIdx} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        />
      )}
    </View>
  );
}
