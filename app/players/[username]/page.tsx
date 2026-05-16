"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileAchievements from "@/components/profile/ProfileAchievements";
import { usePublicProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/authStore";
import { UserX } from "lucide-react";
import Link from "next/link";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuthStore();

  const { data: profile, isLoading, isError } = usePublicProfile(username);
  const isOwnProfile = user?.username === username;

  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ background: "var(--background)" }}
      >
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--neon)",
            }}
          />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div
        className="min-h-screen"
        style={{ background: "var(--background)" }}
      >
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <UserX size={40} style={{ color: "var(--muted)" }} />
          <p
            className="font-inter text-base font-semibold"
            style={{ color: "var(--primary)" }}
          >
            Player not found
          </p>
          <p
            className="font-inter text-sm"
            style={{ color: "var(--muted)" }}
          >
            @{username} doesn't exist or their profile is private
          </p>
          <Link
            href="/games"
            className="font-inter text-sm font-medium mt-2"
            style={{ color: "var(--neon)" }}
          >
            Browse Games
          </Link>
        </div>
      </div>
    );
  }

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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <ProfileStats profile={profile} />
            </div>
            <div>
              <ProfileAchievements profile={profile} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}