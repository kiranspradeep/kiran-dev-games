import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { GameId } from "@prisma/client";
import { optionalAuthenticate } from "../middleware/authenticate";
import { apiLimiter } from "../middleware/rateLimiter";
import * as LeaderboardService from "../services/leaderboard.service";
import * as ScoreService from "../services/score.service";
import { VALID_GAME_IDS } from "../validators/score.validators";

const router = Router();

const gameIdSchema = z.enum(VALID_GAME_IDS);

// ── GET /api/leaderboards/global ──────────────────────────────────────────────
router.get(
  "/global",
  apiLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit } = z
        .object({
          limit: z
            .string()
            .optional()
            .default("10")
            .transform(Number)
            .pipe(z.number().min(1).max(50)),
        })
        .parse(req.query);

      const entries = await LeaderboardService.getGlobalLeaderboard(limit);

      res.status(200).json({
        success: true,
        data: { entries },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/leaderboards/:gameId ─────────────────────────────────────────────
router.get(
  "/:gameId",
  apiLimiter,
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = gameIdSchema.parse(req.params.gameId) as GameId;

      const { limit, offset, mode } = z
        .object({
          limit: z
            .string()
            .optional()
            .default("10")
            .transform(Number)
            .pipe(z.number().min(1).max(100)),
          offset: z
            .string()
            .optional()
            .default("0")
            .transform(Number)
            .pipe(z.number().min(0)),
          mode: z
            .enum(["scores", "ranked"])
            .optional()
            .default("scores"),
        })
        .parse(req.query);

      const [entries, stats] = await Promise.all([
        mode === "ranked"
          ? LeaderboardService.getRankedLeaderboard(gameId, 1, limit, offset)
          : LeaderboardService.getTopScores(gameId, limit, offset),
        LeaderboardService.getGameStats(gameId),
      ]);

      // If user is authenticated, get their rank + personal best
      let userContext = null;
      if (req.user) {
        const [userRank, personalBests] = await Promise.all([
          LeaderboardService.getUserRankInGame(req.user.id, gameId),
          ScoreService.getPersonalBests(req.user.id),
        ]);

        const gameBest = personalBests.find((s) => s.gameId === gameId);
        userContext = {
          rank: userRank,
          highScore: gameBest?.highScore ?? null,
          gamesPlayed: gameBest?.gamesPlayed ?? 0,
        };
      }

      res.status(200).json({
        success: true,
        data: {
          gameId,
          mode,
          entries,
          stats,
          userContext,
          pagination: { limit, offset },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/leaderboards/:gameId/around-me ───────────────────────────────────
// Returns entries surrounding the current user's rank
router.get(
  "/:gameId/around-me",
  apiLimiter,
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = gameIdSchema.parse(req.params.gameId) as GameId;

      if (!req.user) {
        res.status(200).json({
          success: true,
          data: { entries: [], userRank: null },
        });
        return;
      }

      const userRank = await LeaderboardService.getUserRankInGame(
        req.user.id,
        gameId
      );

      if (!userRank) {
        res.status(200).json({
          success: true,
          data: { entries: [], userRank: null },
        });
        return;
      }

      // Get 2 above and 2 below the user
      const offset = Math.max(0, userRank - 3);
      const entries = await LeaderboardService.getTopScores(
        gameId,
        5,
        offset
      );

      res.status(200).json({
        success: true,
        data: { entries, userRank },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;