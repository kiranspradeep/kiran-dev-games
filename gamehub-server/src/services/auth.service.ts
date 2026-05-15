import prisma from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../lib/jwt";
import { getLevelFromXp } from "../lib/xp";
import { Errors } from "../middleware/errorHandler";
import type { RegisterInput, LoginInput } from "../validators/auth.validators";
import crypto from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  xp: number;
  level: number;
  emailVerified: boolean;
  createdAt: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toSafeUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  xp: number;
  level: number;
  emailVerified: boolean;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    xp: user.xp,
    level: user.level,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

async function createTokensAndSession(
  userId: string,
  username: string,
  role: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthTokens> {
  // Create session record
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const refreshToken = crypto.randomBytes(32).toString("hex");

  await prisma.session.create({
    data: {
      userId,
      token: sessionToken,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  // Sign JWTs
  const accessToken = signAccessToken({ sub: userId, username, role });
  const signedRefresh = signRefreshToken({
    sub: userId,
    sessionId: sessionToken,
  });

  return {
    accessToken,
    refreshToken: signedRefresh,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(
  input: RegisterInput,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponse> {
  const { email, username, displayName, password } = input;

  // Check for existing email
  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingEmail) {
    throw Errors.conflict("An account with this email already exists");
  }

  // Check for existing username
  const existingUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existingUsername) {
    throw Errors.conflict("Username is already taken");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user + profile in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash,
        level: getLevelFromXp(0),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        xp: true,
        level: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Create empty profile
    await tx.profile.create({
      data: { userId: newUser.id },
    });

    return newUser;
  });

  const tokens = await createTokensAndSession(
    user.id,
    user.username,
    user.role,
    ipAddress,
    userAgent
  );

  return { user: toSafeUser(user), tokens };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(
  input: LoginInput,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponse> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      xp: true,
      level: true,
      emailVerified: true,
      createdAt: true,
      passwordHash: true,
      status: true,
    },
  });

  // Generic error to prevent email enumeration
  if (!user || !user.passwordHash) {
    throw Errors.unauthorized("Invalid email or password");
  }

  if (user.status === "SUSPENDED") {
    throw Errors.forbidden("Your account has been suspended");
  }

  if (user.status === "BANNED") {
    throw Errors.forbidden("Your account has been banned");
  }

  const passwordValid = await comparePassword(password, user.passwordHash);
  if (!passwordValid) {
    throw Errors.unauthorized("Invalid email or password");
  }

  // Update last seen
  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  const tokens = await createTokensAndSession(
    user.id,
    user.username,
    user.role,
    ipAddress,
    userAgent
  );

  return { user: toSafeUser(user), tokens };
}

// ── Refresh ───────────────────────────────────────────────────────────────────
export async function refresh(
  refreshToken: string
): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Errors.unauthorized("Invalid refresh token");
  }

  // Find session
  const session = await prisma.session.findFirst({
    where: {
      userId: payload.sub,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: { id: true, username: true, role: true, status: true },
      },
    },
  });

  if (!session || session.user.status !== "ACTIVE") {
    throw Errors.unauthorized("Session expired or invalid");
  }

  // Issue new access token (refresh token stays same)
  const accessToken = signAccessToken({
    sub: session.user.id,
    username: session.user.username,
    role: session.user.role,
  });

  return {
    accessToken,
    refreshToken, // return same refresh token
    expiresIn: 15 * 60,
  };
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logout(userId: string): Promise<void> {
  // Delete all sessions for this user
  await prisma.session.deleteMany({
    where: { userId },
  });
}

// ── Get current user ──────────────────────────────────────────────────────────
export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      xp: true,
      level: true,
      emailVerified: true,
      createdAt: true,
      status: true,
    },
  });

  if (!user || user.status === "DELETED") {
    throw Errors.notFound("User");
  }

  return toSafeUser(user);
}