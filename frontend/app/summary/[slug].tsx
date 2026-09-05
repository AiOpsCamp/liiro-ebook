import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Sparkles, Clock, Play, Pause, ChevronRight, BookOpen, Quote, Globe, Volume2, Layers, CheckCircle2 } from "lucide-react-native";
import { AudioManager } from "@/lib/utils/audioManager";
import { useGetStorySummaryQuery } from "@/api/storiesQuery";

export default function SparksSummaryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedLang, setSelectedLang] = useState<"en" | "bn" | "es">("en");
  const [selectedVoice, setSelectedVoice] = useState<string>("af_heart");
  const [selectedQuality, setSelectedQuality] = useState<"high_192k" | "standard_96k" | "low_48k">("high_192k");

  // Query Backend with Language, Voice, and Quality params
  const { data, isLoading: loading } = useGetStorySummaryQuery({
    slug: slug as string,
    lang: selectedLang,
    voiceId: selectedVoice,
    quality: selectedQuality,
  } as any, { skip: !slug });

  const summary = data?.summary;
  const story = data?.story;
  const audioTrack = summary?.activeAudioTrack;

  const handleToggleAudio = () => {
    if (!audioTrack?.audioUrl && !summary?.summaryAudioUrl) return;
    const targetUrl = audioTrack?.audioUrl || summary?.summaryAudioUrl;
    if (isPlayingAudio) {
      AudioManager.getInstance().pauseAudio();
      setIsPlayingAudio(false);
    } else {
      AudioManager.getInstance().playAudio(targetUrl, () => setIsPlayingAudio(false));
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

  return (
    <View style={{ flex: 1, backgroundColor: "#040914" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Floating Glass Header */}
      <View
        style={{
          paddingTop: 52,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: "rgba(4, 9, 20, 0.95)",
          borderBottomWidth: 1,
          borderBottomColor: "#1E293B",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(245,158,11,0.15)",
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 100,
            borderWidth: 1,
            borderColor: "rgba(245,158,11,0.35)",
          }}
        >
          <Sparkles size={14} color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 }}>LIIRO SPARKS ⚡</Text>
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
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 12 }}>Full Ebook</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#818CF8" style={{ marginTop: 120 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Hetzner S3 Hero Banner Image */}
          <View style={{ position: "relative", width: "100%", height: 230, marginBottom: 20 }}>
            <Image
              source={{ uri: summary?.heroImageUrl || story?.coverImageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600" }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {/* Gradient Overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(4,9,20,0.7)",
                justifyContent: "flex-end",
                padding: 20,
              }}
            >
              <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
                15-MIN EXECUTIVE AUDIO SUMMARY
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "900", lineHeight: 32, marginBottom: 4 }}>
                {story?.title?.en || story?.title}
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "500" }}>by {story?.author}</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            {/* Multilingual & Audio Controls Card */}
            <View
              style={{
                backgroundColor: "#0F172A",
                borderWidth: 1,
                borderColor: "#1E293B",
                borderRadius: 20,
                padding: 16,
                marginBottom: 20,
              }}
            >
              {/* Language Selector */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Globe size={14} color="#818CF8" />
                  <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700" }}>Language:</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {[
                    { code: "en", label: "English" },
                    { code: "bn", label: "বাংলা" },
                    { code: "es", label: "Español" },
                  ].map((langObj) => (
                    <Pressable
                      key={langObj.code}
                      onPress={() => setSelectedLang(langObj.code as any)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 100,
                        backgroundColor: selectedLang === langObj.code ? "#4F46E5" : "#1E293B",
                      }}
                    >
                      <Text style={{ color: selectedLang === langObj.code ? "#FFFFFF" : "#94A3B8", fontSize: 11, fontWeight: "700" }}>
                        {langObj.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Bitrate & Quality Selector */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Volume2 size={14} color="#F59E0B" />
                  <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700" }}>Audio Quality:</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {[
                    { code: "high_192k", label: "192k HD" },
                    { code: "standard_96k", label: "96k HQ" },
                    { code: "low_48k", label: "48k Data" },
                  ].map((qObj) => (
                    <Pressable
                      key={qObj.code}
                      onPress={() => setSelectedQuality(qObj.code as any)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 100,
                        backgroundColor: selectedQuality === qObj.code ? "rgba(245,158,11,0.2)" : "#1E293B",
                        borderWidth: 1,
                        borderColor: selectedQuality === qObj.code ? "#F59E0B" : "transparent",
                      }}
                    >
                      <Text style={{ color: selectedQuality === qObj.code ? "#F59E0B" : "#64748B", fontSize: 10, fontWeight: "700" }}>
                        {qObj.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* 15-Min Audio Summary Player Bar */}
            <Pressable
              onPress={handleToggleAudio}
              style={({ pressed }) => ({
                backgroundColor: "#F59E0B",
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 100, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" }}>
                  {isPlayingAudio ? <Pause size={20} color="#F59E0B" /> : <Play size={20} color="#F59E0B" style={{ marginLeft: 2 }} />}
                </View>
                <View>
                  <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 14 }}>
                    {isPlayingAudio ? "Pause Audio Summary" : "Play 15-Min Audio Summary"}
                  </Text>
                  <Text style={{ color: "rgba(15,23,42,0.8)", fontSize: 11, fontWeight: "700" }}>
                    {audioTrack?.voiceName || "Heart (Female US)"} • {audioTrack?.quality || "192k HD"}
                  </Text>
                </View>
              </View>
              <Clock size={18} color="#0F172A" />
            </Pressable>

            {/* SECTION 1: Executive Hook & Overview */}
            <View style={{ backgroundColor: "#0F172A", borderWidth: 1, borderColor: "#1E293B", borderRadius: 24, padding: 22, marginBottom: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Sparkles size={18} color="#F59E0B" />
                <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800" }}>One-Sentence Executive Hook</Text>
              </View>

              <Text style={{ color: "#FBBF24", fontSize: 15, lineHeight: 22, fontWeight: "600", fontStyle: "italic", marginBottom: 18 }}>
                "{summary?.oneSentenceSummary || "An immortal Transylvanian vampire unleashes ancient evil upon Victorian London..."}"
              </Text>

              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 10 }}>
                Full Synopsis & Literary Overview
              </Text>
              <Text style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 22 }}>
                {summary?.summaryText || summary?.overview}
              </Text>
            </View>

            {/* SECTION 2: Key Takeaways (Sparks ⚡) */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={20} color="#F59E0B" />
                  <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>Key Takeaways ({summary?.keyTakeaways?.length || 0})</Text>
                </View>
                <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "700" }}>15-MIN SPARKS ⚡</Text>
              </View>

              <View style={{ gap: 16 }}>
                {summary?.keyTakeaways?.map((item: any, idx: number) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: "#0F172A",
                      borderWidth: 1.5,
                      borderColor: "#1E293B",
                      borderRadius: 22,
                      padding: 20,
                    }}
                  >
                    <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                      KEY TAKEAWAY #{item.takeawayNumber || idx + 1} OF {summary?.keyTakeaways?.length}
                    </Text>

                    <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginBottom: 10, lineHeight: 24 }}>
                      {item.title}
                    </Text>

                    <Text style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 21, marginBottom: item.quote ? 14 : 0 }}>
                      {item.description || item.content}
                    </Text>

                    {item.quote && (
                      <View style={{ backgroundColor: "#030712", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", padding: 14, borderRadius: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                        <Quote size={16} color="#F59E0B" />
                        <Text style={{ color: "#FBBF24", fontStyle: "italic", fontSize: 12, lineHeight: 18, flex: 1, fontWeight: "500" }}>
                          "{item.quote}"
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* SECTION 3: Chapter-by-Chapter Act Breakdowns */}
            {summary?.chapterBreakdowns && summary?.chapterBreakdowns?.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Layers size={20} color="#818CF8" />
                  <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>Chapter-by-Chapter Acts</Text>
                </View>

                <View style={{ gap: 14 }}>
                  {summary?.chapterBreakdowns?.map((actObj: any, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: "#0F172A",
                        borderWidth: 1,
                        borderColor: "#1E293B",
                        borderRadius: 20,
                        padding: 20,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text style={{ color: "#F59E0B", fontWeight: "800", fontSize: 14 }}>{actObj.act}</Text>
                        <View style={{ backgroundColor: "#1E293B", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                          <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "700" }}>{actObj.chapters}</Text>
                        </View>
                      </View>
                      <Text style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 20 }}>{actObj.summary}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Read Full Book CTA Button */}
            <Pressable
              onPress={() => router.push(`/read/${slug}`)}
              style={({ pressed }) => ({
                backgroundColor: "#4F46E5",
                paddingVertical: 18,
                paddingHorizontal: 24,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15 }}>
                Read Full Book ({story?.title?.en || story?.title})
              </Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
