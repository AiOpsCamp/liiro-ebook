import { Platform } from "react-native";
import { useFlashcardAudio as useFlashcardAudioNative } from "./useFlashcardAudio.native";
import { useFlashcardAudio as useFlashcardAudioWeb } from "./useFlashcardAudio.web";

export type { FlashcardAudioAPI } from "./useFlashcardAudio.web";

export function useFlashcardAudio() {
  if (Platform.OS === "web") {
    return useFlashcardAudioWeb();
  }
  return useFlashcardAudioNative();
}
