"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketEmit, useSocketEvent } from "./useSocket";
import { useToast } from "@/store/uiStore";
import type { Room, RoomPlayer, ChatMessage } from "@/store/roomStore";

interface CreateRoomOptions {
  gameId:      string;
  isRanked?:   boolean;
  maxPlayers?: number;
}

interface RoomResponse {
  success: boolean;
  error?:  string;
  room?:   Room;
}

// Maps gameId to the route that should be loaded when the match starts
const GAME_ROUTES: Record<string, string> = {
  STRATEGY_LUDO: "/ludo",
};

export function useRoom() {
  const router = useRouter();

  const {
    currentRoom,
    isInRoom,
    isConnecting,
    chatMessages,
    typingUsers,
    setRoom,
    clearRoom,
    updateRoom,
    addPlayer,
    removePlayer,
    setPlayerReady,
    addChatMessage,
    setTyping,
    setConnecting,
    setMatchId,
  } = useRoomStore();

  const { user } = useAuthStore();
  const emit     = useSocketEmit();
  const toast    = useToast();

  // ── Listen to room events ─────────────────────────────────────────────────
  useSocketEvent<{ room: Room }>("room:joined", ({ room }) => {
    setRoom(room);
  });

  useSocketEvent<{ room: Room }>("room:updated", ({ room }) => {
    updateRoom(room);
  });

  useSocketEvent<{ player: RoomPlayer }>(
    "room:player_joined",
    ({ player }) => {
      addPlayer(player);
      toast.info(`${player.displayName} joined the room`);
    }
  );

  useSocketEvent<{
    userId:  string;
    newHost: string | null;
    kicked?: boolean;
  }>("room:player_left", ({ userId, newHost, kicked }) => {
    const room   = useRoomStore.getState().currentRoom;
    const player = room?.players.find((p) => p.userId === userId);
    if (player && userId !== user?.id) {
      toast.info(
        kicked
          ? `${player.displayName} was kicked`
          : `${player.displayName} left`
      );
    }
    removePlayer(userId, newHost);
  });

  useSocketEvent<{ userId: string; ready: boolean }>(
    "room:player_ready",
    ({ userId, ready }) => {
      setPlayerReady(userId, ready);
    }
  );

  useSocketEvent<ChatMessage>("chat:message", (msg) => {
    addChatMessage(msg);
  });

  useSocketEvent<{
    userId:      string;
    displayName: string;
    isTyping:    boolean;
  }>("chat:typing", ({ userId, displayName, isTyping }) => {
    setTyping(userId, displayName, isTyping);
  });

  useSocketEvent<{ reason: string }>("room:kicked", ({ reason }) => {
    clearRoom();
    toast.error("Removed from room", reason);
  });

  useSocketEvent<{
    matchId:  string;
    gameId:   string;
    startsIn: number;
  }>("room:game_starting", ({ matchId, gameId, startsIn }) => {
    // Store the matchId — LudoPage reads this to confirm a match is active
    setMatchId(matchId);

    const route = GAME_ROUTES[gameId];

    if (route) {
      // Known multiplayer game — navigate to its game page
      toast.success(
        "Game starting!",
        `Match begins in ${startsIn} seconds`
      );
      router.push(route);
    } else {
      // Fallback for any gameId we don't have a route for yet
      toast.success(
        "Game starting!",
        `Match begins in ${startsIn} seconds`
      );
    }
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const createRoom = useCallback(
    async (options: CreateRoomOptions): Promise<RoomResponse> => {
      setConnecting(true);
      try {
        const res = await emit<RoomResponse>("room:create", options);
        if (res.success && res.room) {
          setRoom(res.room);
        }
        return res;
      } catch {
        return { success: false, error: "Failed to create room" };
      } finally {
        setConnecting(false);
      }
    },
    [emit, setRoom, setConnecting]
  );

  const joinRoom = useCallback(
    async (code: string): Promise<RoomResponse> => {
      setConnecting(true);
      try {
        const res = await emit<RoomResponse>("room:join", {
          code: code.toUpperCase(),
        });
        if (res.success && res.room) {
          setRoom(res.room);
        }
        return res;
      } catch {
        return { success: false, error: "Failed to join room" };
      } finally {
        setConnecting(false);
      }
    },
    [emit, setRoom, setConnecting]
  );

  const leaveRoom = useCallback(async () => {
    try {
      await emit("room:leave");
      clearRoom();
    } catch {
      clearRoom();
    }
  }, [emit, clearRoom]);

  const setReady = useCallback(
    async (ready: boolean) => {
      await emit("room:ready", { ready });
    },
    [emit]
  );

  const startGame = useCallback(async (): Promise<RoomResponse> => {
    try {
      return await emit<RoomResponse>("room:start");
    } catch {
      return { success: false, error: "Failed to start game" };
    }
  }, [emit]);

  const kickPlayer = useCallback(
    async (userId: string): Promise<RoomResponse> => {
      try {
        return await emit<RoomResponse>("room:kick", { userId });
      } catch {
        return { success: false, error: "Failed to kick player" };
      }
    },
    [emit]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      await emit("chat:send", { message });
    },
    [emit]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      const socket =
        typeof window !== "undefined"
          ? require("@/lib/socket").getSocket()
          : null;
      socket?.emit("chat:typing", { isTyping });
    },
    []
  );

  const isHost =
    currentRoom?.players.find((p) => p.userId === user?.id)?.isHost ??
    false;

  const myPlayer = currentRoom?.players.find(
    (p) => p.userId === user?.id
  );

  const allReady =
    (currentRoom?.players.length ?? 0) >= 2 &&
    currentRoom?.players.every((p) => p.isReady) === true;

  return {
    currentRoom,
    isInRoom,
    isConnecting,
    chatMessages,
    typingUsers: Array.from(typingUsers.values()),
    isHost,
    myPlayer,
    allReady,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    kickPlayer,
    sendMessage,
    sendTyping,
  };
}