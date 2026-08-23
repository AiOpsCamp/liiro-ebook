// components/ui/AppText.tsx
import React from "react";
import type { TextInput as RNTextInputType } from "react-native";
import {
  Text as RNText,
  type TextProps as RNTextProps,
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
  StyleSheet,
} from "react-native";

export type AppFontWeight = "Regular" | "Medium" | "SemiBold" | "Bold" | "Black";

export interface AppTextProps extends RNTextProps {
  weight?: AppFontWeight;
}

/**
 * AppText
 * - Forces consistent Raleway font family
 * - Disables system font scaling (iOS Dynamic Type / Android Font size)
 */
export function AppText({ style, weight = "Regular", children, ...props }: AppTextProps) {
  // Normalize children to avoid passing plain objects to RN Text which crashes on web
  let normalizedChildren: any = children;

  try {
    if (
      children &&
      typeof children === "object" &&
      !Array.isArray(children) &&
      !React.isValidElement(children)
    ) {
      // If it's a localization object like { en: '...' }, prefer English
      if (typeof (children as any).en === "string") {
        normalizedChildren = (children as any).en;
      } else {
        // Fallback: JSON stringify simple objects to avoid crash
        normalizedChildren = JSON.stringify(children);
      }
    }
  } catch (err) {
    normalizedChildren = String(children);
  }

  return (
    <RNText
      {...props}
      allowFontScaling={false}
      maxFontSizeMultiplier={1}
      style={[styles.baseText, { fontFamily: `Raleway-${weight}` }, style]}
    >
      {normalizedChildren as any}
    </RNText>
  );
}

export interface AppTextInputProps extends RNTextInputProps {
  weight?: AppFontWeight;
}

/**
 * AppTextInput
 * - Forces consistent Raleway font family
 * - Disables system font scaling
 */
export const AppTextInput = React.forwardRef<RNTextInputType, AppTextInputProps>(
  ({ style, weight = "Regular", ...props }, ref) => {
    return (
      <RNTextInput
        ref={ref}
        {...props}
        allowFontScaling={false}
        maxFontSizeMultiplier={1}
        style={[styles.baseInput, { fontFamily: `Raleway-${weight}` }, style]}
      />
    );
  }
);

AppTextInput.displayName = "AppTextInput";

const styles = StyleSheet.create({
  baseText: {
    // keep empty or put shared defaults here
  },
  baseInput: {
    // keep empty or put shared defaults here
  },
});