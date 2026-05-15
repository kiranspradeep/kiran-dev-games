"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

async function fetchLeaderboard(
  gameId: string,
  mode: "scores" | "ranked" = "scores",
  limit: number = 10,
  offset: number = 0
) {
  const token =
    typeof window !== "undefined"
      ? null
      : null;

  const res = await axios.get(
    `${API}/api/leaderboards/${gameId}`,
    {
      params: { mode, limit, offset },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  return res.data.data;
}

async function fetchGlobalLeaderboard(limit: number = 10) {
  const res = await axios.get(`${API}/api/leaderboards/global`, {
    params: { limit },
  });
  return res.data.data;
}

// ── Per-game leaderboard ──────────────────────────────────────────────────────
export function useLeaderboard(
  gameId: string,
  options?: {
    mode?: "scores" | "ranked";
    limit?: number;
    offset?: number;
    enabled?: boolean;
  }
) {
  const {
    mode = "scores",
    limit = 10,
    offset = 0,
    enabled = true,
  } = options ?? {};

  return useQuery({
    queryKey: queryKeys.leaderboard(gameId, limit, offset),
    queryFn: () => fetchLeaderboard(gameId, mode, limit, offset),
    enabled: enabled && !!gameId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}

// ── Global leaderboard ────────────────────────────────────────────────────────
export function useGlobalLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ["leaderboards", "global", limit],
    queryFn: () => fetchGlobalLeaderboard(limit),
    staleTime: 60 * 1000,
  });
}

// ── Personal bests ────────────────────────────────────────────────────────────
async function fetchPersonalBests() {
  const { default: api } = await import("@/lib/api");
  const res = await api.get("/api/scores/personal");
  return res.data.data.scores;
}

export function usePersonalBests(userId?: string) {
  return useQuery({
    queryKey: queryKeys.personalBests(userId ?? ""),
    queryFn: fetchPersonalBests,
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}