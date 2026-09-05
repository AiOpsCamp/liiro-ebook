"use strict";

const { createRedisConnection } = require("../config/redisConfig");

const memoryFallback = new Map();
let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = createRedisConnection();

  redisClient.on("connect", () => {
    isRedisConnected = true;
    console.log("⚡ [CacheManager] Connected to Distributed Redis Cache Cluster");
  });

  redisClient.on("ready", () => {
    isRedisConnected = true;
  });

  redisClient.on("error", (err) => {
    isRedisConnected = false;
    // Log once without flooding
  });
} catch (err) {
  isRedisConnected = false;
  console.warn("⚠️ [CacheManager] Redis initialization skipped, using in-memory fallback:", err.message);
}

/**
 * Enterprise Distributed Cache Manager (SEC-05)
 * =========================================================================
 * Primary: Redis Cluster (ioredis) with automatic TTL key expiration
 * Fallback: Node.js In-Memory Map for multi-pod resilience
 */
class CacheManager {
  static async get(key) {
    if (isRedisConnected && redisClient) {
      try {
        const redisPromise = redisClient.get(`cache:${key}`);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 150));
        const val = await Promise.race([redisPromise, timeoutPromise]);
        if (val) {
          return JSON.parse(val);
        }
      } catch (e) {
        // Soft fallback to in-memory store
      }
    }

    // In-memory fallback
    const item = memoryFallback.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  static async set(key, value, ttlSeconds = 300) {
    if (isRedisConnected && redisClient) {
      try {
        const redisPromise = redisClient.set(`cache:${key}`, JSON.stringify(value), "EX", ttlSeconds);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 150));
        await Promise.race([redisPromise, timeoutPromise]);
      } catch (e) {
        // Soft fallback
      }
    }

    // Always update in-memory fallback
    memoryFallback.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  static async del(key) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(`cache:${key}`);
      } catch (e) {}
    }
    memoryFallback.delete(key);
  }

  static async clear() {
    if (isRedisConnected && redisClient) {
      try {
        const keys = await redisClient.keys("cache:*");
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (e) {}
    }
    memoryFallback.clear();
  }
}

module.exports = CacheManager;
