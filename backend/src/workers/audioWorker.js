"use strict";

require("dotenv").config();
const { Worker } = require("bullmq");
const connectDB = require("../db/connect");
const { connectionOptions } = require("../config/redisConfig");

const QUEUE_NAME = process.env.AUDIO_QUEUE_NAME || "liiro-audio-generation-queue";
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "4", 10);

async function startWorker() {
  console.log("⚡ Starting Liiro Audio Generation Worker...");
  await connectDB();

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`🎧 Processing job ${job.id}: ${job.name} (Data: ${JSON.stringify(job.data)})`);
      
      const { storyId, chapterSlug, audioUrl } = job.data;
      
      return {
        success: true,
        jobId: job.id,
        storyId,
        chapterSlug,
        audioUrl: audioUrl || "https://multicamp-prod-k8s-assets.nbg1.your-objectstorage.com/audio/sample.mp3",
        processedAt: new Date().toISOString()
      };
    },
    {
      connection: connectionOptions,
      concurrency: CONCURRENCY,
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });

  console.log(`🚀 BullMQ Worker listening on queue "${QUEUE_NAME}" with concurrency ${CONCURRENCY}`);
}

startWorker().catch((err) => {
  console.error("❌ Fatal Worker Startup Error:", err);
  process.exit(1);
});
