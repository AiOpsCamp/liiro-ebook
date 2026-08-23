import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let SecureStore: any = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

async function _getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}
async function _setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}
async function _deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

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

const QUIZ_SESSION_KEY = "quiz_current_session";
const QUIZ_STATS_KEY = "quiz_lifetime_stats";

export class QuizProgressManager {
  static async startNewSession(packSlug: string): Promise<QuizSession> {
    const session: QuizSession = {
      packSlug,
      score: 0,
      totalQuestions: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      completedQuestionIds: [],
      averageResponseTime: 0,
    };

    try {
      await _setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error("Error starting quiz session:", error);
      return session;
    }
  }

  static async getCurrentSession(): Promise<QuizSession | null> {
    try {
      const sessionData = await _getItem(QUIZ_SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error("Error getting current session:", error);
    }
    return null;
  }

  static async updateSession(updates: Partial<QuizSession>): Promise<QuizSession | null> {
    try {
      const currentSession = await this.getCurrentSession();
      if (!currentSession) return null;

      const updatedSession: QuizSession = {
        ...currentSession,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      await _setItem(QUIZ_SESSION_KEY, JSON.stringify(updatedSession));
      return updatedSession;
    } catch (error) {
      console.error("Error updating session:", error);
      return null;
    }
  }

  static async completeSession(): Promise<QuizStats> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return this.getDefaultStats();
      }

      // Update lifetime stats
      const currentStats = await this.getLifetimeStats();
      const accuracy =
        session.totalQuestions > 0 ? (session.correctAnswers / session.totalQuestions) * 100 : 0;

      const updatedStats: QuizStats = {
        totalSessions: currentStats.totalSessions + 1,
        totalScore: currentStats.totalScore + session.score,
        totalQuestions: currentStats.totalQuestions + session.totalQuestions,
        totalCorrect: currentStats.totalCorrect + session.correctAnswers,
        bestScore: Math.max(currentStats.bestScore, session.score),
        averageAccuracy:
          currentStats.totalQuestions + session.totalQuestions > 0
            ? ((currentStats.totalCorrect + session.correctAnswers) /
                (currentStats.totalQuestions + session.totalQuestions)) *
              100
            : 0,
        lastPlayDate: new Date().toISOString(),
        streakDays: this.calculateStreak(currentStats.lastPlayDate),
      };

      await _setItem(QUIZ_STATS_KEY, JSON.stringify(updatedStats));
      await _deleteItem(QUIZ_SESSION_KEY); // Clear current session

      return updatedStats;
    } catch (error) {
      console.error("Error completing session:", error);
      return this.getDefaultStats();
    }
  }

  static async getLifetimeStats(): Promise<QuizStats> {
    try {
      const statsData = await _getItem(QUIZ_STATS_KEY);
      if (statsData) {
        return JSON.parse(statsData);
      }
    } catch (error) {
      console.error("Error getting lifetime stats:", error);
    }
    return this.getDefaultStats();
  }

  static async resetStats(): Promise<void> {
    try {
      await _deleteItem(QUIZ_STATS_KEY);
      await _deleteItem(QUIZ_SESSION_KEY);
    } catch (error) {
      console.error("Error resetting stats:", error);
    }
  }

  private static getDefaultStats(): QuizStats {
    return {
      totalSessions: 0,
      totalScore: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      bestScore: 0,
      averageAccuracy: 0,
      lastPlayDate: new Date().toISOString(),
      streakDays: 0,
    };
  }

  private static calculateStreak(lastPlayDate: string): number {
    if (!lastPlayDate) return 1;

    const today = new Date();
    const lastPlay = new Date(lastPlayDate);
    const diffTime = Math.abs(today.getTime() - lastPlay.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If played yesterday or today, continue streak, otherwise reset
    return diffDays <= 1 ? 1 : 0;
  }
}
