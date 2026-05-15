"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "dark"; // extensible later
export type SoundVolume = 0 | 25 | 50 | 75 | 100;

interface SettingsState {
  // Audio
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: SoundVolume;
  musicVolume: SoundVolume;

  // Visual
  reducedMotion: boolean;
  showFps: boolean;

  // Gameplay
  showTimer: boolean;
  autoSaveScores: boolean;

  // Notifications
  notificationsEnabled: boolean;
  friendRequestAlerts: boolean;
  achievementAlerts: boolean;
  matchInviteAlerts: boolean;

  // Actions
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setSfxVolume: (v: SoundVolume) => void;
  setMusicVolume: (v: SoundVolume) => void;
  setReducedMotion: (v: boolean) => void;
  setShowFps: (v: boolean) => void;
  setShowTimer: (v: boolean) => void;
  setAutoSaveScores: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setFriendRequestAlerts: (v: boolean) => void;
  setAchievementAlerts: (v: boolean) => void;
  setMatchInviteAlerts: (v: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULTS = {
  soundEnabled: true,
  musicEnabled: false,
  sfxVolume: 75 as SoundVolume,
  musicVolume: 50 as SoundVolume,
  reducedMotion: false,
  showFps: false,
  showTimer: true,
  autoSaveScores: true,
  notificationsEnabled: true,
  friendRequestAlerts: true,
  achievementAlerts: true,
  matchInviteAlerts: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setMusicEnabled: (v) => set({ musicEnabled: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setShowFps: (v) => set({ showFps: v }),
      setShowTimer: (v) => set({ showTimer: v }),
      setAutoSaveScores: (v) => set({ autoSaveScores: v }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setFriendRequestAlerts: (v) => set({ friendRequestAlerts: v }),
      setAchievementAlerts: (v) => set({ achievementAlerts: v }),
      setMatchInviteAlerts: (v) => set({ matchInviteAlerts: v }),
      resetToDefaults: () => set(DEFAULTS),
    }),
    {
      name: "ksp-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);