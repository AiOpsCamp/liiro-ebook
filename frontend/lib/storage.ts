import { Platform } from "react-native";

let SecureStore: typeof import("expo-secure-store") | null = null;

if (Platform.OS !== "web") {
  const mod = require("expo-secure-store");
  SecureStore = (mod?.default ?? mod) as typeof import("expo-secure-store");
}

const webStore = {
  getItem(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === "web") return webStore.getItem(key);
  if (!SecureStore) return null;
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    webStore.setItem(key, value);
    return;
  }
  if (!SecureStore) return;
  await SecureStore.setItemAsync(key, value);
}

export async function removeItemAsync(key: string): Promise<void> {
  if (Platform.OS === "web") {
    webStore.removeItem(key);
    return;
  }
  if (!SecureStore) return;
  await SecureStore.deleteItemAsync(key);
}
