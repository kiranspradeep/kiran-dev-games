// src/services/score.service.ts
import prisma from "../lib/prisma";
import { awardXp } from "./user.service";
import type { SubmitScoreInput } from "../validators/score.validators";
import { GameId, Prisma } from "@prisma/client";

// ── Submit a score ────────────────────────────────────────────────────────────
export async function submitScore(userId: string, input: SubmitScoreInput) {
  const { gameId, score, metadata } = input;

  // Get current personal best for this game
  const existingBest = await prisma.gameScore.findFirst({
    where: { userId, gameId: gameId as GameId },
    orderBy: { score: "desc" },
    select: { score: true },
  });

  const isNewHighScore = !existingBest || score > existingBest.score;

  // Safely cast metadata to Prisma-compatible JSON value
  const metadataJson: Prisma.InputJsonValue | undefined =
    metadata !== undefined && metadata !== null
      ? (metadata as Prisma.InputJsonValue)
      : undefined;

  // Save the score
  const saved = await prisma.gameScore.create({
    data: {
      userId,
      gameId: gameId as GameId,
      score,
      ...(metadataJson !== undefined && { metadata: metadataJson }),
    },
    select: {
      id: true,
      gameId: true,
      score: true,
      achievedAt: true,
    },
  });

  // Update profile stats
  await prisma.profile.update({
    where: { userId },
    data: {
      totalGamesPlayed: { increment: 1 },
    },
  });

  // Award XP
  const xpResult = await awardXp(userId, "GAME_PLAYED");
  let bonusXp = null;

  if (isNewHighScore) {
    bonusXp = await awardXp(userId, "HIGH_SCORE");
  }

  return {
    score: saved,
    isNewHighScore,
    previousBest: existingBest?.score ?? null,
    xp: {
      gained: isNewHighScore
        ? xpResult.newXp + (bonusXp?.newXp ?? 0)
        : xpResult.newXp,
      leveledUp: xpResult.leveledUp || (bonusXp?.leveledUp ?? false),
      newLevel: bonusXp?.newLevel ?? xpResult.newLevel,
    },
  };
}

// ── Get personal best scores ──────────────────────────────────────────────────
export async function getPersonalBests(userId: string) {
  const scores = await prisma.gameScore.groupBy({
    by: ["gameId"],
    where: { userId },
    _max: { score: true },
    _count: { id: true },
  });

  return scores.map((s) => ({
    gameId: s.gameId,
    highScore: s._max.score,
    gamesPlayed: s._count.id,
  }));
}

// ── Get leaderboard for a game ────────────────────────────────────────────────
export async function getLeaderboard(
  gameId: GameId,
  limit: number = 10,
  offset: number = 0
) {
  const topScores = await prisma.$queryRaw<
    Array<{
      userId: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      level: number;
      score: bigint;
      achievedAt: Date;
    }>
  >`
    SELECT DISTINCT ON (gs."userId")
      gs."userId",
      u.username,
      u."displayName",
      u."avatarUrl",
      u.level,
      gs.score,
      gs."achievedAt"
    FROM game_scores gs
    JOIN users u ON u.id = gs."userId"
    WHERE gs."gameId" = ${gameId}::"GameId"
      AND u.status = 'ACTIVE'
    ORDER BY gs."userId", gs.score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return topScores.map((entry, index) => ({
    rank: offset + index + 1,
    userId: entry.userId,
    username: entry.username,
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
    level: entry.level,
    score: Number(entry.score),
    achievedAt: entry.achievedAt,
  }));
}

// ── Get score history for a user + game ──────────────────────────────────────
export async function getScoreHistory(
  userId: string,
  gameId: GameId,
  limit: number = 10
) {
  return prisma.gameScore.findMany({
    where: { userId, gameId },
    orderBy: { achievedAt: "desc" },
    take: limit,
    select: {
      id: true,
      score: true,
      metadata: true,
      achievedAt: true,
    },
  });
}

// import prisma from "../lib/prisma";
// import { Errors } from "../middleware/errorHandler";
// import { awardXp } from "./user.service";
// import type { SubmitScoreInput } from "../validators/score.validators";
// import { GameId } from "@prisma/client";

// // ── Submit a score ────────────────────────────────────────────────────────────
// export async function submitScore(
//   userId: string,
//   input: SubmitScoreInput
// ) {
//   const { gameId, score, metadata } = input;

//   // Get current personal best for this game
//   const existingBest = await prisma.gameScore.findFirst({
//     where: { userId, gameId: gameId as GameId },
//     orderBy: { score: "desc" },
//     select: { score: true },
//   });

//   const isNewHighScore = !existingBest || score > existingBest.score;

//   // Save the score
//   const saved = await prisma.gameScore.create({
//     data: {
//       userId,
//       gameId: gameId as GameId,
//       score,
//       metadata,
//     },
//     select: {
//       id: true,
//       gameId: true,
//       score: true,
//       achievedAt: true,
//     },
//   });

//   // Update profile stats
//   await prisma.profile.update({
//     where: { userId },
//     data: {
//       totalGamesPlayed: { increment: 1 },
//     },
//   });

//   // Award XP
//   const xpResult = await awardXp(userId, "GAME_PLAYED");
//   let bonusXp = null;

//   if (isNewHighScore) {
//     bonusXp = await awardXp(userId, "HIGH_SCORE");
//   }

//   return {
//     score: saved,
//     isNewHighScore,
//     previousBest: existingBest?.score ?? null,
//     xp: {
//       gained: isNewHighScore
//         ? xpResult.newXp + (bonusXp?.newXp ?? 0)
//         : xpResult.newXp,
//       leveledUp: xpResult.leveledUp || (bonusXp?.leveledUp ?? false),
//       newLevel: bonusXp?.newLevel ?? xpResult.newLevel,
//     },
//   };
// }

// // ── Get personal best scores ──────────────────────────────────────────────────
// export async function getPersonalBests(userId: string) {
//   const scores = await prisma.gameScore.groupBy({
//     by: ["gameId"],
//     where: { userId },
//     _max: { score: true },
//     _count: { id: true },
//   });

//   return scores.map((s) => ({
//     gameId: s.gameId,
//     highScore: s._max.score,
//     gamesPlayed: s._count.id,
//   }));
// }

// // ── Get leaderboard for a game ────────────────────────────────────────────────
// export async function getLeaderboard(
//   gameId: GameId,
//   limit: number = 10,
//   offset: number = 0
// ) {
//   // Get top score per user for this game
//   const topScores = await prisma.$queryRaw<
//     Array<{
//       userId: string;
//       username: string;
//       displayName: string;
//       avatarUrl: string | null;
//       level: number;
//       score: bigint;
//       achievedAt: Date;
//     }>
//   >`
//     SELECT DISTINCT ON (gs."userId")
//       gs."userId",
//       u.username,
//       u."displayName",
//       u."avatarUrl",
//       u.level,
//       gs.score,
//       gs."achievedAt"
//     FROM game_scores gs
//     JOIN users u ON u.id = gs."userId"
//     WHERE gs."gameId" = ${gameId}::"GameId"
//       AND u.status = 'ACTIVE'
//     ORDER BY gs."userId", gs.score DESC
//     LIMIT ${limit}
//     OFFSET ${offset}
//   `;

//   return topScores.map((entry, index) => ({
//     rank: offset + index + 1,
//     userId: entry.userId,
//     username: entry.username,
//     displayName: entry.displayName,
//     avatarUrl: entry.avatarUrl,
//     level: entry.level,
//     score: Number(entry.score),
//     achievedAt: entry.achievedAt,
//   }));
// }

// // ── Get score history for a user + game ───────────────────────────────────────
// export async function getScoreHistory(
//   userId: string,
//   gameId: GameId,
//   limit: number = 10
// ) {
//   return prisma.gameScore.findMany({
//     where: { userId, gameId },
//     orderBy: { achievedAt: "desc" },
//     take: limit,
//     select: {
//       id: true,
//       score: true,
//       metadata: true,
//       achievedAt: true,
//     },
//   });
// }