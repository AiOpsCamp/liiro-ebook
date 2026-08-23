import React from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { X, CheckCircle2, Circle } from "lucide-react-native";

interface ChapterItem {
  _id: string;
  chapterNumber: number;
  title: string;
  durationSeconds?: number;
}

interface EbookReaderTocModalProps {
  visible: boolean;
  onClose: () => void;
  chapters: ChapterItem[];
  currentChapterIdx: number;
  completedChapterIds: string[];
  themeColors: {
    bg: string;
    textMain: string;
    textSecondary: string;
    accent: string;
    borderSoft: string;
  };
  onSelectChapter: (idx: number) => void;
}

export const EbookReaderTocModal: React.FC<EbookReaderTocModalProps> = ({
  visible,
  onClose,
  chapters,
  currentChapterIdx,
  completedChapterIds,
  themeColors,
  onSelectChapter,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: themeColors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            borderTopWidth: 1,
            borderColor: themeColors.borderSoft,
            maxHeight: "85%",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: themeColors.textMain, fontSize: 18, fontWeight: "700" }}>
              Table of Contents ({chapters.length} Chapters)
            </Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={themeColors.textSecondary} />
            </Pressable>
          </View>

          {/* Chapter List */}
          <FlatList
            data={chapters}
            keyExtractor={(item, index) => item._id || String(index)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isCurrent = index === currentChapterIdx;
              const isCompleted = completedChapterIds.includes(item._id);

              return (
                <Pressable
                  onPress={() => {
                    onSelectChapter(index);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: isCurrent ? themeColors.accent + "15" : "transparent",
                    marginBottom: 4,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ marginRight: 12 }}>
                    {isCompleted ? (
                      <CheckCircle2 size={18} color="#10B981" />
                    ) : (
                      <Circle size={18} color={isCurrent ? themeColors.accent : themeColors.textSecondary} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: isCurrent ? themeColors.accent : themeColors.textMain,
                        fontSize: 14,
                        fontWeight: isCurrent ? "700" : "500",
                      }}
                    >
                      Chapter {item.chapterNumber || index + 1}: {item.title}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};
