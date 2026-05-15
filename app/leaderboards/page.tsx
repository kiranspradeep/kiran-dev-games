"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { GAME_DISPLAY, LIVE_GAME_IDS } from "@/lib/gameIdMap";
import { Trophy } from "lucide-react";

export default function LeaderboardsPage() {
  const [selectedGame, setSelectedGame] = useState<string>(LIVE_GAME_IDS[0]);

  const gameInfo = GAME_DISPLAY[selectedGame];
  const gameColor = gameInfo?.color ?? "var(--neon)";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <Navbar />

      <div
        className="fixed top-[57px] left-0 right-0 z-30 h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--neon-dim), transparent)",
        }}
      />

      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-5 w-[2px] rounded-full"
                style={{ background: "var(--neon)" }}
              />
              <h1
                className="font-inter font-black text-3xl sm:text-4xl"
                style={{ color: "var(--primary)" }}
              >
                Leaderboards
              </h1>
            </div>
            <p
              className="font-inter text-sm ml-5"
              style={{ color: "var(--muted)" }}
            >
              Global rankings across all games. Updated in real-time.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Game selector sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full lg:w-52 shrink-0"
            >
              <div
                className="rounded-2xl p-2 sticky top-24"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="font-inter text-[10px] uppercase tracking-widest px-3
                             pt-2 pb-3"
                  style={{ color: "var(--muted)" }}
                >
                  Select Game
                </p>

                {/* Live games */}
                <div className="flex flex-col gap-1 mb-2">
                  {LIVE_GAME_IDS.map((id) => {
                    const info = GAME_DISPLAY[id];
                    const isActive = selectedGame === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedGame(id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                   font-inter text-sm font-medium transition-all
                                   duration-200 cursor-pointer text-left w-full"
                        style={{
                          background: isActive
                            ? `${info?.color ?? "var(--neon)"}15`
                            : "transparent",
                          color: isActive
                            ? info?.color ?? "var(--neon)"
                            : "var(--muted)",
                          border: isActive
                            ? `1px solid ${info?.color ?? "var(--neon)"}30`
                            : "1px solid transparent",
                        }}
                      >
                        <span className="text-base">{info?.icon}</span>
                        <span>{info?.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeGame"
                            className="ml-auto w-1.5 h-1.5 rounded-full"
                            style={{
                              background: info?.color ?? "var(--neon)",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Coming soon */}
                <div
                  className="h-px mb-2"
                  style={{ background: "var(--border)" }}
                />
                <p
                  className="font-inter text-[10px] uppercase tracking-widest
                             px-3 pb-2"
                  style={{ color: "var(--muted)" }}
                >
                  Coming Soon
                </p>
                {["STRATEGY_LUDO", "AIM_TRAINER"].map((id) => {
                  const info = GAME_DISPLAY[id];
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ opacity: 0.35 }}
                    >
                      <span className="text-base">{info?.icon ?? "🎮"}</span>
                      <span
                        className="font-inter text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        {info?.label ?? id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Leaderboard content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-1 min-w-0"
            >
              <LeaderboardTable gameId={selectedGame} />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}