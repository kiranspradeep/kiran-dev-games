import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { ZodError } from "zod";

// ── Custom App Error ──────────────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Common Error Factories ────────────────────────────────────────────────────
export const Errors = {
  notFound: (resource: string = "Resource") =>
    new AppError(`${resource} not found`, 404, "NOT_FOUND"),

  unauthorized: (message: string = "Unauthorized") =>
    new AppError(message, 401, "UNAUTHORIZED"),

  forbidden: (message: string = "Forbidden") =>
    new AppError(message, 403, "FORBIDDEN"),

  badRequest: (message: string) =>
    new AppError(message, 400, "BAD_REQUEST"),

  conflict: (message: string) =>
    new AppError(message, 409, "CONFLICT"),

  internal: (message: string = "Internal server error") =>
    new AppError(message, 500, "INTERNAL_ERROR", false),
};

// ── Error Handler Middleware ──────────────────────────────────────────────────
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Unknown errors — don't leak details in production
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}

// ── 404 Handler ───────────────────────────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}