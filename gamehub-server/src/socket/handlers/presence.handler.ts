import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware/socketAuth";
import {
  presenceManager,
  type UserStatus,
} from "../managers/presenceManager";
import prisma from "../../lib/prisma";

export function registerPresenceHandlers(
  io: Server,
  socket: AuthenticatedSocket
): void {
  // ── On connect — mark as online ────────────────────────────────────────────
  presenceManager.connect({
    userId:      socket.userId,
    username:    socket.username,
    displayName: socket.displayName,
    avatarUrl:   socket.avatarUrl,
    status:      "online",
    currentGame: null,
    roomCode:    null,
    socketId:    socket.id,
  });

  // Update last seen in DB (fire and forget)
  prisma.user
    .update({
      where: { id: socket.userId },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});

  // Notify friends that this user is now online
  notifyFriendsPresence(io, socket.userId, "online");

  // Send current online count to this socket
  socket.emit("presence:stats", {
    onlineCount: presenceManager.getOnlineCount(),
  });

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  socket.on("presence:heartbeat", () => {
    presenceManager.heartbeat(socket.userId);
    socket.emit("presence:heartbeat_ack", { ts: Date.now() });
  });

  // ── Status update ─────────────────────────────────────────────────────────
  socket.on(
    "presence:update_status",
    (data: { status: UserStatus }) => {
      presenceManager.updateStatus(socket.userId, data.status);
      notifyFriendsPresence(io, socket.userId, data.status);
    }
  );

  // ── Get friend presence ───────────────────────────────────────────────────
  socket.on("presence:get_friends", async () => {
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { senderId: socket.userId, status: "ACCEPTED" },
            { receiverId: socket.userId, status: "ACCEPTED" },
          ],
        },
        select: {
          senderId:   true,
          receiverId: true,
        },
      });

      const friendIds = friendships.map((f) =>
        f.senderId === socket.userId ? f.receiverId : f.senderId
      );

      const onlineFriends = presenceManager.getFriendPresence(friendIds);

      socket.emit("presence:friends", {
        friends: onlineFriends.map((f) => ({
          userId:      f.userId,
          username:    f.username,
          displayName: f.displayName,
          avatarUrl:   f.avatarUrl,
          status:      f.status,
          currentGame: f.currentGame,
          roomCode:    f.roomCode,
        })),
      });
    } catch (err) {
      socket.emit("presence:error", { message: "Failed to fetch friends" });
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const entry = presenceManager.disconnectBySocket(socket.id);
    if (entry) {
      prisma.user
        .update({
          where: { id: entry.userId },
          data: { lastSeenAt: new Date() },
        })
        .catch(() => {});

      notifyFriendsPresence(io, entry.userId, "offline");
    }
  });
}

// ── Notify friends of presence change ────────────────────────────────────────
async function notifyFriendsPresence(
  io: Server,
  userId: string,
  status: UserStatus | "offline"
): Promise<void> {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    const friendIds = friendships.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );

    const entry = presenceManager.get(userId);

    for (const friendId of friendIds) {
      const friendEntry = presenceManager.get(friendId);
      if (friendEntry) {
        io.to(friendEntry.socketId).emit("presence:friend_update", {
          userId,
          status,
          currentGame: entry?.currentGame ?? null,
          roomCode:    entry?.roomCode ?? null,
        });
      }
    }
  } catch {
    // Silently ignore
  }
}