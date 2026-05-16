"use client";

import { motion } from "framer-motion";
import { Crown, Check, Clock, UserX } from "lucide-react";
import type { RoomPlayer } from "@/store/roomStore";

interface PlayerSlotProps {
  player?:    RoomPlayer;
  slot:       number;
  maxPlayers: number;
  isCurrentUser: boolean;
  isHost:     boolean;
  onKick?:    (userId: string) => void;
  canKick:    boolean;
}

export default function PlayerSlot({
  player,
  slot,
  isCurrentUser,
  isHost: viewerIsHost,
  onKick,
  canKick,
}: PlayerSlotProps) {
  const initials = player?.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Empty slot
  if (!player) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <span
            className="font-inter text-xs"
            style={{ color: "var(--muted)", opacity: 0.4 }}
          >
            {slot + 1}
          </span>
        </div>
        <span
          className="font-inter text-sm"
          style={{ color: "var(--muted)", opacity: 0.4 }}
        >
          Waiting for player...
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{
        background: isCurrentUser
          ? "rgba(0,168,255,0.06)"
          : "rgba(255,255,255,0.03)",
        border: isCurrentUser
          ? "1px solid rgba(0,168,255,0.15)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center
                     font-inter text-sm font-bold overflow-hidden"
          style={{
            background: player.avatarUrl
              ? "transparent"
              : "rgba(0,168,255,0.15)",
            border: "1px solid rgba(0,168,255,0.2)",
          }}
        >
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span style={{ color: "var(--neon)" }}>{initials}</span>
          )}
        </div>

        {/* Host crown */}
        {player.isHost && (
          <div
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                       flex items-center justify-center"
            style={{
              background: "#C8A97E",
              border: "1px solid rgba(200,169,126,0.5)",
            }}
          >
            <Crown size={9} style={{ color: "#000" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="font-inter text-sm font-semibold truncate"
            style={{
              color: isCurrentUser ? "var(--neon)" : "var(--primary)",
            }}
          >
            {player.displayName}
          </span>
          {isCurrentUser && (
            <span
              className="font-inter text-[9px] font-bold uppercase
                         tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                background: "rgba(0,168,255,0.15)",
                color: "var(--neon)",
              }}
            >
              You
            </span>
          )}
        </div>
        <span
          className="font-inter text-[11px]"
          style={{ color: "var(--muted)" }}
        >
          Level {player.level} · @{player.username}
        </span>
      </div>

      {/* Ready status + kick */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Ready indicator */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{
            background: player.isReady
              ? "rgba(34,197,94,0.1)"
              : "rgba(255,255,255,0.04)",
            border: player.isReady
              ? "1px solid rgba(34,197,94,0.2)"
              : "1px solid var(--border)",
          }}
        >
          {player.isReady ? (
            <Check size={10} style={{ color: "#22c55e" }} />
          ) : (
            <Clock size={10} style={{ color: "var(--muted)" }} />
          )}
          <span
            className="font-inter text-[10px] font-medium"
            style={{
              color: player.isReady ? "#22c55e" : "var(--muted)",
            }}
          >
            {player.isReady ? "Ready" : "Not Ready"}
          </span>
        </div>

        {/* Kick button (host only, not self) */}
        {canKick && viewerIsHost && !player.isHost && onKick && (
          <button
            onClick={() => onKick(player.userId)}
            className="w-6 h-6 flex items-center justify-center
                       rounded-lg transition-all cursor-pointer"
            style={{
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            title={`Kick ${player.displayName}`}
          >
            <UserX size={11} />
          </button>
        )}
      </div>
    </motion.div>
  );
}