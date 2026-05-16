import { GameId } from "@prisma/client";
import crypto from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────
export type RoomStatus =
  | "waiting"
  | "starting"
  | "in_progress"
  | "finished"
  | "abandoned";

export interface RoomPlayer {
  userId:      string;
  username:    string;
  displayName: string;
  avatarUrl:   string | null;
  level:       number;
  isHost:      boolean;
  isReady:     boolean;
  socketId:    string;
  joinedAt:    Date;
  slot:        number;
}

export interface ChatMessage {
  id:          string;
  userId:      string;
  username:    string;
  displayName: string;
  message:     string;
  timestamp:   Date;
}

export interface Room {
  code:        string;
  gameId:      GameId;
  status:      RoomStatus;
  isRanked:    boolean;
  maxPlayers:  number;
  players:     Map<string, RoomPlayer>; // userId → player
  chatHistory: ChatMessage[];
  createdAt:   Date;
  startedAt:   Date | null;
  endedAt:     Date | null;
  config:      Record<string, unknown>;
}

// ── Manager ───────────────────────────────────────────────────────────────────
class RoomManager {
  // roomCode → Room
  private rooms = new Map<string, Room>();

  // userId → roomCode (fast lookup)
  private userRoomMap = new Map<string, string>();

  // ── Generate unique room code ─────────────────────────────────────────────────
  private generateCode(): string {
    let code: string;
    do {
      code = crypto.randomBytes(3).toString("hex").toUpperCase();
    } while (this.rooms.has(code));
    return code;
  }

  // ── Create room ───────────────────────────────────────────────────────────────
  createRoom(options: {
    gameId:     GameId;
    isRanked?:  boolean;
    maxPlayers?:number;
    config?:    Record<string, unknown>;
  }): Room {
    const code = this.generateCode();
    const room: Room = {
      code,
      gameId:     options.gameId,
      status:     "waiting",
      isRanked:   options.isRanked ?? false,
      maxPlayers: options.maxPlayers ?? 4,
      players:    new Map(),
      chatHistory:[],
      createdAt:  new Date(),
      startedAt:  null,
      endedAt:    null,
      config:     options.config ?? {},
    };
    this.rooms.set(code, room);
    return room;
  }

  // ── Add player to room ────────────────────────────────────────────────────────
  joinRoom(
    code: string,
    player: Omit<RoomPlayer, "joinedAt" | "slot" | "isReady">
  ): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: "Room not found" };

    if (room.status !== "waiting") {
      return { success: false, error: "Game already in progress" };
    }

    if (room.players.size >= room.maxPlayers) {
      return { success: false, error: "Room is full" };
    }

    // Already in this room?
    if (room.players.has(player.userId)) {
      return { success: true, room };
    }

    // Leave any current room first
    this.leaveCurrentRoom(player.userId);

    // Assign next available slot
    const usedSlots = new Set(
      Array.from(room.players.values()).map((p) => p.slot)
    );
    let slot = 0;
    while (usedSlots.has(slot)) slot++;

    room.players.set(player.userId, {
      ...player,
      isReady: false,
      joinedAt: new Date(),
      slot,
    });

    this.userRoomMap.set(player.userId, code);
    return { success: true, room };
  }

  // ── Remove player from room ───────────────────────────────────────────────────
  leaveRoom(
    code: string,
    userId: string
  ): { room: Room | null; wasHost: boolean; newHost: string | null } {
    const room = this.rooms.get(code);
    if (!room) return { room: null, wasHost: false, newHost: null };

    const player = room.players.get(userId);
    if (!player) return { room, wasHost: false, newHost: null };

    const wasHost = player.isHost;
    room.players.delete(userId);
    this.userRoomMap.delete(userId);

    // If room is empty, destroy it
    if (room.players.size === 0) {
      this.rooms.delete(code);
      return { room: null, wasHost, newHost: null };
    }

    // Transfer host if needed
    let newHost: string | null = null;
    if (wasHost) {
      const nextPlayer = Array.from(room.players.values()).sort(
        (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
      )[0];
      if (nextPlayer) {
        nextPlayer.isHost = true;
        newHost = nextPlayer.userId;
      }
    }

    return { room, wasHost, newHost };
  }

  // ── Leave whatever room user is currently in ──────────────────────────────────
  leaveCurrentRoom(userId: string): {
    room: Room | null;
    wasHost: boolean;
    newHost: string | null;
    code: string | null;
  } {
    const code = this.userRoomMap.get(userId);
    if (!code) return { room: null, wasHost: false, newHost: null, code: null };
    const result = this.leaveRoom(code, userId);
    return { ...result, code };
  }

  // ── Set ready state ───────────────────────────────────────────────────────────
  setReady(code: string, userId: string, ready: boolean): boolean {
    const room = this.rooms.get(code);
    const player = room?.players.get(userId);
    if (!player) return false;
    player.isReady = ready;
    return true;
  }

  // ── Check if all players ready ────────────────────────────────────────────────
  allReady(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room || room.players.size < 2) return false;
    return Array.from(room.players.values()).every((p) => p.isReady);
  }

  // ── Update room status ────────────────────────────────────────────────────────
  updateStatus(code: string, status: RoomStatus): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.status = status;
    if (status === "in_progress") room.startedAt = new Date();
    if (status === "finished" || status === "abandoned") {
      room.endedAt = new Date();
    }
  }

  // ── Add chat message ──────────────────────────────────────────────────────────
  addChatMessage(
    code: string,
    msg: Omit<ChatMessage, "id" | "timestamp">
  ): ChatMessage | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    const message: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    room.chatHistory.push(message);

    // Keep last 50 messages
    if (room.chatHistory.length > 50) {
      room.chatHistory = room.chatHistory.slice(-50);
    }

    return message;
  }

  // ── Getters ───────────────────────────────────────────────────────────────────
  getRoom(code: string): Room | null {
    return this.rooms.get(code) ?? null;
  }

  getUserRoom(userId: string): Room | null {
    const code = this.userRoomMap.get(userId);
    if (!code) return null;
    return this.rooms.get(code) ?? null;
  }

  getUserRoomCode(userId: string): string | null {
    return this.userRoomMap.get(userId) ?? null;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  // ── Serialize room for clients ────────────────────────────────────────────────
  serializeRoom(room: Room): object {
    return {
      code:        room.code,
      gameId:      room.gameId,
      status:      room.status,
      isRanked:    room.isRanked,
      maxPlayers:  room.maxPlayers,
      playerCount: room.players.size,
      players:     Array.from(room.players.values()).map((p) => ({
        userId:      p.userId,
        username:    p.username,
        displayName: p.displayName,
        avatarUrl:   p.avatarUrl,
        level:       p.level,
        isHost:      p.isHost,
        isReady:     p.isReady,
        slot:        p.slot,
      })),
      chatHistory: room.chatHistory.slice(-20),
      createdAt:   room.createdAt,
      startedAt:   room.startedAt,
      config:      room.config,
    };
  }

  // ── Cleanup stale rooms ────────────────────────────────────────────────────────
  cleanup(maxAgeMs: number = 30 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [code, room] of this.rooms.entries()) {
      if (
        room.players.size === 0 ||
        (room.status === "finished" &&
          room.endedAt &&
          room.endedAt.getTime() < cutoff)
      ) {
        // Clean up userRoomMap entries
        for (const userId of room.players.keys()) {
          this.userRoomMap.delete(userId);
        }
        this.rooms.delete(code);
      }
    }
  }
}

export const roomManager = new RoomManager();