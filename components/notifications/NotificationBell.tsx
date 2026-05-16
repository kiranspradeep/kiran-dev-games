"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: count = 0 } = useUnreadCount();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center
                   rounded-lg transition-all duration-200 cursor-pointer"
        style={{
          color: open ? "var(--primary)" : "var(--muted)",
          border: open
            ? "1px solid rgba(0,168,255,0.2)"
            : "1px solid var(--border)",
          background: open ? "rgba(0,168,255,0.06)" : "transparent",
        }}
        title="Notifications"
      >
        <Bell size={14} />

        {/* Unread badge */}
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full
                         flex items-center justify-center
                         font-inter text-[9px] font-black"
              style={{
                background: "#ef4444",
                color: "#fff",
              }}
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <NotificationPanel onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}