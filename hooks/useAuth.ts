"use client";

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi, setAccessToken } from "@/lib/api";
import { getStoredRefreshToken, persistAuth } from "@/lib/auth-client";

// ── Boot auth from stored refresh token ───────────────────────────────────────
export function useAuthBoot() {
  const { setUser, clearUser, setLoading, isAuthenticated } = useAuthStore();

  const boot = useCallback(async () => {
    // Already authenticated in this session
    if (isAuthenticated) {
      setLoading(false);
      return;
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      setLoading(false);
      return;
    }

    try {
      // Try to get a fresh access token
      const refreshRes = await authApi.refresh(refreshToken);
      if (!refreshRes.success || !refreshRes.data) {
        throw new Error("Refresh failed");
      }

      persistAuth(refreshRes.data.tokens);

      // Fetch current user
      const meRes = await authApi.me();
      if (meRes.success && meRes.data) {
        setUser(meRes.data.user);
      } else {
        throw new Error("Could not fetch user");
      }
    } catch {
      clearUser();
    }
  }, [isAuthenticated, setUser, clearUser, setLoading]);

  useEffect(() => {
    boot();
  }, [boot]);

  // Listen for forced logout events (from API interceptor)
  useEffect(() => {
    const handleLogout = () => clearUser();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clearUser]);
}

// ── Convenience auth hook ─────────────────────────────────────────────────────
export function useAuth() {
  const { user, isAuthenticated, isLoading, isGuest } = useAuthStore();
  return { user, isAuthenticated, isLoading, isGuest };
}