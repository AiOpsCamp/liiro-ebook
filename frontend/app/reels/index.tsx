import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Pressable,
  ViewToken,
  Platform
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ArrowLeft, Film, Sparkles } from "lucide-react-native";
import { EbookReelItem } from "@/components/ebook/reels/EbookReelItem";
import { useGetReelsQuery } from "@/api/storiesQuery";

export default function BookReelsFeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ index?: string }>();
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  // Mobile portrait phone dimensions for web desktop viewing
  const containerWidth = isWeb ? Math.min(width, 430) : width;
  const containerHeight = isWeb ? Math.min(height - 40, 780) : height;

  const initialIndex = params.index ? parseInt(params.index, 10) : 0;
  const [activeIdx, setActiveIdx] = useState(initialIndex || 0);

  const { data: reels = [], isLoading: loading } = useGetReelsQuery(20);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // High-Performance Viewport Visibility Tracking
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIdx(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#020617",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Main Responsive Mobile Frame Container */}
      <View
        style={{
          width: containerWidth,
          height: containerHeight,
          backgroundColor: "#020617",
          borderRadius: isWeb ? 32 : 0,
          borderWidth: isWeb ? 2 : 0,
          borderColor: "rgba(255, 255, 255, 0.15)",
          overflow: "hidden",
          position: "relative",
          boxShadow: isWeb ? "0 25px 50px -12px rgba(0, 0, 0, 0.9)" : undefined,
        }}
      >
        {/* Floating Top Nav Bar inside Frame */}
        <View
          style={{
            position: "absolute",
            top: isWeb ? 20 : 48,
            left: 16,
            right: 16,
            zIndex: 50,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => ({
              padding: 10,
              borderRadius: 100,
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(244, 63, 94, 0.25)",
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: "rgba(244, 63, 94, 0.4)",
            }}
          >
            <Film size={14} color="#F43F5E" />
            <Text style={{ color: "#F43F5E", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 }}>
              BOOK REELS 🎬
            </Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#F43F5E" />
            <Text style={{ color: "#94A3B8", marginTop: 12, fontSize: 13 }}>
              Loading reels...
            </Text>
          </View>
        ) : (
          <FlatList
            data={reels}
            initialScrollIndex={initialIndex < reels.length ? initialIndex : 0}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <EbookReelItem
                reel={item}
                isActive={index === activeIdx}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
              />
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={containerHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: containerHeight,
              offset: containerHeight * index,
              index,
            })}
          />
        )}
      </View>
    </View>
  );
}
