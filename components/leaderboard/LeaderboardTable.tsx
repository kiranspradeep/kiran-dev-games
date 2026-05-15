"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import LeaderboardRow from "./LeaderboardRow";
import PersonalBestCard from "./PersonalBestCard";
import { useAuthStore } from "@/store/authStore";
import { GAME_DISPLAY } from "@/lib/gameIdMap";

interface LeaderboardTableProps {
  gameId: string;
}

const ITEMS_PER_PAGE = 10;

export default function LeaderboardTable({ gameId }: LeaderboardTableProps) {
  const [mode, setMode] = useState<"scores" | "ranked">("scores");
  const [offset, setOffset] = useState(0);
  const { user } = useAuthStore();

  const { data, isLoading, isError, refetch, isFetching } = useLeaderboard(
    gameId,
    { mode, limit: ITEMS_PER_PAGE, offset }
  );

  const gameInfo = GAME_DISPLAY[gameId];
  const gameColor = gameInfo?.color ?? "var(--neon)";
  const entries = data?.entries ?? [];
  const stats = data?.stats;
  const userContext = data?.userContext;

  const canGoBack = offset > 0;
  const canGoNext = entries.length === ITEMS_PER_PAGE;

  const handlePageBack = () => {
    setOffset((o) => Math.max(0, o - ITEMS_PER_PAGE));
  };

  const handlePageNext = () => {
    setOffset((o) => o + ITEMS_PER_PAGE);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: `${gameColor}15`,
              border: `1px solid ${gameColor}30`,
            }}
          >
            {gameInfo?.icon ?? "🎮"}
          </div>
          <div>
            <h2
              className="font-inter text-lg font-black"
              style={{ color: "var(--primary)" }}
            >
              {gameInfo?.label ?? gameId}
            </h2>
            <p
              className="font-inter text-[11px]"
              style={{ color: "var(--muted)" }}
            >
              {gameInfo?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div
            className="flex p-1 rounded-lg gap-1"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {(["scores", "ranked"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setOffset(0); }}
                className="px-3 py-1.5 rounded-md font-inter text-xs font-medium
                           capitalize transition-all duration-200 cursor-pointer"
                style={{
                  background:
                    mode === m ? `${gameColor}15` : "transparent",
                  color: mode === m ? gameColor : "var(--muted)",
                  border: mode === m ? `1px solid ${gameColor}30` : "1px solid transparent",
                }}
              >
                {m === "scores" ? "High Scores" : "Ranked ELO"}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       transition-all duration-200 cursor-pointer"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
          >
            <RefreshCw
              size={13}
              className={isFetching ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Game stats strip */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon: <Users size={12} />,
              label: "Players",
              value: stats.totalPlayers.toLocaleString(),
            },
            {
              icon: <Trophy size={12} />,
              label: "Top Score",
              value: stats.topScore.toLocaleString(),
            },
            {
              icon: <Trophy size={12} />,
              label: "Record Holder",
              value: stats.topScoreHolder
                ? `@${stats.topScoreHolder}`
                : "—",
            },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="p-3 rounded-xl text-center"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="flex items-center justify-center gap-1 mb-1"
                style={{ color: "var(--muted)" }}
              >
                {icon}
                <span className="font-inter text-[10px]">{label}</span>
              </div>
              <p
                className="font-inter text-sm font-bold truncate"
                style={{ color: "var(--primary)" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Personal best card */}
      <PersonalBestCard
        gameId={gameId}
        highScore={userContext?.highScore ?? null}
        gamesPlayed={userContext?.gamesPlayed ?? 0}
        globalRank={userContext?.rank ?? null}
        gameColor={gameColor}
        gameLabel={gameInfo?.label ?? gameId}
      />

      {/* Leaderboard entries */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Table header */}
        <div
          className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase
                     tracking-widest font-inter font-semibold"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          <span className="w-8 text-center">Rank</span>
          <span className="w-8" />
          <span className="flex-1">Player</span>
          <span className="text-right">
            {mode === "scores" ? "Score" : "ELO"}
          </span>
          {mode === "ranked" && (
            <span className="hidden sm:block text-right" style={{ minWidth: 48 }}>
              Win Rate
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="py-12 text-center">
            <p
              className="font-inter text-sm"
              style={{ color: "var(--muted)" }}
            >
              Failed to load leaderboard
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 font-inter text-xs cursor-pointer"
              style={{ color: "var(--neon)" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Entries */}
        {!isLoading && !isError && (
          <AnimatePresence mode="wait">
            <div className="p-2">
              {entries.length === 0 ? (
                <div className="py-12 text-center">
                  <p
                    className="font-inter text-sm mb-1"
                    style={{ color: "var(--primary)" }}
                  >
                    No scores yet
                  </p>
                  <p
                    className="font-inter text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    Be the first to set a record!
                  </p>
                </div>
              ) : (
                entries.map(
                  (
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
                    },
                    i: number
                  ) => (
                    <LeaderboardRow
                      key={entry.userId}
                      entry={entry}
                      index={i}
                      mode={mode}
                      gameColor={gameColor}
                    />
                  )
                )
              )}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {(canGoBack || canGoNext) && !isLoading && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              onClick={handlePageBack}
              disabled={!canGoBack}
              className="flex items-center gap-1 font-inter text-xs
                         transition-all cursor-pointer disabled:opacity-30
                         disabled:cursor-not-allowed"
              style={{ color: "var(--muted)" }}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span
              className="font-inter text-xs"
              style={{ color: "var(--muted)" }}
            >
              #{offset + 1} – #{offset + entries.length}
            </span>
            <button
              onClick={handlePageNext}
              disabled={!canGoNext}
              className="flex items-center gap-1 font-inter text-xs
                         transition-all cursor-pointer disabled:opacity-30
                         disabled:cursor-not-allowed"
              style={{ color: "var(--muted)" }}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}