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
      className={`min-h-screen flex flex-col ${
        isPlaying && isMobile ? "overflow-hidden h-screen" : ""
      }`}
      style={{ background: "var(--background)" }}
    >
      {!(isPlaying && isMobile) && <Navbar />}

      {/* HUD top bar */}
      {!(isPlaying && isMobile) && (
        <div
          className="fixed top-[57px] left-0 right-0 z-30 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--neon-dim), transparent)",
          }}
        />
      )}

      <main className={`flex-1 ${isPlaying && isMobile ? "pt-2" : "pt-20"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`shrink-0 ${isPlaying && isMobile ? "mb-2" : "mb-6"}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-5 w-[2px] rounded-full"
                style={{ background: "var(--neon)" }}
              />
              <h1
                className={`font-inter font-bold tracking-tight ${
                  isPlaying && isMobile ? "text-lg" : "text-2xl sm:text-3xl"
                }`}
                style={{ color: "var(--primary)" }}
              >
                {title}
              </h1>
            </div>

            {/* Controls */}
            {!(isPlaying && isMobile) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {controls.map((ctrl) => (
                  <div
                    key={ctrl.key}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <kbd
                      className="font-inter text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(0,168,255,0.1)",
                        border: "1px solid rgba(0,168,255,0.2)",
                        color: "var(--neon)",
                      }}
                    >
                      {ctrl.key}
                    </kbd>
                    <span
                      className="font-inter text-[11px]"
                      style={{ color: "var(--muted)" }}
                    >
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