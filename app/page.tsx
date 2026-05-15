"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import GameCard from "@/components/GameCard";
import Link from "next/link";
import {
  Trophy,
  Zap,
  Target,
  BarChart3,
  Users,
  Radio,
  Shield,
} from "lucide-react";

// ── Existing Games ──────────────────────────────────────────────────────────
const EXISTING_GAMES = [
  {
    id: "snake",
    title: "Snake",
    description:
      "Eat, grow, survive. Speed ramps with every meal. One wrong turn ends it.",
    href: "/snake",
    tag: "Classic",
    difficulty: "Medium" as const,
    players: "1P",
    tags: ["Reflex", "Speed", "Solo"],
  },
  {
    id: "pacman",
    title: "Pac-Man",
    description:
      "Navigate the maze. Eat every dot. Power pellets flip the script on ghosts.",
    href: "/pacman",
    tag: "Arcade",
    difficulty: "Medium" as const,
    players: "1P",
    tags: ["Strategy", "Arcade", "Solo"],
  },
  {
    id: "2048",
    title: "2048",
    description: "Slide tiles, merge numbers. Reach 2048 — then push beyond.",
    href: "/2048",
    tag: "Strategy",
    difficulty: "Hard" as const,
    players: "1P",
    tags: ["Puzzle", "Math", "Solo"],
  },
  {
    id: "wordle",
    title: "Wordle",
    description:
      "Five letters. Six attempts. Each guess reveals the hidden word.",
    href: "/wordle",
    tag: "Word",
    difficulty: "Easy" as const,
    players: "1P",
    tags: ["Word", "Daily", "Solo"],
  },
];

// ── Upcoming Games ──────────────────────────────────────────────────────────
const UPCOMING_GAMES = [
  {
    id: "strategy-ludo",
    title: "Strategy Ludo",
    description:
      "A fully reimagined Ludo with ranked competitive modes, real-time matchmaking, and tactical depth.",
    tag: "Multiplayer",
    difficulty: "Hard" as const,
    players: "2–4P",
    tags: ["Ranked", "Realtime", "Strategy"],
  },
  {
    id: "battle-snake",
    title: "Battle Snake & Ladder",
    description:
      "Fantasy-themed multiplayer Snake & Ladder with combat mechanics and real-time battles.",
    tag: "Multiplayer",
    difficulty: "Medium" as const,
    players: "2–4P",
    tags: ["Fantasy", "Multiplayer", "Battle"],
  },
  {
    id: "aim-trainer",
    title: "Aim Trainer",
    description:
      "Precision targeting system. Train reaction speed, flicking, and tracking with ranked scoring.",
    tag: "Training",
    difficulty: "Hard" as const,
    players: "1P",
    tags: ["Precision", "Ranked", "Training"],
  },
  {
    id: "rope-swing",
    title: "Rope Swing",
    description:
      "Physics-based momentum platformer. Swing, release, fly. Built on a custom physics engine.",
    tag: "Physics",
    difficulty: "Medium" as const,
    players: "1P",
    tags: ["Physics", "Platformer", "Skill"],
  },
  {
    id: "destruction",
    title: "Destruction Sandbox",
    description:
      "Interactive physics destruction environment. Wrecking balls, explosions, structural collapse.",
    tag: "Physics",
    difficulty: "Easy" as const,
    players: "1P",
    tags: ["Physics", "Sandbox", "Destruction"],
  },
];

const TECH_STACK = [
  {
    name: "Next.js 16",
    desc: "App Router + RSC",
    color: "var(--primary)",
  },
  { name: "TypeScript", desc: "Full type safety", color: "#3B82F6" },
  {
    name: "Framer Motion",
    desc: "Animations & physics",
    color: "#a855f7",
  },
  {
    name: "Canvas API",
    desc: "Game rendering engine",
    color: "var(--neon)",
  },
  {
    name: "Zustand",
    desc: "Realtime state management",
    color: "#f97316",
  },
  {
    name: "WebSockets",
    desc: "Multiplayer infrastructure",
    color: "#22c55e",
  },
  {
    name: "Tailwind CSS",
    desc: "Utility-first styling",
    color: "#06b6d4",
  },
  { name: "Vercel", desc: "Edge deployment", color: "var(--primary)" },
];

const PLATFORM_FEATURES = [
  {
    icon: <Trophy size={28} strokeWidth={1.5} />,
    title: "Competitive Rankings",
    desc: "ELO-based matchmaking across all multiplayer modes. Climb from Bronze to Grandmaster.",
    neon: true,
  },
  {
    icon: <Zap size={28} strokeWidth={1.5} />,
    title: "Realtime Matchmaking",
    desc: "Sub-100ms WebSocket infrastructure. Instant lobby creation and peer synchronization.",
    neon: false,
  },
  {
    icon: <Target size={28} strokeWidth={1.5} />,
    title: "Achievement System",
    desc: "Unlock badges across gameplay milestones. Track personal bests and progression.",
    neon: false,
  },
  {
    icon: <BarChart3 size={28} strokeWidth={1.5} />,
    title: "Match Analytics",
    desc: "Post-game breakdowns, heatmaps, and performance trends over time.",
    neon: false,
  },
  {
    icon: <Users size={28} strokeWidth={1.5} />,
    title: "Player Profiles",
    desc: "Public profiles with match history, stats, and achievement showcases.",
    neon: false,
  },
  {
    icon: <Radio size={28} strokeWidth={1.5} />,
    title: "Live Spectating",
    desc: "Watch ongoing ranked matches in real-time. Learn from top players.",
    neon: false,
  },
];

// ── Mouse parallax hook ─────────────────────────────────────────────────────
function useMouseParallax() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  return { springX, springY };
}

// ── Animated counter ────────────────────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const step = target / 60;
        const interval = setInterval(() => {
          start += step;
          if (start >= target) {
            setCount(target);
            clearInterval(interval);
          } else setCount(Math.floor(start));
        }, 16);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);
  const { springX, springY } = useMouseParallax();

  const bgX = useTransform(springX, (v) => v * 20);
  const bgY = useTransform(springY, (v) => v * 20);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Parallax background layers */}
        <motion.div
          style={{ x: bgX, y: bgY }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(var(--neon) 1px, transparent 1px), linear-gradient(90deg, var(--neon) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Radial glow center */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                       w-[800px] h-[800px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(0,168,255,0.06) 0%, transparent 70%)",
            }}
          />
          {/* Corner glows */}
          <div
            className="absolute top-20 right-20 w-64 h-64 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(200,169,126,0.06) 0%, transparent 70%)",
            }}
          />
        </motion.div>

        {/* Scan line effect */}
        <div
          className="absolute left-0 right-0 h-[1px] pointer-events-none scan-line opacity-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--neon), transparent)",
          }}
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full"
        >
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-8"
            >
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(0,168,255,0.08)",
                  border: "1px solid rgba(0,168,255,0.2)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "var(--neon)" }}
                />
                <span
                  className="font-inter text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "var(--neon)" }}
                >
                  Competitive Gaming Platform
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-inter font-black leading-[0.92] tracking-tight mb-6"
              style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
            >
              <span style={{ color: "var(--primary)" }}>Modern</span>
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--neon) 0%, #0066cc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Multiplayer
              </span>
              <br />
              <span style={{ color: "var(--primary)" }}>Browser </span>
              <span
                className="font-cormorant font-light italic"
                style={{ color: "var(--accent)" }}
              >
                Experiences.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-inter text-base sm:text-lg leading-relaxed mb-10 max-w-2xl"
              style={{ color: "var(--muted)" }}
            >
              A next-generation competitive game hub featuring realtime
              matchmaking, ranked strategy games, physics simulations, and
              immersive browser experiences — all engineered from scratch.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-4 mb-16"
            >
              <Link
                href="/games"
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                           font-inter text-sm font-bold transition-all duration-300
                           hover:scale-105 hover:shadow-[0_0_30px_rgba(0,168,255,0.4)]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--neon) 0%, #0066cc 100%)",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(0,168,255,0.2)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Now
              </Link>

              <Link
                href="#games"
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                           font-inter text-sm font-bold transition-all duration-300
                           hover:border-neon/40"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--primary)",
                }}
              >
                Explore Games
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                           font-inter text-sm font-medium transition-all duration-300"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--muted)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-6 sm:gap-10"
            >
              {[
                { value: 4, suffix: "", label: "Live Games" },
                { value: 5, suffix: "+", label: "In Development" },
                { value: 8, suffix: "", label: "Tech Systems" },
                { value: 100, suffix: "%", label: "Browser Native" },
              ].map(({ value, suffix, label }) => (
                <div key={label}>
                  <div
                    className="font-inter text-2xl font-black tabular-nums"
                    style={{ color: "var(--neon)" }}
                  >
                    <AnimatedCounter target={value} suffix={suffix} />
                  </div>
                  <div
                    className="font-inter text-xs mt-0.5"
                    style={{ color: "var(--muted)" }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col
                     items-center gap-2"
          style={{ color: "var(--muted)" }}
        >
          <span className="font-inter text-[10px] uppercase tracking-[0.2em]">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-4 h-4 flex items-center justify-center"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
      <div
        className="h-[1px] w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--neon-dim), var(--border-gold), transparent)",
        }}
      />

      {/* ── STRATEGY LUDO SPOTLIGHT ──────────────────────────────────────── */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 60% 50%, rgba(0,168,255,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,168,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,168,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                style={{
                  background: "rgba(0,168,255,0.08)",
                  border: "1px solid rgba(0,168,255,0.2)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "var(--neon)" }}
                />
                <span
                  className="font-inter text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "var(--neon)" }}
                >
                  Featured — Coming Soon
                </span>
              </div>

              <h2
                className="font-inter font-black mb-4 leading-tight"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  color: "var(--primary)",
                }}
              >
                Strategy Ludo
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, var(--neon), #0066cc)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Reimagined.
                </span>
              </h2>

              <p
                className="font-inter text-base leading-relaxed mb-8"
                style={{ color: "var(--muted)", maxWidth: 480 }}
              >
                The classic board game rebuilt as a competitive multiplayer
                experience. Real-time matchmaking, ELO rankings, tactical
                power-ups, and spectator mode — all running natively in the
                browser with WebSocket infrastructure.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  "Realtime Multiplayer",
                  "ELO Rankings",
                  "2–4 Players",
                  "Spectator Mode",
                  "Power-Ups",
                  "Match History",
                ].map((f) => (
                  <span
                    key={f}
                    className="px-3 py-1.5 rounded-full font-inter text-xs font-medium"
                    style={{
                      background: "rgba(0,168,255,0.08)",
                      border: "1px solid rgba(0,168,255,0.15)",
                      color: "var(--neon)",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl w-fit"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                <span
                  className="font-inter text-sm font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  In active development
                </span>
              </div>
            </motion.div>

            {/* Right: visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div
                className="relative rounded-2xl overflow-hidden aspect-square max-w-md mx-auto"
                style={{
                  background:
                    "linear-gradient(135deg, #0a001a 0%, #1a0030 50%, #0a001a 100%)",
                  border: "1px solid rgba(0,168,255,0.2)",
                  boxShadow:
                    "0 0 60px rgba(0,168,255,0.1), inset 0 0 60px rgba(0,168,255,0.05)",
                }}
              >
                {/* Grid */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,168,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,168,255,0.3) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Ludo board preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Board quadrants */}
                    {[
                      { color: "#ef4444", x: 0, y: 0 },
                      { color: "#22c55e", x: 50, y: 0 },
                      { color: "#eab308", x: 0, y: 50 },
                      { color: "#3b82f6", x: 50, y: 50 },
                    ].map(({ color, x, y }, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-[45%] h-[45%] rounded-xl"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          background: `${color}22`,
                          border: `1px solid ${color}44`,
                        }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 2,
                          delay: i * 0.4,
                          repeat: Infinity,
                        }}
                      />
                    ))}

                    {/* Center */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                 w-[20%] h-[20%] rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(0,168,255,0.2)",
                        border: "1px solid rgba(0,168,255,0.4)",
                      }}
                    >
                      <Shield size={20} style={{ color: "var(--neon)" }} />
                    </div>

                    {/* Floating pieces */}
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={`piece-${i}`}
                        className="absolute w-5 h-5 rounded-full border-2"
                        style={{
                          backgroundColor:
                            [
                              "#ef4444",
                              "#22c55e",
                              "#eab308",
                              "#3b82f6",
                            ][i] + "cc",
                          borderColor: [
                            "#ef4444",
                            "#22c55e",
                            "#eab308",
                            "#3b82f6",
                          ][i],
                          left: `${15 + i * 20}%`,
                          top: `${20 + (i % 2) * 55}%`,
                          boxShadow: `0 0 10px ${
                            [
                              "#ef4444",
                              "#22c55e",
                              "#eab308",
                              "#3b82f6",
                            ][i]
                          }66`,
                        }}
                        animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 2,
                          delay: i * 0.3,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* HUD overlay elements */}
                <div
                  className="absolute top-4 left-4 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  style={{
                    background: "rgba(8,8,16,0.8)",
                    border: "1px solid rgba(0,168,255,0.2)",
                  }}
                >
                  <Radio
                    size={10}
                    style={{ color: "var(--neon)" }}
                    className="animate-pulse"
                  />
                  <span
                    className="font-inter text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--neon)" }}
                  >
                    Ranked Match
                  </span>
                </div>

                <div
                  className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(8,8,16,0.8)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="font-inter text-[10px]"
                    style={{ color: "var(--muted)" }}
                  >
                    Turn 12 / 4 Players
                  </span>
                </div>
              </div>

              {/* Floating glow */}
              <div
                className="absolute -inset-8 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(0,168,255,0.06) 0%, transparent 70%)",
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── GAMES GRID ───────────────────────────────────────────────────── */}
      <section id="games" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-[1px] w-8"
                style={{ background: "var(--neon)" }}
              />
              <span
                className="font-inter text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--neon)" }}
              >
                Game Library
              </span>
            </div>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <h2
                className="font-inter font-black"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  color: "var(--primary)",
                }}
              >
                Available Now
              </h2>
              <Link
                href="/games"
                className="font-inter text-sm font-medium flex items-center gap-1.5
                           transition-all hover:gap-2.5"
                style={{ color: "var(--neon)" }}
              >
                View All Games
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* Live games */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {EXISTING_GAMES.map((game, i) => (
              <GameCard key={game.id} index={i} {...game} />
            ))}
          </div>

          {/* Coming soon label */}
          <div className="flex items-center gap-4 my-8">
            <div
              className="flex-1 h-[1px]"
              style={{ background: "var(--border)" }}
            />
            <span
              className="font-inter text-xs font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(0,168,255,0.06)",
                border: "1px solid rgba(0,168,255,0.15)",
                color: "var(--muted)",
              }}
            >
              In Development
            </span>
            <div
              className="flex-1 h-[1px]"
              style={{ background: "var(--border)" }}
            />
          </div>

          {/* Coming soon games */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {UPCOMING_GAMES.map((game, i) => (
              <GameCard
                key={game.id}
                index={EXISTING_GAMES.length + i}
                {...game}
                comingSoon
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ────────────────────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6 relative overflow-hidden"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(0,168,255,0.06) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-[1px] w-8"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="font-inter text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--accent)" }}
              >
                Platform Systems
              </span>
            </div>
            <h2
              className="font-inter font-black"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                color: "var(--primary)",
              }}
            >
              Built for Competition
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORM_FEATURES.map(({ icon, title, desc, neon }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl relative group"
                style={{
                  background: neon
                    ? "linear-gradient(135deg, rgba(0,168,255,0.08), rgba(0,102,204,0.04))"
                    : "var(--card)",
                  border: neon
                    ? "1px solid rgba(0,168,255,0.2)"
                    : "1px solid var(--border)",
                }}
              >
                {neon && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                               transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow: "inset 0 0 30px rgba(0,168,255,0.05)",
                    }}
                  />
                )}
                <div
                  className="mb-4 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: neon
                      ? "rgba(0,168,255,0.1)"
                      : "rgba(255,255,255,0.04)",
                    border: neon
                      ? "1px solid rgba(0,168,255,0.2)"
                      : "1px solid var(--border)",
                    color: neon ? "var(--neon)" : "var(--muted)",
                  }}
                >
                  {icon}
                </div>
                <h3
                  className="font-inter text-base font-bold mb-2"
                  style={{ color: "var(--primary)" }}
                >
                  {title}
                </h3>
                <p
                  className="font-inter text-sm leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {desc}
                </p>
                {neon && (
                  <div
                    className="mt-4 flex items-center gap-2 font-inter text-xs font-semibold"
                    style={{ color: "var(--neon)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "var(--neon)" }}
                    />
                    Coming with Strategy Ludo
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-[1px] w-8"
                style={{ background: "var(--muted)" }}
              />
              <span
                className="font-inter text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--muted)" }}
              >
                Engineering
              </span>
            </div>
            <h2
              className="font-inter font-black"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                color: "var(--primary)",
              }}
            >
              Built with precision.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TECH_STACK.map(({ name, desc, color }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="p-4 rounded-xl group hover:border-white/10 transition-colors"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mb-3"
                  style={{ background: color }}
                />
                <div
                  className="font-inter text-sm font-bold mb-0.5"
                  style={{ color: "var(--primary)" }}
                >
                  {name}
                </div>
                <div
                  className="font-inter text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  {desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ───────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-4 sm:px-6 text-center overflow-hidden"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(0,168,255,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--neon), var(--gold), transparent)",
            opacity: 0.5,
          }}
        />

        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="font-inter font-black mb-4 leading-tight"
              style={{
                fontSize: "clamp(2rem, 6vw, 4rem)",
                color: "var(--primary)",
              }}
            >
              Enter the{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--neon) 0%, #0066cc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Arena.
              </span>
            </h2>

            <p
              className="font-inter text-base mb-10 leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              No accounts required. No tracking. Your scores live locally. Just
              open a game and compete.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/games"
                className="flex items-center gap-2.5 px-8 py-4 rounded-xl
                           font-inter text-sm font-bold transition-all duration-300
                           hover:scale-105 hover:shadow-[0_0_40px_rgba(0,168,255,0.4)]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--neon) 0%, #0066cc 100%)",
                  color: "#fff",
                  boxShadow: "0 0 30px rgba(0,168,255,0.2)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Playing
              </Link>

              <Link
                href="/games"
                className="flex items-center gap-2.5 px-8 py-4 rounded-xl
                           font-inter text-sm font-medium transition-all duration-300"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--primary)",
                }}
              >
                View All Games
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER BAR ───────────────────────────────────────────────────── */}
      <footer
        className="px-4 sm:px-6 py-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
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
          <span
            className="font-inter text-xs"
            style={{ color: "var(--muted)" }}
          >
            Scores saved locally · No tracking · Open source
          </span>
          <div className="flex items-center gap-4">
            <span
              className="font-inter text-xs"
              style={{ color: "var(--muted)" }}
            >
              Built with Next.js · TypeScript · Canvas API
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}