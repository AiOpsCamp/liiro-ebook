"use strict";

const cacheStore = new Map();

/**
 * High-performance Cache Manager for static/semi-static catalog endpoints
 * Automatically manages TTL expiration with zero external latency overhead.
 */
class CacheManager {
  static get(key) {
    const item = cacheStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      cacheStore.delete(key);
      return null;
    }
    return item.value;
  }

  static set(key, value, ttlSeconds = 300) {
    cacheStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  static del(key) {
    cacheStore.delete(key);
  }

  static clear() {
    cacheStore.clear();
  }
}

module.exports = CacheManager;
