import themeColors from "@/constants/theme-colors.json";
import { AppColors } from "@/constants/Colors";
export interface Term {
  id: string;
  term: string;
  definition: string;
  type?: string;
  image?: string;
  audio?: string;
  examples?: Array<{
    sentence: string;
    meaning: string;
    audio: string;
  }>;
}
export interface SlideShowProps {
  data: Term[];
}

export interface EndScreenProps {
  visible: boolean;
  onRestart: () => void;
  onExit: () => void;
  totalTerms: number;
  timeSpent: number;
}

export interface ConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export interface ProgressBarProps {
  progress: any;
  color: string;
}

export interface AudioButtonProps {
  onPress: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  disabled: boolean;
}

export interface ExampleCardProps {
  example: {
    sentence: string;
    meaning: string;
  };
  index: number;
}

// Enhanced color theme (keeping original)
export const COLORS = {
  sunbeam: themeColors["sunbeam"],
  lemonLeaf: themeColors["lemon-leaf"],
  meadowGreen: themeColors["meadow-green"],
  forestCore: themeColors["forest-core"],
  white: themeColors["white"],
  success: themeColors["success"],
  warning: themeColors["warning"],
  error: themeColors["error"],
  gray: {
    50: themeColors["gray-50"],
    100: themeColors["gray-100"],
    200: themeColors["gray-200"],
    300: themeColors["gray-300"],
    400: themeColors["gray-400"],
    500: themeColors["gray-500"],
    600: themeColors["gray-600"],
    700: themeColors["gray-700"],
    800: themeColors["gray-800"],
    900: themeColors["gray-900"],
  },
};

// Constants
export const AVERAGE_AUDIO_DURATION = 3500;
export const WAIT_AFTER_AUDIO = 1500;
export const SLIDE_DURATION = AVERAGE_AUDIO_DURATION + WAIT_AFTER_AUDIO;
export const ANIMATION_DURATION = 200;
