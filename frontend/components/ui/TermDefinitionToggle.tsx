import React from "react";
import { View, Pressable } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { AppColors } from "@/constants/Colors";

interface TermDefinitionToggleProps {
  showDef: boolean;
  onToggle: () => void;
  dark: boolean;
  userLanguage?: string;
  defaultLanguage?: string;
}

/**
 * Reusable Term/Definition toggle component
 * Displays language labels (e.g., "En" / "Fi") if provided
 * Falls back to "Term" / "Definition" if language labels not available
 */
export const TermDefinitionToggle: React.FC<TermDefinitionToggleProps> = ({
  showDef,
  onToggle,
  dark,
  userLanguage,
  defaultLanguage,
}) => {
  // Use language abbreviations if available, otherwise fall back to Term/Definition
  const termLabel = userLanguage ? getLanguageAbbreviation(userLanguage) : "Term";
  const defLabel = defaultLanguage ? getLanguageAbbreviation(defaultLanguage) : "Definition";

  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
      {/* Term/User Language Button */}
      <Pressable
        onPress={onToggle}
        disabled={!showDef}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: !showDef ? AppColors.purple500 : "transparent",
          borderWidth: 1,
          borderColor: !showDef
            ? AppColors.purple500
            : dark
              ? "rgba(255,255,255,0.2)"
              : AppColors.slate200,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: !showDef ? "white" : dark ? AppColors.slate400 : AppColors.slate600,
          }}
        >
          {termLabel}
        </Text>
      </Pressable>

      {/* Definition/Default Language Button */}
      <Pressable
        onPress={onToggle}
        disabled={showDef}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: showDef ? AppColors.purple500 : "transparent",
          borderWidth: 1,
          borderColor: showDef
            ? AppColors.purple500
            : dark
              ? "rgba(255,255,255,0.2)"
              : AppColors.slate200,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: showDef ? "white" : dark ? AppColors.slate400 : AppColors.slate600,
          }}
        >
          {defLabel}
        </Text>
      </Pressable>
    </View>
  );
};

/**
 * Convert language names to abbreviations
 * Examples: "English" -> "En", "Finnish" -> "Fi", "Spanish" -> "Es"
 */
function getLanguageAbbreviation(language: string): string {
  const abbreviations: Record<string, string> = {
    English: "En",
    Finnish: "Fi",
    Spanish: "Es",
    French: "Fr",
    German: "De",
    Italian: "It",
    Portuguese: "Pt",
    Dutch: "Nl",
    Swedish: "Sv",
    Norwegian: "No",
    Danish: "Da",
    Polish: "Pl",
    Russian: "Ru",
    Japanese: "Ja",
    Chinese: "Zh",
    Korean: "Ko",
    Bengali: "Bn",
  };

  return abbreviations[language] || language.substring(0, 2).toUpperCase();
}
