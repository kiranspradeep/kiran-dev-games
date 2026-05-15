"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  gameId: string;
}

export default function LeaderboardsClientPage({ gameId }: Props) {
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
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <Link
              href="/leaderboards"
              className="flex items-center gap-1.5 font-inter text-xs
                         transition-colors mb-4"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--neon)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <ChevronLeft size={14} />
              All Leaderboards
            </Link>
          </motion.div>
          <LeaderboardTable gameId={gameId} />
        </div>
      </main>
    </div>
  );
}