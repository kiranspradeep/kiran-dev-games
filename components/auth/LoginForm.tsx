"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import { authApi } from "@/lib/api";
import { persistAuth } from "@/lib/auth-client";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";
import { signIn } from "next-auth/react";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export default function LoginForm({
  onSuccess,
  onSwitchToSignup,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { setUser } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);

      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? "Login failed");
      }

      persistAuth(res.data.tokens);
      setUser(res.data.user);
      toast.success("Welcome back!", `Logged in as ${res.data.user.displayName}`);
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";

      if (message.toLowerCase().includes("password")) {
        setError("password", { message });
      } else {
        setError("email", { message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      toast.error("Google login failed", "Please try again");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Google OAuth */}
      <Button
        variant="secondary"
        fullWidth
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
        disabled={isLoading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span
          className="font-inter text-[11px] uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          or
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-inter text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Email
          </label>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl font-inter text-sm
                         outline-none transition-all duration-200"
              style={{
                background: "var(--card)",
                border: errors.email
                  ? "1px solid rgba(239,68,68,0.5)"
                  : "1px solid var(--border)",
                color: "var(--primary)",
              }}
              onFocus={(e) => {
                if (!errors.email)
                  e.currentTarget.style.border =
                    "1px solid rgba(0,168,255,0.4)";
              }}
              onBlur={(e) => {
                if (!errors.email)
                  e.currentTarget.style.border = "1px solid var(--border)";
              }}
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-inter text-[11px]"
              style={{ color: "#ef4444" }}
            >
              {errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-inter text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Password
          </label>
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              {...register("password", {
                required: "Password is required",
              })}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl font-inter text-sm
                         outline-none transition-all duration-200"
              style={{
                background: "var(--card)",
                border: errors.password
                  ? "1px solid rgba(239,68,68,0.5)"
                  : "1px solid var(--border)",
                color: "var(--primary)",
              }}
              onFocus={(e) => {
                if (!errors.password)
                  e.currentTarget.style.border =
                    "1px solid rgba(0,168,255,0.4)";
              }}
              onBlur={(e) => {
                if (!errors.password)
                  e.currentTarget.style.border = "1px solid var(--border)";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "var(--muted)" }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-inter text-[11px]"
              style={{ color: "#ef4444" }}
            >
              {errors.password.message}
            </motion.p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={isGoogleLoading}
        >
          Sign In
        </Button>
      </form>

      {/* Switch to signup */}
      <p
        className="text-center font-inter text-xs"
        style={{ color: "var(--muted)" }}
      >
        No account?{" "}
        <button
          onClick={onSwitchToSignup}
          className="font-semibold cursor-pointer transition-colors"
          style={{ color: "var(--neon)" }}
        >
          Create one
        </button>
      </p>
    </div>
  );
}