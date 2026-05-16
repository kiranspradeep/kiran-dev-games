import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware/socketAuth";
import { roomManager } from "../managers/roomManager";
import { presenceManager } from "../managers/presenceManager";
import { GameId } from "@prisma/client";
import prisma from "../../lib/prisma";
import { z } from "zod";

const VALID_GAME_IDS = [
  "SNAKE",
  "PACMAN",
  "WORDLE",
  "GAME_2048",
  "STRATEGY_LUDO",
  "BATTLE_SNAKE",
  "AIM_TRAINER",
  "ROPE_SWING",
  "DESTRUCTION",
] as const;

const createRoomSchema = z.object({
  gameId: z.enum(VALID_GAME_IDS),
  isRanked: z.boolean().optional().default(false),
  maxPlayers: z.number().min(2).max(4).optional().default(4),
  config: z.record(z.unknown()).optional().default({}),
});

const joinRoomSchema = z.object({
  code: z.string().length(6),
});

export function registerRoomHandlers(
  io: Server,
  socket: AuthenticatedSocket
): void {
  // ──────────────────────────────────────────────────────────────────────────
  // CREATE ROOM
  // ──────────────────────────────────────────────────────────────────────────

  socket.on("room:create", (data: unknown, callback?: Function) => {
    try {
      const input = createRoomSchema.parse(data);

      const room = roomManager.createRoom({
        gameId: input.gameId as GameId,
        isRanked: input.isRanked,
        maxPlayers: input.maxPlayers,
        config: input.config,
      });

      // Join creator as host
      roomManager.joinRoom(room.code, {
        userId: socket.userId,
        username: socket.username,
        displayName: socket.displayName,
        avatarUrl: socket.avatarUrl,
        level: socket.level,
        isHost: true,
        socketId: socket.id,
      });

      socket.join(`room:${room.code}`);

      // Update presence
      presenceManager.updateStatus(socket.userId, "in_lobby", {
        roomCode: room.code,
        currentGame: input.gameId,
      });

      const serialized = roomManager.serializeRoom(room);

      callback?.({
        success: true,
        room: serialized,
      });

      socket.emit("room:joined", {
        room: serialized,
      });
    } catch (err) {
      const msg =
        err instanceof z.ZodError
          ? "Invalid room configuration"
          : "Failed to create room";

      callback?.({
        success: false,
        error: msg,
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // JOIN ROOM
  // ──────────────────────────────────────────────────────────────────────────

  socket.on("room:join", (data: unknown, callback?: Function) => {
    try {
      const { code } = joinRoomSchema.parse(data);

      const result = roomManager.joinRoom(code, {
        userId: socket.userId,
        username: socket.username,
        displayName: socket.displayName,
        avatarUrl: socket.avatarUrl,
        level: socket.level,
        isHost: false,
        socketId: socket.id,
      });

      if (!result.success || !result.room) {
        callback?.({
          success: false,
          error: result.error,
        });
        return;
      }

      socket.join(`room:${code}`);

      presenceManager.updateStatus(socket.userId, "in_lobby", {
        roomCode: code,
        currentGame: result.room.gameId,
      });

      const serialized = roomManager.serializeRoom(result.room);

      callback?.({
        success: true,
        room: serialized,
      });

      socket.emit("room:joined", {
        room: serialized,
      });

      // Notify others
      socket.to(`room:${code}`).emit("room:player_joined", {
        player: {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          avatarUrl: socket.avatarUrl,
          level: socket.level,
          isHost: false,
          isReady: false,
          slot:
            result.room.players.get(socket.userId)?.slot ?? 0,
        },
      });
    } catch (err) {
      callback?.({
        success: false,
        error: "Invalid room code",
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // LEAVE ROOM
  // ──────────────────────────────────────────────────────────────────────────

  socket.on("room:leave", (callback?: Function) => {
    const result = roomManager.leaveCurrentRoom(socket.userId);

    if (result.code) {
      socket.leave(`room:${result.code}`);

      // Reset presence
      presenceManager.updateStatus(socket.userId, "online", {
        roomCode: null,
        currentGame: null,
      });

      if (result.room) {
        io.to(`room:${result.code}`).emit(
          "room:player_left",
          {
            userId: socket.userId,
            newHost: result.newHost,
          }
        );

        io.to(`room:${result.code}`).emit(
          "room:updated",
          {
            room: roomManager.serializeRoom(result.room),
          }
        );
      }
    }

    callback?.({
      success: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // READY
  // ──────────────────────────────────────────────────────────────────────────

  socket.on(
    "room:ready",
    (data: { ready: boolean }, callback?: Function) => {
      const code = roomManager.getUserRoomCode(socket.userId);

      if (!code) {
        callback?.({
          success: false,
          error: "Not in a room",
        });
        return;
      }

      roomManager.setReady(code, socket.userId, data.ready);

      const room = roomManager.getRoom(code);

      if (!room) return;

      io.to(`room:${code}`).emit("room:player_ready", {
        userId: socket.userId,
        ready: data.ready,
      });

      // Everyone ready
      if (roomManager.allReady(code)) {
        io.to(`room:${code}`).emit("room:all_ready", {
          room: roomManager.serializeRoom(room),
        });
      }

      callback?.({
        success: true,
      });
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // START GAME
  // ──────────────────────────────────────────────────────────────────────────

  socket.on("room:start", async (callback?: Function) => {
    const code = roomManager.getUserRoomCode(socket.userId);

    if (!code) {
      callback?.({
        success: false,
        error: "Not in a room",
      });
      return;
    }

    const room = roomManager.getRoom(code);

    if (!room) {
      callback?.({
        success: false,
        error: "Room not found",
      });
      return;
    }

    const host = Array.from(room.players.values()).find(
      (p) => p.isHost
    );

    if (host?.userId !== socket.userId) {
      callback?.({
        success: false,
        error: "Only the host can start",
      });
      return;
    }

    if (room.players.size < 2) {
      callback?.({
        success: false,
        error: "Need at least 2 players",
      });
      return;
    }

    try {
      const match = await prisma.match.create({
        data: {
          gameId: room.gameId,
          roomCode: code,
          status: "IN_PROGRESS",
          isRanked: room.isRanked,
          maxPlayers: room.maxPlayers,
          startedAt: new Date(),

          players: {
            create: Array.from(room.players.values()).map(
              (p) => ({
                userId: p.userId,
              })
            ),
          },
        },
      });

      roomManager.updateStatus(code, "in_progress");

      // Update player presence
      for (const player of room.players.values()) {
        presenceManager.updateStatus(
          player.userId,
          "in_game",
          {
            currentGame: room.gameId,
            roomCode: code,
          }
        );
      }

      io.to(`room:${code}`).emit(
        "room:game_starting",
        {
          matchId: match.id,
          gameId: room.gameId,
          players: roomManager.serializeRoom(room),
          startsIn: 3,
        }
      );

      callback?.({
        success: true,
        matchId: match.id,
      });
    } catch (err) {
      callback?.({
        success: false,
        error: "Failed to start match",
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // KICK PLAYER
  // ──────────────────────────────────────────────────────────────────────────

  socket.on(
    "room:kick",
    (
      data: { userId: string },
      callback?: Function
    ) => {
      const code = roomManager.getUserRoomCode(socket.userId);

      if (!code) {
        callback?.({
          success: false,
          error: "Not in a room",
        });
        return;
      }

      const room = roomManager.getRoom(code);

      const host = Array.from(
        room?.players.values() ?? []
      ).find((p) => p.isHost);

      if (host?.userId !== socket.userId) {
        callback?.({
          success: false,
          error: "Only host can kick",
        });
        return;
      }

      const targetPlayer = room?.players.get(data.userId);

      if (!targetPlayer) {
        callback?.({
          success: false,
          error: "Player not found",
        });
        return;
      }

      const result = roomManager.leaveRoom(
        code,
        data.userId
      );

      // Notify kicked player
      io.to(targetPlayer.socketId).emit(
        "room:kicked",
        {
          reason: "Kicked by host",
        }
      );

      // Notify room
      if (result.room) {
        io.to(`room:${code}`).emit(
          "room:player_left",
          {
            userId: data.userId,
            kicked: true,
            newHost: result.newHost,
          }
        );

        io.to(`room:${code}`).emit(
          "room:updated",
          {
            room: roomManager.serializeRoom(result.room),
          }
        );
      }

      callback?.({
        success: true,
      });
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // GET ROOM
  // ──────────────────────────────────────────────────────────────────────────

  socket.on(
    "room:get",
    (
      data: { code: string },
      callback?: Function
    ) => {
      const room = roomManager.getRoom(data.code);

      if (!room) {
        callback?.({
          success: false,
          error: "Room not found",
        });
        return;
      }

      callback?.({
        success: true,
        room: roomManager.serializeRoom(room),
      });
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // DISCONNECT
  // ──────────────────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    const result = roomManager.leaveCurrentRoom(
      socket.userId
    );

    // Reset presence
    presenceManager.updateStatus(socket.userId, "online", {
      roomCode: null,
      currentGame: null,
    });

    if (result.code && result.room) {
      io.to(`room:${result.code}`).emit(
        "room:player_left",
        {
          userId: socket.userId,
          newHost: result.newHost,
        }
      );

      io.to(`room:${result.code}`).emit(
        "room:updated",
        {
          room: roomManager.serializeRoom(result.room),
        }
      );
    }
  });
}