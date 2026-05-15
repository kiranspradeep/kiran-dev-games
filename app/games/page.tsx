"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import GameCard from "@/components/GameCard";
import {
  Gamepad2,
  Swords,
  Brain,
  Zap,
  Filter,
  Search,
  LayoutGrid,
  List,
  X,
} from "lucide-react";

// ── Game Data ───────────────────────────────────────────────────────────────
interface GameEntry {
  id: string;
  title: string;
  description: string;
  href?: string;
  tag: string;
  difficulty: "Easy" | "Medium" | "Hard";
  players: string;
  tags: string[];
  comingSoon?: boolean;
  category: "classic" | "multiplayer" | "training" | "physics";
}

const ALL_GAMES: GameEntry[] = [
  {
    id: "snake",
    title: "Snake",
    description:
      "Eat, grow, survive. Speed ramps with every meal. One wrong turn ends it.",
    href: "/snake",
    tag: "Classic",
    difficulty: "Medium",
    players: "1P",
    tags: ["Reflex", "Speed", "Solo"],
    category: "classic",
  },
  {
    id: "pacman",
    title: "Pac-Man",
    description:
      "Navigate the maze. Eat every dot. Power pellets flip the script on ghosts.",
    href: "/pacman",
    tag: "Arcade",
    difficulty: "Medium",
    players: "1P",
    tags: ["Strategy", "Arcade", "Solo"],
    category: "classic",
  },
  {
    id: "2048",
    title: "2048",
    description: "Slide tiles, merge numbers. Reach 2048 — then push beyond.",
    href: "/2048",
    tag: "Strategy",
    difficulty: "Hard",
    players: "1P",
    tags: ["Puzzle", "Math", "Solo"],
    category: "classic",
  },
  {
    id: "wordle",
    title: "Wordle",
    description:
      "Five letters. Six attempts. Each guess reveals the hidden word.",
    href: "/wordle",
    tag: "Word",
    difficulty: "Easy",
    players: "1P",
    tags: ["Word", "Daily", "Solo"],
    category: "classic",
  },
  {
    id: "strategy-ludo",
    title: "Strategy Ludo",
    description:
      "A fully reimagined Ludo with ranked competitive modes, real-time matchmaking, and tactical depth.",
    tag: "Multiplayer",
    difficulty: "Hard",
    players: "2–4P",
    tags: ["Ranked", "Realtime", "Strategy"],
    comingSoon: true,
    category: "multiplayer",
  },
  {
    id: "battle-snake",
    title: "Battle Snake & Ladder",
    description:
      "Fantasy-themed multiplayer Snake & Ladder with combat mechanics and real-time battles.",
    tag: "Multiplayer",
    difficulty: "Medium",
    players: "2–4P",
    tags: ["Fantasy", "Multiplayer", "Battle"],
    comingSoon: true,
    category: "multiplayer",
  },
  {
    id: "aim-trainer",
    title: "Aim Trainer",
    description:
      "Precision targeting system. Train reaction speed, flicking, and tracking with ranked scoring.",
    tag: "Training",
    difficulty: "Hard",
    players: "1P",
    tags: ["Precision", "Ranked", "Training"],
    comingSoon: true,
    category: "training",
  },
  {
    id: "rope-swing",
    title: "Rope Swing",
    description:
      "Physics-based momentum platformer. Swing, release, fly. Built on a custom physics engine.",
    tag: "Physics",
    difficulty: "Medium",
    players: "1P",
    tags: ["Physics", "Platformer", "Skill"],
    comingSoon: true,
    category: "physics",
  },
  {
    id: "destruction",
    title: "Destruction Sandbox",
    description:
      "Interactive physics destruction environment. Wrecking balls, explosions, structural collapse.",
    tag: "Physics",
    difficulty: "Easy",
    players: "1P",
    tags: ["Physics", "Sandbox", "Destruction"],
    comingSoon: true,
    category: "physics",
  },
];

type CategoryFilter = "all" | "classic" | "multiplayer" | "training" | "physics";
type DifficultyFilter = "all" | "Easy" | "Medium" | "Hard";
type StatusFilter = "all" | "live" | "coming-soon";
type SortOption = "name" | "difficulty" | "status";

const CATEGORIES: { key: CategoryFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All Games", icon: <LayoutGrid size={14} /> },
  { key: "classic", label: "Classic", icon: <Gamepad2 size={14} /> },
  { key: "multiplayer", label: "Multiplayer", icon: <Swords size={14} /> },
  { key: "training", label: "Training", icon: <Zap size={14} /> },
  { key: "physics", label: "Physics", icon: <Brain size={14} /> },
];

export default function GamesPage() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("status");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...ALL_GAMES];

    // Category
    if (category !== "all") {
      result = result.filter((g) => g.category === category);
    }

    // Difficulty
    if (difficulty !== "all") {
      result = result.filter((g) => g.difficulty === difficulty);
    }

    // Status
    if (status === "live") {
      result = result.filter((g) => !g.comingSoon);
    } else if (status === "coming-soon") {
      result = result.filter((g) => g.comingSoon);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "difficulty") {
        const order = { Easy: 0, Medium: 1, Hard: 2 };
        return order[a.difficulty] - order[b.difficulty];
      }
      // status: live first
      const aLive = a.comingSoon ? 1 : 0;
      const bLive = b.comingSoon ? 1 : 0;
      return aLive - bLive;
    });

    return result;
  }, [category, difficulty, status, search, sort]);

  const liveCount = ALL_GAMES.filter((g) => !g.comingSoon).length;
  const soonCount = ALL_GAMES.filter((g) => g.comingSoon).length;
  const hasActiveFilters =
    category !== "all" || difficulty !== "all" || status !== "all" || search.trim() !== "";

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Top accent */}
      <div
        className="fixed top-[57px] left-0 right-0 z-30 h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--neon-dim), transparent)",
        }}
      />

      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-5 w-[2px] rounded-full"
                style={{ background: "var(--neon)" }}
              />
              <h1
                className="font-inter font-black text-3xl sm:text-4xl"
                style={{ color: "var(--primary)" }}
              >
                Game Library
              </h1>
            </div>
            <p
              className="font-inter text-sm max-w-xl"
              style={{ color: "var(--muted)" }}
            >
              Browse all available and upcoming games. Filter by category,
              difficulty, or status.
            </p>

            {/* Stats strip */}
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#22c55e" }}
                />
                <span
                  className="font-inter text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  {liveCount} Live
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--neon)" }}
                />
                <span
                  className="font-inter text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  {soonCount} In Development
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
                <span
                  className="font-inter text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  {ALL_GAMES.length} Total
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Filters Bar ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                             font-inter text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background:
                      category === cat.key
                        ? "rgba(0,168,255,0.12)"
                        : "var(--card)",
                    border:
                      category === cat.key
                        ? "1px solid rgba(0,168,255,0.3)"
                        : "1px solid var(--border)",
                    color:
                      category === cat.key ? "var(--neon)" : "var(--muted)",
                  }}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search + filter toggle + sort */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px] max-w-sm"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <Search size={14} style={{ color: "var(--muted)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search games..."
                  className="bg-transparent border-none outline-none font-inter text-xs w-full"
                  style={{ color: "var(--primary)" }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="cursor-pointer"
                  >
                    <X size={12} style={{ color: "var(--muted)" }} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                           font-inter text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: showFilters
                    ? "rgba(0,168,255,0.12)"
                    : "var(--card)",
                  border: showFilters
                    ? "1px solid rgba(0,168,255,0.3)"
                    : "1px solid var(--border)",
                  color: showFilters ? "var(--neon)" : "var(--muted)",
                }}
              >
                <Filter size={14} />
                Filters
                {hasActiveFilters && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: "var(--neon)",
                      color: "var(--background)",
                    }}
                  >
                    !
                  </span>
                )}
              </button>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="px-3 py-2 rounded-lg font-inter text-xs cursor-pointer
                           outline-none appearance-none"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                <option value="status">Sort: Status</option>
                <option value="name">Sort: Name</option>
                <option value="difficulty">Sort: Difficulty</option>
              </select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setCategory("all");
                    setDifficulty("all");
                    setStatus("all");
                    setSearch("");
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg
                             font-inter text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444",
                  }}
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>

            {/* Expanded filter options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-4 p-4 rounded-xl flex flex-wrap gap-6"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* Difficulty filter */}
                    <div>
                      <div
                        className="font-inter text-[10px] uppercase tracking-widest mb-2"
                        style={{ color: "var(--muted)" }}
                      >
                        Difficulty
                      </div>
                      <div className="flex gap-1.5">
                        {(["all", "Easy", "Medium", "Hard"] as DifficultyFilter[]).map(
                          (d) => (
                            <button
                              key={d}
                              onClick={() => setDifficulty(d)}
                              className="px-3 py-1.5 rounded-lg font-inter text-[10px]
                                         font-medium capitalize transition-all cursor-pointer"
                              style={{
                                background:
                                  difficulty === d
                                    ? "rgba(0,168,255,0.12)"
                                    : "var(--surface)",
                                border:
                                  difficulty === d
                                    ? "1px solid rgba(0,168,255,0.3)"
                                    : "1px solid var(--border)",
                                color:
                                  difficulty === d
                                    ? "var(--neon)"
                                    : "var(--muted)",
                              }}
                            >
                              {d}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Status filter */}
                    <div>
                      <div
                        className="font-inter text-[10px] uppercase tracking-widest mb-2"
                        style={{ color: "var(--muted)" }}
                      >
                        Status
                      </div>
                      <div className="flex gap-1.5">
                        {(
                          [
                            { key: "all", label: "All" },
                            { key: "live", label: "Live" },
                            { key: "coming-soon", label: "Coming Soon" },
                          ] as { key: StatusFilter; label: string }[]
                        ).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => setStatus(s.key)}
                            className="px-3 py-1.5 rounded-lg font-inter text-[10px]
                                       font-medium transition-all cursor-pointer"
                            style={{
                              background:
                                status === s.key
                                  ? "rgba(0,168,255,0.12)"
                                  : "var(--surface)",
                              border:
                                status === s.key
                                  ? "1px solid rgba(0,168,255,0.3)"
                                  : "1px solid var(--border)",
                              color:
                                status === s.key
                                  ? "var(--neon)"
                                  : "var(--muted)",
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Results Info ────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <span
              className="font-inter text-xs"
              style={{ color: "var(--muted)" }}
            >
              Showing {filtered.length} of {ALL_GAMES.length} games
            </span>
          </div>

          {/* ── Game Grid ──────────────────────────────────────────────── */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((game, i) => (
                <GameCard
                  key={game.id}
                  index={i}
                  id={game.id}
                  title={game.title}
                  description={game.description}
                  href={game.href}
                  tag={game.tag}
                  difficulty={game.difficulty}
                  players={game.players}
                  tags={game.tags}
                  comingSoon={game.comingSoon}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <Search
                size={32}
                className="mx-auto mb-4"
                style={{ color: "var(--muted)" }}
              />
              <p
                className="font-inter text-base font-medium mb-2"
                style={{ color: "var(--primary)" }}
              >
                No games found
              </p>
              <p
                className="font-inter text-sm mb-6"
                style={{ color: "var(--muted)" }}
              >
                Try adjusting your filters or search query.
              </p>
              <button
                onClick={() => {
                  setCategory("all");
                  setDifficulty("all");
                  setStatus("all");
                  setSearch("");
                }}
                className="px-6 py-2.5 rounded-lg font-inter text-sm font-medium
                           transition-all cursor-pointer"
                style={{
                  background: "rgba(0,168,255,0.1)",
                  border: "1px solid rgba(0,168,255,0.2)",
                  color: "var(--neon)",
                }}
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span
              className="font-inter text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary)" }}
            >
              KSP
            </span>
            <span
              className="font-inter text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--neon)" }}
            >
              Games
            </span>
          </div>
          <span className="font-inter text-xs" style={{ color: "var(--muted)" }}>
            Scores saved locally
          </span>
        </div>
      </footer>
    </div>
  );
}