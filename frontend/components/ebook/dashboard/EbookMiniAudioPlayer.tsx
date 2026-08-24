import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Image, Platform } from "react-native";
import { Play, Pause, SkipForward, X, Volume2 } from "lucide-react-native";
import { AudioManager } from "@/lib/utils/audioManager";

interface EbookMiniAudioPlayerProps {
  storyTitle?: string;
  chapterTitle?: string;
  coverImageUrl?: string;
  onPressExpand?: () => void;
  onClosePlayer?: () => void;
}

export const EbookMiniAudioPlayer: React.FC<EbookMiniAudioPlayerProps> = ({
  storyTitle = "The Strange Case of Dr. Jekyll and Mr. Hyde",
  chapterTitle = "Chapter 1. Story of the Door",
  coverImageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400",
  onPressExpand,
  onClosePlayer,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  useEffect(() => {
    const audioMgr = AudioManager.getInstance();
    const handleStatus = ({ position, duration }: { position: number; duration: number }) => {
      setPositionSec(position);
      setDurationSec(duration);
    };

    audioMgr.subscribeStatus(handleStatus);
    return () => {
      audioMgr.unsubscribeStatus(handleStatus);
    };
  }, []);

  const handleTogglePlay = async () => {
    const audioMgr = AudioManager.getInstance();
    if (isPlaying) {
      await audioMgr.pauseAudio();
      setIsPlaying(false);
    } else {
      await audioMgr.resumeAudio();
      setIsPlaying(true);
    }
  };

  const progressPct = durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0;

  return (
    <Pressable
      onPress={onPressExpand}
      style={({ pressed }) => ({
        position: "absolute",
        bottom: Platform.OS === "web" ? 20 : 30,
        left: 12,
        right: 12,
        zIndex: 99,
        backgroundColor: "#0F172A",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(56, 189, 248, 0.35)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        overflow: "hidden",
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {/* Top Scrub Bar Indicator */}
      <View style={{ height: 3, width: "100%", backgroundColor: "rgba(255,255,255,0.1)" }}>
        <View style={{ height: "100%", width: `${progressPct}%`, backgroundColor: "#38BDF8" }} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10 }}>
        {/* Left Book Cover & Metadata */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingRight: 10 }}>
          <Image
            source={{ uri: coverImageUrl }}
            style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#1E293B" }}
          />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: "#F8FAFC", fontSize: 13, fontWeight: "700" }}>
              {storyTitle}
            </Text>
            <Text numberOfLines={1} style={{ color: "#38BDF8", fontSize: 11, fontWeight: "600", marginTop: 2 }}>
              {chapterTitle}
            </Text>
          </View>
        </View>

        {/* Right Audio Action Controls */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Play/Pause Button */}
          <Pressable
            onPress={handleTogglePlay}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#38BDF8",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPlaying ? <Pause size={18} color="#0F172A" /> : <Play size={18} color="#0F172A" style={{ marginLeft: 2 }} />}
          </Pressable>

          {/* Skip 15s */}
          <Pressable
            onPress={() => AudioManager.getInstance().seekTo(positionSec + 15)}
            style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
          >
            <SkipForward size={18} color="#94A3B8" />
          </Pressable>

          {/* Close Mini Player */}
          {onClosePlayer && (
            <Pressable
              onPress={onClosePlayer}
              style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} color="#64748B" />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};
