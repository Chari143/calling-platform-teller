process.env.CPS_LIMIT = "2";
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index.js";
import { redis } from "../src/redis.js";

describe("concurrency limit", () => {
  it("third call gets 429 due to CPS", async () => {
    await redis.flushdb();
    const r1 = await request(app).post("/calls").set("Authorization", "Bearer cpskey").send({ from: "a", to: "b" });
    const r2 = await request(app).post("/calls").set("Authorization", "Bearer cpskey").send({ from: "a", to: "b" });
    const r3 = await request(app).post("/calls").set("Authorization", "Bearer cpskey").send({ from: "a", to: "b" });
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
  });
});