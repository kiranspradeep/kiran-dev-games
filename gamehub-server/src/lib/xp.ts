// ── XP + Level System ─────────────────────────────────────────────────────────
// Simple formula: level N requires N * 100 XP to reach

export const XP_REWARDS = {
  // Game actions
  GAME_PLAYED:        10,
  GAME_WIN:           50,
  GAME_LOSS:           5,
  HIGH_SCORE:         25,
  FIRST_GAME:        100,

  // Social
  FRIEND_ADDED:       20,
  PROFILE_COMPLETE:   50,

  // Ranked
  RANKED_WIN:        100,
  RANKED_LOSS:        10,
  RANK_UP:           200,

  // Achievements
  ACHIEVEMENT_COMMON:    50,
  ACHIEVEMENT_RARE:     150,
  ACHIEVEMENT_EPIC:     300,
  ACHIEVEMENT_LEGENDARY:500,
} as const;

export type XpRewardKey = keyof typeof XP_REWARDS;

// ── Level calculation ─────────────────────────────────────────────────────────
export function getLevelFromXp(xp: number): number {
  // Level 1 = 0 XP
  // Level 2 = 100 XP
  // Level 3 = 300 XP  (100 + 200)
  // Level N = sum of 100 * i for i = 1..N-1
  // Solve: xp = 50 * level^2 + 50 * level  → quadratic
  return Math.floor((-1 + Math.sqrt(1 + (4 * xp) / 50)) / 2) + 1;
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * (level - 1) * level;
}

export function getXpToNextLevel(currentXp: number): {
  current: number;
  required: number;
  progress: number; // 0-1
  level: number;
} {
  const level = getLevelFromXp(currentXp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpIntoLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return {
    current: xpIntoLevel,
    required: xpNeeded,
    progress: xpIntoLevel / xpNeeded,
    level,
  };
}

// ── ELO calculation ───────────────────────────────────────────────────────────
const K_FACTOR = 32;

export function calculateElo(
  playerElo: number,
  opponentElo: number,
  result: "win" | "loss" | "draw"
): number {
  const expected =
    1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

  const score = result === "win" ? 1 : result === "loss" ? 0 : 0.5;
  const change = Math.round(K_FACTOR * (score - expected));

  return Math.max(100, playerElo + change);
}

export function getEloChange(
  playerElo: number,
  opponentElo: number,
  result: "win" | "loss" | "draw"
): number {
  const newElo = calculateElo(playerElo, opponentElo, result);
  return newElo - playerElo;
}

// ── Rank tier from ELO ────────────────────────────────────────────────────────
export function getTierFromElo(elo: number): string {
  if (elo >= 2200) return "GRANDMASTER";
  if (elo >= 1800) return "MASTER";
  if (elo >= 1500) return "DIAMOND";
  if (elo >= 1200) return "PLATINUM";
  if (elo >= 1000) return "GOLD";
  if (elo >= 800)  return "SILVER";
  return "BRONZE";
}