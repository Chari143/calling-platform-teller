import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index.js";

describe("limits", () => {
  it("metrics works", async () => {
    const res = await request(app).get("/metrics").set("Authorization", "Bearer any");
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe("number");
  });

  // concurrency tested in separate file with env set before import
});