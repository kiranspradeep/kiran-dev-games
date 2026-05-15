import jwt from "jsonwebtoken";
import { env } from "../config/env";

// ── Token Payload Types ───────────────────────────────────────────────────────
export interface AccessTokenPayload {
  sub: string;       // userId
  username: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;       // userId
  sessionId: string;
  type: "refresh";
}

// ── Sign Tokens ───────────────────────────────────────────────────────────────
export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

// ── Verify Tokens ─────────────────────────────────────────────────────────────
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return decoded;
}

// ── Token Expiry Helpers ──────────────────────────────────────────────────────
export function getAccessTokenExpiry(): Date {
  // 15 minutes from now
  return new Date(Date.now() + 15 * 60 * 1000);
}

export function getRefreshTokenExpiry(): Date {
  // 7 days from now
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

// ── Extract token from header ─────────────────────────────────────────────────
export function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}