"use client";

import { create } from "zustand";

export interface RoomPlayer {
  userId:      string;
  username:    string;
  displayName: string;
  avatarUrl:   string | null;
  level:       number;
  isHost:      boolean;
  isReady:     boolean;
  slot:        number;
}

export interface ChatMessage {
  id:          string;
  userId:      string;
  username:    string;
  displayName: string;
  message:     string;
  timestamp:   string;
}

export interface Room {
  code:        string;
  gameId:      string;
  status:      string;
  isRanked:    boolean;
  maxPlayers:  number;
  playerCount: number;
  players:     RoomPlayer[];
  chatHistory: ChatMessage[];
  createdAt:   string;
  startedAt:   string | null;
  config:      Record<string, unknown>;
}

interface RoomState {
  currentRoom:   Room | null;
  isInRoom:      boolean;
  isConnecting:  boolean;
  chatMessages:  ChatMessage[];
  typingUsers:   Map<string, string>;
  matchId:       string | null;

  setRoom:          (room: Room) => void;
  clearRoom:        () => void;
  updateRoom:       (room: Room) => void;
  addPlayer:        (player: RoomPlayer) => void;
  removePlayer:     (userId: string, newHost?: string | null) => void;
  setPlayerReady:   (userId: string, ready: boolean) => void;
  addChatMessage:   (msg: ChatMessage) => void;
  setTyping:        (userId: string, name: string, isTyping: boolean) => void;
  setConnecting:    (v: boolean) => void;
  setMatchId:       (id: string) => void;
  reset:            () => void;
}

export const useRoomStore = create<RoomState>()((set) => ({
  currentRoom:  null,
  isInRoom:     false,
  isConnecting: false,
  chatMessages: [],
  typingUsers:  new Map(),
  matchId:      null,

  setRoom: (room) =>
    set({
      currentRoom:  room,
      isInRoom:     true,
      chatMessages: room.chatHistory ?? [],
    }),

  clearRoom: () =>
    set({
      currentRoom:  null,
      isInRoom:     false,
      chatMessages: [],
      typingUsers:  new Map(),
      matchId:      null,
    }),

  updateRoom: (room) =>
    set({ currentRoom: room }),

  addPlayer: (player) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const existing = state.currentRoom.players.find(
        (p) => p.userId === player.userId
      );
      if (existing) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          players:     [...state.currentRoom.players, player],
          playerCount: state.currentRoom.playerCount + 1,
        },
      };
    }),

  removePlayer: (userId, newHost) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const updated = state.currentRoom.players
        .filter((p) => p.userId !== userId)
        .map((p) =>
          newHost && p.userId === newHost ? { ...p, isHost: true } : p
        );
      return {
        currentRoom: {
          ...state.currentRoom,
          players:     updated,
          playerCount: updated.length,
        },
      };
    }),

  setPlayerReady: (userId, ready) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          players: state.currentRoom.players.map((p) =>
            p.userId === userId ? { ...p, isReady: ready } : p
          ),
        },
      };
    }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-49), msg],
    })),

  setTyping: (userId, name, isTyping) =>
    set((state) => {
      const next = new Map(state.typingUsers);
      if (isTyping) {
        next.set(userId, name);
      } else {
        next.delete(userId);
      }
      return { typingUsers: next };
    }),

  setConnecting: (v) => set({ isConnecting: v }),

  setMatchId: (id) => set({ matchId: id }),

  reset: () =>
    set({
      currentRoom:  null,
      isInRoom:     false,
      isConnecting: false,
      chatMessages: [],
      typingUsers:  new Map(),
      matchId:      null,
    }),
}));