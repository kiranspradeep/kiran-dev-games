"use client";

import { motion } from "framer-motion";
import { UserPlus, UserMinus, UserCheck, Clock, Edit2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import {
  useSendFriendRequest,
  useRemoveFriend,
  useFriendshipStatus,
} from "@/hooks/useProfile";
import { getTierColor } from "@/lib/auth-client";
import { formatDate } from "@/lib/dateUtils";
import type { PublicProfile } from "@/types/auth";

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  onEditClick?: () => void;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  onEditClick,
}: ProfileHeaderProps) {
  const { user } = useAuthStore();
  const { openModal } = useUiStore();
  const sendRequest = useSendFriendRequest();
  const removeFriend = useRemoveFriend();
  const { data: friendStatus } = useFriendshipStatus(profile.id);

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const xp = profile.xpProgress;
  const topRanking = profile.rankings?.[0];
  const tierColor = topRanking
    ? getTierColor(topRanking.tier)
    : "var(--muted)";

  const handleFriendAction = () => {
    if (!user) {
      openModal("auth", "login");
      return;
    }

    if (friendStatus?.status === "ACCEPTED" && friendStatus.friendshipId) {
      removeFriend.mutate(profile.id);
    } else if (friendStatus?.status === "NONE" || !friendStatus) {
      sendRequest.mutate(profile.username);
    }
  };

  const FriendButton = () => {
    if (isOwnProfile) return null;

    const status = friendStatus?.status ?? "NONE";

    const configs = {
      NONE: {
        icon: <UserPlus size={13} />,
        label: "Add Friend",
        style: {
          background: "rgba(0,168,255,0.1)",
          border: "1px solid rgba(0,168,255,0.25)",
          color: "var(--neon)",
        },
      },
      PENDING: {
        icon: <Clock size={13} />,
        label: friendStatus?.isSender ? "Request Sent" : "Respond",
        style: {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          color: "var(--muted)",
        },
      },
      ACCEPTED: {
        icon: <UserCheck size={13} />,
        label: "Friends",
        style: {
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e",
        },
      },
      BLOCKED: {
        icon: <UserMinus size={13} />,
        label: "Blocked",
        style: {
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#ef4444",
        },
      },
    };

    const config = configs[status as keyof typeof configs] ?? configs.NONE;
    const isLoading =
      sendRequest.isPending || removeFriend.isPending;

    return (
      <button
        onClick={handleFriendAction}
        disabled={
          isLoading ||
          status === "PENDING" ||
          status === "BLOCKED"
        }
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                   font-inter text-xs font-semibold transition-all
                   duration-200 cursor-pointer disabled:opacity-60
                   disabled:cursor-not-allowed"
        style={config.style}
      >
        {config.icon}
        {isLoading ? "..." : config.label}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 0% 0%, rgba(0,168,255,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row gap-5">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center
                     font-inter text-2xl font-black shrink-0 overflow-hidden"
          style={{
            background: profile.avatarUrl
              ? "transparent"
              : "linear-gradient(135deg, rgba(0,168,255,0.2), rgba(0,102,204,0.2))",
            border: "1px solid rgba(0,168,255,0.2)",
          }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span style={{ color: "var(--neon)" }}>{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="font-inter text-2xl font-black"
                  style={{ color: "var(--primary)" }}
                >
                  {profile.displayName}
                </h1>
                {topRanking && (
                  <span
                    className="font-inter text-[11px] font-bold px-2 py-0.5
                               rounded-full"
                    style={{
                      background: `${tierColor}15`,
                      border: `1px solid ${tierColor}30`,
                      color: tierColor,
                    }}
                  >
                    {topRanking.tier}
                  </span>
                )}
              </div>
              <p
                className="font-inter text-sm mt-0.5"
                style={{ color: "var(--muted)" }}
              >
                @{profile.username}
              </p>
              {profile.bio && (
                <p
                  className="font-inter text-sm mt-2 max-w-md leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {profile.bio}
                </p>
              )}
              <p
                className="font-inter text-[11px] mt-2"
                style={{ color: "var(--muted)" }}
              >
                Joined {formatDate(profile.createdAt)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <FriendButton />
              {isOwnProfile && (
                <button
                  onClick={onEditClick}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                             font-inter text-xs font-medium transition-all
                             duration-200 cursor-pointer"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <Edit2 size={12} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Level + XP bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="font-inter text-xs font-bold"
                style={{ color: "var(--neon)" }}
              >
                Level {profile.level}
              </span>
              <span
                className="font-inter text-[11px]"
                style={{ color: "var(--muted)" }}
              >
                {xp.current.toLocaleString()} /
                {xp.required.toLocaleString()} XP
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--neon), #0066cc)",
                }}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.round(xp.progress * 100)}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}