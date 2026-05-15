"use client";

import { useEffect } from "react";
import { useAuthBoot } from "@/hooks/useAuth";
import { useSoundSync } from "@/hooks/useSound";
import { useSettingsStore } from "@/store/settingsStore";
import { useReducedMotion } from "@/hooks/useMediaQuery";

// ── Boots all global systems ──────────────────────────────────────────────────
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Boot auth from stored tokens
  useAuthBoot();

  // Keep sound manager in sync with settings
  useSoundSync();

  // Sync system reduced motion preference
  const prefersReducedMotion = useReducedMotion();
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion, setReducedMotion]);

  return <>{children}</>;
}