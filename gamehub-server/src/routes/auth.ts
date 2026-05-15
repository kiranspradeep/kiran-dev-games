// src/routes/auth.ts
import { Router, Request, Response, NextFunction } from "express";
import { authLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/authenticate";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/auth.validators";
import * as AuthService from "../services/auth.service";
import { hashPassword, comparePassword } from "../lib/hash";
import { Errors } from "../middleware/errorHandler";
import prisma from "../lib/prisma";

const router = Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  "/register",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = registerSchema.parse(req.body);
      const result = await AuthService.register(
        input,
        req.ip,
        req.headers["user-agent"]
      );

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  "/login",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await AuthService.login(
        input,
        req.ip,
        req.headers["user-agent"]
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const tokens = await AuthService.refresh(refreshToken);

      res.status(200).json({
        success: true,
        data: { tokens },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post(
  "/logout",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await AuthService.logout(req.user!.id);
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await AuthService.getCurrentUser(req.user!.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/auth/profile ───────────────────────────────────────────────────
router.patch(
  "/profile",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateProfileSchema.parse(req.body);
      const { updateProfile } = await import("../services/user.service");
      const updated = await updateProfile(req.user!.id, input);

      res.status(200).json({
        success: true,
        message: "Profile updated",
        data: { user: updated },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/change-password ────────────────────────────────────────────
router.post(
  "/change-password",
  authenticate,
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } =
        changePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { passwordHash: true },
      });

      if (!user?.passwordHash) {
        throw Errors.badRequest("Cannot change password for OAuth accounts");
      }

      const valid = await comparePassword(currentPassword, user.passwordHash);
      if (!valid) {
        throw Errors.unauthorized("Current password is incorrect");
      }

      const newHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { passwordHash: newHash },
      });

      // Invalidate all sessions
      await AuthService.logout(req.user!.id);

      res.status(200).json({
        success: true,
        message: "Password changed. Please log in again.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/check-username ──────────────────────────────────────────────
router.get(
  "/check-username/:username",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Express route params are always string — cast explicitly to satisfy TS
      const raw = req.params["username"] as string;
      const username = raw.toLowerCase();

      if (username.length < 3 || username.length > 20) {
        res.status(200).json({
          success: true,
          data: { available: false, reason: "Invalid length" },
        });
        return;
      }

      const existing = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      res.status(200).json({
        success: true,
        data: { available: !existing },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

// import { Router, Request, Response, NextFunction } from "express";
// import { authLimiter } from "../middleware/rateLimiter";
// import { authenticate } from "../middleware/authenticate";
// import {
//   registerSchema,
//   loginSchema,
//   refreshSchema,
//   changePasswordSchema,
//   updateProfileSchema,
// } from "../validators/auth.validators";
// import * as AuthService from "../services/auth.service";
// import { hashPassword, comparePassword } from "../lib/hash";
// import { Errors } from "../middleware/errorHandler";
// import prisma from "../lib/prisma";

// const router = Router();

// // ── POST /api/auth/register ───────────────────────────────────────────────────
// router.post(
//   "/register",
//   authLimiter,
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const input = registerSchema.parse(req.body);
//       const result = await AuthService.register(
//         input,
//         req.ip,
//         req.headers["user-agent"]
//       );

//       res.status(201).json({
//         success: true,
//         message: "Account created successfully",
//         data: result,
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ── POST /api/auth/login ──────────────────────────────────────────────────────
// router.post(
//   "/login",
//   authLimiter,
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const input = loginSchema.parse(req.body);
//       const result = await AuthService.login(
//         input,
//         req.ip,
//         req.headers["user-agent"]
//       );

//       res.status(200).json({
//         success: true,
//         message: "Login successful",
//         data: result,
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ── POST /api/auth/refresh ────────────────────────────────────────────────────
// router.post(
//   "/refresh",
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { refreshToken } = refreshSchema.parse(req.body);
//       const tokens = await AuthService.refresh(refreshToken);

//       res.status(200).json({
//         success: true,
//         data: { tokens },
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ── POST /api/auth/logout ─────────────────────────────────────────────────────
// router.post(
//   "/logout",
//   authenticate,
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       await AuthService.logout(req.user!.id);
//       res.status(200).json({
//         success: true,
//         message: "Logged out successfully",
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ── GET /api/auth/me ──────────────────────────────────────────────────────────
// router.get(
//   "/me",
//   authenticate,
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const user = await AuthService.getCurrentUser(req.user!.id);
//       res.status(200).json({
//         success: true,
//         data: { user },
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ── PATCH /api/auth/profile ───────────────────────────────────────────────────
// router.patch(
//   "/profile",
//   authenticate,
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const input = updateProfileSchema.parse(req.body);
//       const { updateProfile } = await import("../services/user.service");
//       const updated = await updateProfile(req.user!.id, input);

//       res.status(200).json({
//         success: true,
//         message: "Profile updated",
//         data: { user: updated },
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ── POST /api/auth/change-password ────────────────────────────────────────────
// router.post(
//   "/change-password",
//   authenticate,
//   authLimiter,
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { currentPassword, newPassword } =
//         changePasswordSchema.parse(req.body);

//       const user = await prisma.user.findUnique({
//         where: { id: req.user!.id },
//         select: { passwordHash: true },
//       });

//       if (!user?.passwordHash) {
//         throw Errors.badRequest(
//           "Cannot change password for OAuth accounts"
//         );
//       }

//       const valid = await comparePassword(currentPassword, user.passwordHash);
//       if (!valid) {
//         throw Errors.unauthorized("Current password is incorrect");
//       }

//       const newHash = await hashPassword(newPassword);
//       await prisma.user.update({
//         where: { id: req.user!.id },
//         data: { passwordHash: newHash },
//       });

//       // Invalidate all sessions
//       await AuthService.logout(req.user!.id);

//       res.status(200).json({
//         success: true,
//         message: "Password changed. Please log in again.",
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // ── GET /api/auth/check-username ──────────────────────────────────────────────
// router.get(
//   "/check-username/:username",
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const username = req.params.username.toLowerCase();

//       if (username.length < 3 || username.length > 20) {
//         res.status(200).json({
//           success: true,
//           data: { available: false, reason: "Invalid length" },
//         });
//         return;
//       }

//       const existing = await prisma.user.findUnique({
//         where: { username },
//         select: { id: true },
//       });

//       res.status(200).json({
//         success: true,
//         data: { available: !existing },
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// export default router;