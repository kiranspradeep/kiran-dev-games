import { setAccessToken } from "./api";
import type { User, AuthResponse } from "@/types/auth";

const REFRESH_TOKEN_KEY = "ksp_refresh_token";

// ── Persist tokens ────────────────────────────────────────────────────────────
export function persistAuth(tokens: AuthResponse["tokens"]): void {
  setAccessToken(tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuth(): void {
  setAccessToken(null);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// ── Avatar fallback ───────────────────────────────────────────────────────────
export function getAvatarFallback(user: Pick<User, "displayName">): string {
  return user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── XP helpers ────────────────────────────────────────────────────────────────
export function getLevelLabel(level: number): string {
  if (level >= 50) return "Legend";
  if (level >= 30) return "Expert";
  if (level >= 20) return "Advanced";
  if (level >= 10) return "Skilled";
  if (level >= 5)  return "Rookie";
  return "Newcomer";
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    GRANDMASTER: "#ff4655",
    MASTER:      "#a855f7",
    DIAMOND:     "#00A8FF",
    PLATINUM:    "#06b6d4",
    GOLD:        "#C8A97E",
    SILVER:      "#94a3b8",
    BRONZE:      "#cd7f32",
  };
  return colors[tier] ?? "#4a4a6a";
}

