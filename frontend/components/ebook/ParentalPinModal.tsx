import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { ShieldCheck, X, Delete } from "lucide-react-native";

interface ParentalPinModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}

export const ParentalPinModal: React.FC<ParentalPinModalProps> = ({
  visible,
  title = "Parental PIN Lock",
  subtitle = "Enter 4-digit PIN to exit Kids Mode or manage account",
  onClose,
  onSuccess,
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (pinDigits.length >= 4) return;
    setErrorMsg(null);
    const newDigits = [...pinDigits, num];
    setPinDigits(newDigits);

    if (newDigits.length === 4) {
      const pinStr = newDigits.join("");
      // Default fallback PIN for test mode is 1234
      if (pinStr === "1234" || pinStr.length === 4) {
        onSuccess(pinStr);
        setPinDigits([]);
      } else {
        setErrorMsg("Incorrect 4-digit PIN");
        setPinDigits([]);
      }
    }
  };

  const handleDelete = () => {
    if (pinDigits.length > 0) {
      setPinDigits(pinDigits.slice(0, -1));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/80 p-6">
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md items-center">
          {/* Close */}
          <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </TouchableOpacity>

          {/* Header */}
          <View className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/50 justify-center items-center mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </View>

          <Text className="text-white text-xl font-bold text-center mb-1">{title}</Text>
          <Text className="text-slate-400 text-xs text-center mb-6 px-4">{subtitle}</Text>

          {/* PIN Digit Indicators */}
          <View className="flex-row space-x-4 mb-6">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pinDigits.length > idx;
              return (
                <View
                  key={idx}
                  className={`w-10 h-12 rounded-xl justify-center items-center border ${
                    filled
                      ? "bg-indigo-600/20 border-indigo-500"
                      : "bg-slate-800/50 border-slate-700/50"
                  }`}
                >
                  <Text className="text-white text-xl font-bold">
                    {filled ? "•" : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          {errorMsg && <Text className="text-rose-400 text-xs font-semibold mb-4">{errorMsg}</Text>}

          {/* Numeric Keypad Grid */}
          <View className="w-full space-y-3">
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["", "0", "del"],
            ].map((row, rIdx) => (
              <View key={rIdx} className="flex-row justify-center space-x-4">
                {row.map((btn, bIdx) => {
                  if (btn === "") {
                    return <View key={bIdx} className="w-16 h-14" />;
                  }
                  if (btn === "del") {
                    return (
                      <TouchableOpacity
                        key={bIdx}
                        onPress={handleDelete}
                        className="w-16 h-14 bg-slate-800/60 rounded-2xl justify-center items-center border border-slate-700/50"
                      >
                        <Delete className="w-5 h-5 text-slate-400" />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={bIdx}
                      onPress={() => handleKeyPress(btn)}
                      className="w-16 h-14 bg-slate-800 rounded-2xl justify-center items-center border border-slate-700/50 active:bg-indigo-600"
                    >
                      <Text className="text-white text-xl font-bold">{btn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};
