import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { X, CloudRain, Flame, Trees, Coffee, Castle, Volume2, Play, Pause, VolumeX } from "lucide-react-native";
import { soundscapeManager, SOUNDSCAPE_TRACKS, SoundscapeTrack } from "@/lib/utils/soundscapeManager";

interface EbookAmbientSoundscapeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EbookAmbientSoundscapeModal: React.FC<EbookAmbientSoundscapeModalProps> = ({
  visible,
  onClose,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    const unsubscribe = soundscapeManager.subscribe((state) => {
      setActiveKey(state.activeKey);
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
    });
    return unsubscribe;
  }, []);

  if (!visible) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "CloudRain": return <CloudRain className="w-5 h-5 text-sky-400" />;
      case "Flame": return <Flame className="w-5 h-5 text-orange-400" />;
      case "Trees": return <Trees className="w-5 h-5 text-emerald-400" />;
      case "Coffee": return <Coffee className="w-5 h-5 text-amber-400" />;
      case "Castle": return <Castle className="w-5 h-5 text-purple-400" />;
      default: return <CloudRain className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/75 p-6">
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <View className="flex-row items-center space-x-2">
              <CloudRain className="w-5 h-5 text-sky-400" />
              <Text className="text-white text-lg font-bold">Ambient Reading Soundscapes</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-slate-800">
              <X className="w-5 h-5 text-slate-400" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-400 text-xs mb-4 font-medium">
            Mix calming ambient focus soundscapes underneath your eBook reading or audiobook narration.
          </Text>

          {/* Soundscapes List */}
          <ScrollView className="max-h-72 space-y-3 mb-6">
            {SOUNDSCAPE_TRACKS.map((track) => {
              const isSelected = activeKey === track.key;
              const isTrackPlaying = isSelected && isPlaying;

              return (
                <TouchableOpacity
                  key={track.key}
                  onPress={() => soundscapeManager.playSoundscape(track.key)}
                  className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                    isSelected
                      ? "bg-sky-500/10 border-sky-500/50"
                      : "bg-slate-800/60 border-slate-700/50"
                  }`}
                >
                  <View className="flex-row items-center space-x-3 flex-1 pr-3">
                    <View className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-700/50 justify-center items-center">
                      {getIcon(track.icon)}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center space-x-1.5 mb-0.5">
                        <Text className="text-white font-bold text-sm">{track.name}</Text>
                        <Text className="text-xs">{track.emoji}</Text>
                      </View>
                      <Text className="text-slate-400 text-xs" numberOfLines={1}>
                        {track.description}
                      </Text>
                    </View>
                  </View>

                  <View className="w-9 h-9 rounded-full bg-sky-500/20 justify-center items-center border border-sky-500/40">
                    {isTrackPlaying ? (
                      <Pause className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Play className="w-4 h-4 text-sky-400 ml-0.5" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Volume Control Bar */}
          {activeKey && (
            <View className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <Text className="text-slate-300 text-xs font-bold">Ambient Volume ({Math.round(volume * 100)}%)</Text>
              </View>

              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => soundscapeManager.setVolume(Math.max(0, volume - 0.2))}
                  className="px-3 py-1.5 bg-slate-800 rounded-xl"
                >
                  <Text className="text-slate-300 font-bold text-xs">-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => soundscapeManager.setVolume(Math.min(1, volume + 0.2))}
                  className="px-3 py-1.5 bg-slate-800 rounded-xl"
                >
                  <Text className="text-slate-300 font-bold text-xs">+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => soundscapeManager.stopSoundscape()}
                  className="p-1.5 bg-red-500/20 border border-red-500/40 rounded-xl"
                >
                  <VolumeX className="w-4 h-4 text-red-400" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
