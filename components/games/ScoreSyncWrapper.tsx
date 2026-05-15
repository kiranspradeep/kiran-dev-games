"use client";

// ScoreSyncWrapper — provides score sync context to child game components
// Does NOT modify the game components themselves
// Games call window.__syncScore() if it exists — zero coupling

import { useEffect } from "react";
import { useScoreSync } from "@/hooks/useScoreSync";
import { useAuthStore } from "@/store/authStore";

interface ScoreSyncWrapperProps {
  gameId: string;
  children: React.ReactNode;
}

// Extend window for the sync bridge
declare global {
  interface Window {
    __syncScore?: (
      score: number,
      metadata?: Record<string, unknown>
    ) => Promise<void>;
    __currentGameId?: string;
  }
}

export default function ScoreSyncWrapper({
  gameId,
  children,
}: ScoreSyncWrapperProps) {
  const { syncScore } = useScoreSync();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Register global sync bridge — games can call this without importing anything
    window.__currentGameId = gameId;
    window.__syncScore = async (
      score: number,
      metadata?: Record<string, unknown>
    ) => {
      await syncScore({ gameId, score, metadata });
    };

    return () => {
      delete window.__syncScore;
      delete window.__currentGameId;
    };
  }, [gameId, syncScore]);

  return <>{children}</>;
}