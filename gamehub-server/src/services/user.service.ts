import prisma from "../lib/prisma";
import { Errors } from "../middleware/errorHandler";
import { getLevelFromXp, getXpToNextLevel, XP_REWARDS } from "../lib/xp";
import type { UpdateProfileInput } from "../validators/auth.validators";

// ── Get public profile ────────────────────────────────────────────────────────
export async function getPublicProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      xp: true,
      level: true,
      createdAt: true,
      status: true,
      profile: {
        select: {
          totalGamesPlayed: true,
          totalWins: true,
          totalLosses: true,
          winRate: true,
          favoriteGame: true,
          isPublic: true,
          showcaseBadges: true,
          country: true,
        },
      },
      achievements: {
        take: 6,
        orderBy: { unlockedAt: "desc" },
        include: {
          achievement: {
            select: {
              key: true,
              title: true,
              icon: true,
              rarity: true,
            },
          },
        },
      },
      rankings: {
        select: {
          gameId: true,
          elo: true,
          tier: true,
          wins: true,
          losses: true,
        },
      },
    },
  });

  if (!user || user.status === "DELETED") {
    throw Errors.notFound("Player");
  }

  if (!user.profile?.isPublic) {
    throw Errors.forbidden("This profile is private");
  }

  const xpProgress = getXpToNextLevel(user.xp);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    level: user.level,
    xp: user.xp,
    xpProgress,
    createdAt: user.createdAt,
    stats: user.profile,
    recentAchievements: user.achievements.map((ua) => ua.achievement),
    rankings: user.rankings,
  };
}

// ── Update profile ────────────────────────────────────────────────────────────
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
) {
  const { displayName, bio, avatarUrl, isPublic } = input;

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
      },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        ...(isPublic !== undefined && { isPublic }),
      },
    }),
  ]);

  return updatedUser;
}

// ── Award XP ──────────────────────────────────────────────────────────────────
export async function awardXp(
  userId: string,
  rewardKey: keyof typeof XP_REWARDS
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const xpAmount = XP_REWARDS[rewardKey];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });

  if (!user) throw Errors.notFound("User");

  const newXp = user.xp + xpAmount;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > user.level;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  });

  return { newXp, newLevel, leveledUp };
}

// ── Search users ──────────────────────────────────────────────────────────────
export async function searchUsers(query: string, limit: number = 10) {
  if (query.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { status: "ACTIVE" },
        {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { displayName: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      level: true,
    },
    take: limit,
  });

  return users;
}