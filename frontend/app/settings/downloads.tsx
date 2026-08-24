import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, HardDrive, Trash2, Wifi, ShieldCheck, Download } from "lucide-react-native";

export default function DownloadsSettingsScreen() {
  const router = useRouter();
  const [wifiOnly, setWifiOnly] = useState(true);
  const [hdAudio, setHdAudio] = useState(true);
  const [cacheSize, setCacheSize] = useState("142.8 MB");

  const handleClearCache = () => {
    setCacheSize("0.0 MB");
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-4 pt-12">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center space-x-3 mb-6">
        <TouchableOpacity onPress={handleBack} className="p-2.5 rounded-full bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Storage & Downloads</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Storage Usage Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
          <View className="flex-row items-center space-x-3 mb-4">
            <View className="w-10 h-10 rounded-2xl bg-indigo-500/20 justify-center items-center">
              <HardDrive className="w-5 h-5 text-indigo-400" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">Local Offline Storage</Text>
              <Text className="text-slate-400 text-xs">Used space on this device</Text>
            </View>
          </View>

          <Text className="text-white text-3xl font-extrabold mb-2">{cacheSize}</Text>
          <View className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <View className="h-full bg-indigo-500 rounded-full w-[35%]" />
          </View>

          <TouchableOpacity
            onPress={handleClearCache}
            className="bg-red-500/20 border border-red-500/40 p-3.5 rounded-2xl flex-row items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <Text className="text-red-400 font-bold text-xs">Clear All Offline Downloads</Text>
          </TouchableOpacity>
        </View>

        {/* Download Preferences */}
        <Text className="text-white text-lg font-bold mb-4">Download Preferences</Text>

        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center space-x-3 flex-1">
              <Wifi className="w-5 h-5 text-slate-400" />
              <View>
                <Text className="text-white font-bold text-sm">Download Over Wi-Fi Only</Text>
                <Text className="text-slate-400 text-xs">Prevent cellular data usage</Text>
              </View>
            </View>
            <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ true: "#6366F1" }} />
          </View>

          <View className="border-t border-slate-800 pt-4 flex-row items-center justify-between">
            <View className="flex-row items-center space-x-3 flex-1">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <View>
                <Text className="text-white font-bold text-sm">High-Definition Audio (192kbps)</Text>
                <Text className="text-slate-400 text-xs">Higher audio clarity and file size</Text>
              </View>
            </View>
            <Switch value={hdAudio} onValueChange={setHdAudio} trackColor={{ true: "#6366F1" }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
