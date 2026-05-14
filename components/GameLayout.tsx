"use client";

import { motion } from "framer-motion";
import Navbar from "./Navbar";

interface GameLayoutProps {
  children: React.ReactNode;
  title: string;
  controls: { key: string; description: string }[];
}

export default function GameLayout({
  children,
  title,
  controls,
}: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 shrink-0"
          >
            <h1 className="font-cormorant text-3xl sm:text-4xl font-light text-primary mb-2">
              {title}
            </h1>
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