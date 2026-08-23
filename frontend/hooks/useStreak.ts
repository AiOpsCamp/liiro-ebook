import { StreakManager } from "@/lib/streakManager";
import { useState, useEffect, useCallback } from "react";

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastPlayDate: string;
  totalCorrect: number;
  totalQuestions: number;
}

interface UseStreakReturn {
  streakData: StreakData;
  updateStreak: (isCorrect: boolean) => Promise<void>;
  resetStreak: () => Promise<void>;
  refreshStreak: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  lastPlayDate: new Date().toISOString(),
  totalCorrect: 0,
  totalQuestions: 0,
};

export const useStreak = (): UseStreakReturn => {
  // Initialize with default data immediately to prevent undefined errors
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStreak = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await StreakManager.getStreakData();
      setStreakData(data);
    } catch (err) {
      console.error("Error refreshing streak:", err);
      setError("Failed to load streak data");
      // Keep default data on error
      setStreakData(DEFAULT_STREAK_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStreak = useCallback(async (isCorrect: boolean) => {
    try {
      setError(null);
      const updatedData = await StreakManager.updateStreak(isCorrect);
      setStreakData(updatedData);
    } catch (err) {
      console.error("Error updating streak:", err);
      setError("Failed to update streak");
      // Update local state even if save fails
      setStreakData((prev) => ({
        ...prev,
        currentStreak: isCorrect ? prev.currentStreak + 1 : 0,
        bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.currentStreak + 1) : prev.bestStreak,
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        totalQuestions: prev.totalQuestions + 1,
      }));
    }
  }, []);

  const resetStreak = useCallback(async () => {
    try {
      setError(null);
      await StreakManager.resetStreak();
      setStreakData(DEFAULT_STREAK_DATA);
    } catch (err) {
      console.error("Error resetting streak:", err);
      setError("Failed to reset streak");
    }
  }, []);

  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  return {
    streakData,
    updateStreak,
    resetStreak,
    refreshStreak,
    isLoading,
    error,
  };
};
