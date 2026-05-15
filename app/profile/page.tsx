"use client";

import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Trophy, Gamepad2, Star, TrendingUp } from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { openModal } = useUiStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openModal("auth", "login");
    }
  }, [isAuthenticated, isLoading, openModal]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--neon)",
            }}
          />
          <span
            className="font-inter text-sm"
            style={{ color: "var(--muted)" }}
          >
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div
        className="min-h-screen"
        style={{ background: "var(--background)" }}
      >
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p
              className="font-inter text-base"
              style={{ color: "var(--muted)" }}
            >
              Sign in to view your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: <Trophy size={20} />,
      label: "Rank",
      value: "Unranked",
      color: "var(--accent)",
    },
    {
      icon: <Gamepad2 size={20} />,
      label: "Games Played",
      value: "0",
      color: "var(--neon)",
    },
    {
      icon: <Star size={20} />,
      label: "Achievements",
      value: "0",
      color: "#a855f7",
    },
    {
      icon: <TrendingUp size={20} />,
      label: "Win Rate",
      value: "—",
      color: "#22c55e",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <Navbar />

      <div
        className="fixed top-[57px] left-0 right-0 z-30 h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--neon-dim), transparent)",
        }}
      />

      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="h-5 w-[2px] rounded-full"
                style={{ background: "var(--neon)" }}
              />
              <h1
                className="font-inter font-black text-3xl"
                style={{ color: "var(--primary)" }}
              >
                Profile
              </h1>
            </div>

            {/* Player card */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 0% 0%, rgba(0,168,255,0.05) 0%, transparent 60%)",
                }}
              />

              <div className="flex items-center gap-5 relative z-10">
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center
                             font-inter text-xl font-black shrink-0 overflow-hidden"
                  style={{
                    background: user.avatarUrl
                      ? "transparent"
                      : "linear-gradient(135deg, rgba(0,168,255,0.2), rgba(0,102,204,0.2))",
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
                    <span style={{ color: "var(--neon)" }}>
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2
                    className="font-inter text-2xl font-black mb-0.5"
                    style={{ color: "var(--primary)" }}
                  >
                    {user.displayName}
                  </h2>
                  <p
                    className="font-inter text-sm mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    @{user.username}
                  </p>

                  {/* XP bar */}
                  <div className="flex items-center gap-3">
                    <span
                      className="font-inter text-xs font-bold shrink-0"
                      style={{ color: "var(--neon)" }}
                    >
                      Lvl {user.level}
                    </span>
                    <div className="flex-1 max-w-xs">
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, var(--neon), #0066cc)",
                            width: "0%",
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="font-inter text-[11px] shrink-0"
                      style={{ color: "var(--muted)" }}
                    >
                      {user.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            {statCards.map(({ icon, label, value, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="p-4 rounded-2xl text-center"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-center mb-2"
                  style={{ color }}
                >
                  {icon}
                </div>
                <div
                  className="font-inter text-xl font-black mb-0.5"
                  style={{ color: "var(--primary)" }}
                >
                  {value}
                </div>
                <div
                  className="font-inter text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  {label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Coming soon sections */}
          {[
            "Recent Matches",
            "Achievements",
            "Rankings",
          ].map((section, i) => (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="mb-4 p-5 rounded-2xl flex items-center justify-between"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="font-inter text-sm font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {section}
              </span>
              <span
                className="font-inter text-[10px] uppercase tracking-widest px-2 py-1
                           rounded-full"
                style={{
                  background: "rgba(0,168,255,0.06)",
                  border: "1px solid rgba(0,168,255,0.15)",
                  color: "var(--muted)",
                }}
              >
                Phase 2
              </span>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}