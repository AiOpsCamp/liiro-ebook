import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Moon, X, Check, Clock } from "lucide-react-native";
import AudioManager from "../../lib/utils/audioManager";

interface EbookSleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

const TIMER_PRESETS: Array<{ label: string; value: number | "end_of_chapter" }> = [
  { label: "Off", value: 0 },
  { label: "5 Min", value: 5 },
  { label: "15 Min", value: 15 },
  { label: "30 Min", value: 30 },
  { label: "45 Min", value: 45 },
  { label: "60 Min", value: 60 },
  { label: "End of Chapter 📖", value: "end_of_chapter" },
];

export const EbookSleepTimerModal: React.FC<EbookSleepTimerModalProps> = ({
  visible,
  onClose,
}) => {
  const [activePreset, setActivePreset] = useState<number | "end_of_chapter">(0);
  const [remainingSec, setRemainingSec] = useState<number>(0);

  useEffect(() => {
    if (!visible) return;
    const audioMgr = AudioManager.getInstance();
    const interval = setInterval(() => {
      setRemainingSec(audioMgr.getRemainingSleepTimerSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleSelectPreset = (presetValue: number | "end_of_chapter") => {
    const audioMgr = AudioManager.getInstance();
    setActivePreset(presetValue);

    if (presetValue === 0) {
      audioMgr.cancelSleepTimer();
    } else {
      audioMgr.setSleepTimer(presetValue);
    }
  };

  const handleExtend = () => {
    const audioMgr = AudioManager.getInstance();
    audioMgr.extendSleepTimer(15);
  };

  const formatRemainingTime = (sec: number) => {
    if (sec === -1) return "Until End of Chapter";
    if (sec <= 0) return "Timer Off";
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s remaining`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <View className="flex-row items-center space-x-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <Text className="text-white text-lg font-bold">Sleep Timer</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-slate-800">
              <X className="w-5 h-5 text-slate-400" />
            </TouchableOpacity>
          </View>

          {/* Active Timer Countdown Banner */}
          {remainingSec !== 0 && (
            <View className="bg-indigo-950/60 border border-indigo-800/50 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center space-x-3">
                <Clock className="w-5 h-5 text-indigo-400" />
                <View>
                  <Text className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                    Active Countdown
                  </Text>
                  <Text className="text-white text-base font-bold">
                    {formatRemainingTime(remainingSec)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleExtend}
                className="bg-indigo-600 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-white text-xs font-bold">+15 Min</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Preset Buttons Grid */}
          <View className="space-y-2">
            {TIMER_PRESETS.map((preset) => {
              const isSelected = activePreset === preset.value;
              return (
                <TouchableOpacity
                  key={String(preset.value)}
                  onPress={() => handleSelectPreset(preset.value)}
                  className={`flex-row items-center justify-between p-4 rounded-xl border ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500"
                      : "bg-slate-800/50 border-slate-700/50"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      isSelected ? "text-indigo-400" : "text-slate-300"
                    }`}
                  >
                    {preset.label}
                  </Text>
                  {isSelected && <Check className="w-5 h-5 text-indigo-400" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};
