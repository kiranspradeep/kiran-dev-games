"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LudoColor } from "@/types/ludo";

interface LudoDiceProps {
  value:     number | null;
  isRolling: boolean;
  canRoll:   boolean;
  onRoll:    () => void;
  color:     LudoColor;
  isMyTurn:  boolean;
}

const COLOR_MAP: Record<LudoColor, string> = {
  RED:    "#ef4444",
  GREEN:  "#22c55e",
  YELLOW: "#eab308",
  BLUE:   "#3b82f6",
};

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

export default function LudoDice({
  value,
  isRolling,
  canRoll,
  onRoll,
  color,
  isMyTurn,
}: LudoDiceProps) {
  const accentColor  = COLOR_MAP[color];
  const displayValue = isRolling
    ? Math.floor(Math.random() * 6) + 1
    : (value ?? 1);
  const dots         = DOT_POSITIONS[displayValue] ?? DOT_POSITIONS[1];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dice face */}
      <motion.button
        onClick={canRoll ? onRoll : undefined}
        disabled={!canRoll}
        whileTap={canRoll ? { scale: 0.9 } : {}}
        animate={
          isRolling
            ? { rotate: [0, 15, -15, 10, -10, 0] }
            : { rotate: 0 }
        }
        transition={
          isRolling
            ? { duration: 0.4, repeat: 2, ease: "easeInOut" }
            : { duration: 0.1 }
        }
        className="relative w-16 h-16 rounded-2xl cursor-pointer
                   disabled:cursor-not-allowed transition-all duration-200"
        style={{
          background: canRoll
            ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`
            : "rgba(255,255,255,0.04)",
          border: canRoll
            ? `2px solid ${accentColor}60`
            : "2px solid rgba(255,255,255,0.08)",
          boxShadow: canRoll
            ? `0 0 20px ${accentColor}30`
            : "none",
        }}
      >
        {/* Dots */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-2"
        >
          {dots.map(([cx, cy], i) => (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={8}
              fill={canRoll ? accentColor : "rgba(255,255,255,0.2)"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.15 }}
            />
          ))}
        </svg>
      </motion.button>

      {/* Label */}
      <p
        className="font-inter text-[11px] font-medium text-center"
        style={{ color: "var(--muted)" }}
      >
        {!isMyTurn
          ? "Waiting..."
          : canRoll
          ? "Click to roll"
          : isRolling
          ? "Rolling..."
          : value
          ? `Rolled ${value}`
          : "Roll!"}
      </p>
    </div>
  );
}