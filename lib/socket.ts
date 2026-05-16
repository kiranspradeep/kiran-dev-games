import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

// ── Socket instance (singleton) ───────────────────────────────────────────────
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", {
      autoConnect:     false,
      transports:      ["websocket", "polling"],
      reconnection:    true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: (cb) => {
        cb({ token: getAccessToken() });
      },
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export function resetSocket(): void {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
}