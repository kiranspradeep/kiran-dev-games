import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate";
import { apiLimiter } from "../middleware/rateLimiter";
import * as UserService from "../services/user.service";

const router = Router();

// ── GET /api/users/search?q= ──────────────────────────────────────────────────
router.get(
  "/search",
  apiLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, limit } = z
        .object({
          q: z.string().min(2).max(50),
          limit: z
            .string()
            .optional()
            .default("10")
            .transform(Number)
            .pipe(z.number().min(1).max(20)),
        })
        .parse(req.query);

      const users = await UserService.searchUsers(q, limit);
      res.status(200).json({ success: true, data: { users } });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/users/:username ──────────────────────────────────────────────────
router.get(
  "/:username",
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = z
        .object({ username: z.string().min(3).max(20) })
        .parse(req.params);

      const profile = await UserService.getPublicProfile(username);
      res.status(200).json({ success: true, data: { profile } });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/users/me/xp ─────────────────────────────────────────────────────
router.get(
  "/me/xp",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { getXpToNextLevel } = await import("../lib/xp");
      const { getCurrentUser } = await import("../services/auth.service");
      const user = await getCurrentUser(req.user!.id);
      const xpProgress = getXpToNextLevel(user.xp);

      res.status(200).json({
        success: true,
        data: {
          xp: user.xp,
          level: user.level,
          progress: xpProgress,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;