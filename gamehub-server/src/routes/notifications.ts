import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import * as NotificationService from "../services/notification.service";

const router = Router();

router.use(authenticate);

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { unreadOnly, limit, offset } = z
        .object({
          unreadOnly: z
            .string()
            .optional()
            .transform((v) => v === "true"),
          limit: z
            .string()
            .optional()
            .default("20")
            .transform(Number)
            .pipe(z.number().min(1).max(50)),
          offset: z
            .string()
            .optional()
            .default("0")
            .transform(Number)
            .pipe(z.number().min(0)),
        })
        .parse(req.query);

      const result = await NotificationService.getUserNotifications(
        req.user!.id,
        { unreadOnly, limit, offset }
      );

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/notifications/unread-count ───────────────────────────────────────
router.get(
  "/unread-count",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.id);
      res.status(200).json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/notifications/read ─────────────────────────────────────────────
router.post(
  "/read",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = z
        .object({ ids: z.array(z.string()).min(1).max(50) })
        .parse(req.body);

      await NotificationService.markAsRead(req.user!.id, ids);
      res.status(200).json({ success: true, message: "Marked as read" });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/notifications/read-all ─────────────────────────────────────────
router.post(
  "/read-all",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/notifications/clear/read ─────────────────────────────────────
// IMPORTANT: This must come BEFORE /:id to avoid route conflict
router.delete(
  "/clear/read",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await NotificationService.clearReadNotifications(req.user!.id);
      res.status(200).json({
        success: true,
        message: "Read notifications cleared",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/notifications/:id ─────────────────────────────────────────────
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Explicit string cast — Express params are always strings at runtime
      const id = req.params["id"] as string;

      await NotificationService.deleteNotification(req.user!.id, id);
      res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;