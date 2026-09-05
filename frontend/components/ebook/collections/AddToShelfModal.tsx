import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform
} from "react-native";
import {
  X,
  Bookmark,
  Heart,
  BookOpen,
  Folder,
  Sparkles,
  Plus,
  Check,
  CheckCircle2,
  FolderPlus
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE = "http://127.0.0.1:5012/api/v1";

interface AddToShelfModalProps {
  visible: boolean;
  onClose: () => void;
  storyId?: string;
  storySlug?: string;
  storyTitle?: string;
  onShelfUpdated?: () => void;
}

const PALETTE = ["#38BDF8", "#F59E0B", "#EC4899", "#10B981", "#8B5CF6", "#F43F5E", "#06B6D4"];

export function AddToShelfModal({
  visible,
  onClose,
  storyId,
  storySlug,
  storyTitle = "Book",
  onShelfUpdated
}: AddToShelfModalProps) {
  const [shelves, setShelves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (visible && (storyId || storySlug)) {
      fetchShelves();
    }
  }, [visible, storyId, storySlug]);

  const fetchShelves = async () => {
    setLoading(true);
    try {
      const identifier = storySlug || storyId;
      const res = await fetch(`${API_BASE}/collections/story/${identifier}`);
      const json = await res.json();
      if (json.success && json.data) {
        setShelves(json.data);
      }
    } catch (e) {
      console.error("Error loading story shelves:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShelf = async (shelf: any) => {
    setActionLoading(shelf._id);
    const targetId = storyId || storySlug;
    const isCurrentlyIn = shelf.isInShelf;

    // Optimistic UI update
    setShelves((prev) =>
      prev.map((s) => (s._id === shelf._id ? { ...s, isInShelf: !isCurrentlyIn } : s))
    );

    try {
      if (isCurrentlyIn) {
        // Remove
        await fetch(`${API_BASE}/collections/${shelf._id}/stories/${targetId}`, {
          method: "DELETE"
        });
      } else {
        // Add
        await fetch(`${API_BASE}/collections/${shelf._id}/stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId, storySlug })
        });
      }
      if (onShelfUpdated) onShelfUpdated();
    } catch (e) {
      console.error("Error updating shelf:", e);
      // Revert on error
      setShelves((prev) =>
        prev.map((s) => (s._id === shelf._id ? { ...s, isInShelf: isCurrentlyIn } : s))
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateShelf = async () => {
    if (!newShelfName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newShelfName.trim(),
          color: selectedColor,
          icon: "folder"
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Automatically add the current story to the newly created shelf
        if (storyId || storySlug) {
          await fetch(`${API_BASE}/collections/${json.data._id}/stories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storyId, storySlug })
          });
        }
        setNewShelfName("");
        setIsCreating(false);
        fetchShelves();
        if (onShelfUpdated) onShelfUpdated();
      }
    } catch (e) {
      console.error("Error creating new shelf:", e);
    }
  };

  const getShelfIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case "heart":
        return <Heart size={18} color={color} fill={color} />;
      case "book-open":
        return <BookOpen size={18} color={color} />;
      case "sparkles":
        return <Sparkles size={18} color={color} />;
      case "bookmark":
      default:
        return <Bookmark size={18} color={color} fill={color} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <FolderPlus size={20} color="#38BDF8" />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.headerTitle}>Add to Bookshelf</Text>
                <Text numberOfLines={1} style={styles.headerSubtitle}>
                  {storyTitle}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Shelves List */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#38BDF8" />
              <Text style={styles.loaderText}>Loading your bookshelves...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
              {shelves.map((shelf) => {
                const isSelected = shelf.isInShelf;
                const isActionActive = actionLoading === shelf._id;

                return (
                  <TouchableOpacity
                    key={shelf._id}
                    onPress={() => handleToggleShelf(shelf)}
                    style={[
                      styles.shelfRow,
                      isSelected && { borderColor: shelf.color, backgroundColor: "rgba(15, 23, 42, 0.9)" }
                    ]}
                  >
                    <View style={styles.shelfLeft}>
                      <View style={[styles.iconCircle, { backgroundColor: `${shelf.color}20`, borderColor: `${shelf.color}40` }]}>
                        {getShelfIcon(shelf.icon, shelf.color)}
                      </View>
                      <View>
                        <Text style={[styles.shelfName, isSelected && { color: "#FFFFFF" }]}>
                          {shelf.name}
                        </Text>
                        <Text style={styles.shelfType}>
                          {shelf.isSystem ? "Built-in Shelf" : "Custom Bookshelf"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.checkWrapper}>
                      {isActionActive ? (
                        <ActivityIndicator size="small" color={shelf.color} />
                      ) : isSelected ? (
                        <View style={[styles.checkboxSelected, { backgroundColor: shelf.color }]}>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={styles.checkboxEmpty} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Create New Shelf Section */}
              {!isCreating ? (
                <TouchableOpacity
                  onPress={() => setIsCreating(true)}
                  style={styles.createToggleBtn}
                >
                  <Plus size={18} color="#38BDF8" />
                  <Text style={styles.createToggleText}>Create New Bookshelf</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.createBox}>
                  <Text style={styles.createBoxTitle}>New Bookshelf</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Victorian Classics, Bedtime Reads"
                    placeholderTextColor="#64748B"
                    value={newShelfName}
                    onChangeText={setNewShelfName}
                    autoFocus
                  />

                  {/* Color Palette Picker */}
                  <View style={styles.paletteRow}>
                    {PALETTE.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setSelectedColor(c)}
                        style={[
                          styles.colorDot,
                          { backgroundColor: c },
                          selectedColor === c && styles.colorDotSelected
                        ]}
                      >
                        {selectedColor === c && <Check size={12} color="#FFFFFF" />}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.createActionRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsCreating(false);
                        setNewShelfName("");
                      }}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCreateShelf}
                      style={[styles.saveBtn, !newShelfName.trim() && styles.saveBtnDisabled]}
                      disabled={!newShelfName.trim()}
                    >
                      <Text style={styles.saveBtnText}>Save & Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Done Button */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "85%",
    backgroundColor: "#0B1329",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B"
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center"
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10
  },
  loaderText: {
    fontSize: 13,
    color: "#94A3B8"
  },
  scrollList: {
    padding: 16,
    gap: 10
  },
  shelfRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B"
  },
  shelfLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  shelfName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0"
  },
  shelfType: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  checkWrapper: {
    marginLeft: 10
  },
  checkboxEmpty: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#475569"
  },
  checkboxSelected: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  createToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(56, 189, 248, 0.4)",
    backgroundColor: "rgba(56, 189, 248, 0.05)",
    marginTop: 6
  },
  createToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#38BDF8"
  },
  createBox: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
    marginTop: 6
  },
  createBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 10
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#F8FAFC",
    marginBottom: 12
  },
  paletteRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  createActionRow: {
    flexDirection: "row",
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center"
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8"
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0284C7",
    alignItems: "center"
  },
  saveBtnDisabled: {
    opacity: 0.5
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#1E293B"
  },
  doneBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center"
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#38BDF8"
  }
});
