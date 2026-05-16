"use client";

import { motion } from "framer-motion";
import { X, Check, CheckCheck, Trash2, Bell, BellOff } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationsRead,
  useMarkAllRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { useAcceptFriendRequest } from "@/hooks/useProfile";
import { formatDistanceToNow } from "@/lib/dateUtils";

interface NotificationPanelProps {
  onClose: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  FRIEND_REQUEST:      "👋",
  FRIEND_ACCEPTED:     "🤝",
  ACHIEVEMENT_UNLOCKED:"🏆",
  MATCH_INVITE:        "🎮",
  MATCH_RESULT:        "🏅",
  RANK_UP:             "⬆️",
  RANK_DOWN:           "⬇️",
  SYSTEM:              "📢",
};

const TYPE_COLORS: Record<string, string> = {
  FRIEND_REQUEST:      "#00A8FF",
  FRIEND_ACCEPTED:     "#22c55e",
  ACHIEVEMENT_UNLOCKED:"#C8A97E",
  MATCH_INVITE:        "#a855f7",
  MATCH_RESULT:        "#f97316",
  RANK_UP:             "#22c55e",
  RANK_DOWN:           "#ef4444",
  SYSTEM:              "var(--muted)",
};

export default function NotificationPanel({
  onClose,
}: NotificationPanelProps) {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();
  const acceptFriend = useAcceptFriendRequest();

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unreadCount   ?? 0;

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) markRead.mutate([id]);
  };

  const handleAcceptFriend = async (
    friendshipId: string,
    notifId: string
  ) => {
    await acceptFriend.mutateAsync(friendshipId);
    deleteNotif.mutate(notifId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl
                 overflow-hidden z-50"
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
      }}
      onClick={(e) => e.stopPropagation()}
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

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Bell size={14} style={{ color: "var(--neon)" }} />
          <span
            className="font-inter text-sm font-bold"
            style={{ color: "var(--primary)" }}
          >
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="font-inter text-[10px] font-bold px-1.5 py-0.5
                         rounded-full"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#ef4444",
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg
                         font-inter text-[10px] transition-all cursor-pointer"
              style={{
                color: "var(--muted)",
                border: "1px solid transparent",
              }}
              title="Mark all as read"
            >
              <CheckCheck size={11} />
              All read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center
                       rounded-lg cursor-pointer"
            style={{ color: "var(--muted)" }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {isLoading && (
          <div className="p-4 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3">
            <BellOff size={28} style={{ color: "var(--muted)" }} />
            <p
              className="font-inter text-sm"
              style={{ color: "var(--muted)" }}
            >
              No notifications
            </p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="p-2 flex flex-col gap-1">
            {notifications.map(
              (notif: {
                id: string;
                type: string;
                title: string;
                body: string;
                isRead: boolean;
                createdAt: string;
                data?: Record<string, unknown>;
              }) => {
                const color =
                  TYPE_COLORS[notif.type] ?? "var(--muted)";
                const icon = TYPE_ICONS[notif.type] ?? "📌";

                return (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl transition-all duration-150 group"
                    style={{
                      background: notif.isRead
                        ? "transparent"
                        : `${color}08`,
                      border: notif.isRead
                        ? "1px solid transparent"
                        : `1px solid ${color}20`,
                    }}
                    onClick={() =>
                      handleMarkRead(notif.id, notif.isRead)
                    }
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center
                                   justify-center text-sm shrink-0"
                        style={{
                          background: `${color}15`,
                          border: `1px solid ${color}25`,
                        }}
                      >
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="font-inter text-xs font-semibold"
                            style={{
                              color: notif.isRead
                                ? "var(--muted)"
                                : "var(--primary)",
                            }}
                          >
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                              style={{ background: color }}
                            />
                          )}
                        </div>

                        <p
                          className="font-inter text-[11px] leading-relaxed mt-0.5"
                          style={{ color: "var(--muted)" }}
                        >
                          {notif.body}
                        </p>

                        <p
                          className="font-inter text-[10px] mt-1.5"
                          style={{ color: "var(--muted)" }}
                        >
                          {formatDistanceToNow(notif.createdAt)}
                        </p>

                        {/* Friend request actions */}
                        {notif.type === "FRIEND_REQUEST" &&
                          !notif.isRead && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const friendshipId =
                                    notif.data?.friendshipId as
                                      | string
                                      | undefined;
                                  if (friendshipId) {
                                    handleAcceptFriend(
                                      friendshipId,
                                      notif.id
                                    );
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1
                                           rounded-lg font-inter text-[11px]
                                           font-medium cursor-pointer
                                           transition-all"
                                style={{
                                  background: "rgba(34,197,94,0.12)",
                                  border: "1px solid rgba(34,197,94,0.25)",
                                  color: "#22c55e",
                                }}
                              >
                                <Check size={10} />
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotif.mutate(notif.id);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1
                                           rounded-lg font-inter text-[11px]
                                           font-medium cursor-pointer
                                           transition-all"
                                style={{
                                  background: "rgba(239,68,68,0.08)",
                                  border: "1px solid rgba(239,68,68,0.15)",
                                  color: "#ef4444",
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotif.mutate(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100
                                   transition-opacity cursor-pointer shrink-0"
                        style={{ color: "var(--muted)" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}