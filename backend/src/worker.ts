import { Worker } from "bullmq";
import { REDIS_URL } from "./config.js";
import { prisma, db, disconnect } from "./db.js";
import { redis } from "./redis.js";
import { releaseConcurrency } from "./rateLimiter.js";
import { makeRecordingUrl } from "./recordingUrl.js";
import * as fs from "fs";
import * as path from "path";
import { UPLOADS_DIR } from "./config.js";
import { callStateQueue, uploadQueue } from "./queue.js";

const connection = { url: REDIS_URL } as const;

type StateJob = { id: string };
type UploadJob = { id: string };

// Worker connection
await db();

// State worker
const stateWorker = new Worker<StateJob>("call-state", async (job) => {
  const id = job.data.id;
  const existing = await prisma.call.findUnique({ where: { id } });
  if (!existing) return;
  if (existing.state === "QUEUED") {
    await updateState(id, "RINGING");
    await callStateQueue.add("next", { id }, { delay: 2000 });
    return;
  }
  if (existing.state === "RINGING") {
    const answered = Math.random() < 2.5;
    await prisma.call.update({ where: { id }, data: { state: answered ? "ANSWERED" : "UNANSWERED", answered } });
    await redis.hmset(`call:${id}`, { state: answered ? "ANSWERED" : "UNANSWERED" });
    await publish(id);
    await callStateQueue.add("complete", { id }, { delay: 2000 });
    return;
  }
  if (existing.state === "ANSWERED" || existing.state === "UNANSWERED") {
    await updateState(id, "COMPLETED");
    await uploadQueue.add("upload", { id }, { delay: 2000 });
    await releaseConcurrency(existing.apiKey, id);
    return;
  }
}, { connection });

// Upload worker
const uploadWorker = new Worker<UploadJob>("upload", async (job) => {
  const id = job.data.id;
  const filename = `${id}.mp3`;
  const url = makeRecordingUrl(filename);
  const uploadsPath = path.join(process.cwd(), UPLOADS_DIR);
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
  const payload = Buffer.from("SUQzAwAAAAAAQ1JJQy4uLm1vY2s=", "base64");
  fs.writeFileSync(path.join(uploadsPath, filename), payload);
  await prisma.upload.create({ data: { callId: id, url } });
  await prisma.call.update({ where: { id }, data: { recordingUrl: url } });
  await redis.hmset(`call:${id}`, { recordingUrl: url });
  await publish(id);
}, { connection });

async function updateState(id: string, state: "RINGING" | "COMPLETED") {
  // Update state
  await prisma.call.update({ where: { id }, data: { state } });
  await redis.hmset(`call:${id}`, { state });
  await publish(id);
}

async function publish(id: string) {
  // Publish event
  const call = await prisma.call.findUnique({ where: { id } });
  if (!call) return;
  const payload = JSON.stringify({ id, state: call.state, recordingUrl: call.recordingUrl });
  await redis.publish(`events:call:${id}`, payload);
}

export {};

// Shutdown hooks
process.on("SIGINT", async () => {
  await disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnect();
  process.exit(0);
});