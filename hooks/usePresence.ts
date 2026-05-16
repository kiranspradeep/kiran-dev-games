"use client";

import { useEffect } from "react";
import { usePresenceStore } from "@/store/presenceStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketEvent, useSocketEmit } from "./useSocket";
import { getSocket } from "@/lib/socket";
import type { OnlineFriend } from "@/store/presenceStore";

export function usePresence() {
  const {
    isConnected,
    onlineCount,
    onlineFriends,
    setFriendOnline,
    setFriendOffline,
    updateFriend,
    setFriends,
    setOnlineCount,
  } = usePresenceStore();

  const { user } = useAuthStore();

  // ── Listen for friend presence updates ───────────────────────────────────
  useSocketEvent<{ friends: OnlineFriend[] }>(
    "presence:friends",
    ({ friends }) => {
      setFriends(friends);
    }
  );

  useSocketEvent<OnlineFriend & { status: string }>(
    "presence:friend_update",
    (data) => {
      if (data.status === "offline") {
        setFriendOffline(data.userId);
      } else {
        const existing = onlineFriends.get(data.userId);
        if (existing) {
          updateFriend(data.userId, {
            status:      data.status as OnlineFriend["status"],
            currentGame: data.currentGame,
            roomCode:    data.roomCode,
          });
        } else {
          setFriendOnline(data as OnlineFriend);
        }
      }
    }
  );

  useSocketEvent<{ onlineCount: number }>(
    "presence:stats",
    ({ onlineCount: count }) => {
      setOnlineCount(count);
    }
  );

  // ── Periodic heartbeat ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("presence:heartbeat");
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // ── Request friend presence on connect ────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !user) return;
    const socket = getSocket();
    socket.emit("presence:get_friends");
  }, [isConnected, user]);

  return {
    isConnected,
    onlineCount,
    onlineFriends: Array.from(onlineFriends.values()),
    onlineFriendCount: onlineFriends.size,
  };
}

// ── Check if specific user is online ─────────────────────────────────────────
export function useIsUserOnline(userId: string): boolean {
  const onlineFriends = usePresenceStore((s) => s.onlineFriends);
  return onlineFriends.has(userId);
}