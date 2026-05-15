"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Hash } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";

interface PersonalBestCardProps {
  gameId: string;
  highScore: number | null;
  gamesPlayed: number;
  globalRank: number | null;
  gameColor: string;
  gameLabel: string;
}

export default function PersonalBestCard({
  highScore,
  gamesPlayed,
  globalRank,
  gameColor,
  gameLabel,
}: PersonalBestCardProps) {
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useUiStore();

  if (!isAuthenticated) {
    return (
      <div
        className="p-4 rounded-2xl flex items-center gap-4"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${gameColor}15`,
            border: `1px solid ${gameColor}30`,
          }}
        >
          <Trophy size={18} style={{ color: gameColor }} />
        </div>
        <div className="flex-1">
          <p
            className="font-inter text-sm font-semibold mb-0.5"
            style={{ color: "var(--primary)" }}
          >
            Your Best Score
          </p>
          <p
            className="font-inter text-xs"
            style={{ color: "var(--muted)" }}
          >
            <button
              onClick={() => openModal("auth", "login")}
              className="cursor-pointer font-semibold"
              style={{ color: "var(--neon)" }}
            >
              Sign in
            </button>{" "}
            to track your scores on the global leaderboard
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: <Trophy size={14} />,
      label: "Personal Best",
      value: highScore ? highScore.toLocaleString() : "—",
      color: gameColor,
    },
    {
      icon: <Hash size={14} />,
      label: "Global Rank",
      value: globalRank ? `#${globalRank}` : "—",
      color: "var(--neon)",
    },
    {
      icon: <TrendingUp size={14} />,
      label: "Games Played",
      value: gamesPlayed.toString(),
      color: "var(--accent)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${gameColor}08, transparent)`,
        border: `1px solid ${gameColor}20`,
      }}
    >
      <p
        className="font-inter text-[10px] uppercase tracking-widest mb-3"
        style={{ color: "var(--muted)" }}
      >
        Your Stats — {gameLabel}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon, label, value, color }) => (
          <div key={label} className="flex flex-col gap-1">
            <div
              className="flex items-center gap-1"
              style={{ color: "var(--muted)" }}
            >
              {icon}
              <span className="font-inter text-[10px]">{label}</span>
            </div>
            <p
              className="font-inter text-lg font-black tabular-nums"
              style={{ color }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}