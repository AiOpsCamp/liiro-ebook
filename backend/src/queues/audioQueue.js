"use strict";

/**
 * ⚡ BullMQ & Redis Distributed Audio Generation & Transcoding Queue
 * ===================================================================
 * Manages background queue jobs for Kokoro TTS audio generation, Whisper alignment,
 * and HLS transcoding across multi-pod Kubernetes (k8s) worker clusters.
 */

const { Queue, QueueEvents } = require("bullmq");
const { createRedisConnection } = require("../config/redisConfig");

class DistributedAudioQueue {
  constructor() {
    this.queueName = "liiro-audio-generation-queue";
    this.useRedis = true;
    this.fallbackQueue = [];

    try {
      this.connection = createRedisConnection();

      // Gracefully capture Redis connection errors
      this.connection.on("error", (err) => {
        if (this.useRedis) {
          console.warn("⚠️ [Redis Distributed Queue] Redis connection error, falling back to local queue mode:", err.message);
          this.useRedis = false;
        }
      });

      this.queue = new Queue(this.queueName, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: { age: 86400, count: 1000 }, // Keep completed jobs 24h
          removeOnFail: { age: 604800, count: 500 },     // Keep failed jobs 7 days
        },
      });

      this.queueEvents = new QueueEvents(this.queueName, { connection: this.connection });

      this.queueEvents.on("completed", ({ jobId }) => {
        console.log(`✅ [BullMQ Queue] Job '${jobId}' completed successfully across cluster`);
      });

      this.queueEvents.on("failed", ({ jobId, failedReason }) => {
        console.error(`❌ [BullMQ Queue] Job '${jobId}' failed: ${failedReason}`);
      });

      console.log(`⚡ [BullMQ Queue Manager] Initialized BullMQ Redis Queue '${this.queueName}'`);
    } catch (err) {
      console.warn("⚠️ [BullMQ Queue] Falling back to memory queue:", err.message);
      this.useRedis = false;
    }
  }

  /**
   * Enqueue a job for background processing
   */
  async addJob(jobType, payload) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const jobData = {
      id: jobId,
      type: jobType,
      payload,
      createdAt: new Date().toISOString(),
    };

    if (this.useRedis && this.queue) {
      try {
        const job = await this.queue.add(jobType, jobData, { jobId });
        console.log(`📥 [BullMQ Redis Queue] Enqueued job '${job.id}' (Type: ${jobType}) for slug '${payload.slug}'`);
        return {
          id: job.id,
          type: jobType,
          payload,
          status: "queued",
          queueEngine: "BullMQ / Redis",
        };
      } catch (err) {
        console.warn(`⚠️ [BullMQ Add Job Error] Falling back to local queue: ${err.message}`);
      }
    }

    // Fallback to in-memory processing if Redis is unavailable
    const fallbackJob = { ...jobData, status: "queued", queueEngine: "In-Memory Fallback" };
    this.fallbackQueue.push(fallbackJob);
    setTimeout(() => this.processFallbackJob(fallbackJob), 100);
    return fallbackJob;
  }

  async processFallbackJob(job) {
    job.status = "processing";
    try {
      if (job.type === "HLS_TRANSCODE") {
        const HLSTranscoderService = require("../services/hlsTranscoder.service");
        const { sourceAudioUrl, slug, chapterNumber, voice } = job.payload;
        await HLSTranscoderService.transcodeAndUploadHLS(sourceAudioUrl, slug, chapterNumber, voice);
      }
      job.status = "completed";
    } catch (err) {
      job.status = "failed";
      job.error = err.message;
    }
  }

  /**
   * Get current queue status across Redis cluster
   */
  async getQueueStatus() {
    if (this.useRedis && this.queue) {
      try {
        const [waitingCount, activeCount, completedCount, failedCount] = await Promise.all([
          this.queue.getWaitingCount(),
          this.queue.getActiveCount(),
          this.queue.getCompletedCount(),
          this.queue.getFailedCount(),
        ]);

        return {
          queueEngine: "BullMQ / Redis Distributed Cluster",
          queueName: this.queueName,
          waiting: waitingCount,
          active: activeCount,
          completed: completedCount,
          failed: failedCount,
          total: waitingCount + activeCount + completedCount + failedCount,
        };
      } catch (err) {
        console.warn("⚠️ [Queue Status Error]", err.message);
      }
    }

    return {
      queueEngine: "In-Memory Fallback",
      totalJobs: this.fallbackQueue.length,
      queued: this.fallbackQueue.filter((j) => j.status === "queued").length,
      processing: this.fallbackQueue.filter((j) => j.status === "processing").length,
      completed: this.fallbackQueue.filter((j) => j.status === "completed").length,
      failed: this.fallbackQueue.filter((j) => j.status === "failed").length,
    };
  }
}

module.exports = new DistributedAudioQueue();
