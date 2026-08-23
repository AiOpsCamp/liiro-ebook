import { AppText as Text } from '@/components/ui/AppText';
import type React from "react";
import { View, Pressable, Image, Animated } from "react-native";
import { languagesAndCountry } from "@/lib/utils";
import { useRef } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { colors } from "@/lib/utils";

type LanguageItem = {
  id: string;
  language: string;
  title: string;
};

type LanguageSelectorProps = {
  data: LanguageItem[];
  selectedLang: LanguageItem | null;
  setSelectedLang: (lang: LanguageItem) => void;
};

const getFlagUrl = (languageName: string) => {
  const language = languagesAndCountry.find((lang) => lang.language === languageName);
  return language?.flag || "https://placehold.co/200x200.png";
};

type LanguageItemComponentProps = {
  item: LanguageItem;
  index: number;
  isSelected: boolean;
  onSelect: (item: LanguageItem) => void;
};

const LanguageItemComponent: React.FC<LanguageItemComponentProps> = ({
  item,
  index,
  isSelected,
  onSelect}) => {
   
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    onSelect(item);

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

  return (
    <Animated.View
      key={index}
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: 1}}
    >
      <Pressable
        onPress={handlePress}
        className={`flex-row items-center p-4 rounded-xl mb-4 ${
          isSelected ? "border-2" : "bg-white border border-gray-200"
        }`}
        style={{
          backgroundColor: isSelected ? `${colors.lightGreen}30` : colors.white,
          borderColor: isSelected ? colors.darkGreen : colors.gray[200]}}
      >
        <Image
          source={{ uri: getFlagUrl(item.title) }}
          className="mr-3"
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? colors.darkGreen : "transparent"}}
        />
        <View className="flex-1">
          <Text
            className={`font-medium text-lg`}
            style={{ color: isSelected ? colors.darkGreen : colors.gray[900] }}
          >
            {item.title}
          </Text>
          <Text className="text-sm text-gray-500">{item.language}</Text>
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

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  data,
  selectedLang,
  setSelectedLang}) => {
  return (
    <View className="flex-1">
      {data.map((item, index) => (
        <LanguageItemComponent
          key={item.id}
          item={item}
          index={index}
          isSelected={selectedLang?.id === item.id}
          onSelect={setSelectedLang}
        />
      ))}
    </View>
  );
};

export default LanguageSelector;
