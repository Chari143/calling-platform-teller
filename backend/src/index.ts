import express from "express";
import { createServer } from "http";
import * as path from "path";
import * as fs from "fs";
import { PORT, UPLOADS_DIR } from "./config.js";
import { auth } from "./auth.js";
import callsRouter from "./routes/calls.js";
import metricsRouter from "./routes/metrics.js";
import { initWebSocket } from "./websocket.js";
import { db } from "./db.js";  
import { redisConnect } from "./redis.js";

const app = express();
app.use(express.json());
app.use(auth);

const uploadsPath = path.join(process.cwd(), UPLOADS_DIR);
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

// for uploads
app.use("/uploads", express.static(uploadsPath));
app.use(callsRouter);
app.use(metricsRouter);

const server = createServer(app);
initWebSocket(server);

async function startServer() {
  // DB connect
  // Redis connect
  await db();
  await redisConnect();
  server.listen(PORT, () => {});
}

startServer();

export { app, server };
