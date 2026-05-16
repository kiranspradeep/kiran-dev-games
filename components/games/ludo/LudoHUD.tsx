"use client";

import { motion } from "framer-motion";
import { Clock, Trophy } from "lucide-react";
import type { LudoPlayer, LudoColor } from "@/types/ludo";

interface LudoHUDProps {
  players:       LudoPlayer[];
  currentTurn:   string;
  turnTimeLeft:  number;
  turnTimeLimit: number;
  rankings:      string[];
  myUserId:      string;
}

const COLOR_HEX: Record<LudoColor, string> = {
  RED:    "#ef4444",
  GREEN:  "#22c55e",
  YELLOW: "#eab308",
  BLUE:   "#3b82f6",
};

const COLOR_NAMES: Record<LudoColor, string> = {
  RED:    "Red",
  GREEN:  "Green",
  YELLOW: "Yellow",
  BLUE:   "Blue",
};

export default function LudoHUD({
  players,
  currentTurn,
  turnTimeLeft,
  turnTimeLimit,
  rankings,
  myUserId,
}: LudoHUDProps) {
  const timePercent = (turnTimeLeft / turnTimeLimit) * 100;
  const isUrgent    = turnTimeLeft <= 10;

  return (
    <div className="flex flex-col gap-3">
      {/* Turn timer */}
      <div
        className="p-3 rounded-xl"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock
              size={12}
              style={{ color: isUrgent ? "#ef4444" : "var(--muted)" }}
            />
            <span
              className="font-inter text-[10px] uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Turn Timer
            </span>
          </div>
          <span
            className="font-inter text-sm font-black tabular-nums"
            style={{ color: isUrgent ? "#ef4444" : "var(--primary)" }}
          >
            {turnTimeLeft}s
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${timePercent}%`,
              background: isUrgent
                ? "#ef4444"
                : "linear-gradient(90deg, var(--neon), #0066cc)",
            }}
          />
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-col gap-2">
        {players.map((player) => {
          const isActive    = currentTurn === player.userId;
          const isMe        = player.userId === myUserId;
          const rank        = rankings.indexOf(player.userId);
          const isFinished  = rank !== -1;
          const hex         = COLOR_HEX[player.color];

          return (
            <motion.div
              key={player.userId}
              animate={
                isActive
                  ? { borderColor: `${hex}50` }
                  : { borderColor: "rgba(255,255,255,0.06)" }
              }
              className="p-3 rounded-xl transition-all duration-300"
              style={{
                background: isActive
                  ? `${hex}08`
                  : "var(--card)",
                border: isActive
                  ? `1px solid ${hex}40`
                  : "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2.5">
                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: hex,
                    boxShadow: isActive
                      ? `0 0 8px ${hex}80`
                      : "none",
                  }}
                />

                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                             font-inter text-[10px] font-bold shrink-0 overflow-hidden"
                  style={{
                    background: `${hex}20`,
                    border: `1px solid ${hex}30`,
                  }}
                >
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span style={{ color: hex }}>
                      {player.displayName[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-inter text-xs font-semibold truncate"
                      style={{
                        color: isActive ? hex : "var(--primary)",
                      }}
                    >
                      {player.displayName}
                    </span>
                    {isMe && (
                      <span
                        className="font-inter text-[9px] font-bold
                                   uppercase tracking-wider px-1 py-0.5
                                   rounded shrink-0"
                        style={{
                          background: `${hex}20`,
                          color: hex,
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <span
                    className="font-inter text-[10px]"
                    style={{ color: "var(--muted)" }}
                  >
                    {COLOR_NAMES[player.color]} ·{" "}
                    {player.piecesFinished}/4 home
                  </span>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {isFinished ? (
                    <div className="flex items-center gap-1">
                      <Trophy
                        size={12}
                        style={{ color: "var(--accent)" }}
                      />
                      <span
                        className="font-inter text-[10px] font-bold"
                        style={{ color: "var(--accent)" }}
                      >
                        #{rank + 1}
                      </span>
                    </div>
                  ) : isActive ? (
                    <span
                      className="font-inter text-[10px] font-bold
                                 animate-pulse"
                      style={{ color: hex }}
                    >
                      Active
                    </span>
                  ) : (
                    <div className="flex gap-0.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background:
                              i < player.piecesFinished
                                ? hex
                                : `${hex}25`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}