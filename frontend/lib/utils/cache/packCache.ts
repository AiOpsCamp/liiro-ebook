// packCache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const packKey = (slug: string, userKey: string) => `pack:${userKey}:${slug}`;

export type PersistedPack<T> = {
  savedAt: number;
  data: T;
};

export async function savePack<T>(slug: string, userKey: string, data: T) {
  const entry: PersistedPack<T> = { savedAt: Date.now(), data };
  await AsyncStorage.setItem(packKey(slug, userKey), JSON.stringify(entry));
}

export async function loadPack<T>(slug: string, userKey: string): Promise<PersistedPack<T> | null> {
  const raw = await AsyncStorage.getItem(packKey(slug, userKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedPack<T>;
    if (parsed && parsed.data) return parsed;
  } catch {}
  return null;
}

export async function removePack(slug: string, userKey: string) {
  await AsyncStorage.removeItem(packKey(slug, userKey));
}
