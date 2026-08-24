"use strict";

require("dotenv").config();
const { Worker } = require("bullmq");
const connectDB = require("../db/connect");
const { connectionOptions } = require("../config/redisConfig");

const QUEUE_NAME = process.env.AUDIO_QUEUE_NAME || "liiro-audio-generation-queue";
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "4", 10);

const { execFile } = require("child_process");
const path = require("path");

async function startWorker() {
  console.log("⚡ Starting Liiro Audio Generation Worker...");
  await connectDB();

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`🎧 [Worker] Processing BullMQ Audio Job #${job.id}: ${job.name} (Slug: ${job.data.slug || job.data.storySlug})`);
      
      const slug = job.data.slug || job.data.storySlug;
      const voice = job.data.voice || "af_heart";
      const chapterNumber = job.data.chapterNumber;

      if (!slug) {
        throw new Error("Job payload missing required 'slug' field");
      }

      const pythonScript = path.resolve(__dirname, "../../audio_pipeline/run_full_pipeline.py");
      const args = ["-u", pythonScript, "--slug", slug, "--voice", voice, "--upload", "--hls"];
      if (chapterNumber) {
        args.push("--chapter", chapterNumber.toString());
      }

      return new Promise((resolve, reject) => {
        execFile("python3", args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ [Worker Job ${job.id}] Pipeline Execution Error:`, stderr || error.message);
            return reject(error);
          }
          console.log(`✅ [Worker Job ${job.id}] Pipeline Output:\n${stdout.substring(0, 500)}...`);
          resolve({
            success: true,
            jobId: job.id,
            slug,
            voice,
            completedAt: new Date().toISOString(),
          });
        });
      });
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
