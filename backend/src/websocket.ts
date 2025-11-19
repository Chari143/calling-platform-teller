import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { redisSubscriber } from "./redis.js";

type ClientInfo = { apiKey: string; callId: string };

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<WebSocket, ClientInfo>();

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    const callId = url.searchParams.get("call_id") || "";
    const auth = (request.headers["authorization"] || request.headers["Authorization"]) as string | undefined;
    if (!auth || !auth.startsWith("Bearer ") || !callId) {
      socket.destroy();
      return;
    }
    const apiKey = auth.slice(7).trim();
    wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      clients.set(ws, { apiKey, callId });
      ws.on("close", () => {
        clients.delete(ws);
      });
    });
  });

  redisSubscriber.psubscribe("events:call:*");
  redisSubscriber.on("pmessage", (_pattern: string, channel: string, message: string) => {
    const parts = channel.split(":");
    const callId = parts[2];
    for (const [ws, info] of clients.entries()) {
      if (info.callId === callId) {
        ws.send(message);
      }
    }
  });
}