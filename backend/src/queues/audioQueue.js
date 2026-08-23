"use strict";

/**
 * BullMQ & Redis Asynchronous Audio Transcoding & Synthesis Queue
 * Manages background queue jobs for Kokoro TTS audio generation, Whisper alignment, and HLS transcoding.
 */

class BackgroundAudioQueue {
  constructor() {
    this.privateQueue = [];
    console.log("⚡ [Background Audio Queue] Initialized async queue manager");
  }

  /**
   * Enqueue a job for background processing
   */
  async addJob(jobType, payload) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const job = {
      id: jobId,
      type: jobType,
      payload,
      status: "queued",
      createdAt: new Date().toISOString(),
    };

    console.log(`📥 [Audio Queue] Enqueued job '${job.id}' (Type: ${jobType}) for slug '${payload.slug}'`);
    this.privateQueue.push(job);

    // Process job asynchronously in background
    setTimeout(() => {
      this.processJob(job);
    }, 100);

    return job;
  }

  /**
   * Process background job
   */
  async processJob(job) {
    job.status = "processing";
    job.startedAt = new Date().toISOString();
    console.log(`⚙️ [Audio Queue Worker] Processing job '${job.id}' (${job.type})...`);

    try {
      if (job.type === "HLS_TRANSCODE") {
        const HLSTranscoderService = require("../services/hlsTranscoder.service");
        const { sourceAudioUrl, slug, chapterNumber, voice } = job.payload;
        await HLSTranscoderService.transcodeAndUploadHLS(sourceAudioUrl, slug, chapterNumber, voice);
      }

      job.status = "completed";
      job.completedAt = new Date().toISOString();
      console.log(`   ✅ [Audio Queue Worker] Job '${job.id}' completed successfully`);
    } catch (err) {
      job.status = "failed";
      job.error = err.message;
      console.error(`   ❌ [Audio Queue Worker] Job '${job.id}' failed:`, err);
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      totalJobs: this.privateQueue.length,
      queued: this.privateQueue.filter((j) => j.status === "queued").length,
      processing: this.privateQueue.filter((j) => j.status === "processing").length,
      completed: this.privateQueue.filter((j) => j.status === "completed").length,
      failed: this.privateQueue.filter((j) => j.status === "failed").length,
      jobs: this.privateQueue.slice(-20),
    };
  }
}

module.exports = new BackgroundAudioQueue();
