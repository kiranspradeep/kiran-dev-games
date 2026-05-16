"use client";

import { create } from "zustand";

export type UserStatus =
  | "online"
  | "in_game"
  | "in_lobby"
  | "away"
  | "offline";

export interface OnlineFriend {
  userId:      string;
  username:    string;
  displayName: string;
  avatarUrl:   string | null;
  status:      UserStatus;
  currentGame: string | null;
  roomCode:    string | null;
}

interface PresenceState {
  isConnected:  boolean;
  onlineCount:  number;
  onlineFriends:Map<string, OnlineFriend>;

  setConnected:    (v: boolean) => void;
  setOnlineCount:  (n: number) => void;
  setFriendOnline: (friend: OnlineFriend) => void;
  setFriendOffline:(userId: string) => void;
  updateFriend:    (userId: string, update: Partial<OnlineFriend>) => void;
  setFriends:      (friends: OnlineFriend[]) => void;
  reset:           () => void;
}

export const usePresenceStore = create<PresenceState>()((set) => ({
  isConnected:   false,
  onlineCount:   0,
  onlineFriends: new Map(),

  setConnected: (v) => set({ isConnected: v }),

  setOnlineCount: (n) => set({ onlineCount: n }),

  setFriendOnline: (friend) =>
    set((state) => {
      const next = new Map(state.onlineFriends);
      next.set(friend.userId, friend);
      return { onlineFriends: next };
    }),

  setFriendOffline: (userId) =>
    set((state) => {
      const next = new Map(state.onlineFriends);
      next.delete(userId);
      return { onlineFriends: next };
    }),

  updateFriend: (userId, update) =>
    set((state) => {
      const friend = state.onlineFriends.get(userId);
      if (!friend) return state;
      const next = new Map(state.onlineFriends);
      next.set(userId, { ...friend, ...update });
      return { onlineFriends: next };
    }),

  setFriends: (friends) =>
    set(() => {
      const next = new Map<string, OnlineFriend>();
      friends.forEach((f) => next.set(f.userId, f));
      return { onlineFriends: next };
    }),

  reset: () =>
    set({
      isConnected:   false,
      onlineCount:   0,
      onlineFriends: new Map(),
    }),
}));