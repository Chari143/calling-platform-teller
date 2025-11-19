import { redis } from "./redis.js";
import { CONCURRENCY_LIMIT, CPS_LIMIT } from "./config.js";

export async function getConcurrency(apiKey: string, callId: string) {
  const countKey = `active_count:${apiKey}`;
  const setKey = `active:${apiKey}`;
  const v = await redis.incr(countKey);
  if (v === 1) await redis.expire(countKey, 3600);
  if (v > CONCURRENCY_LIMIT) {
    await redis.decr(countKey);
    return false;
  }
  await redis.sadd(setKey, callId);
  return true;
}

export async function releaseConcurrency(apiKey: string, callId: string) {
  const countKey = `active_count:${apiKey}`;
  const setKey = `active:${apiKey}`;
  await redis.srem(setKey, callId);
  await redis.decr(countKey);
}

export async function checkCpsLimit(apiKey: string) {
  const second = Math.floor(Date.now() / 1000);
  const key = `cps:${apiKey}:${second}`;
  const v = await redis.incr(key);
  if (v === 1) await redis.expire(key, 2);
  return v <= CPS_LIMIT;
}