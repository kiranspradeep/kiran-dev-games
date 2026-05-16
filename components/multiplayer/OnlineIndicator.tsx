"use client";

import { usePresenceStore } from "@/store/presenceStore";
import { motion, AnimatePresence } from "framer-motion";

interface OnlineIndicatorProps {
  showCount?: boolean;
  size?:      "sm" | "md";
}

export default function OnlineIndicator({
  showCount = true,
  size = "sm",
}: OnlineIndicatorProps) {
  const { isConnected, onlineCount } = usePresenceStore();

  return (
    <AnimatePresence>
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1.5"
        >
          <span
            className="relative flex"
            style={{
              width:  size === "sm" ? 8 : 10,
              height: size === "sm" ? 8 : 10,
            }}
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full
                         rounded-full opacity-75"
              style={{ background: "#22c55e" }}
            />
            <span
              className="relative inline-flex rounded-full h-full w-full"
              style={{ background: "#22c55e" }}
            />
          </span>

          {showCount && onlineCount > 0 && (
            <span
              className="font-inter font-medium"
              style={{
                color:    "var(--muted)",
                fontSize: size === "sm" ? 11 : 12,
              }}
            >
              {onlineCount.toLocaleString()} online
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}