import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { env } from "../config/env";
import {
  socketAuthMiddleware,
  type AuthenticatedSocket,
} from "./middleware/socketAuth";
import { registerPresenceHandlers } from "./handlers/presence.handler";
import { registerRoomHandlers }     from "./handlers/room.handler";
import { registerChatHandlers }     from "./handlers/chat.handler";
import { registerLudoHandlers }     from "./handlers/ludo.handler";
import { presenceManager }          from "./managers/presenceManager";
import { roomManager }              from "./managers/roomManager";

export function initializeSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin:      env.CLIENT_URL,
      methods:     ["GET", "POST"],
      credentials: true,
    },
    pingTimeout:  20000,
    pingInterval: 25000,
    transports:   ["websocket", "polling"],
  });

  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use(socketAuthMiddleware);

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;

    console.log(
      `[Socket] Connected: ${authSocket.username} (${authSocket.id})`
    );

    // Register all handlers
    registerPresenceHandlers(io, authSocket);
    registerRoomHandlers(io, authSocket);
    registerChatHandlers(io, authSocket);
    registerLudoHandlers(io, authSocket);

    authSocket.emit("connected", {
      socketId:    authSocket.id,
      onlineCount: presenceManager.getOnlineCount(),
      serverTime:  Date.now(),
    });

    authSocket.on("disconnect", (reason) => {
      console.log(
        `[Socket] Disconnected: ${authSocket.username} — ${reason}`
      );
    });

    authSocket.on("error", (err) => {
      console.error(`[Socket] Error from ${authSocket.username}:`, err);
    });
  });

  // ── Admin stats ────────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    socket.on("admin:stats", (callback?: Function) => {
      callback?.({
        onlineUsers: presenceManager.getOnlineCount(),
        activeRooms: roomManager.getRoomCount(),
        serverTime:  Date.now(),
      });
    });
  });

  // ── Periodic cleanup ───────────────────────────────────────────────────────
  setInterval(() => {
    presenceManager.cleanup();
    roomManager.cleanup();
  }, 2 * 60 * 1000);

  console.log("✅ Socket.io server initialized");
  return io;
}