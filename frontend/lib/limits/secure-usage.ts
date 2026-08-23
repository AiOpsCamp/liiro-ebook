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

const PREFIX = "lt-usage"; // learning tool usage

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // local date (not UTC)
}

// Per-day, per-user, per-tool key
function keyFor(toolId: string, userKey?: string) {
  return `${PREFIX}:${userKey ?? "anon"}:${toolId}:${todayLocal()}`;
}

export async function getUsage(toolId: string, userKey?: string): Promise<number> {
  try {
    const k = keyFor(toolId, userKey);
    const v = await _getItem(k);
    return v ? Math.max(0, parseInt(v, 10)) : 0;
  } catch {
    return 0;
  }
}

export async function incrementUsage(toolId: string, userKey?: string): Promise<number> {
  const k = keyFor(toolId, userKey);
  const current = await getUsage(toolId, userKey);
  const next = current + 1;
  await _setItem(k, String(next));
  return next;
}

export async function getLockedMap(
  toolIds: string[],
  dailyLimit: number,
  userKey?: string
): Promise<Record<string, boolean>> {
  const map: Record<string, boolean> = {};
  for (const id of toolIds) {
    const used = await getUsage(id, userKey);
    map[id] = used >= dailyLimit;
  }
  return map;
}
