"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { PublicProfile } from "@/types/auth";

interface ProfileAchievementsProps {
  profile: PublicProfile;
}

const RARITY_STYLES: Record<string, {
  bg: string; border: string; color: string; label: string
}> = {
  legendary: {
    bg: "rgba(200,169,126,0.1)",
    border: "rgba(200,169,126,0.3)",
    color: "#C8A97E",
    label: "Legendary",
  },
  epic: {
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.3)",
    color: "#a855f7",
    label: "Epic",
  },
  rare: {
    bg: "rgba(0,168,255,0.1)",
    border: "rgba(0,168,255,0.3)",
    color: "#00A8FF",
    label: "Rare",
  },
  common: {
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.1)",
    color: "var(--muted)",
    label: "Common",
  },
};

export default function ProfileAchievements({
  profile,
}: ProfileAchievementsProps) {
  const achievements = profile.recentAchievements ?? [];

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p
          className="font-inter text-[10px] uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          Recent Achievements
        </p>
        <Trophy size={14} style={{ color: "var(--accent)" }} />
      </div>

      {achievements.length === 0 ? (
        <div className="py-8 text-center">
          <Trophy
            size={28}
            className="mx-auto mb-2"
            style={{ color: "var(--muted)", opacity: 0.3 }}
          />
          <p
            className="font-inter text-sm"
            style={{ color: "var(--muted)" }}
          >
            No achievements yet
          </p>
          <p
            className="font-inter text-xs mt-1"
            style={{ color: "var(--muted)", opacity: 0.6 }}
          >
            Keep playing to unlock them
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {achievements.map((ach, i) => {
            const rarity =
              RARITY_STYLES[ach.rarity] ?? RARITY_STYLES.common;

            return (
              <motion.div
                key={ach.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="p-3 rounded-xl flex flex-col items-center
                           gap-1.5 text-center"
                style={{
                  background: rarity.bg,
                  border: `1px solid ${rarity.border}`,
                }}
                title={ach.title}
              >
                <span className="text-2xl">{ach.icon}</span>
                <p
                  className="font-inter text-[11px] font-semibold
                             leading-tight"
                  style={{ color: rarity.color }}
                >
                  {ach.title}
                </p>
                <span
                  className="font-inter text-[9px] uppercase tracking-wider"
                  style={{ color: rarity.color, opacity: 0.7 }}
                >
                  {rarity.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}