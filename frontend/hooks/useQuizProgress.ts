import { useState, useEffect, useCallback } from "react";
import { QuizProgressManager } from "@/lib/utils/quizProgressManager";

interface QuizSession {
  packSlug: string;
  score: number;
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  startTime: string;
  lastUpdated: string;
  completedQuestionIds: string[];
  averageResponseTime: number;
}

interface QuizStats {
  totalSessions: number;
  totalScore: number;
  totalQuestions: number;
  totalCorrect: number;
  bestScore: number;
  averageAccuracy: number;
  lastPlayDate: string;
  streakDays: number;
}

export const useQuizProgress = (packSlug: string) => {
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [lifetimeStats, setLifetimeStats] = useState<QuizStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check for existing session
      let session = await QuizProgressManager.getCurrentSession();

      if (!session || session.packSlug !== packSlug) {
        // Start new session
        session = await QuizProgressManager.startNewSession(packSlug);
      }

      setCurrentSession(session);

      // Load lifetime stats
      const stats = await QuizProgressManager.getLifetimeStats();
      setLifetimeStats(stats);
    } catch (error) {
      console.error("Error initializing quiz session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [packSlug]);

  const updateProgress = useCallback(
    async (isCorrect: boolean, questionId: string, responseTime?: number) => {
      if (!currentSession) return;

      const updates: Partial<QuizSession> = {
        questionsAnswered: currentSession.questionsAnswered + 1,
        totalQuestions: currentSession.totalQuestions + 1,
        correctAnswers: currentSession.correctAnswers + (isCorrect ? 1 : 0),
        score: currentSession.score + (isCorrect ? 1 : 0),
        completedQuestionIds: [...currentSession.completedQuestionIds, questionId],
      };

      if (responseTime) {
        const totalResponseTime =
          currentSession.averageResponseTime * currentSession.questionsAnswered + responseTime;
        updates.averageResponseTime = totalResponseTime / (currentSession.questionsAnswered + 1);
      }

      // Update immediately without waiting
      setTimeout(() => {
        const updatedSession = {
          ...currentSession,
          ...updates,
          lastUpdated: new Date().toISOString(),
        };

        setCurrentSession(updatedSession);
      }, 1000);
      // Save to storage asynchronously without blocking UI
      QuizProgressManager.updateSession(updates).catch(console.error);
    },
    [currentSession]
  );

  const completeSession = useCallback(async () => {
    const finalStats = await QuizProgressManager.completeSession();
    setLifetimeStats(finalStats);
    setCurrentSession(null);
    return finalStats;
  }, []);

  const resetProgress = useCallback(async () => {
    await QuizProgressManager.resetStats();
    setCurrentSession(null);
    setLifetimeStats(null);
    await initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    currentSession,
    lifetimeStats,
    isLoading,
    updateProgress,
    completeSession,
    resetProgress,
  };
};
