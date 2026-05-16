import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { apiLimiter } from "../middleware/rateLimiter";
import * as FriendService from "../services/friend.service";

const router = Router();
router.use(authenticate);

// ── GET /api/friends ──────────────────────────────────────────────────────────
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const friends = await FriendService.getFriends(req.user!.id);
      res.status(200).json({ success: true, data: { friends } });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/friends/pending ──────────────────────────────────────────────────
router.get(
  "/pending",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pending = await FriendService.getPendingRequests(req.user!.id);
      res.status(200).json({ success: true, data: pending });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/friends/status/:userId ──────────────────────────────────────────
router.get(
  "/status/:userId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = z
        .object({ userId: z.string().min(1) })
        .parse(req.params);

      const status = await FriendService.getFriendshipStatus(
        req.user!.id,
        userId
      );
      res.status(200).json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/friends/request ─────────────────────────────────────────────────
router.post(
  "/request",
  apiLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = z
        .object({ username: z.string().min(3).max(20) })
        .parse(req.body);

      const friendship = await FriendService.sendFriendRequest(
        req.user!.id,
        username
      );

      res.status(201).json({
        success: true,
        message: "Friend request sent",
        data: { friendship },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/friends/:friendshipId/accept ────────────────────────────────────
router.post(
  "/:friendshipId/accept",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { friendshipId } = z
        .object({ friendshipId: z.string().min(1) })
        .parse(req.params);

      await FriendService.acceptFriendRequest(req.user!.id, friendshipId);

      res.status(200).json({
        success: true,
        message: "Friend request accepted",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/friends/:friendshipId/decline ───────────────────────────────────
router.post(
  "/:friendshipId/decline",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { friendshipId } = z
        .object({ friendshipId: z.string().min(1) })
        .parse(req.params);

      await FriendService.declineFriendRequest(req.user!.id, friendshipId);

      res.status(200).json({
        success: true,
        message: "Friend request declined",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/friends/:friendId ─────────────────────────────────────────────
router.delete(
  "/:friendId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { friendId } = z
        .object({ friendId: z.string().min(1) })
        .parse(req.params);

      await FriendService.removeFriend(req.user!.id, friendId);

      res.status(200).json({
        success: true,
        message: "Friend removed",
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;