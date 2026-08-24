import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native";
import { BookOpen, Languages, Highlighting, MessageSquare, X, Play, Check } from "lucide-react-native";
import axios from "axios";

interface EbookTextSelectionTooltipProps {
  selectedText: string;
  onClose: () => void;
  onHighlight: (color: string) => void;
}

export function EbookTextSelectionTooltip({
  selectedText,
  onClose,
  onHighlight,
}: EbookTextSelectionTooltipProps) {
  const [activeModal, setActiveModal] = useState<"dictionary" | "translate" | null>(null);
  const [dictionaryResult, setDictionaryResult] = useState<any>(null);
  const [isLoadingDict, setIsLoadingDict] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<string | null>(null);

  const cleanWord = selectedText.trim().replace(/[^\w\s]/gi, "").split(/\s+/)[0];

  const handleLookupDictionary = async () => {
    setActiveModal("dictionary");
    setIsLoadingDict(true);
    try {
      const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
      if (res.data && res.data[0]) {
        setDictionaryResult(res.data[0]);
      } else {
        setDictionaryResult({ word: cleanWord, meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "No definition found for this word." }] }] });
      }
    } catch (err) {
      setDictionaryResult({
        word: cleanWord,
        meanings: [
          {
            partOfSpeech: "definition",
            definitions: [{ definition: `"${selectedText.substring(0, 100)}..."` }],
          },
        ],
      });
    } finally {
      setIsLoadingDict(false);
    }
  };

  const handleTranslate = () => {
    setActiveModal("translate");
    // Mock translation preview
    setTranslatedText(`[ES] "${selectedText}" -> "Demostración de traducción interactiva de Liiro Ebook."`);
  };

  const highlightColors = [
    { name: "Yellow", hex: "#FEF08A" },
    { name: "Green", hex: "#BBF7D0" },
    { name: "Blue", hex: "#BFDBFE" },
    { name: "Pink", hex: "#FBCFE8" },
  ];

  return (
    <>
      {/* Floating Action Toolbar */}
      <View className="absolute bottom-24 left-4 right-4 z-50 bg-[#0F172A] border border-cyan-500/30 rounded-2xl p-3 shadow-2xl flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2 flex-1 pr-2">
          <Text className="text-white text-xs font-semibold" numberOfLines={1}>
            "{selectedText}"
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          {/* Dictionary Lookup Button */}
          <TouchableOpacity
            onPress={handleLookupDictionary}
            className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 items-center justify-center"
          >
            <BookOpen size={16} color="#38BDF8" />
          </TouchableOpacity>

          {/* Translation Preview Button */}
          <TouchableOpacity
            onPress={handleTranslate}
            className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/40 items-center justify-center"
          >
            <Languages size={16} color="#C084FC" />
          </TouchableOpacity>

          {/* Color Highlight Buttons */}
          <View className="flex-row items-center space-x-1 pl-1 border-l border-gray-800">
            {highlightColors.map((c) => (
              <TouchableOpacity
                key={c.name}
                onPress={() => {
                  setSelectedHighlightColor(c.hex);
                  onHighlight(c.hex);
                }}
                style={{ backgroundColor: c.hex }}
                className="w-6 h-6 rounded-full border border-gray-700 items-center justify-center"
              >
                {selectedHighlightColor === c.hex && <Check size={12} color="#000" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Close Toolbar */}
          <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center ml-1">
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dictionary Modal Sheet */}
      <Modal visible={activeModal === "dictionary"} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-[#0F172A] rounded-t-3xl border-t border-cyan-500/30 p-6 max-h-[70%]">
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-800">
              <View className="flex-row items-center space-x-2">
                <BookOpen size={20} color="#38BDF8" />
                <Text className="text-white text-lg font-bold">Dictionary Lookup</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="w-8 h-8 items-center justify-center">
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {isLoadingDict ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#38BDF8" />
              </View>
            ) : (
              <ScrollView className="py-4 space-y-4">
                <Text className="text-cyan-400 text-2xl font-bold capitalize">{dictionaryResult?.word || cleanWord}</Text>
                {dictionaryResult?.phonetic && <Text className="text-gray-400 text-sm font-mono">{dictionaryResult.phonetic}</Text>}

                {dictionaryResult?.meanings?.map((m: any, idx: number) => (
                  <View key={idx} className="bg-slate-900 border border-gray-800 rounded-xl p-4 space-y-2">
                    <Text className="text-purple-400 font-semibold italic text-xs uppercase">{m.partOfSpeech}</Text>
                    {m.definitions?.map((d: any, dIdx: number) => (
                      <Text key={dIdx} className="text-gray-200 text-sm leading-relaxed">
                        • {d.definition}
                      </Text>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Translation Modal Sheet */}
      <Modal visible={activeModal === "translate"} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-[#0F172A] rounded-t-3xl border-t border-purple-500/30 p-6 max-h-[50%]">
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-800">
              <View className="flex-row items-center space-x-2">
                <Languages size={20} color="#C084FC" />
                <Text className="text-white text-lg font-bold">Instant Translation</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="w-8 h-8 items-center justify-center">
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="py-4 space-y-4">
              <View className="bg-slate-900 border border-gray-800 rounded-xl p-4 space-y-1">
                <Text className="text-gray-400 text-xs uppercase font-semibold">Original Text</Text>
                <Text className="text-white text-sm italic">"{selectedText}"</Text>
              </View>

              <View className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-4 space-y-1">
                <Text className="text-purple-400 text-xs uppercase font-semibold">Spanish Translation (Preview)</Text>
                <Text className="text-purple-200 text-sm font-medium">{translatedText}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
