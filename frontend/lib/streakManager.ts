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

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastPlayDate: string;
  totalCorrect: number;
  totalQuestions: number;
}

const STREAK_KEY = "vocabulary_streak_data";

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  lastPlayDate: new Date().toISOString(),
  totalCorrect: 0,
  totalQuestions: 0,
};

export class StreakManager {
  static async getStreakData(): Promise<StreakData> {
    try {
      const data = await _getItem(STREAK_KEY);
      if (data) {
        const parsed = JSON.parse(data);

        // Validate the parsed data structure
        if (!parsed || typeof parsed !== "object") {
          return DEFAULT_STREAK_DATA;
        }

        // Ensure all required properties exist
        const validatedData: StreakData = {
          currentStreak: parsed.currentStreak || 0,
          bestStreak: parsed.bestStreak || 0,
          lastPlayDate: parsed.lastPlayDate || new Date().toISOString(),
          totalCorrect: parsed.totalCorrect || 0,
          totalQuestions: parsed.totalQuestions || 0,
        };

        // Check if it's a new day, reset current streak if so
        const today = new Date().toDateString();
        const lastPlayDate = new Date(validatedData.lastPlayDate).toDateString();

        if (today !== lastPlayDate) {
          // If more than 1 day gap, reset current streak
          const daysDiff = Math.floor(
            (new Date().getTime() - new Date(validatedData.lastPlayDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (daysDiff > 1) {
            validatedData.currentStreak = 0;
          }
        }

        return validatedData;
      }
    } catch (error) {
      console.error("Error getting streak data:", error);
    }

    return DEFAULT_STREAK_DATA;
  }

  static async updateStreak(isCorrect: boolean): Promise<StreakData> {
    try {
      const currentData = await this.getStreakData();

      const newStreak = isCorrect ? currentData.currentStreak + 1 : 0;
      const newBestStreak = Math.max(currentData.bestStreak, newStreak);

      const updatedData: StreakData = {
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        lastPlayDate: new Date().toISOString(),
        totalCorrect: currentData.totalCorrect + (isCorrect ? 1 : 0),
        totalQuestions: currentData.totalQuestions + 1,
      };

      await _setItem(STREAK_KEY, JSON.stringify(updatedData));
      return updatedData;
    } catch (error) {
      console.error("Error saving streak data:", error);
      // Return current data with session update if save fails
      const currentData = await this.getStreakData();
      return {
        ...currentData,
        totalCorrect: currentData.totalCorrect + (isCorrect ? 1 : 0),
        totalQuestions: currentData.totalQuestions + 1,
      };
    }
  }

  static async resetStreak(): Promise<void> {
    try {
      await _deleteItem(STREAK_KEY);
    } catch (error) {
      console.error("Error resetting streak:", error);
    }
  }

  static async getLifetimeStats(): Promise<{
    totalCorrect: number;
    totalQuestions: number;
    accuracy: number;
  }> {
    try {
      const data = await this.getStreakData();
      return {
        totalCorrect: data.totalCorrect,
        totalQuestions: data.totalQuestions,
        accuracy: data.totalQuestions > 0 ? (data.totalCorrect / data.totalQuestions) * 100 : 0,
      };
    } catch (error) {
      console.error("Error getting lifetime stats:", error);
      return { totalCorrect: 0, totalQuestions: 0, accuracy: 0 };
    }
  }
}
