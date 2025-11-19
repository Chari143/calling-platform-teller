import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index.js";

describe("calls API", () => {
  it("needs auth header", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(401);
  });

  it("makes a call and gives ids", async () => {
    const res = await request(app)
      .post("/calls")
      .set("Authorization", "Bearer test")
      .send({ from: "100", to: "200" });
    expect(res.status).toBe(200);
    expect(!!res.body.call_id).toBe(true);
    expect(res.body.ws_url.includes("ws://")).toBe(true);
  });
});