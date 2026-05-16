"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, AtSign, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { authApi } from "@/lib/api";
import { persistAuth } from "@/lib/auth-client";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";
import { signIn } from "next-auth/react";

interface SignupFormData {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function SignupForm({
  onSuccess,
  onSwitchToLogin,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const { setUser } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<SignupFormData>();

  const watchedUsername = watch("username");
  const watchedPassword = watch("password", "");

  // Username availability check
  useEffect(() => {
    if (!watchedUsername || watchedUsername.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await authApi.checkUsername(watchedUsername);
        setUsernameStatus(
          res.data?.available ? "available" : "taken"
        );
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedUsername]);

  // Password strength
  const passwordChecks = {
    length: watchedPassword.length >= 8,
    uppercase: /[A-Z]/.test(watchedPassword),
    lowercase: /[a-z]/.test(watchedPassword),
    number: /[0-9]/.test(watchedPassword),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const onSubmit = async (data: SignupFormData) => {
    if (usernameStatus === "taken") {
      setError("username", { message: "Username is already taken" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register(data);

      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? "Registration failed");
      }

      persistAuth(res.data.tokens);
      setUser(res.data.user);
      toast.success(
        "Welcome to KSP Games!",
        `Account created for ${res.data.user.displayName}`
      );
      onSuccess?.();
    // SignupForm.tsx — in onSubmit catch, make it more specific:
} catch (err: unknown) {
  const message =
    err instanceof Error ? err.message : "Registration failed";

  const lower = message.toLowerCase();

  if (lower.includes("email already exists") || lower.includes("email")) {
    setError("email", { message: "This email is already registered. Try logging in." });
  } else if (lower.includes("username") || lower.includes("taken")) {
    setError("username", { message: "This username is taken. Try another." });
  } else {
    setError("email", { message });
  }
} finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      toast.error("Google signup failed", "Please try again");
      setIsGoogleLoading(false);
    }
  };

  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strengthColor = strengthColors[passwordStrength - 1] ?? "#2a2a2a";

  return (
    <div className="flex flex-col gap-4">
      {/* Google OAuth */}
      <Button
        variant="secondary"
        fullWidth
        onClick={handleGoogleSignup}
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        {/* Display Name */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-inter text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Display Name
          </label>
          <div className="relative">
            <User
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              {...register("displayName", {
                required: "Display name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 30, message: "At most 30 characters" },
              })}
              type="text"
              placeholder="Your Name"
              autoComplete="name"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl font-inter text-sm
                         outline-none transition-all duration-200"
              style={{
                background: "var(--card)",
                border: errors.displayName
                  ? "1px solid rgba(239,68,68,0.5)"
                  : "1px solid var(--border)",
                color: "var(--primary)",
              }}
              onFocus={(e) => {
                if (!errors.displayName)
                  e.currentTarget.style.border =
                    "1px solid rgba(0,168,255,0.4)";
              }}
              onBlur={(e) => {
                if (!errors.displayName)
                  e.currentTarget.style.border = "1px solid var(--border)";
              }}
            />
          </div>
          {errors.displayName && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-inter text-[11px]"
              style={{ color: "#ef4444" }}
            >
              {errors.displayName.message}
            </motion.p>
          )}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-inter text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Username
          </label>
          <div className="relative">
            <AtSign
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "At least 3 characters" },
                maxLength: { value: 20, message: "At most 20 characters" },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: "Letters, numbers, _ and - only",
                },
              })}
              type="text"
              placeholder="your_username"
              autoComplete="username"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl font-inter text-sm
                         outline-none transition-all duration-200"
              style={{
                background: "var(--card)",
                border: errors.username
                  ? "1px solid rgba(239,68,68,0.5)"
                  : usernameStatus === "available"
                  ? "1px solid rgba(34,197,94,0.4)"
                  : usernameStatus === "taken"
                  ? "1px solid rgba(239,68,68,0.4)"
                  : "1px solid var(--border)",
                color: "var(--primary)",
              }}
            />
            {/* Username status icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === "checking" && (
                <div
                  className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "var(--muted)",
                    borderTopColor: "transparent",
                  }}
                />
              )}
              {usernameStatus === "available" && (
                <Check size={14} style={{ color: "#22c55e" }} />
              )}
              {usernameStatus === "taken" && (
                <X size={14} style={{ color: "#ef4444" }} />
              )}
            </div>
          </div>
          {errors.username && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-inter text-[11px]"
              style={{ color: "#ef4444" }}
            >
              {errors.username.message}
            </motion.p>
          )}
          {usernameStatus === "taken" && !errors.username && (
            <p className="font-inter text-[11px]" style={{ color: "#ef4444" }}>
              Username is already taken
            </p>
          )}
        </div>

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
                minLength: { value: 8, message: "At least 8 characters" },
                validate: {
                  hasUpper: (v) =>
                    /[A-Z]/.test(v) || "Needs an uppercase letter",
                  hasLower: (v) =>
                    /[a-z]/.test(v) || "Needs a lowercase letter",
                  hasNumber: (v) =>
                    /[0-9]/.test(v) || "Needs a number",
                },
              })}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
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

          {/* Password strength bar */}
          {watchedPassword && (
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background:
                      i < passwordStrength ? strengthColor : "var(--border)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Password requirement hints */}
          {watchedPassword && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              {[
                { key: "length", label: "8+ chars" },
                { key: "uppercase", label: "Uppercase" },
                { key: "lowercase", label: "Lowercase" },
                { key: "number", label: "Number" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1">
                  {passwordChecks[key as keyof typeof passwordChecks] ? (
                    <Check size={10} style={{ color: "#22c55e" }} />
                  ) : (
                    <X size={10} style={{ color: "var(--muted)" }} />
                  )}
                  <span
                    className="font-inter text-[10px]"
                    style={{
                      color: passwordChecks[key as keyof typeof passwordChecks]
                        ? "#22c55e"
                        : "var(--muted)",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={isGoogleLoading || usernameStatus === "taken"}
          className="mt-1"
        >
          Create Account
        </Button>
      </form>

      {/* Switch to login */}
      <p
        className="text-center font-inter text-xs"
        style={{ color: "var(--muted)" }}
      >
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="font-semibold cursor-pointer transition-colors"
          style={{ color: "var(--neon)" }}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}