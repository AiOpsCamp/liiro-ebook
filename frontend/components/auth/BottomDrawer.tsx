import { AppText as Text } from '@/components/ui/AppText';
import type React from "react";
import { View, Pressable, Animated, Dimensions, type LayoutChangeEvent } from "react-native";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRef, useEffect, useState } from "react";
import { colors } from "@/lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LanguageItem = {
  id: string;
  language: string;
  title: string;
};

type BottomDrawerProps = {
  step: number;
  totalSteps: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  selectedLanguage: LanguageItem | null;
  selectedUserLanguage: LanguageItem | null;
  selectedProficiency: string;
  selectedGoal: string;
  handlePrevious: () => void;
  handleNext: () => void;
  isLastStep: boolean;
  handleSubmit: () => void;
  updatingLoading: boolean;
  onHeightChange: (height: number) => void;
};

const { width } = Dimensions.get("window");
const isTablet = width > 768;

const BottomDrawer: React.FC<BottomDrawerProps> = ({
  step,
  totalSteps,
  isDrawerOpen,
  setIsDrawerOpen,
  selectedLanguage,
  selectedUserLanguage,
  selectedProficiency,
  selectedGoal,
  handlePrevious,
  handleNext,
  isLastStep,
  handleSubmit,
  updatingLoading,
  onHeightChange}) => {
  const insets = useSafeAreaInsets();
  const heightAnim = useRef(new Animated.Value(isDrawerOpen ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);
  const [tagsHeight, setTagsHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [buttonsHeight, setButtonsHeight] = useState(0);

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isDrawerOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false}).start();
     
  }, [isDrawerOpen]);

  useEffect(() => {
    const totalHeight =
      headerHeight + (isDrawerOpen ? tagsHeight + buttonsHeight + 16 : 0) + insets.bottom;
    onHeightChange(totalHeight);
     
  }, [isDrawerOpen, tagsHeight, headerHeight, buttonsHeight, insets.bottom]);

  const drawerHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [headerHeight + insets.bottom, contentHeight + insets.bottom]});

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };

  const handleTagsLayout = (event: LayoutChangeEvent) => {
    setTagsHeight(event.nativeEvent.layout.height);
  };

  const handleButtonsLayout = (event: LayoutChangeEvent) => {
    setButtonsHeight(event.nativeEvent.layout.height);
  };

  const handleContentLayout = (event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height);
  };

  return (
    <Animated.View
      style={{
        height: drawerHeight,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        paddingBottom: insets.bottom}}
    >
      <View className="px-4 pt-4" onLayout={handleContentLayout}>
        <View className="flex-row justify-between items-center mb-4" onLayout={handleHeaderLayout}>
          <View className="flex-row items-center">
            <Text className="text-sm font-medium mr-2" style={{ color: colors.darkGreen }}>
              Step {step + 1} of {totalSteps}
            </Text>
            <View className="h-1 bg-gray-200 rounded-full overflow-hidden w-20">
              <View
                className="h-1 rounded-full"
                style={{
                  width: `${((step + 1) / totalSteps) * 100}%`,
                  backgroundColor: colors.darkGreen}}
              />
            </View>
          </View>
          <Pressable
            onPress={() => setIsDrawerOpen(!isDrawerOpen)}
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: `${colors.lightGreen}50` }}
          >
            <FontAwesome
              name={isDrawerOpen ? "chevron-down" : "chevron-up"}
              size={16}
              color={colors.darkGreen}
            />
          </Pressable>
        </View>

        {isDrawerOpen && (
          <>
            <View className="flex-row flex-wrap mb-4" onLayout={handleTagsLayout}>
              {selectedLanguage && (
                <View
                  className="rounded-lg px-3 py-2 mr-2 mb-2 flex-row items-center"
                  style={{ backgroundColor: `${colors.yellow}30` }}
                >
                  <FontAwesome5
                    name="language"
                    size={12}
                    color={colors.darkGreen}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-sm font-medium" style={{ color: colors.darkGreen }}>
                    {selectedLanguage.title}
                  </Text>
                </View>
              )}
              {selectedUserLanguage && (
                <View
                  className="rounded-lg px-3 py-2 mr-2 mb-2 flex-row items-center"
                  style={{ backgroundColor: `${colors.lightGreen}30` }}
                >
                  <FontAwesome5
                    name="globe-americas"
                    size={12}
                    color={colors.darkGreen}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-sm font-medium" style={{ color: colors.darkGreen }}>
                    {selectedUserLanguage.title}
                  </Text>
                </View>
              )}
              {selectedProficiency && (
                <View
                  className="rounded-lg px-3 py-2 mr-2 mb-2 flex-row items-center"
                  style={{ backgroundColor: `${colors.mediumGreen}30` }}
                >
                  <FontAwesome5
                    name="chart-line"
                    size={12}
                    color={colors.darkGreen}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-sm font-medium" style={{ color: colors.darkGreen }}>
                    {selectedProficiency}
                  </Text>
                </View>
              )}
              {selectedGoal && (
                <View
                  className="rounded-lg px-3 py-2 mr-2 mb-2 flex-row items-center"
                  style={{ backgroundColor: `${colors.darkGreen}20` }}
                >
                  <FontAwesome5
                    name="tasks"
                    size={12}
                    color={colors.darkGreen}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-sm font-medium" style={{ color: colors.darkGreen }}>
                    {selectedGoal}
                  </Text>
                </View>
              )}
            </View>

            <View
              className={`flex-row justify-between mb-2 ${isTablet ? "" : "flex-wrap"}`}
              onLayout={handleButtonsLayout}
            >
              <Pressable
                onPress={handlePrevious}
                disabled={step === 0}
                className={`px-5 py-3 rounded-xl flex-row items-center justify-center  ${
                  step === 0 ? "bg-gray-200" : "border-2"
                }`}
                style={{
                  width: isTablet ? width * 0.44 : "48%",
                  borderColor: step === 0 ? "transparent" : colors.mediumGreen}}
              >
                <FontAwesome
                  name="arrow-left"
                  size={16}
                  color={step === 0 ? colors.gray[400] : colors.darkGreen}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`font-medium ${step === 0 ? "text-gray-400" : ""}`}
                  style={{ color: step === 0 ? colors.gray[400] : colors.darkGreen }}
                >
                  Previous
                </Text>
              </Pressable>

              {isLastStep ? (
                <Pressable
                  onPress={handleSubmit}
                  disabled={updatingLoading}
                  className={`px-5 py-3 rounded-xl flex-row items-center justify-center`}
                  style={{
                    width: isTablet ? width * 0.44 : "48%",
                    backgroundColor: updatingLoading ? colors.gray[300] : colors.darkGreen}}
                >
                  {updatingLoading ? (
                    <Text className="text-white font-medium">Creating...</Text>
                  ) : (
                    <>
                      <Text className="text-white font-medium mr-2">Create Account</Text>
                      <FontAwesome name="check" size={16} color="white" />
                    </>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleNext}
                  className="px-5  rounded-xl flex-row items-center justify-center"
                  style={{
                    width: isTablet ? width * 0.44 : "48%",
                    backgroundColor: colors.darkGreen}}
                >
                  <Text className="text-white font-medium mr-2">Next</Text>
                  <FontAwesome name="arrow-right" size={16} color="white" />
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

export default BottomDrawer;
