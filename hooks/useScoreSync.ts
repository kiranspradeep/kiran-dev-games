"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { scoresApi } from "@/lib/api";
import { toBackendGameId } from "@/lib/gameIdMap";
import { useToast } from "@/store/uiStore";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

interface SyncScoreOptions {
  gameId: string;           // frontend game ID (snake, pacman, etc.)
  score: number;
  metadata?: Record<string, unknown>;
  silent?: boolean;         // suppress toasts
}

interface SyncResult {
  synced: boolean;
  isNewHighScore: boolean;
  previousBest: number | null;
  xpGained?: number;
  leveledUp?: boolean;
}

export function useScoreSync() {
  const { user, isAuthenticated } = useAuthStore();
  const { autoSaveScores } = useSettingsStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const syncScore = useCallback(
    async (options: SyncScoreOptions): Promise<SyncResult> => {
      const { gameId, score, metadata = {}, silent = false } = options;

      // Guest or auto-save disabled — skip sync
      if (!isAuthenticated || !user || !autoSaveScores) {
        return {
          synced: false,
          isNewHighScore: false,
          previousBest: null,
        };
      }

      // Skip zero scores
      if (score <= 0) {
        return {
          synced: false,
          isNewHighScore: false,
          previousBest: null,
        };
      }

      try {
        const backendGameId = toBackendGameId(gameId);
        const result = await scoresApi.submit({
          gameId: backendGameId,
          score,
          metadata,
        });

        const data = result.data;

        // Invalidate leaderboard + personal bests cache
        queryClient.invalidateQueries({
          queryKey: queryKeys.leaderboard(backendGameId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalBests(user.id),
        });

        // Show toasts
        if (!silent) {
          if (data?.isNewHighScore) {
            toast.success(
              "New Personal Best!",
              `${score.toLocaleString()} pts saved to your profile`
            );
          }
          if (data?.xp?.leveledUp) {
            toast.success(
              `Level Up! → Level ${data.xp.newLevel}`,
              "Keep playing to earn more XP"
            );
          }
        }

        return {
          synced: true,
          isNewHighScore: data?.isNewHighScore ?? false,
          previousBest: data?.previousBest ?? null,
          xpGained: data?.xp?.gained,
          leveledUp: data?.xp?.leveledUp,
        };
      } catch (err) {
        // Never break the game — just log
        if (process.env.NODE_ENV === "development") {
          console.warn("[ScoreSync] Failed to sync score:", err);
        }
        return {
          synced: false,
          isNewHighScore: false,
          previousBest: null,
        };
      }
    },
    [isAuthenticated, user, autoSaveScores, toast, queryClient]
  );

  return {
    syncScore,
    isAuthenticated,
    autoSaveScores,
  };
}