"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getScore, formatScore, type GameId } from "@/lib/scores";

interface GameCardProps {
  id: GameId;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  tag?: string;
  index: number;
}

export default function GameCard({
  id, title, description, href, icon, tag, index,
}: GameCardProps) {
  const [scoreData, setScoreData] = useState({ highScore: 0, gamesPlayed: 0 });

  useEffect(() => {
    const data = getScore(id);
    setScoreData({ highScore: data.highScore, gamesPlayed: data.gamesPlayed ?? 0 });
  }, [id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <Link href={href} className="group block h-full">
        <div className="relative h-full bg-card border border-white/[0.06]
                        rounded-2xl p-6 overflow-hidden transition-all duration-300
                        hover:border-accent/20 hover:shadow-[0_0_30px_rgba(200,169,126,0.05)]">

          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                          transition-opacity duration-500 pointer-events-none rounded-2xl"
            style={{
              background: "radial-gradient(ellipse at top left, rgba(200,169,126,0.04) 0%, transparent 60%)",
            }}
          />

          {/* Tag */}
          {tag && (
            <div className="inline-flex items-center gap-1.5 rounded-full
                            px-2.5 py-1 mb-4 bg-accent/10 border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-inter text-[11px] font-medium text-accent
                               tracking-widest uppercase">
                {tag}
              </span>
            </div>
          )}

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-surface border border-white/[0.06]
                          flex items-center justify-center mb-4
                          group-hover:border-accent/20 transition-colors duration-300">
            {icon}
          </div>

          {/* Title */}
          <h3 className="font-cormorant text-2xl font-medium text-primary mb-2
                         group-hover:text-accent transition-colors duration-200">
            {title}
          </h3>

          {/* Description */}
          <p className="font-inter text-sm text-muted leading-relaxed mb-6">
            {description}
          </p>

          {/* Bottom */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-inter text-xs text-muted">
                Best:{" "}
                <span className="text-accent font-medium">
                  {scoreData.highScore > 0 ? formatScore(scoreData.highScore) : "—"}
                </span>
              </span>
              {scoreData.gamesPlayed > 0 && (
                <span className="font-inter text-xs text-muted/50">
                  · {scoreData.gamesPlayed} played
                </span>
              )}
            </div>
            <span className="font-inter text-xs font-medium text-accent
                             flex items-center gap-1.5
                             group-hover:gap-3 transition-all duration-200">
              Play
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}