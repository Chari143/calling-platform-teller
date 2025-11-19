import { REDIS_URL } from "./config.js";
import { Redis } from "ioredis";

export const redis = new Redis(REDIS_URL);
export const redisSubscriber = new Redis(REDIS_URL);

export async function redisConnect() {
  await redis.ping();
}