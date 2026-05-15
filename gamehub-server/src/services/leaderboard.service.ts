import prisma from "../lib/prisma";
import { GameId } from "@prisma/client";
import { getTierFromElo } from "../lib/xp";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  score: number;
  achievedAt: Date;
}

export interface RankedEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  elo: number;
  tier: string;
  tierColor: string;
  wins: number;
  losses: number;
  winRate: number;
}

export interface GlobalStats {
  totalPlayers: number;
  totalGamesPlayed: number;
  topScore: number;
  topScoreHolder: string | null;
}

// ── Top scores per game ───────────────────────────────────────────────────────
export async function getTopScores(
  gameId: GameId,
  limit: number = 10,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  // One best score per user
  const raw = await prisma.$queryRaw<
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
      AND u.status = 'ACTIVE'::"UserStatus"
    ORDER BY gs."userId", gs.score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Sort by score descending and add rank
  const sorted = [...raw].sort(
    (a, b) => Number(b.score) - Number(a.score)
  );

  return sorted.map((entry, index) => ({
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

// ── Ranked leaderboard (ELO) ──────────────────────────────────────────────────
export async function getRankedLeaderboard(
  gameId: GameId,
  season: number = 1,
  limit: number = 10,
  offset: number = 0
): Promise<RankedEntry[]> {
  const rankings = await prisma.playerRanking.findMany({
    where: {
      gameId,
      season,
      user: { status: "ACTIVE" },
    },
    orderBy: { elo: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          level: true,
        },
      },
    },
  });

  return rankings.map((r, index) => {
    const total = r.wins + r.losses + r.draws;
    const winRate = total > 0 ? Math.round((r.wins / total) * 100) : 0;

    return {
      rank: offset + index + 1,
      userId: r.user.id,
      username: r.user.username,
      displayName: r.user.displayName,
      avatarUrl: r.user.avatarUrl,
      level: r.user.level,
      elo: r.elo,
      tier: getTierFromElo(r.elo),
      tierColor: getTierColor(r.elo),
      wins: r.wins,
      losses: r.losses,
      winRate,
    };
  });
}

// ── Personal best per game for a user ────────────────────────────────────────
export async function getUserPersonalBests(userId: string) {
  const scores = await prisma.gameScore.groupBy({
    by: ["gameId"],
    where: { userId },
    _max: { score: true },
    _count: { id: true },
  });

  // Get rank for each game
  const withRanks = await Promise.all(
    scores.map(async (s) => {
      const highScore = s._max.score ?? 0;

      // Count how many users have a higher score
      const betterCount = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT gs2."userId") as count
        FROM game_scores gs2
        WHERE gs2."gameId" = ${s.gameId}::"GameId"
          AND gs2.score > ${highScore}
      `;

      const rank = Number(betterCount[0]?.count ?? 0) + 1;

      return {
        gameId: s.gameId,
        highScore,
        gamesPlayed: s._count.id,
        globalRank: rank,
      };
    })
  );

  return withRanks;
}

// ── Global stats for a game ───────────────────────────────────────────────────
export async function getGameStats(gameId: GameId): Promise<GlobalStats> {
  const [totalPlayers, totalGamesPlayed, topEntry] = await Promise.all([
    prisma.gameScore
      .groupBy({ by: ["userId"], where: { gameId } })
      .then((r) => r.length),

    prisma.gameScore.count({ where: { gameId } }),

    prisma.gameScore.findFirst({
      where: { gameId },
      orderBy: { score: "desc" },
      include: {
        user: { select: { username: true } },
      },
    }),
  ]);

  return {
    totalPlayers,
    totalGamesPlayed,
    topScore: topEntry?.score ?? 0,
    topScoreHolder: topEntry?.user.username ?? null,
  };
}

// ── User rank in a specific game ──────────────────────────────────────────────
export async function getUserRankInGame(
  userId: string,
  gameId: GameId
): Promise<number | null> {
  const userBest = await prisma.gameScore.findFirst({
    where: { userId, gameId },
    orderBy: { score: "desc" },
    select: { score: true },
  });

  if (!userBest) return null;

  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT gs2."userId") as count
    FROM game_scores gs2
    WHERE gs2."gameId" = ${gameId}::"GameId"
      AND gs2.score > ${userBest.score}
  `;

  return Number(result[0]?.count ?? 0) + 1;
}

// ── All-time combined leaderboard ─────────────────────────────────────────────
export async function getGlobalLeaderboard(limit: number = 10) {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      level: true,
      xp: true,
      gameScores: {
        select: { score: true, gameId: true },
      },
      profile: {
        select: {
          totalWins: true,
          totalGamesPlayed: true,
          winRate: true,
        },
      },
    },
    take: limit * 3, // fetch more, sort in memory
  });

  // Rank by XP
  const sorted = users
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);

  return sorted.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    level: u.level,
    xp: u.xp,
    totalGamesPlayed: u.profile?.totalGamesPlayed ?? 0,
    totalWins: u.profile?.totalWins ?? 0,
    winRate: u.profile?.winRate ?? 0,
  }));
}

// ── Tier color helper ─────────────────────────────────────────────────────────
function getTierColor(elo: number): string {
  if (elo >= 2200) return "#ff4655";
  if (elo >= 1800) return "#a855f7";
  if (elo >= 1500) return "#00A8FF";
  if (elo >= 1200) return "#06b6d4";
  if (elo >= 1000) return "#C8A97E";
  if (elo >= 800)  return "#94a3b8";
  return "#cd7f32";
}