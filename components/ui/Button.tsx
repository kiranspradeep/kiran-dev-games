"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const VARIANTS = {
  primary: {
    background: "linear-gradient(135deg, var(--neon) 0%, #0066cc 100%)",
    color: "#fff",
    border: "none",
    hover: "hover:shadow-[0_0_20px_rgba(0,168,255,0.4)]",
  },
  secondary: {
    background: "var(--card)",
    color: "var(--primary)",
    border: "1px solid var(--border)",
    hover: "hover:border-white/20",
  },
  ghost: {
    background: "transparent",
    color: "var(--muted)",
    border: "1px solid transparent",
    hover: "hover:text-primary",
  },
  danger: {
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.2)",
    hover: "hover:bg-red-500/20",
  },
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm",
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = "",
}: ButtonProps) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-inter font-semibold rounded-xl
        transition-all duration-200 cursor-pointer
        ${SIZES[size]}
        ${v.hover}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      style={{
        background: v.background,
        color: v.color,
        border: v.border,
      }}
    >
      {isLoading && (
        <Loader2 size={14} className="animate-spin shrink-0" />
      )}
      {children}
    </motion.button>
  );
}