"use strict";

/**
 * ⚡ Redis Connection Configuration for BullMQ Distributed Queues & Caching
 * =========================================================================
 * Aligned with Kubernetes (k8s) infrastructure (multicamp k8s redis-service).
 */

const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || null;

const connectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
};

function createRedisConnection() {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return new Redis(connectionOptions);
}

module.exports = {
  createRedisConnection,
  connectionOptions,
  REDIS_URL,
};
