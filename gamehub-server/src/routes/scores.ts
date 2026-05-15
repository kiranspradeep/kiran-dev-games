import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { apiLimiter } from "../middleware/rateLimiter";
import {
  submitScoreSchema,
  leaderboardQuerySchema,
  VALID_GAME_IDS,
} from "../validators/score.validators";
import * as ScoreService from "../services/score.service";
import { GameId } from "@prisma/client";
import { z } from "zod";

const router = Router();

// ── POST /api/scores ──────────────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  apiLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = submitScoreSchema.parse(req.body);
      const result = await ScoreService.submitScore(req.user!.id, input);

      res.status(201).json({
        success: true,
        message: result.isNewHighScore
          ? "New personal best!"
          : "Score submitted",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/scores/personal ──────────────────────────────────────────────────
router.get(
  "/personal",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bests = await ScoreService.getPersonalBests(req.user!.id);
      res.status(200).json({ success: true, data: { scores: bests } });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/scores/leaderboard?gameId=SNAKE&limit=10 ────────────────────────
router.get(
  "/leaderboard",
  apiLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gameId, limit, offset } = leaderboardQuerySchema.parse(
        req.query
      );
      const entries = await ScoreService.getLeaderboard(
        gameId as GameId,
        limit,
        offset
      );

      res.status(200).json({
        success: true,
        data: { gameId, entries, limit, offset },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/scores/history/:gameId ──────────────────────────────────────────
router.get(
  "/history/:gameId",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = z
        .enum(VALID_GAME_IDS)
        .parse(req.params.gameId) as GameId;

      const history = await ScoreService.getScoreHistory(
        req.user!.id,
        gameId
      );

      res.status(200).json({
        success: true,
        data: { gameId, history },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;