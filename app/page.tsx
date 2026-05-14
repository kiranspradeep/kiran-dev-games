"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import GameCard from "@/components/GameCard";

function SnakeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8C3 6.9 3.9 6 5 6H10C11.1 6 12 6.9 12 8V10H16C17.1 10 18 10.9 18 12V16C18 17.1 17.1 18 16 18H12"
        stroke="#C8A97E" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="5.5" cy="8.5" r="1" fill="#C8A97E" />
      <path
        d="M12 14H8C6.9 14 6 13.1 6 12V8"
        stroke="#C8A97E" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
      />
    </svg>
  );
}

function WordleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="4" height="4" rx="0.5" fill="#C8A97E" />
      <rect x="10" y="3" width="4" height="4" rx="0.5" fill="#C8A97E" opacity="0.4" />
      <rect x="17" y="3" width="4" height="4" rx="0.5" fill="#C8A97E" opacity="0.2" />
      <rect x="3" y="10" width="4" height="4" rx="0.5" fill="#C8A97E" opacity="0.5" />
      <rect x="10" y="10" width="4" height="4" rx="0.5" fill="#C8A97E" />
      <rect x="17" y="10" width="4" height="4" rx="0.5" fill="#C8A97E" opacity="0.3" />
      <rect x="3" y="17" width="4" height="4" rx="0.5" fill="#C8A97E" opacity="0.2" />
      <rect x="10" y="17" width="4" height="4" rx="0.5" fill="#C8A97E" opacity="0.6" />
      <rect x="17" y="17" width="4" height="4" rx="0.5" fill="#C8A97E" />
    </svg>
  );
}

function TwentyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#C8A97E" opacity="0.3" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#C8A97E" opacity="0.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#C8A97E" opacity="0.7" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#C8A97E" />
    </svg>
  );
}

function PacmanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        fill="#C8A97E" opacity="0.15"
      />
      <path
        d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"
        fill="none"
      />
      <path
        d="M12 12L20 6A9 9 0 1 0 20 18L12 12Z"
        fill="#C8A97E"
      />
      <circle cx="13" cy="8" r="1.2" fill="#0a0a0a" />
    </svg>
  );
}

const GAMES = [
  {
    id: "snake" as const,
    title: "Snake",
    description: "Classic snake. Eat, grow, don't crash. Speed ramps up as your score climbs.",
    href: "/snake",
    icon: <SnakeIcon />,
    tag: "Classic",
  },
  {
    id: "pacman" as const,
    title: "Pac-Man",
    description: "Navigate the maze, eat all dots, avoid ghosts. Power pellets turn the tables.",
    href: "/pacman",
    icon: <PacmanIcon />,
    tag: "Arcade",
  },
  {
    id: "2048" as const,
    title: "2048",
    description: "Slide tiles, merge numbers. Reach the elusive 2048 — then keep going.",
    href: "/2048",
    icon: <TwentyIcon />,
    tag: "Strategy",
  },
  {
    id: "wordle" as const,
    title: "Wordle",
    description: "Five letters. Six guesses. Daily word or random mode.",
    href: "/wordle",
    icon: <WordleIcon />,
    tag: "Word",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px w-8 bg-accent/40" />
            <span className="font-inter text-xs tracking-[0.2em] uppercase text-muted">
              Game Hub
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-cormorant text-7xl md:text-8xl font-light
                       leading-[0.95] tracking-tight text-primary mb-6"
          >
            Play
            <br />
            <em
              className="italic"
              style={{
                background: "linear-gradient(135deg, #C8A97E, #d4b896)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              something.
            </em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="font-inter text-sm text-muted max-w-md leading-relaxed"
          >
            A curated set of timeless games. No accounts, no distractions.
            Your high scores live locally in your browser.
          </motion.p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <span className="font-inter text-xs tracking-[0.2em] uppercase text-muted">
              Available Games
            </span>
            <span className="font-inter text-xs text-muted/50">
              {GAMES.length} games
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GAMES.map((game, i) => (
              <GameCard
                key={game.id}
                index={i}
                id={game.id}
                title={game.title}
                description={game.description}
                href={game.href}
                icon={game.icon}
                tag={game.tag}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-cormorant text-muted text-sm italic">
            KSP Games
          </span>
          <span className="font-inter text-xs text-muted/50">
            Scores saved locally — no tracking.
          </span>
        </div>
      </footer>
    </div>
  );
}