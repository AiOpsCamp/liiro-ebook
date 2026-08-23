import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";

import { selectThemeTokens, selectIsDark } from "@/redux/features/themeSlice";
import { useGetStoriesDashboardQuery } from "@/api/storiesQuery";
import EbookDashboardContent from "@/components/ebook/EbookDashboardContent";

export default function EbookDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tokens = useSelector(selectThemeTokens);
  const isDark = useSelector(selectIsDark);

  const { data, isLoading, error, refetch } = useGetStoriesDashboardQuery();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleStoryPress = useCallback(
    (slug: string, preferAudio?: boolean) => {
      if (preferAudio) {
        router.push(`/read/${slug}?audio=1`);
      } else {
        router.push(`/details/${slug}`);
      }
    },
    [router]
  );

  return (
    <View style={{ flex: 1, width: "100%", height: "100%", backgroundColor: tokens?.bg || "#0f172a" }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <EbookDashboardContent
        data={data}
        colors={tokens}
        onStoryPress={handleStoryPress}
        insets={insets}
        onRefresh={onRefresh}
      />
    </View>
  );
}
