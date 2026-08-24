import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, RefreshControl } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSelector } from "react-redux";
import { selectThemeTokens } from "@/redux/features/themeSlice";
import { ArrowLeft, Activity, BookOpen, Headphones, Globe, Clock, Trophy, Pause, Bookmark, RefreshCw } from "lucide-react-native";

export default function UserActivityScreen() {
  const router = useRouter();
  const tokens = useSelector(selectThemeTokens);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/user/activities?limit=30`);
      const json = await res.json();
      if (json.success) {
        setActivities(json.data || []);
      }
    } catch (e) {
      console.warn("Failed to fetch user activities:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "started_reading":
      case "paused_reading":
        return <BookOpen size={18} color="#818CF8" />;
      case "started_listening":
      case "paused_listening":
        return <Headphones size={18} color="#F59E0B" />;
      case "completed_chapter":
      case "completed_audiobook":
        return <Trophy size={18} color="#10B981" />;
      case "changed_language":
        return <Globe size={18} color="#38BDF8" />;
      case "added_bookmark":
        return <Bookmark size={18} color="#EC4899" />;
      default:
        return <Activity size={18} color="#A855F7" />;
    }
  };

  const getActivityBadgeLabel = (type: string) => {
    switch (type) {
      case "started_reading":
        return "READING STARTED";
      case "paused_reading":
        return "READING PAUSED";
      case "started_listening":
        return "AUDIOBOOK STARTED";
      case "paused_listening":
        return "AUDIO PAUSED";
      case "completed_chapter":
        return "CHAPTER COMPLETE";
      case "changed_language":
        return "LANGUAGE SWITCHED";
      case "added_bookmark":
        return "BOOKMARK SAVED";
      default:
        return "ACTIVITY";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080E1A", paddingHorizontal: 16, paddingTop: 48 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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

          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>Reading Activity History</Text>
            <Text style={{ color: "#94A3B8", fontSize: 12 }}>Track your reading & listening progress</Text>
          </View>
        </View>

        <Pressable
          onPress={fetchActivities}
          style={({ pressed }) => ({
            padding: 10,
            borderRadius: 100,
            backgroundColor: "#0F172A",
            borderWidth: 1,
            borderColor: "#1E293B",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <RefreshCw size={16} color="#818CF8" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#818CF8" style={{ marginTop: 80 }} />
      ) : activities.length === 0 ? (
        <View style={{ alignItems: "center", justifyContent: "center", marginTop: 80, gap: 12 }}>
          <Activity size={48} color="#334155" />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>No Reading Activities Logged Yet</Text>
          <Text style={{ color: "#94A3B8", fontSize: 13, textAlign: "center" }}>
            Start reading or listening to an ebook to log your real-time progress timeline!
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818CF8" colors={["#818CF8"]} />}
        >
          <View style={{ gap: 16 }}>
            {activities.map((act) => {
              const langFlag = act.activeLang === "es" ? "🇪🇸 ES" : act.activeLang === "fr" ? "🇫🇷 FR" : "🇬🇧 EN";
              const posMin = Math.floor((act.positionSec || 0) / 60);

              return (
                <Pressable
                  key={act._id}
                  onPress={() => router.push(`/details/${act.storySlug}`)}
                  style={({ pressed }) => ({
                    backgroundColor: "#0F172A",
                    borderWidth: 1,
                    borderColor: "#1E293B",
                    borderRadius: 20,
                    padding: 18,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flexDirection: "row", items: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ padding: 8, borderRadius: 12, backgroundColor: "rgba(99,102,241,0.12)", borderWidth: 1, borderColor: "rgba(99,102,241,0.25)" }}>
                        {getActivityIcon(act.activityType)}
                      </View>
                      <Text style={{ color: "#818CF8", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
                        {getActivityBadgeLabel(act.activityType)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(56,189,248,0.12)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1, borderColor: "rgba(56,189,248,0.3)" }}>
                      <Globe size={11} color="#38BDF8" />
                      <Text style={{ color: "#38BDF8", fontSize: 10, fontWeight: "800" }}>{langFlag}</Text>
                    </View>
                  </View>

                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
                    {act.storyTitle}
                  </Text>

                  <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 12 }}>
                    Chapter {act.chapterNumber} {act.chapterTitle ? `• ${act.chapterTitle}` : ""}
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      {act.positionSec > 0 && (
                        <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700" }}>
                          Paused at {posMin}m
                        </Text>
                      )}
                      {act.progressPercent > 0 && (
                        <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "700" }}>
                          {act.progressPercent}% Complete
                        </Text>
                      )}
                    </View>

                    <Text style={{ color: "#64748B", fontSize: 11 }}>
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
