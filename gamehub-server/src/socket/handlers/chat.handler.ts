import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware/socketAuth";
import { roomManager } from "../managers/roomManager";
import { z } from "zod";

const chatSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(200)
    .trim()
    .transform((s) =>
      s.replace(/<[^>]*>/g, "")  // strip HTML
       .replace(/[^\w\s.,!?@#$%^&*()-]/g, "")
       .trim()
    ),
});

export function registerChatHandlers(
  io: Server,
  socket: AuthenticatedSocket
): void {
  // ── Send room chat message ─────────────────────────────────────────────────
  socket.on(
    "chat:send",
    (data: unknown, callback?: Function) => {
      try {
        const { message } = chatSchema.parse(data);

        const code = roomManager.getUserRoomCode(socket.userId);
        if (!code) {
          callback?.({ success: false, error: "Not in a room" });
          return;
        }

        const chatMsg = roomManager.addChatMessage(code, {
          userId:      socket.userId,
          username:    socket.username,
          displayName: socket.displayName,
          message,
        });

        if (!chatMsg) {
          callback?.({ success: false, error: "Failed to send message" });
          return;
        }

        // Broadcast to everyone in room (including sender)
        io.to(`room:${code}`).emit("chat:message", {
          id:          chatMsg.id,
          userId:      chatMsg.userId,
          username:    chatMsg.username,
          displayName: chatMsg.displayName,
          message:     chatMsg.message,
          timestamp:   chatMsg.timestamp,
        });

        callback?.({ success: true });
      } catch {
        callback?.({ success: false, error: "Invalid message" });
      }
    }
  );

  // ── Typing indicator ──────────────────────────────────────────────────────
  socket.on("chat:typing", (data: { isTyping: boolean }) => {
    const code = roomManager.getUserRoomCode(socket.userId);
    if (!code) return;

    socket.to(`room:${code}`).emit("chat:typing", {
      userId:      socket.userId,
      displayName: socket.displayName,
      isTyping:    data.isTyping,
    });
  });
}