"use client";

import { useEffect } from "react";
import { useAuthBoot } from "@/hooks/useAuth";
import { useSoundSync } from "@/hooks/useSound";
import { useSettingsStore } from "@/store/settingsStore";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { useSocketConnection } from "@/hooks/useSocket";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthBoot();
  useSoundSync();
  useSocketConnection();   // ← NEW

  const prefersReducedMotion = useReducedMotion();
  const setReducedMotion    = useSettingsStore((s) => s.setReducedMotion);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion, setReducedMotion]);

  return <>{children}</>;
}