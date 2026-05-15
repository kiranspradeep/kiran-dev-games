"use client";

import { create } from "zustand";

export type ModalType = "auth" | "settings" | "confirm" | null;
export type AuthModalTab = "login" | "signup";
export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface UiState {
  // Modal
  activeModal: ModalType;
  authModalTab: AuthModalTab;
  openModal: (type: ModalType, tab?: AuthModalTab) => void;
  closeModal: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Sound
  soundEnabled: boolean;
  toggleSound: () => void;

  // Theme
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  // Modal
  activeModal: null,
  authModalTab: "login",

  openModal: (type, tab = "login") =>
    set({ activeModal: type, authModalTab: tab }),

  closeModal: () => set({ activeModal: null }),

  // Toasts
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto remove
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Sound
  soundEnabled: true,
  toggleSound: () =>
    set((state) => ({ soundEnabled: !state.soundEnabled })),

  // Motion
  reducedMotion: false,
  setReducedMotion: (v) => set({ reducedMotion: v }),
}));

// ── Convenience hook for toasts ───────────────────────────────────────────────
export function useToast() {
  const addToast = useUiStore((s) => s.addToast);

  return {
    success: (title: string, message?: string) =>
      addToast({ type: "success", title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: "error", title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: "warning", title, message }),
  };
}