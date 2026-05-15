import { z } from "zod";

// ── Username rules ────────────────────────────────────────────────────────────
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  )
  .transform((s) => s.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const displayNameSchema = z
  .string()
  .min(2, "Display name must be at least 2 characters")
  .max(30, "Display name must be at most 30 characters")
  .trim();

// ── Register ──────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .transform((s) => s.toLowerCase().trim()),
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Refresh ───────────────────────────────────────────────────────────────────
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

// ── Change Password ───────────────────────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ── Update Profile ────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
  isPublic: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ── Google OAuth ──────────────────────────────────────────────────────────────
export const googleCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

export type GoogleCallbackInput = z.infer<typeof googleCallbackSchema>;