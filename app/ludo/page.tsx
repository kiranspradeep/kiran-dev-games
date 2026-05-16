"use client";

import { useEffect } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LudoGame from "@/components/games/ludo/LudoGame";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LudoPage() {
  const router    = useRouter();
  const { currentRoom, matchId, isInRoom } = useRoomStore();

  // Must be in a room with an active match
  useEffect(() => {
    if (!isInRoom || !matchId) {
      router.replace("/arena");
    }
  }, [isInRoom, matchId, router]);

  if (!currentRoom || !matchId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--neon)",
          }}
        />
      </div>
    );
  }

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

      <main className="pt-20 pb-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-5 w-[2px] rounded-full"
                style={{ background: "var(--neon)" }}
              />
              <h1
                className="font-inter font-black text-xl"
                style={{ color: "var(--primary)" }}
              >
                Strategy Ludo
              </h1>
              <span
                className="font-inter text-xs font-bold px-2 py-0.5
                           rounded-full uppercase tracking-wider"
                style={{
                  background: currentRoom.isRanked
                    ? "rgba(200,169,126,0.1)"
                    : "rgba(0,168,255,0.08)",
                  border: currentRoom.isRanked
                    ? "1px solid rgba(200,169,126,0.3)"
                    : "1px solid rgba(0,168,255,0.2)",
                  color: currentRoom.isRanked
                    ? "var(--accent)"
                    : "var(--neon)",
                }}
              >
                {currentRoom.isRanked ? "Ranked" : "Casual"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="font-inter text-xs"
                style={{ color: "var(--muted)" }}
              >
                Room{" "}
                <span
                  style={{ color: "var(--neon)", fontWeight: 700 }}
                >
                  {currentRoom.code}
                </span>
              </span>
            </div>
          </motion.div>

          <LudoGame roomCode={currentRoom.code} matchId={matchId} />
        </div>
      </main>
    </div>
  );
}