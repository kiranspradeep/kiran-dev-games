"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { getScore, formatScore, type GameId } from "@/lib/scores";

interface GameCardProps {
  id: GameId | string;
  title: string;
  description: string;
  href?: string;
  tag?: string;
  index: number;
  comingSoon?: boolean;
  difficulty?: "Easy" | "Medium" | "Hard";
  players?: string;
  tags?: string[];
}

const DIFFICULTY_COLOR = {
  Easy: {
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    text: "#22c55e",
  },
  Medium: {
    bg: "rgba(234,179,8,0.1)",
    border: "rgba(234,179,8,0.25)",
    text: "#eab308",
  },
  Hard: {
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    text: "#ef4444",
  },
};

// Game-specific accent colors for the fallback SVG placeholder
const GAME_ACCENT: Record<string, string> = {
  snake: "#22c55e",
  pacman: "#eab308",
  "2048": "#a855f7",
  wordle: "#22c55e",
  "strategy-ludo": "#00A8FF",
  "battle-snake": "#f97316",
  "aim-trainer": "#ef4444",
  "rope-swing": "#06b6d4",
  destruction: "#f97316",
};

export default function GameCard({
  id,
  title,
  description,
  href,
  tag,
  index,
  comingSoon = false,
  difficulty = "Medium",
  players = "1P",
  tags = [],
}: GameCardProps) {
  const [scoreData, setScoreData] = useState({ highScore: 0, gamesPlayed: 0 });
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);

  useEffect(() => {
    if (
      !comingSoon &&
      (id === "snake" || id === "wordle" || id === "2048" || id === "pacman")
    ) {
      const data = getScore(id as GameId);
      setScoreData({
        highScore: data.highScore,
        gamesPlayed: data.gamesPlayed ?? 0,
      });
    }
  }, [id, comingSoon]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const diffStyle = DIFFICULTY_COLOR[difficulty];
  const accentColor = GAME_ACCENT[id] ?? "var(--neon)";

  // Determine if we should try loading an image
  // Only non-coming-soon games have real images at /images/games/{id}.png
  const hasImage = !comingSoon;
  const imagePath = `/images/games/${id}.png`;
  const showImage = hasImage && !imgError;

  const CardContent = (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      className="relative h-full rounded-2xl overflow-hidden group cursor-pointer"
    >
      {/* Border */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300 z-10 pointer-events-none"
        style={{
          border: comingSoon
            ? "1px solid rgba(255,255,255,0.04)"
            : "1px solid rgba(0,168,255,0.15)",
          boxShadow: comingSoon
            ? "none"
            : "inset 0 0 0 1px rgba(0,168,255,0.05)",
        }}
      />

      {/* Thumbnail area */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: "var(--surface)" }}
      >
        {/* Real image or SVG fallback */}
        {showImage ? (
          <img
            src={imagePath}
            alt={title}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform
                       duration-500 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholderSVG
            title={title}
            accentColor={accentColor}
            comingSoon={comingSoon}
          />
        )}

        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 40%, var(--card) 100%)",
          }}
        />

        {/* Coming soon overlay */}
        {comingSoon && (
          <div
            className="absolute inset-0 flex items-center justify-center z-[2]"
            style={{
              background: "rgba(8,8,16,0.55)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              className="px-4 py-2 rounded-full font-inter text-xs font-bold
                         tracking-[0.2em] uppercase"
              style={{
                background: "rgba(0,168,255,0.1)",
                border: "1px solid rgba(0,168,255,0.3)",
                color: "var(--neon)",
              }}
            >
              Coming Soon
            </div>
          </div>
        )}

        {/* Genre tag top-left */}
        {tag && (
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full
                       font-inter text-[10px] font-semibold uppercase tracking-wider z-10"
            style={{
              background: "rgba(0,168,255,0.15)",
              border: "1px solid rgba(0,168,255,0.3)",
              color: "var(--neon)",
            }}
          >
            {tag}
          </div>
        )}

        {/* Players top-right */}
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-lg
                     font-inter text-[10px] font-medium z-10"
          style={{
            background: "rgba(8,8,16,0.8)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          {players}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 relative" style={{ background: "var(--card)" }}>
        {/* Neon glow on hover */}
        {!comingSoon && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100
                       transition-opacity duration-500 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top center, rgba(0,168,255,0.05) 0%, transparent 70%)",
            }}
          />
        )}

        {/* Title */}
        <h3
          className="font-inter text-base font-semibold mb-1.5 transition-colors duration-200"
          style={{ color: comingSoon ? "var(--muted)" : "var(--primary)" }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className="font-inter text-xs leading-relaxed mb-3"
          style={{ color: "var(--muted)" }}
        >
          {description}
        </p>

        {/* Tags row */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded font-inter text-[9px] font-medium uppercase tracking-wider"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--muted)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Difficulty */}
          <span
            className="px-2 py-0.5 rounded font-inter text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: diffStyle.bg,
              border: `1px solid ${diffStyle.border}`,
              color: diffStyle.text,
            }}
          >
            {difficulty}
          </span>

          {/* Score or play */}
          {!comingSoon ? (
            <div className="flex items-center gap-2">
              {scoreData.highScore > 0 && (
                <span
                  className="font-inter text-[10px]"
                  style={{ color: "var(--muted)" }}
                >
                  Best:{" "}
                  <span
                    style={{ color: "var(--gold)" }}
                    className="font-semibold"
                  >
                    {formatScore(scoreData.highScore)}
                  </span>
                </span>
              )}
              <span
                className="font-inter text-xs font-semibold flex items-center gap-1
                           transition-all duration-200 group-hover:gap-2"
                style={{ color: "var(--neon)" }}
              >
                Play
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          ) : (
            <span
              className="font-inter text-[10px]"
              style={{ color: "var(--muted)" }}
            >
              In development
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="h-full"
      style={{ perspective: 800 }}
    >
      {comingSoon || !href ? (
        <div className="h-full" style={{ opacity: comingSoon ? 0.65 : 1 }}>
          {CardContent}
        </div>
      ) : (
        <Link href={href} className="block h-full">
          {CardContent}
        </Link>
      )}
    </motion.div>
  );
}

// ── SVG Image Placeholder ───────────────────────────────────────────────────
// Used when no real image exists (coming soon games or failed image load)
function ImagePlaceholderSVG({
  title,
  accentColor,
  comingSoon,
}: {
  title: string;
  accentColor: string;
  comingSoon: boolean;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--surface) 0%, var(--card) 100%)`,
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background grid pattern */}
        <defs>
          <pattern
            id={`grid-${title}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={accentColor}
              strokeWidth="0.3"
              opacity="0.15"
            />
          </pattern>

          {/* Radial glow */}
          <radialGradient
            id={`glow-${title}`}
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid fill */}
        <rect width="400" height="200" fill={`url(#grid-${title})`} />

        {/* Center glow */}
        <ellipse
          cx="200"
          cy="100"
          rx="160"
          ry="80"
          fill={`url(#glow-${title})`}
        />

        {/* Image icon (mountain/landscape style placeholder) */}
        <g
          transform="translate(160, 55)"
          opacity={comingSoon ? "0.3" : "0.5"}
        >
          {/* Outer frame */}
          <rect
            x="0"
            y="0"
            width="80"
            height="64"
            rx="6"
            stroke={accentColor}
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />

          {/* Mountain / landscape icon inside */}
          <path
            d="M16 48 L28 28 L36 38 L44 22 L64 48 Z"
            fill={accentColor}
            opacity="0.2"
          />
          <path
            d="M16 48 L28 28 L36 38 L44 22 L64 48"
            stroke={accentColor}
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
            strokeLinejoin="round"
          />

          {/* Sun / circle */}
          <circle
            cx="56"
            cy="20"
            r="6"
            fill={accentColor}
            opacity="0.25"
          />
          <circle
            cx="56"
            cy="20"
            r="6"
            stroke={accentColor}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
        </g>

        {/* Decorative corner accents */}
        <path
          d="M12 12 L28 12 M12 12 L12 28"
          stroke={accentColor}
          strokeWidth="1"
          opacity="0.2"
          strokeLinecap="round"
        />
        <path
          d="M388 12 L372 12 M388 12 L388 28"
          stroke={accentColor}
          strokeWidth="1"
          opacity="0.2"
          strokeLinecap="round"
        />
        <path
          d="M12 188 L28 188 M12 188 L12 172"
          stroke={accentColor}
          strokeWidth="1"
          opacity="0.2"
          strokeLinecap="round"
        />
        <path
          d="M388 188 L372 188 M388 188 L388 172"
          stroke={accentColor}
          strokeWidth="1"
          opacity="0.2"
          strokeLinecap="round"
        />

        {/* Horizontal scan lines */}
        <line
          x1="0"
          y1="66"
          x2="400"
          y2="66"
          stroke={accentColor}
          strokeWidth="0.3"
          opacity="0.1"
        />
        <line
          x1="0"
          y1="133"
          x2="400"
          y2="133"
          stroke={accentColor}
          strokeWidth="0.3"
          opacity="0.1"
        />

        {/* Small dots for texture */}
        <circle cx="40" cy="40" r="1" fill={accentColor} opacity="0.15" />
        <circle cx="360" cy="40" r="1" fill={accentColor} opacity="0.15" />
        <circle cx="40" cy="160" r="1" fill={accentColor} opacity="0.15" />
        <circle cx="360" cy="160" r="1" fill={accentColor} opacity="0.15" />
        <circle cx="200" cy="170" r="1" fill={accentColor} opacity="0.1" />
      </svg>
    </div>
  );
}