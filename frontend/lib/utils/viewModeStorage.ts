import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let SecureStore: any = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

const VIEW_MODE_KEY = "vocabulary_view_mode";

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

export class ViewModeManager {
  static async getViewMode(): Promise<"grid" | "list"> {
    try {
      const mode = await getItem(VIEW_MODE_KEY);
      return mode === "grid" ? "grid" : "list";
    } catch (error) {
      console.error("Error getting view mode:", error);
      return "list";
    }
  }

  static async setViewMode(mode: "grid" | "list"): Promise<void> {
    try {
      await setItem(VIEW_MODE_KEY, mode);
    } catch (error) {
      console.error("Error saving view mode:", error);
    }
  }
}
