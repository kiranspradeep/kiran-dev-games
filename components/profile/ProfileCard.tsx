"use client";

import { motion } from "framer-motion";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { authApi } from "@/lib/api";
// import { getAvatarFallback, getXpToNextLevel } from "@/lib/auth-client";
import { getAvatarFallback} from "@/lib/auth-client";
import { useToast } from "@/store/uiStore";
import Link from "next/link";

// Re-export the helper that was in auth-client
function getXpProgress(xp: number) {
  // level N requires N*(N-1)*50 XP total
  const level = Math.floor((-1 + Math.sqrt(1 + (4 * xp) / 50)) / 2) + 1;
  const currentLevelXp = 50 * (level - 1) * level;
  const nextLevelXp = 50 * level * (level + 1);
  const xpIntoLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return {
    current: xpIntoLevel,
    required: xpNeeded,
    progress: xpIntoLevel / xpNeeded,
    level,
  };
}

export default function ProfileCard() {
  const { user, clearUser } = useAuthStore();
  const { openModal } = useUiStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const xp = getXpProgress(user.xp);
  const initials = getAvatarFallback(user);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // ignore errors — clear anyway
    } finally {
      clearUser();
      setOpen(false);
      toast.info("Signed out", "See you next time!");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                   transition-all duration-200 cursor-pointer"
        style={{
          background: open ? "rgba(0,168,255,0.08)" : "transparent",
          border: open
            ? "1px solid rgba(0,168,255,0.2)"
            : "1px solid var(--border)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center
                     font-inter text-xs font-bold shrink-0 overflow-hidden"
          style={{
            background: user.avatarUrl
              ? "transparent"
              : "linear-gradient(135deg, var(--neon-dim), rgba(0,168,255,0.3))",
            border: "1px solid rgba(0,168,255,0.2)",
          }}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span style={{ color: "var(--neon)" }}>{initials}</span>
          )}
        </div>

        {/* Name — hidden on small screens */}
        <div className="hidden sm:flex flex-col items-start">
          <span
            className="font-inter text-xs font-semibold leading-none"
            style={{ color: "var(--primary)" }}
          >
            {user.displayName}
          </span>
          <span
            className="font-inter text-[10px] leading-none mt-0.5"
            style={{ color: "var(--neon)" }}
          >
            Lvl {user.level}
          </span>
        </div>

        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--muted)" }}
        />
      </button>

      {/* Dropdown */}
      <motion.div
        initial={false}
        animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Top accent */}
        <div
          className="h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--neon), transparent)",
            opacity: 0.5,
          }}
        />

        {/* User info */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center
                         font-inter text-sm font-bold overflow-hidden shrink-0"
              style={{
                background: user.avatarUrl
                  ? "transparent"
                  : "linear-gradient(135deg, var(--neon-dim), rgba(0,168,255,0.3))",
                border: "1px solid rgba(0,168,255,0.2)",
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span style={{ color: "var(--neon)" }}>{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-inter text-sm font-bold truncate"
                style={{ color: "var(--primary)" }}
              >
                {user.displayName}
              </p>
              <p
                className="font-inter text-[11px] truncate"
                style={{ color: "var(--muted)" }}
              >
                @{user.username}
              </p>
            </div>
          </div>

          {/* XP bar */}
          <div className="mb-1 flex items-center justify-between">
            <span
              className="font-inter text-[10px] font-medium"
              style={{ color: "var(--muted)" }}
            >
              Level {xp.level}
            </span>
            <span
              className="font-inter text-[10px]"
              style={{ color: "var(--muted)" }}
            >
              {xp.current}/{xp.required} XP
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--neon), #0066cc)",
                width: `${Math.round(xp.progress * 100)}%`,
              }}
              initial={false}
              animate={{ width: `${Math.round(xp.progress * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mx-4"
          style={{ background: "var(--border)" }}
        />

        {/* Menu items */}
        <div className="p-2">
          <Link
            href={`/profile`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                       font-inter text-sm transition-all duration-150 cursor-pointer"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            <User size={15} />
            View Profile
          </Link>

          <button
            onClick={() => {
              setOpen(false);
              openModal("settings");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       font-inter text-sm transition-all duration-150 cursor-pointer text-left"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            <Settings size={15} />
            Settings
          </button>

          {/* Divider */}
          <div
            className="h-px my-1.5"
            style={{ background: "var(--border)" }}
          />

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       font-inter text-sm transition-all duration-150 cursor-pointer text-left"
            style={{ color: "#ef4444" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={15} />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}