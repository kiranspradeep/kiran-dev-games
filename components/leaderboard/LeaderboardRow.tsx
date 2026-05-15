"use client";

import { motion } from "framer-motion";
import RankBadge from "./RankBadge";
import { useAuthStore } from "@/store/authStore";

interface LeaderboardRowProps {
  entry: {
    rank: number;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    level: number;
    score?: number;
    elo?: number;
    tier?: string;
    tierColor?: string;
    wins?: number;
    losses?: number;
    winRate?: number;
    achievedAt?: Date | string;
  };
  index: number;
  mode: "scores" | "ranked";
  gameColor: string;
}

export default function LeaderboardRow({
  entry,
  index,
  mode,
  gameColor,
}: LeaderboardRowProps) {
  const { user } = useAuthStore();
  const isCurrentUser = user?.id === entry.userId;

  const initials = entry.displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
      style={{
        background: isCurrentUser
          ? "rgba(0,168,255,0.06)"
          : index % 2 === 0
          ? "transparent"
          : "rgba(255,255,255,0.015)",
        border: isCurrentUser
          ? "1px solid rgba(0,168,255,0.15)"
          : "1px solid transparent",
      }}
    >
      {/* Rank */}
      <RankBadge rank={entry.rank} size="sm" />

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   font-inter text-[11px] font-bold shrink-0 overflow-hidden"
        style={{
          background: entry.avatarUrl
            ? "transparent"
            : `${gameColor}22`,
          border: `1px solid ${gameColor}33`,
        }}
      >
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span style={{ color: gameColor }}>{initials}</span>
        )}
      </div>

      {/* Name + username */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="font-inter text-sm font-semibold truncate"
            style={{
              color: isCurrentUser ? "var(--neon)" : "var(--primary)",
            }}
          >
            {entry.displayName}
          </p>
          {isCurrentUser && (
            <span
              className="font-inter text-[9px] font-bold uppercase tracking-wider
                         px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                background: "rgba(0,168,255,0.15)",
                color: "var(--neon)",
              }}
            >
              You
            </span>
          )}
        </div>
        <p
          className="font-inter text-[10px] truncate"
          style={{ color: "var(--muted)" }}
        >
          @{entry.username} · Lvl {entry.level}
        </p>
      </div>

      {/* Score or ELO */}
      <div className="text-right shrink-0">
        {mode === "scores" && entry.score !== undefined && (
          <p
            className="font-inter text-sm font-bold tabular-nums"
            style={{ color: entry.rank <= 3 ? gameColor : "var(--primary)" }}
          >
            {entry.score.toLocaleString()}
          </p>
        )}
        {mode === "ranked" && entry.elo !== undefined && (
          <div className="flex flex-col items-end gap-0.5">
            <p
              className="font-inter text-sm font-bold tabular-nums"
              style={{ color: entry.tierColor ?? "var(--primary)" }}
            >
              {entry.elo}
            </p>
            <p
              className="font-inter text-[10px] font-medium"
              style={{ color: entry.tierColor ?? "var(--muted)" }}
            >
              {entry.tier}
            </p>
          </div>
        )}
      </div>

      {/* Win rate (ranked only) */}
      {mode === "ranked" && entry.winRate !== undefined && (
        <div
          className="hidden sm:flex flex-col items-end shrink-0"
          style={{ minWidth: 48 }}
        >
          <p
            className="font-inter text-[11px] font-medium"
            style={{ color: "var(--muted)" }}
          >
            {entry.winRate}% WR
          </p>
          <p
            className="font-inter text-[10px]"
            style={{ color: "var(--muted)" }}
          >
            {entry.wins}W {entry.losses}L
          </p>
        </div>
      )}
    </motion.div>
  );
}