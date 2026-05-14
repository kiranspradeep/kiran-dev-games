// components/GameLayout.tsx
"use client";

import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";

interface GameLayoutProps {
  children: React.ReactNode;
  title: string;
  controls: { key: string; description: string }[];
  isPlaying?: boolean;
}

export default function GameLayout({
  children,
  title,
  controls,
  isPlaying = false,
}: GameLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      className={`min-h-screen bg-background flex flex-col ${
        isPlaying && isMobile ? "overflow-hidden h-screen" : ""
      }`}
    >
      {/* Hide navbar on mobile when playing to maximize space */}
      {!(isPlaying && isMobile) && <Navbar />}
      <main className={`flex-1 ${isPlaying && isMobile ? "pt-2" : "pt-16"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
          {/* Header - compact on mobile when playing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`shrink-0 ${isPlaying && isMobile ? "mb-2" : "mb-4"}`}
          >
            <h1
              className={`font-cormorant font-light text-primary ${
                isPlaying && isMobile
                  ? "text-xl mb-1"
                  : "text-3xl sm:text-4xl mb-2"
              }`}
            >
              {title}
            </h1>
            {/* Hide controls legend on mobile when playing */}
            {!(isPlaying && isMobile) && (
              <div className="flex flex-wrap gap-2">
                {controls.map((ctrl) => (
                  <div
                    key={ctrl.key}
                    className="flex items-center gap-2 bg-card border border-white/[0.06] rounded-lg px-2.5 py-1"
                  >
                    <kbd className="font-inter text-[10px] font-medium text-accent bg-accent/10 rounded px-1.5 py-0.5">
                      {ctrl.key}
                    </kbd>
                    <span className="font-inter text-[11px] text-muted">
                      {ctrl.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Game content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}