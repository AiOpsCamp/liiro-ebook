import { ApiConfig } from "./api";

// Call at runtime, not at module load time
export function getApiBaseURL(): string {
  return ApiConfig.getBaseUrl();
}

// Legacy export for backward compatibility - will be called when accessed
export const API_BASE_URL = ApiConfig.getBaseUrl();
export const VIOLET_600 = "#7C4DFF";
export const VIOLET_700 = "#5F3DC4";
export const VIOLET_800 = "#4C24A3";

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveToken(key: string, token: string) {
  await AsyncStorage.setItem(key, token);
}

export const EYE_COMFORT_COLOR = "#E6DFAF";

export async function getToken(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}
