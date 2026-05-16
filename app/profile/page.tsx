"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileAchievements from "@/components/profile/ProfileAchievements";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { usePublicProfile } from "@/hooks/useProfile";
import { usePersonalBests } from "@/hooks/useLeaderboard";
import { useEffect } from "react";
import { GAME_DISPLAY } from "@/lib/gameIdMap";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { openModal } = useUiStore();
  const [editOpen, setEditOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = usePublicProfile(
    user?.username ?? ""
  );
  const { data: personalBests } = usePersonalBests(user?.id);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openModal("auth", "login");
    }
  }, [isAuthenticated, isLoading, openModal]);

  if (isLoading || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--neon)",
          }}
        />
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
          <p
            className="font-inter text-sm"
            style={{ color: "var(--muted)" }}
          >
            Sign in to view your profile
          </p>
        </div>
      </div>
    );
  }

  // Build a profile shape from user + fetched data
  const profileData = profile ?? {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    level: user.level,
    xp: user.xp,
    xpProgress: { current: 0, required: 100, progress: 0, level: user.level },
    createdAt: user.createdAt,
    stats: null,
    recentAchievements: [],
    rankings: [],
  };

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
        <div className="max-w-4xl mx-auto flex flex-col gap-5">

          {/* Profile header */}
          <ProfileHeader
            profile={profileData}
            isOwnProfile
            onEditClick={() => setEditOpen(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <ProfileStats profile={profileData} />

              {/* Personal bests */}
              {personalBests && personalBests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="font-inter text-[10px] uppercase tracking-widest mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    Personal Bests
                  </p>
                  <div className="flex flex-col gap-2">
                    {personalBests.map(
                      (pb: {
                        gameId: string;
                        highScore: number | null;
                        gamesPlayed: number;
                        globalRank: number;
                      }) => {
                        const game = GAME_DISPLAY[pb.gameId];
                        return (
                          <Link
                            key={pb.gameId}
                            href={`/leaderboards/${pb.gameId.toLowerCase()}`}
                            className="flex items-center gap-3 p-3 rounded-xl
                                       transition-all duration-150"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid var(--border)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(0,168,255,0.04)";
                              e.currentTarget.style.border =
                                "1px solid rgba(0,168,255,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.02)";
                              e.currentTarget.style.border =
                                "1px solid var(--border)";
                            }}
                          >
                            <span className="text-xl">
                              {game?.icon ?? "🎮"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-inter text-sm font-semibold"
                                style={{ color: "var(--primary)" }}
                              >
                                {game?.label ?? pb.gameId}
                              </p>
                              <p
                                className="font-inter text-[11px]"
                                style={{ color: "var(--muted)" }}
                              >
                                {pb.gamesPlayed} games played
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className="font-inter text-sm font-bold"
                                style={{ color: game?.color ?? "var(--neon)" }}
                              >
                                {pb.highScore?.toLocaleString() ?? "—"}
                              </p>
                              {pb.globalRank && (
                                <p
                                  className="font-inter text-[11px]"
                                  style={{ color: "var(--muted)" }}
                                >
                                  #{pb.globalRank} global
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      }
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              <ProfileAchievements profile={profileData} />
            </div>
          </div>
        </div>
      </main>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}