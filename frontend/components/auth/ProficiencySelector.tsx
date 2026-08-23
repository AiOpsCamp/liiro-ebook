import { AppText as Text } from '@/components/ui/AppText';
import type React from "react";
import { View, Pressable, Animated, useWindowDimensions } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { colors } from "@/lib/utils";

type ProficiencySelectorProps = {
  selectedProficiency: string;
  setSelectedProficiency: (proficiency: string) => void;
};

const ProficiencySelector: React.FC<ProficiencySelectorProps> = ({
  selectedProficiency,
  setSelectedProficiency}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const maxWidth = isMobile ? undefined : width >= 1024 ? 720 : 640;

  // ✅ no refs: lint-safe
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const proficiencies = [
    {
      level: "No Experience",
      icon: "flag",
      description: "Starting from scratch",
      color: colors.yellow},
    { level: "Beginner", icon: "book", description: "Know a few basics", color: colors.lightGreen },
    {
      level: "Intermediate",
      icon: "trophy",
      description: "Can handle conversations",
      color: colors.mediumGreen},
    {
      level: "Advanced",
      icon: "star",
      description: "Fluent in most situations",
      color: colors.darkGreen},
    {
      level: "Proficient",
      icon: "graduation-cap",
      description: "Near-native abilities",
      color: colors.darkGreen},
  ] as const;

  const handleSelect = (level: string) => {
    setSelectedProficiency(level);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={{ flex: 1, alignItems: isMobile ? "stretch" : "center" }}>
      <View style={{ width: "100%", maxWidth }}>
        {proficiencies.map((item, idx) => {
          const isSelected = selectedProficiency === item.level;

          return (
            <Animated.View
              key={item.level}
              style={{ transform: [{ scale: isSelected ? scaleAnim : 1 }] }}
            >
              <Pressable
                onPress={() => handleSelect(item.level)}
                className={`flex-row items-start p-4 rounded-xl mb-4 ${
                  isSelected ? "border-2" : "bg-white border border-gray-200"
                }`}
                style={{
                  backgroundColor: isSelected ? `${colors.lightGreen}30` : colors.white,
                  borderColor: isSelected ? colors.darkGreen : colors.gray[200]}}
              >
                <View
                  className="p-3 rounded-full mr-4"
                  style={{ backgroundColor: `${item.color}30` }}
                >
                  <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
                </View>

                <View className="flex-1">
                  <Text
                    className="font-medium text-lg"
                    style={{ color: isSelected ? colors.darkGreen : colors.gray[900] }}
                  >
                    {item.level}
                  </Text>
                  <Text className="text-sm text-gray-500">{item.description}</Text>
                </View>

                {isSelected && (
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.darkGreen }}
                  >
                    <FontAwesome5 name="check" size={14} color="white" />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

export default ProficiencySelector;
