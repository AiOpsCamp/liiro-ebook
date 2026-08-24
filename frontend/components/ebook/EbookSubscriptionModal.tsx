import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Linking } from "react-native";
import { Sparkles, Check, X, ShieldCheck, Zap } from "lucide-react-native";

interface EbookSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EbookSubscriptionModal: React.FC<EbookSubscriptionModalProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro_monthly" | "pro_yearly">("pro_monthly");

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
      const priceId = selectedPlan === "pro_yearly" ? "price_pro_yearly" : "price_pro_monthly";

      const res = await fetch(`${apiBase}/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const json = await res.json();

      if (json.success && json.url) {
        if (typeof window !== "undefined") {
          window.location.href = json.url;
        } else {
          Linking.openURL(json.url);
        }
      }
    } catch (e) {
      console.error("Error creating checkout session:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/80 p-6">
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 justify-center items-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-slate-800">
              <X className="w-5 h-5 text-slate-400" />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-2xl font-extrabold mb-1">Upgrade to Liiro Premium</Text>
          <Text className="text-slate-400 text-xs mb-6">
            Unlock 100 hours of monthly audiobook streaming, offline downloads, & high-definition narrators.
          </Text>

          {/* Plan Selector */}
          <View className="space-y-3 mb-6">
            <TouchableOpacity
              onPress={() => setSelectedPlan("pro_monthly")}
              className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                selectedPlan === "pro_monthly"
                  ? "bg-amber-500/10 border-amber-500"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <View>
                <Text className="text-white font-bold text-base">Monthly Unlimited</Text>
                <Text className="text-slate-400 text-xs">100 Hours Audiobook Streaming</Text>
              </View>
              <Text className="text-amber-400 font-extrabold text-lg">$9.99/mo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPlan("pro_yearly")}
              className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                selectedPlan === "pro_yearly"
                  ? "bg-amber-500/10 border-amber-500"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <View>
                <View className="flex-row items-center space-x-2">
                  <Text className="text-white font-bold text-base">Annual Master</Text>
                  <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <Text className="text-emerald-400 text-[10px] font-bold">SAVE 35%</Text>
                  </View>
                </View>
                <Text className="text-slate-400 text-xs">Unused hours roll over</Text>
              </View>
              <Text className="text-amber-400 font-extrabold text-lg">$79.99/yr</Text>
            </TouchableOpacity>
          </View>

          {/* Features List */}
          <View className="space-y-2 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            {[
              "100 Hours Monthly Audiobook Allowance",
              "100% Offline Audio & Text Caching",
              "All 4 Neural Voice Narrators (Adam, Michael, Bella, Heart)",
              "Family Sub-Accounts (Up to 5 Profiles)",
            ].map((feat, idx) => (
              <View key={idx} className="flex-row items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <Text className="text-slate-300 text-xs font-semibold">{feat}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={loading}
            className="bg-gradient-to-r from-amber-500 to-amber-600 py-4 rounded-2xl items-center shadow-lg shadow-amber-500/20"
            style={{ backgroundColor: "#F59E0B" }}
          >
            {loading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text className="text-slate-950 font-extrabold text-base">
                Start 7-Day Free Trial
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
