"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { configureSoundManager, playSound, Sound } from "@/lib/sound";
import type { SoundEvent } from "@/lib/sound";

// ── Sync settings → sound manager ────────────────────────────────────────────
export function useSoundSync() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const sfxVolume    = useSettingsStore((s) => s.sfxVolume);

  useEffect(() => {
    configureSoundManager({
      sfxEnabled: soundEnabled,
      sfxVolume:  sfxVolume / 100,
    });
  }, [soundEnabled, sfxVolume]);
}

// ── Hook for playing sounds ───────────────────────────────────────────────────
export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  return {
    play: (event: SoundEvent) => {
      if (soundEnabled) playSound(event);
    },
    Sound,
    enabled: soundEnabled,
  };
}