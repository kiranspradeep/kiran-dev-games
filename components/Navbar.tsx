"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04]"
      style={{
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Link
              href="/"
              className="font-inter text-sm text-muted hover:text-accent
                         transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Hub
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#C8A97E" strokeWidth="1.5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
            </svg>
            <span className="font-cormorant text-lg font-medium tracking-wide
                             text-primary group-hover:text-accent transition-colors">
              KSP Games
            </span>
          </Link>
        </div>

        {isHome && (
          <span className="font-inter text-xs text-muted tracking-[0.15em]
                           uppercase hidden sm:block">
            Play. Compete. Repeat.
          </span>
        )}
      </div>
    </motion.nav>
  );
}