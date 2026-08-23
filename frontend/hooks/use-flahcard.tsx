import { useState, useEffect, useRef, useCallback, MutableRefObject } from "react";
import { Animated } from "react-native";
import {
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  useDerivedValue,
  Easing,
} from "react-native-reanimated";
import { FlatTerm } from "@/types/lexicon-srs";

interface UseFlashcardsProps {
  terms: FlatTerm[];
  onAddedToFavorite?: (term: FlatTerm, mode?: "add" | "remove") => Promise<boolean>;
  onMarkForReview?: (term: FlatTerm, mode?: "add" | "remove") => Promise<boolean>;
  onMarkAsLearned?: (term: FlatTerm, mode?: "add" | "remove") => Promise<boolean>;
  playAudio?: (uri?: string) => Promise<void>;
  mutedSet?: Set<string>;
}

export const SPRING_CONFIG = { damping: 15, mass: 1, stiffness: 100 };
export const TIMING_CONFIG = { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

export const useFlashcards = ({
  terms = [],
  onAddedToFavorite,
  onMarkForReview,
  onMarkAsLearned,
  playAudio,
  mutedSet,
}: UseFlashcardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const isFlippedRef = useRef(false);

  const [showExamples, setShowExamples] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [localTerms, setLocalTerms] = useState<FlatTerm[]>([]);

  // Reanimated values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardTranslateX = useSharedValue(0);
  const progressValue = useSharedValue(0);

  // RN Animated (drawer)
  const [drawerAnimation] = useState(() => new Animated.Value(0));

  const termsKey = terms?.map((t) => (t as any).id || (t as any)._id || t.term).join(",") || "";
  const initialLoadedRef = useRef(false);

  useEffect(() => {
    setLocalTerms(terms?.length ? [...terms] : []);
    setIsLoading(false);
    if (!initialLoadedRef.current) {
      initialLoadedRef.current = true;
      setCurrentIndex(0);
      setIsFlipped(false);
      isFlippedRef.current = false;
      rotation.value = 0;
    }
  }, [termsKey]);

  const currentCard = localTerms[currentIndex];

  useEffect(() => {
    if (localTerms.length > 0) {
      progressValue.value = withTiming((currentIndex + 1) / localTerms.length, TIMING_CONFIG);
    } else {
      progressValue.value = withTiming(0, TIMING_CONFIG);
    }
  }, [currentIndex, localTerms.length, progressValue]);

  const animatedRotation = useDerivedValue(() => {
    return interpolate(rotation.value, [0, 1], [0, 180]);
  }, [rotation]);

  const scaleDown = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  const flipCard = useCallback(() => {
    const newFlipped = !isFlippedRef.current;
    isFlippedRef.current = newFlipped;
    setIsFlipped(newFlipped);

    scale.value = withTiming(1.03, { duration: 150 });

    rotation.value = withTiming(newFlipped ? 1 : 0, { duration: 350, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(scaleDown)();
    });
  }, [rotation, scale, scaleDown]);

  const toggleExamples = useCallback(() => {
    Animated.timing(drawerAnimation, {
      toValue: showExamples ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setShowExamples((v) => !v);
  }, [drawerAnimation, showExamples]);

  const closeExamples = useCallback(() => {
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowExamples(false));
  }, [drawerAnimation]);

  const navigateCard = useCallback(
    (direction: number) => {
      setError(null);

      let newIndex = currentIndex + direction;
      while (newIndex >= 0 && newIndex < localTerms.length) {
        const card = localTerms[newIndex];
        const cardId = String(card?.id || (card as any)?._id || card?.term);
        if (!mutedSet?.has(cardId)) {
          break;
        }
        newIndex += direction;
      }

      if (newIndex < 0 || newIndex >= localTerms.length) return;

      // Reset flip state synchronously on the JS thread.
      // Do NOT animate cardTranslateX here — the caller (handleNext)
      // already drives the slide-out / slide-in animation on that value.
      isFlippedRef.current = false;
      setIsFlipped(false);
      rotation.value = 0;
      setCurrentIndex(newIndex);
    },
    [currentIndex, localTerms, rotation, mutedSet]
  );

  const toggleFavorite = useCallback(async () => {
    if (!currentCard || !onAddedToFavorite) return;

    const newFavoriteStatus = !currentCard.favorite;
    const updated = [...localTerms];
    updated[currentIndex] = { ...currentCard, favorite: newFavoriteStatus };
    setLocalTerms(updated);

    try {
      await onAddedToFavorite(currentCard, newFavoriteStatus ? "add" : "remove");
    } catch {
      const reverted = [...updated];
      reverted[currentIndex] = { ...currentCard, favorite: !newFavoriteStatus };
      setLocalTerms(reverted);
    }
  }, [currentCard, currentIndex, localTerms, onAddedToFavorite]);

  const toggleMarkForReview = useCallback(async () => {
    if (!currentCard || !onMarkForReview) return;

    const newStatus = !currentCard.markedForReview;
    const updated = [...localTerms];
    updated[currentIndex] = { ...currentCard, markedForReview: newStatus };
    setLocalTerms(updated);

    try {
      await onMarkForReview(currentCard, newStatus ? "add" : "remove");
    } catch {
      const reverted = [...updated];
      reverted[currentIndex] = { ...currentCard, markedForReview: !newStatus };
      setLocalTerms(reverted);
    }
  }, [currentCard, currentIndex, localTerms, onMarkForReview]);

  const toggleLearned = useCallback(async () => {
    if (!currentCard || !onMarkAsLearned) return;

    const newStatus = !currentCard.isLearned;
    const updated = [...localTerms];
    updated[currentIndex] = { ...currentCard, isLearned: newStatus };
    setLocalTerms(updated);

    try {
      await onMarkAsLearned(currentCard, newStatus ? "add" : "remove");
    } catch {
      const reverted = [...updated];
      reverted[currentIndex] = { ...currentCard, isLearned: !newStatus };
      setLocalTerms(reverted);
    }
  }, [currentCard, currentIndex, localTerms, onMarkAsLearned]);

  const handleExit = useCallback(() => setShowExitModal(true), []);
  const confirmExit = useCallback(() => setShowExitModal(false), []);
  const cancelExit = useCallback(() => setShowExitModal(false), []);

  return {
    currentIndex,
    isFlipped,
    showExamples,
    error,
    isLoading,
    showExitModal,
    localTerms,
    currentCard,

    rotation,
    scale,
    cardOpacity,
    cardTranslateX,
    progressValue,
    drawerAnimation,
    animatedRotation,

    flipCard,
    toggleExamples,
    closeExamples,
    navigateCard,
    toggleFavorite,
    toggleMarkForReview,
    toggleLearned,
    handleExit,
    confirmExit,
    cancelExit,
  };
};
