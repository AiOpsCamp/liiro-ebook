"use strict";

/**
 * 🛠️ Standalone BullMQ Distributed Audio Worker
 * ===============================================
 * Background worker process executed in Kubernetes (k8s) pod deployments (`liiro-backend-worker`).
 * Listens to BullMQ Redis Queue 'liiro-audio-generation-queue' and executes:
 * 1. Kokoro TTS speech synthesis & Whispersync alignment (`GENERATE_AUDIO`).
 * 2. HLS VOD transcoding & Hetzner S3 upload (`HLS_TRANSCODE`).
 */

require("dotenv").config();
const { Worker } = require("bullmq");
const { createRedisConnection } = require("../config/redisConfig");
const HLSTranscoderService = require("../services/hlsTranscoder.service");

const QUEUE_NAME = "liiro-audio-generation-queue";
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);

console.log(`=======================================================`);
console.log(`🛠️ STARTING BULLMQ DISTRIBUTED AUDIO WORKER POD`);
console.log(`   Queue: '${QUEUE_NAME}' | Concurrency: ${CONCURRENCY} workers`);
console.log(`=======================================================\n`);

const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`⚙️ [Worker PID:${process.pid}] Processing job '${job.id}' (Type: ${job.name})...`);

    const { type, payload } = job.data;

    if (type === "HLS_TRANSCODE" || job.name === "HLS_TRANSCODE") {
      const { sourceAudioUrl, slug, chapterNumber, voice } = payload;
      await HLSTranscoderService.transcodeAndUploadHLS(sourceAudioUrl, slug, chapterNumber, voice);
    } else if (type === "FULL_PIPELINE" || job.name === "FULL_PIPELINE") {
      const { spawn } = require("child_process");
      const path = require("path");
      const scriptPath = path.join(__dirname, "../../audio_pipeline/run_full_pipeline.py");
      
      const args = [scriptPath, "--slug", payload.slug, "--voice", payload.voice || "am_adam", "--upload", "--hls"];
      console.log(`🚀 [Worker] Executing Python Audio Pipeline: python3 ${args.join(" ")}`);

      await new Promise((resolve, reject) => {
        const pyProc = spawn("python3", args);
        pyProc.stdout.on("data", (data) => console.log(`   [PyPipeline] ${data.toString().trim()}`));
        pyProc.stderr.on("data", (data) => console.warn(`   [PyPipeline Warning] ${data.toString().trim()}`));
        pyProc.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Python Audio Pipeline exited with error code ${code}`));
        });
      });
    }

    console.log(`✅ [Worker PID:${process.pid}] Job '${job.id}' completed cleanly`);
  },
  {
    connection,
    concurrency: CONCURRENCY,
  }
);

worker.on("completed", (job) => {
  console.log(`🎉 Job '${job.id}' finished successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`💥 Job '${job?.id}' failed with error: ${err.message}`);
});

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, gracefully closing BullMQ worker...");
  await worker.close();
  process.exit(0);
});
