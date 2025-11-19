import { Router } from "express";
import { z } from "zod";
import { redis } from "../redis.js";
import { checkCpsLimit, getConcurrency } from "../rateLimiter.js";
import { callStateQueue } from "../queue.js";
import { PUBLIC_BASE_URL } from "../config.js";
import crypto from "crypto";
import { prisma } from "../db.js";

const router = Router();

const callSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

router.post("/calls", async (req, res) => {
  const apiKey = req.apiKey as string;
  const parse = callSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const allowedCps = await checkCpsLimit(apiKey);
  if (!allowedCps) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }
  const id = crypto.randomUUID();
  const { from, to, metadata } = parse.data;
  const call = await prisma.call.create({
    data: {
      id,
      from,
      to,
      apiKey,
      metadata,
      state: "QUEUED"
    }
  });
  await redis.hmset(`call:${id}`, {
    id,
    from,
    to,
    apiKey,
    state: "QUEUED"
  });
  const concurrency = await getConcurrency(apiKey, id);
  if (!concurrency) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }
  await callStateQueue.add("to-ringing", { id }, { delay: 500 });
  const wsBase = PUBLIC_BASE_URL.replace(/^http/, "ws");
  return res.json({ call_id: id, ws_url: `${wsBase}/ws?call_id=${id}` });
});

router.get("/calls/:id", async (req, res) => {
  const id = req.params.id;
  const state = await redis.hgetall(`call:${id}`);
  if (state && Object.keys(state).length > 0) {
    return res.json({ id, ...state });

  }
  const call = await prisma.call.findUnique({ where: { id } });
  if (!call) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(call);
});

export default router;