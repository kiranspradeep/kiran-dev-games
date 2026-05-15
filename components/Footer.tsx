// components/Footer.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const GAME_LINKS = [
  { label: "Snake",   href: "/snake" },
  { label: "Pac-Man", href: "/pacman" },
  { label: "2048",    href: "/2048" },
  { label: "Wordle",  href: "/wordle" },
];

const PLATFORM_LINKS = [
  { label: "All Games",    href: "/games" },
  { label: "Arena",        href: "/arena",        soon: true },
  { label: "Leaderboards", href: "/leaderboards",  soon: true },
  { label: "Profile",      href: "/profile",       soon: true },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy",   href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms"   },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative overflow-hidden"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      {/* Top accent gradient line */}
      <div
        className="h-[1px] w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--neon), var(--gold), transparent)",
          opacity: 0.4,
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px]
                   rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,168,255,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Main grid ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Col 1 — Brand */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group w-fit mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                           transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(0,168,255,0.5)]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--neon-dim), transparent)",
                  border: "1px solid var(--border-neon)",
                }}
              >
                <svg
                  width="15"
                  height="15"
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

            <p
              className="font-inter text-xs leading-relaxed mb-5"
              style={{ color: "var(--muted)", maxWidth: 220 }}
            >
              A next-generation competitive game hub — engineered from scratch
              for the browser.
            </p>

            {/* Status badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(0,168,255,0.06)",
                border: "1px solid rgba(0,168,255,0.15)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                style={{ background: "var(--neon)" }}
              />
              <span
                className="font-inter text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: "var(--neon)" }}
              >
                4 Games Live
              </span>
            </div>

            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-fit group transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="font-inter text-xs">View on GitHub</span>
            </a>
          </div>

          {/* Col 2 — Games */}
          <div>
            <FooterColHeading label="Games" accentColor="var(--neon)" />
            <ul className="space-y-2.5">
              {GAME_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <FooterLink href={href} label={label} />
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Platform */}
          <div>
            <FooterColHeading label="Platform" accentColor="var(--gold)" />
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(({ label, href, soon }) => (
                <li key={href}>
                  {soon ? (
                    <FooterSoonLink label={label} />
                  ) : (
                    <FooterLink href={href} label={label} />
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Legal + Contact */}
          <div>
            <FooterColHeading label="Legal" accentColor="var(--muted)" />
            <ul className="space-y-2.5 mb-8">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <FooterLink href={href} label={label} />
                </li>
              ))}
            </ul>

            <FooterColHeading label="Contact" accentColor="var(--muted)" />
            <a
              href="mailto:kiranspradeep2002@gmail.com"
              className="font-inter text-xs transition-colors break-all"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--neon)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              kiranspradeep2002@gmail.com
            </a>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className="h-[1px] w-full mb-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--border), transparent)",
          }}
        />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span
              className="font-inter text-xs"
              style={{ color: "var(--muted)" }}
            >
              © {year} KSP Games. All rights reserved.
            </span>
            <span
              className="hidden sm:block w-[3px] h-[3px] rounded-full"
              style={{ background: "var(--muted)", opacity: 0.4 }}
            />
            <span
              className="font-inter text-xs"
              style={{ color: "var(--muted)" }}
            >
              Scores saved locally · No tracking
            </span>
          </div>

          {/* Right — tech stack pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            {["Next.js", "TypeScript", "Canvas API"].map((tech) => (
              <span
                key={tech}
                className="font-inter text-[10px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Sub-components ─── */

function FooterColHeading({
  label,
  accentColor,
}: {
  label: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-3 h-[1px]"
        style={{ background: accentColor }}
      />
      <span
        className="font-inter text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: accentColor }}
      >
        {label}
      </span>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="font-inter text-xs transition-all duration-200 flex items-center gap-1.5
                 group w-fit"
      style={{ color: "var(--muted)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--muted)";
      }}
    >
      <span
        className="w-0 group-hover:w-2 h-[1px] transition-all duration-200 flex-shrink-0"
        style={{ background: "var(--neon)" }}
      />
      {label}
    </Link>
  );
}

function FooterSoonLink({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 w-fit"
      style={{ opacity: 0.45, cursor: "not-allowed" }}
    >
      <span className="font-inter text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span
        className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
        style={{
          background: "rgba(0,168,255,0.08)",
          border: "1px solid rgba(0,168,255,0.15)",
          color: "var(--neon)",
        }}
      >
        SOON
      </span>
    </div>
  );
}