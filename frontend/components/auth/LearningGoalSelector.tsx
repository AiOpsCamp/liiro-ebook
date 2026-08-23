import { AppText as Text } from '@/components/ui/AppText';
import type React from "react";
import { View, Pressable, Animated } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRef } from "react";
import { colors } from "@/lib/utils";

type LearningGoalSelectorProps = {
  selectedGoal: string;
  setSelectedGoal: (goal: string) => void;
};

const LearningGoalSelector: React.FC<LearningGoalSelectorProps> = ({
  selectedGoal,
  setSelectedGoal}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const goals = [
    {
      goal: "5 minutes/day",
      icon: "clock",
      description: "Quick daily practice",
      color: colors.yellow},
    {
      goal: "15 minutes/day",
      icon: "clock",
      description: "Regular commitment",
      color: colors.yellow},
    {
      goal: "30 minutes/day",
      icon: "clock",
      description: "Dedicated learning",
      color: colors.lightGreen},
    {
      goal: "1 hour/day",
      icon: "clock",
      description: "Intensive study",
      color: colors.lightGreen},
    {
      goal: "2 lessons/week",
      icon: "book",
      description: "Flexible schedule",
      color: colors.mediumGreen},
    {
      goal: "5 lessons/week",
      icon: "book",
      description: "Consistent progress",
      color: colors.mediumGreen},
    {
      goal: "10 lessons/week",
      icon: "book",
      description: "Fast-track learning",
      color: colors.darkGreen},
    {
      goal: "Custom",
      icon: "pencil-alt",
      description: "Set your own pace",
      color: colors.darkGreen},
  ];

  const handleSelect = (goal: string) => {
    setSelectedGoal(goal);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true}),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true}),
    ]).start();
  };

  const renderItem = ({ item, idx }: { idx: number; item: (typeof goals)[0] }) => {
    const isSelected = selectedGoal === item.goal;

    return (
      <Animated.View
        key={idx}
        style={{
          transform: [{ scale: isSelected ? scaleAnim : 1 }]}}
      >
        <Pressable
          onPress={() => handleSelect(item.goal)}
          className={`flex-row items-start p-4 rounded-xl mb-4 ${
            isSelected ? "border-2" : "bg-white border border-gray-200"
          }`}
          style={{
            backgroundColor: isSelected ? `${colors.lightGreen}30` : colors.white,
            borderColor: isSelected ? colors.darkGreen : colors.gray[200]}}
        >
          <View className="p-3 rounded-full mr-4" style={{ backgroundColor: `${item.color}30` }}>
            <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
          </View>
          <View className="flex-1">
            <Text
              className={`font-medium text-lg`}
              style={{ color: isSelected ? colors.darkGreen : colors.gray[900] }}
            >
              {item.goal}
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
  };

   
  return <View className="flex-1">{goals.map((item, idx) => renderItem({ item, idx }))}</View>;
};

export default LearningGoalSelector;
