"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useUiStore } from "@/store/uiStore";

const TOAST_STYLES = {
  success: {
    icon: CheckCircle,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
  },
  error: {
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
  },
  info: {
    icon: Info,
    color: "var(--neon)",
    bg: "rgba(0,168,255,0.08)",
    border: "rgba(0,168,255,0.2)",
  },
  warning: {
    icon: AlertTriangle,
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.2)",
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2"
      style={{ maxWidth: 360 }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          const Icon = style.icon;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <Icon
                size={18}
                className="shrink-0 mt-0.5"
                style={{ color: style.color }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="font-inter text-sm font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  {toast.title}
                </p>
                {toast.message && (
                  <p
                    className="font-inter text-xs mt-0.5 leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 cursor-pointer"
                style={{ color: "var(--muted)" }}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}