"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  resetSocket,
} from "@/lib/socket";
import { usePresenceStore } from "@/store/presenceStore";
import { useRoomStore } from "@/store/roomStore";

// ── Connect/disconnect based on auth state ────────────────────────────────────
export function useSocketConnection() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { setConnected, setOnlineCount, reset: resetPresence } =
    usePresenceStore();
  const { reset: resetRoom } = useRoomStore();
  const listenersAttached = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      disconnectSocket();
      resetPresence();
      resetRoom();
      listenersAttached.current = false; // ✅ reset so reconnect works
      return;
    }

    const socket = getSocket();

    if (!listenersAttached.current) {
      listenersAttached.current = true;

      socket.on("connect", () => {
        console.log("[Socket] Connected:", socket.id);
        setConnected(true);
        socket.emit("presence:get_friends");
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
        setConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.warn("[Socket] Connection error:", err.message);
        setConnected(false);
      });

      socket.on("presence:stats", (data: { onlineCount: number }) => {
        setOnlineCount(data.onlineCount);
      });
    }

    connectSocket();

    return () => {
      // intentionally not disconnecting on re-render
    };
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const handleLogout = () => {
      resetSocket();
      resetPresence();
      resetRoom();
      listenersAttached.current = false; // ✅ reset ref on logout
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);
}

// ── Generic socket emit with callback ────────────────────────────────────────
export function useSocketEmit() {
  const emit = useCallback(
    <T>(event: string, data?: unknown): Promise<T> => {
      return new Promise((resolve, reject) => {
        const socket = getSocket();

        if (!socket.connected) {
          reject(new Error("Socket not connected"));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error(`Socket emit timeout: ${event}`));
        }, 10_000);

        socket.emit(event, data, (response: T) => {
          clearTimeout(timeout);
          resolve(response);
        });
      });
    },
    []
  );

  return emit;
}

// ── Socket event listener hook ────────────────────────────────────────────────
export function useSocketEvent<T>(
  event: string,
  handler: (data: T) => void
): void {
  const handlerRef = useRef(handler);

  // ✅ Always keep ref pointing to latest handler (no stale closures)
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const socket = getSocket();

    // ✅ Stable listener — always calls the latest handler via ref
    const listener = (data: T) => handlerRef.current(data);

    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event]); // ✅ only re-register when event name changes
}