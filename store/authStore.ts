"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/auth";
import { clearAuth } from "@/lib/auth-client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setGuest: (isGuest: boolean) => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isGuest: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isGuest: false,
        }),

      clearUser: () => {
        clearAuth();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isGuest: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setGuest: (isGuest) =>
        set({
          isGuest,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: "ksp-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist user data, not loading states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    }
  )
);