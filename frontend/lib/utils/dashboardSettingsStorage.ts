import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let SecureStore: any = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

const DASHBOARD_DISMISSED_KEY_PREFIX = "dashboard_dismissed_";

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export class DashboardSettingsManager {
  static async isWidgetDismissed(widgetKey: string): Promise<boolean> {
    try {
      const value = await getItem(DASHBOARD_DISMISSED_KEY_PREFIX + widgetKey);
      return value === "true";
    } catch (error) {
      console.error(`Error getting dashboard dismissed state for ${widgetKey}:`, error);
      return false;
    }
  }

  static async setWidgetDismissed(widgetKey: string, dismissed: boolean): Promise<void> {
    try {
      await setItem(DASHBOARD_DISMISSED_KEY_PREFIX + widgetKey, dismissed ? "true" : "false");
    } catch (error) {
      console.error(`Error setting dashboard dismissed state for ${widgetKey}:`, error);
    }
  }

  static async resetDashboardLayout(): Promise<void> {
    try {
      const keys = ["dailyChallenge", "wordsProgress", "cognitiveLoad"];
      for (const key of keys) {
        await removeItem(DASHBOARD_DISMISSED_KEY_PREFIX + key);
      }
    } catch (error) {
      console.error("Error resetting dashboard layout:", error);
    }
  }
}
