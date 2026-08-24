import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native";
import { Bell, X, CheckCheck, Sparkles, BookOpen, Flame } from "lucide-react-native";

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type?: string;
  readAt?: string | null;
  createdAt: string;
}

interface EbookNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    _id: "notif_1",
    title: "🔥 7-Day Reading Streak Achieved!",
    body: "Congratulations! You earned +50 XP for reading 15 minutes today.",
    createdAt: "2026-08-24T12:00:00.000Z",
  },
  {
    _id: "notif_2",
    title: "🎧 New Audiobook Release: Frankenstein",
    body: "Adam's multi-voice narration for Frankenstein is now available in your library.",
    createdAt: "2026-08-23T12:00:00.000Z",
  },
];

export const EbookNotificationsModal: React.FC<EbookNotificationsModalProps> = ({
  visible,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetchNotifications();
  }, [visible]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const res = await fetch(`${apiBase}/notifications`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.items) && json.data.items.length > 0) {
        setNotifications(json.data.items);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      await fetch(`${apiBase}/notifications/mark-all-read`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70 p-6">
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <View className="flex-row items-center space-x-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <Text className="text-white text-lg font-bold">Notifications</Text>
            </View>

            <View className="flex-row items-center space-x-2">
              <TouchableOpacity onPress={handleMarkAllRead} className="p-2 bg-slate-800 rounded-xl">
                <CheckCheck className="w-4 h-4 text-slate-400" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          {loading ? (
            <ActivityIndicator size="small" color="#818CF8" className="my-10" />
          ) : (
            <ScrollView className="flex-1 space-y-3">
              {notifications.map((n) => (
                <View
                  key={n._id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex-row space-x-3"
                >
                  <View className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/50 justify-center items-center">
                    {n.title.includes("Streak") ? (
                      <Flame className="w-5 h-5 text-orange-400" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-white font-bold text-sm mb-0.5">{n.title}</Text>
                    <Text className="text-slate-300 text-xs leading-relaxed mb-1">{n.body}</Text>
                    <Text className="text-slate-500 text-[10px]">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
