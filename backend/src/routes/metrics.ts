import { Router } from "express";
import { prisma } from "../db.js";
import { redis } from "../redis.js";

const router = Router();

router.get("/metrics", async (_req, res) => {
  const total = await prisma.call.count();
  const uploads = await prisma.upload.count();
  const countKeys = await redis.keys("active_count:*");
  let active = 0;
  for (const k of countKeys) {
    const v = await redis.get(k);
    active += Number(v || 0);
  }
  const cpsKeys = await redis.keys("cps:*:" + Math.floor(Date.now() / 1000));
  let cps = 0;
  for (const k of cpsKeys) {
    const v = await redis.get(k);
    cps += Number(v || 0);
  }
  res.json({ total, active, cps, uploads });
});

export default router;