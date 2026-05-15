"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface NavLink {
  label: string;
  href: string;
  soon?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Games",        href: "/games" },
  { label: "Arena",        href: "/arena",        soon: true },
  { label: "Training",     href: "/training",     soon: true },
  { label: "Physics",      href: "/physics",      soon: true },
  { label: "Leaderboards", href: "/leaderboards", soon: true },
  { label: "Profile",      href: "/profile",      soon: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04]"
        style={{
          background: scrolled
            ? "rgba(8,8,16,0.95)"
            : "rgba(8,8,16,0.7)",
          backdropFilter: "blur(16px)",
          transition: "background 0.3s ease",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[1px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--neon), var(--gold), transparent)",
            opacity: 0.6,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: back + logo */}
          <div className="flex items-center gap-4">
            {!isHome && (
              <Link
                href="/"
                className="font-inter text-xs transition-colors flex items-center gap-1.5"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--neon)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--muted)")
                }
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Hub
              </Link>
            )}
            <Link href="/" className="flex items-center gap-2 group">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center relative"
                style={{
                  background:
                    "linear-gradient(135deg, var(--neon-dim), transparent)",
                  border: "1px solid var(--border-neon)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--neon)"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
                </svg>
              </div>
              <span
                className="font-inter text-sm font-semibold tracking-wider uppercase"
                style={{ color: "var(--primary)" }}
              >
                KSP
                <span style={{ color: "var(--neon)" }}> Games</span>
              </span>
            </Link>
          </div>

          {/* Center: nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <div key={link.href} className="relative">
                  {link.soon ? (
                    <span
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                 font-inter text-xs font-medium cursor-not-allowed"
                      style={{ color: "var(--muted)" }}
                    >
                      {link.label}
                      <span
                        className="px-1 py-0.5 rounded text-[9px] font-bold tracking-wider"
                        style={{
                          background: "rgba(0,168,255,0.1)",
                          border: "1px solid rgba(0,168,255,0.2)",
                          color: "var(--neon)",
                        }}
                      >
                        SOON
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={link.href}
                      className="flex items-center px-3 py-1.5 rounded-lg
                                 font-inter text-xs font-medium transition-all duration-200"
                      style={{
                        color: isActive ? "var(--neon)" : "var(--muted)",
                        background: isActive
                          ? "rgba(0,168,255,0.08)"
                          : "transparent",
                      }}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/games"
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg
                         font-inter text-xs font-semibold transition-all duration-200
                         hover:shadow-[0_0_20px_rgba(0,168,255,0.3)]"
              style={{
                background:
                  "linear-gradient(135deg, var(--neon), #0066cc)",
                color: "#fff",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Now
            </Link>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5
                         rounded-lg transition-colors cursor-pointer"
              style={{ border: "1px solid var(--border)" }}
              aria-label="Toggle menu"
            >
              <motion.span
                animate={
                  menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }
                }
                className="block w-4 h-[1.5px]"
                style={{ background: "var(--primary)" }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block w-4 h-[1.5px]"
                style={{ background: "var(--primary)" }}
              />
              <motion.span
                animate={
                  menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }
                }
                className="block w-4 h-[1.5px]"
                style={{ background: "var(--primary)" }}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 top-[57px] z-50 md:hidden"
              style={{
                background: "rgba(8,8,16,0.98)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {link.soon ? (
                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ opacity: 0.4 }}
                      >
                        <span className="font-inter text-sm" style={{ color: "var(--muted)" }}>
                          {link.label}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider"
                          style={{
                            background: "rgba(0,168,255,0.1)",
                            border: "1px solid rgba(0,168,255,0.2)",
                            color: "var(--neon)",
                          }}
                        >
                          COMING SOON
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center px-4 py-3 rounded-xl
                                   font-inter text-sm font-medium transition-colors"
                        style={{ color: "var(--primary)" }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.div>
                ))}

                <div
                  className="mt-2 pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <Link
                    href="/games"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl
                               font-inter text-sm font-semibold w-full"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--neon), #0066cc)",
                      color: "#fff",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}