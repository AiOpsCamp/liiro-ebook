import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Users, Plus, ShieldCheck, Check, Lock, ChevronRight } from "lucide-react-native";
import { ParentalPinModal } from "../../components/ebook/ParentalPinModal";

interface ProfileItem {
  _id: string;
  name: string;
  avatarUrl: string;
  isKidsMode: boolean;
  ageTier?: string;
  parentalPin?: string;
}

export default function FamilyProfilesScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileItem[]>([
    {
      _id: "main_1",
      name: "Main Reader",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
      isKidsMode: false,
    },
    {
      _id: "kid_1",
      name: "Tommy (Kids)",
      avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=300",
      isKidsMode: true,
      ageTier: "6-9",
      parentalPin: "1234",
    },
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>("main_1");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingTargetProfile, setPendingTargetProfile] = useState<ProfileItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [isKidsModeToggle, setIsKidsModeToggle] = useState(false);

  const handleSelectProfile = (profile: ProfileItem) => {
    // If switching away from Kids Mode or entering a PIN protected profile
    const currentProfile = profiles.find((p) => p._id === activeProfileId);
    if (currentProfile?.isKidsMode && !profile.isKidsMode) {
      setPendingTargetProfile(profile);
      setIsPinModalOpen(true);
      return;
    }

    setActiveProfileId(profile._id);
    router.replace("/");
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    if (pendingTargetProfile) {
      setActiveProfileId(pendingTargetProfile._id);
      setPendingTargetProfile(null);
      router.replace("/");
    }
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;
    const newP: ProfileItem = {
      _id: `prof_${Date.now()}`,
      name: newProfileName.trim(),
      avatarUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=300",
      isKidsMode: isKidsModeToggle,
      ageTier: isKidsModeToggle ? "6-9" : "all",
      parentalPin: isKidsModeToggle ? "1234" : undefined,
    };
    setProfiles([...profiles, newP]);
    setNewProfileName("");
    setIsAddModalOpen(false);
  };

  return (
    <ScrollView className="flex-1 bg-slate-950 px-6 py-12">
      {/* Header */}
      <View className="items-center mb-10">
        <View className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 justify-center items-center mb-4">
          <Users className="w-8 h-8 text-indigo-400" />
        </View>
        <Text className="text-white text-3xl font-extrabold tracking-tight mb-1 text-center">
          Who is reading?
        </Text>
        <Text className="text-slate-400 text-sm text-center">
          Select your family profile or switch to Kids Mode
        </Text>
      </View>

      {/* Profiles Grid */}
      <View className="flex-row flex-wrap justify-center gap-6 mb-10">
        {profiles.map((prof) => {
          const isActive = activeProfileId === prof._id;
          return (
            <TouchableOpacity
              key={prof._id}
              onPress={() => handleSelectProfile(prof)}
              className="items-center w-28"
            >
              <View className={`relative rounded-3xl p-1 mb-2 ${isActive ? "border-2 border-indigo-500" : "border-2 border-transparent"}`}>
                <Image
                  source={{ uri: prof.avatarUrl }}
                  className="w-24 h-24 rounded-2xl bg-slate-800"
                />
                {prof.isKidsMode && (
                  <View className="absolute bottom-1 right-1 bg-orange-500 px-2 py-0.5 rounded-full border border-slate-900">
                    <Text className="text-white text-[10px] font-bold">KIDS</Text>
                  </View>
                )}
                {prof.parentalPin && (
                  <View className="absolute top-1 right-1 bg-slate-900/80 p-1 rounded-full border border-slate-700">
                    <Lock className="w-3 h-3 text-slate-300" />
                  </View>
                )}
              </View>

              <Text numberOfLines={1} className="text-white font-bold text-sm text-center mb-0.5">
                {prof.name}
              </Text>
              {prof.isKidsMode && (
                <Text className="text-orange-400 text-xs font-medium">Ages {prof.ageTier}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add Profile Button */}
        {profiles.length < 5 && (
          <TouchableOpacity
            onPress={() => setIsAddModalOpen(true)}
            className="items-center w-28"
          >
            <View className="w-26 h-26 rounded-3xl bg-slate-900 border-2 border-dashed border-slate-800 justify-center items-center mb-2">
              <Plus className="w-8 h-8 text-slate-500" />
            </View>
            <Text className="text-slate-400 font-semibold text-xs text-center">Add Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Parental PIN Modal */}
      <ParentalPinModal
        visible={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Add Profile Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70 p-6">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <Text className="text-white text-xl font-bold mb-4">Add Family Profile</Text>
            
            <Text className="text-slate-400 text-xs font-semibold mb-2">PROFILE NAME</Text>
            <TextInput
              value={newProfileName}
              onChangeText={setNewProfileName}
              placeholder="e.g. Emma"
              placeholderTextColor="#64748B"
              className="bg-slate-800 text-white p-4 rounded-xl mb-4 font-semibold border border-slate-700"
            />

            <TouchableOpacity
              onPress={() => setIsKidsModeToggle(!isKidsModeToggle)}
              className="flex-row items-center justify-between bg-slate-800/60 p-4 rounded-xl mb-6 border border-slate-700/50"
            >
              <View>
                <Text className="text-white font-bold text-sm">Kids Mode Profile</Text>
                <Text className="text-slate-400 text-xs">Filter content for ages 0–12 yrs</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border justify-center items-center ${isKidsModeToggle ? "bg-orange-500 border-orange-400" : "border-slate-600"}`}>
                {isKidsModeToggle && <Check className="w-4 h-4 text-white" />}
              </View>
            </TouchableOpacity>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                className="flex-1 bg-slate-800 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-300 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddProfile}
                className="flex-1 bg-indigo-600 py-3.5 rounded-xl items-center"
              >
                <Text className="text-white font-bold">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
