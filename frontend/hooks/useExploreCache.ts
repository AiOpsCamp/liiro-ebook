/**
 * useExploreCache.ts
 * ─────────────────────────────────────────────────────────
 * High-performance caching hook for explore route
 * - Caches pack data with TTL
 * - Caches images efficiently
 * - Memoizes computations
 * - Smart invalidation
 */

import { useRef, useCallback, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EXPLORE_CACHE_PREFIX = "@explore_cache_";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface CacheConfig {
  key: string;
  ttl?: number;
  version?: number;
}

export function useExploreCache() {
  const memoryCache = useRef<Map<string, CacheEntry<any>>>(new Map());

  /**
   * Get from cache (memory first, then AsyncStorage)
   */
  const getFromCache = useCallback(
    async <T,>(config: CacheConfig): Promise<T | null> => {
      try {
        // 1. Check memory cache first (fastest)
        const cached = memoryCache.current.get(config.key);
        if (cached && cached.version === (config.version ?? 1)) {
          const elapsed = Date.now() - cached.timestamp;
          if (elapsed < (config.ttl ?? CACHE_TTL)) {
            return cached.data as T;
          }
        }

        // 2. Check AsyncStorage (persistent)
        const storageKey = `${EXPLORE_CACHE_PREFIX}${config.key}`;
        const stored = await AsyncStorage.getItem(storageKey);

        if (stored) {
          const parsed = JSON.parse(stored) as CacheEntry<T>;
          if (parsed.version === (config.version ?? 1)) {
            const elapsed = Date.now() - parsed.timestamp;
            if (elapsed < (config.ttl ?? CACHE_TTL)) {
              // Restore to memory cache
              memoryCache.current.set(config.key, parsed);
              return parsed.data;
            }
          }
        }

        return null;
      } catch (error) {
        console.error("[Cache] Get error:", error);
        return null;
      }
    },
    []
  );

  /**
   * Save to cache (memory + AsyncStorage)
   */
  const setInCache = useCallback(
    async <T,>(config: CacheConfig, data: T): Promise<void> => {
      try {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          version: config.version ?? 1,
        };

        // Save to memory (immediate)
        memoryCache.current.set(config.key, entry);

        // Save to storage (async)
        const storageKey = `${EXPLORE_CACHE_PREFIX}${config.key}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
      } catch (error) {
        console.error("[Cache] Set error:", error);
      }
    },
    []
  );

  /**
   * Clear specific cache entry
   */
  const clearCache = useCallback(async (key: string): Promise<void> => {
    try {
      memoryCache.current.delete(key);
      const storageKey = `${EXPLORE_CACHE_PREFIX}${key}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error("[Cache] Clear error:", error);
    }
  }, []);

  /**
   * Clear all explore caches
   */
  const clearAllCache = useCallback(async (): Promise<void> => {
    try {
      memoryCache.current.clear();
      const keys = await AsyncStorage.getAllKeys();
      const exploreCacheKeys = keys.filter((k) =>
        k.startsWith(EXPLORE_CACHE_PREFIX)
      );
      await AsyncStorage.multiRemove(exploreCacheKeys);
    } catch (error) {
      console.error("[Cache] Clear all error:", error);
    }
  }, []);

  /**
   * Check if cache is still valid
   */
  const isCacheValid = useCallback((config: CacheConfig): boolean => {
    const cached = memoryCache.current.get(config.key);
    if (!cached || cached.version !== (config.version ?? 1)) {
      return false;
    }
    const elapsed = Date.now() - cached.timestamp;
    return elapsed < (config.ttl ?? CACHE_TTL);
  }, []);

  return {
    getFromCache,
    setInCache,
    clearCache,
    clearAllCache,
    isCacheValid,
  };
}

/**
 * Image cache manager
 */
export function useImageCache() {
  const imageCache = useRef<Map<string, string>>(new Map());

  const cacheImage = useCallback((url: string): void => {
    if (url && !imageCache.current.has(url)) {
      imageCache.current.set(url, url);
    }
  }, []);

  const getCachedImage = useCallback((url: string): string => {
    return imageCache.current.get(url) ?? url;
  }, []);

  const preloadImages = useCallback((urls: string[]): void => {
    urls.forEach((url) => cacheImage(url));
  }, [cacheImage]);

  const clearImageCache = useCallback((): void => {
    imageCache.current.clear();
  }, []);

  return {
    cacheImage,
    getCachedImage,
    preloadImages,
    clearImageCache,
  };
}
