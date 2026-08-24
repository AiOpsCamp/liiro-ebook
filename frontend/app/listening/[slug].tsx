import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Slider } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Moon, BookOpen, Volume2, Mic } from "lucide-react-native";
import { AudioManager } from "@/lib/utils/audioManager";

export default function ListeningScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [position, setPosition] = useState(45);
  const [duration, setDuration] = useState(180);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        setPosition((prev) => (prev >= duration ? 0 : prev + 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      AudioManager.pauseAudio();
    } else {
      AudioManager.resumeAudio();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedCycle = () => {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    AudioManager.setPlaybackRate(nextSpeed);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/details/${slug}`);
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 pt-12 justify-between pb-10">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity onPress={handleBack} className="p-2.5 rounded-full bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">AUDIOBOOK PLAYER</Text>
        <TouchableOpacity onPress={() => router.push(`/read/${slug}`)} className="p-2.5 rounded-full bg-indigo-600">
          <BookOpen className="w-5 h-5 text-white" />
        </TouchableOpacity>
      </View>

      {/* Large Cover Art Hero */}
      <View className="items-center my-6">
        <View className="w-64 h-80 rounded-3xl bg-slate-900 overflow-hidden border-2 border-slate-800 shadow-2xl shadow-indigo-500/20">
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600" }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <Text className="text-white text-2xl font-extrabold text-center mt-6 mb-1" numberOfLines={1}>
          Alice’s Adventures in Wonderland
        </Text>
        <Text className="text-slate-400 text-sm font-semibold mb-2">by Lewis Carroll</Text>
        <View className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 flex-row items-center space-x-1.5">
          <Mic className="w-3.5 h-3.5 text-amber-400" />
          <Text className="text-amber-400 text-xs font-bold">Narrated by Adam</Text>
        </View>
      </View>

      {/* Scrubber Controls */}
      <View className="space-y-2 mb-6">
        <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <View style={{ width: `${(position / duration) * 100}%` }} className="h-full bg-amber-400 rounded-full" />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-slate-400 text-xs font-semibold">
            {Math.floor(position / 60)}:{String(position % 60).padStart(2, "0")}
          </Text>
          <Text className="text-slate-400 text-xs font-semibold">
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
          </Text>
        </View>
      </View>

      {/* Playback Buttons */}
      <View className="flex-row items-center justify-between px-4 mb-6">
        <TouchableOpacity onPress={handleSpeedCycle} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <Text className="text-amber-400 font-extrabold text-xs">{playbackSpeed}x</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPosition((p) => Math.max(0, p - 15))} className="p-3">
          <SkipBack className="w-7 h-7 text-white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTogglePlay}
          className="w-16 h-16 rounded-full bg-amber-500 justify-center items-center shadow-lg shadow-amber-500/40"
        >
          {isPlaying ? <Pause className="w-8 h-8 text-slate-950" /> : <Play className="w-8 h-8 text-slate-950 ml-1" />}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPosition((p) => Math.min(duration, p + 15))} className="p-3">
          <SkipForward className="w-7 h-7 text-white" />
        </TouchableOpacity>

        <TouchableOpacity className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <Moon className="w-5 h-5 text-slate-400" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
