import { Dimensions } from "react-native";

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// Re-export colors from the centralized module
export { colors, AppColors } from "./Colors";

/* -------------------------------------------------------------------------- */
/*                               STATIC DATA                                  */
/* -------------------------------------------------------------------------- */
import { BookOpen, Play, Lightbulb, RefreshCw, FileText, Gamepad2 } from "lucide-react-native";
import { AppColors } from "./Colors";
import { VOCABULARY_MODE_ROUTES } from "./vocabulary-routes";

export const learningTools = [
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Quick review",
    Icon: BookOpen,
    path: VOCABULARY_MODE_ROUTES.flashcard,
    bgColor: AppColors.sunbeamDark + "30",
    iconColor: AppColors.forestCoreDark,
  },
  {
    id: "slideshow",
    title: "SlideShow",
    description: "Visual learning",
    Icon: Play,
    path: VOCABULARY_MODE_ROUTES.slideshow,
    bgColor: AppColors.lemonLeafDark + "30",
    iconColor: AppColors.forestCoreDark,
  },
  {
    id: "learn",
    title: "Learn",
    description: "Structured path",
    Icon: Lightbulb,
    path: VOCABULARY_MODE_ROUTES.learn,
    bgColor: AppColors.meadowGreenDark + "30",
    iconColor: AppColors.forestCoreDark,
  },
  {
    id: "quick-review",
    title: "Review",
    description: "Fast practice",
    Icon: RefreshCw,
    path: VOCABULARY_MODE_ROUTES.quickReview,
    bgColor: AppColors.forestCoreDark + "30",
    iconColor: AppColors.forestCoreDark,
  },
  {
    id: "test",
    title: "Test",
    description: "Assessment",
    Icon: FileText,
    path: VOCABULARY_MODE_ROUTES.test,
    bgColor: AppColors.blueDark + "30",
    iconColor: AppColors.blueDark,
  },
  {
    id: "games",
    title: "Games",
    description: "Fun activities",
    Icon: Gamepad2,
    path: VOCABULARY_MODE_ROUTES.game,
    bgColor: AppColors.purpleDark + "30",
    iconColor: AppColors.purpleDark,
  },
];
