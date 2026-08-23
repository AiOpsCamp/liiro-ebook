/** Canonical expo-router paths for vocabulary learning tools (under app/words/modes/). */
export const VOCABULARY_MODE_ROUTES = {
  flashcard: "/words/modes/flashcard",
  slideshow: "/words/modes/slideshow",
  learn: "/words/modes/learn",
  quickReview: "/words/modes/quick-review",
  test: "/words/modes/test",
  testMode: "/words/modes/test-mode",
  training: "/words/modes/training",
  game: "/words/modes/game",
  audioTest: "/words/modes/audio-test",
  imageDragAndDrop: "/words/modes/image-drag-and-drop",
  packSmartLearn: "/words/pack-smart/learn",
  packSmartTest: "/words/pack-smart/test",
  packSmartAudioTest: "/words/pack-smart/audio-test",
  packSmartTraining: "/words/pack-smart/training",
} as const;

export const VOCABULARY_PACK_START_ROUTE = "/words/start/[slug]" as const;
