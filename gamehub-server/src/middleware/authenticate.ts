import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractBearerToken } from "../lib/jwt";
import { Errors } from "./errorHandler";
import prisma from "../lib/prisma";

// ── Augment Express Request ───────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

// ── Require authentication ────────────────────────────────────────────────────
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw Errors.unauthorized("No token provided");
    }

    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true, status: true },
    });

    if (!user) {
      throw Errors.unauthorized("User not found");
    }

    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      throw Errors.forbidden("Account suspended or banned");
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err: unknown) {
    // JWT errors
    if (
      err instanceof Error &&
      (err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError" ||
        err.name === "NotBeforeError")
    ) {
      next(Errors.unauthorized("Invalid or expired token"));
      return;
    }
    next(err);
  }
}

// ── Optional auth (guest-aware) ───────────────────────────────────────────────
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true, status: true },
    });

    if (user && user.status === "ACTIVE") {
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    }

    next();
  } catch {
    // Silently ignore auth errors for optional routes
    next();
  }
}

// ── Require specific role ─────────────────────────────────────────────────────
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(Errors.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(Errors.forbidden("Insufficient permissions"));
      return;
    }
    next();
  };
}