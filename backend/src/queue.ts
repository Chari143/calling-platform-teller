import { Queue } from "bullmq";
import { REDIS_URL } from "./config.js";

const connection = { url: REDIS_URL } as const;

// BullMQ queues
export const callStateQueue = new Queue("call-state", { connection });
export const uploadQueue = new Queue("upload", { connection });