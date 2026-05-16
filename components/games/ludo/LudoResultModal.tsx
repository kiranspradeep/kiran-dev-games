"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import type { LudoPlayer } from "@/types/ludo";
import { useAuthStore } from "@/store/authStore";

interface LudoResultModalProps {
  players:  LudoPlayer[];
  rankings: string[];
  winner:   string | null;
  onPlayAgain?: () => void;
}

const PLACEMENT_COLORS = ["#C8A97E", "#94a3b8", "#cd7f32", "#4a4a6a"];
const PLACEMENT_LABELS = ["1st 🥇", "2nd 🥈", "3rd 🥉", "4th"];

const COLOR_HEX: Record<string, string> = {
  RED:    "#ef4444",
  GREEN:  "#22c55e",
  YELLOW: "#eab308",
  BLUE:   "#3b82f6",
};

export default function LudoResultModal({
  players,
  rankings,
  winner,
  onPlayAgain,
}: LudoResultModalProps) {
  const { user } = useAuthStore();
  const isWinner = winner === user?.id;

  const orderedPlayers = rankings
    .map((uid) => players.find((p) => p.userId === uid))
    .filter(Boolean) as LudoPlayer[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top accent */}
        <div
          className="h-[2px]"
          style={{
            background: isWinner
              ? "linear-gradient(90deg, var(--accent), #e8c98a)"
              : "linear-gradient(90deg, var(--neon), #0066cc)",
          }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-5xl mb-3"
            >
              {isWinner ? "🏆" : "🎮"}
            </motion.div>
            <h2
              className="font-inter text-xl font-black mb-1"
              style={{ color: "var(--primary)" }}
            >
              {isWinner ? "Victory!" : "Game Over"}
            </h2>
            <p
              className="font-inter text-sm"
              style={{ color: "var(--muted)" }}
            >
              {isWinner
                ? "You finished first!"
                : `${orderedPlayers[0]?.displayName ?? "Player"} won`}
            </p>
          </div>

          {/* Rankings */}
          <div className="flex flex-col gap-2 mb-6">
            {orderedPlayers.map((player, i) => {
              const isMe        = player.userId === user?.id;
              const hex         = COLOR_HEX[player.color];
              const placement   = PLACEMENT_COLORS[i];
              const label       = PLACEMENT_LABELS[i];

              return (
                <motion.div
                  key={player.userId}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: isMe
                      ? "rgba(0,168,255,0.06)"
                      : "rgba(255,255,255,0.03)",
                    border: isMe
                      ? "1px solid rgba(0,168,255,0.15)"
                      : "1px solid transparent",
                  }}
                >
                  {/* Rank */}
                  <span
                    className="font-inter text-sm font-black shrink-0 w-8 text-center"
                    style={{ color: placement }}
                  >
                    {label.split(" ")[0]}
                  </span>

                  {/* Color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: hex }}
                  />

                  {/* Name */}
                  <span
                    className="font-inter text-sm font-semibold flex-1"
                    style={{
                      color: isMe ? "var(--neon)" : "var(--primary)",
                    }}
                  >
                    {player.displayName}
                    {isMe && (
                      <span
                        className="ml-1.5 text-[10px] font-normal"
                        style={{ color: "var(--muted)" }}
                      >
                        (you)
                      </span>
                    )}
                  </span>

                  {/* Medal */}
                  <span className="text-lg shrink-0">
                    {label.split(" ")[1]}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="flex-1 flex items-center justify-center gap-2
                           py-2.5 rounded-xl font-inter text-sm font-bold
                           transition-all cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, var(--neon), #0066cc)",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(0,168,255,0.2)",
                }}
              >
                <RotateCcw size={14} />
                Play Again
              </button>
            )}

            <Link
              href="/arena"
              className="flex-1 flex items-center justify-center gap-2
                         py-2.5 rounded-xl font-inter text-sm font-medium
                         transition-all cursor-pointer"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
            >
              <Home size={14} />
              Arena
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}