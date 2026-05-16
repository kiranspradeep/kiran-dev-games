"use client";

import { motion } from "framer-motion";
import { Trophy, Gamepad2, TrendingUp, Target } from "lucide-react";
import type { PublicProfile } from "@/types/auth";
import { GAME_DISPLAY } from "@/lib/gameIdMap";
import { getTierColor } from "@/lib/auth-client";

interface ProfileStatsProps {
  profile: PublicProfile;
}

export default function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = profile.stats;
  const rankings = profile.rankings ?? [];

  const statCards = [
    {
      icon: <Gamepad2 size={18} />,
      label: "Games Played",
      value: stats?.totalGamesPlayed?.toLocaleString() ?? "0",
      color: "var(--neon)",
    },
    {
      icon: <Trophy size={18} />,
      label: "Total Wins",
      value: stats?.totalWins?.toLocaleString() ?? "0",
      color: "var(--accent)",
    },
    {
      icon: <TrendingUp size={18} />,
      label: "Win Rate",
      value:
        stats && stats.totalGamesPlayed > 0
          ? `${Math.round(stats.winRate)}%`
          : "—",
      color: "#22c55e",
    },
    {
      icon: <Target size={18} />,
      label: "Favourite Game",
      value: stats?.favoriteGame
        ? (GAME_DISPLAY[stats.favoriteGame]?.label ?? stats.favoriteGame)
        : "—",
      color: "#a855f7",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4 rounded-2xl text-center"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-center mb-2"
              style={{ color }}
            >
              {icon}
            </div>
            <div
              className="font-inter text-xl font-black mb-0.5"
              style={{ color: "var(--primary)" }}
            >
              {value}
            </div>
            <div
              className="font-inter text-[10px] uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rankings */}
      {rankings.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="font-inter text-[10px] uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            Ranked Performance
          </p>
          <div className="flex flex-col gap-2">
            {rankings.map((r, i) => {
              const game = GAME_DISPLAY[r.gameId];
              const color = getTierColor(r.tier);
              const total = r.wins + r.losses;
              const wr =
                total > 0
                  ? Math.round((r.wins / total) * 100)
                  : 0;

              return (
                <motion.div
                  key={r.gameId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <span className="text-lg">{game?.icon ?? "🎮"}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-inter text-sm font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {game?.label ?? r.gameId}
                    </p>
                    <p
                      className="font-inter text-[11px]"
                      style={{ color: "var(--muted)" }}
                    >
                      {r.wins}W {r.losses}L · {wr}% WR
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-inter text-sm font-bold"
                      style={{ color }}
                    >
                      {r.elo} ELO
                    </p>
                    <p
                      className="font-inter text-[11px] font-medium"
                      style={{ color }}
                    >
                      {r.tier}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}