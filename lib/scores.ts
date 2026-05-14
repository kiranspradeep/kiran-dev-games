export type GameId = "snake" | "wordle" | "2048" | "pacman";

export interface ScoreData {
  highScore: number;
  lastScore?: number;
  gamesPlayed?: number;
  lastPlayed?: string;
  recentScores?: number[];
}

const SCORE_KEY_PREFIX = "ksp_games_score_";

export function getScore(gameId: GameId): ScoreData {
  if (typeof window === "undefined") return { highScore: 0 };

  try {
    const raw = localStorage.getItem(`${SCORE_KEY_PREFIX}${gameId}`);
    if (!raw) return { highScore: 0, gamesPlayed: 0, recentScores: [] };
    return JSON.parse(raw) as ScoreData;
  } catch {
    return { highScore: 0, gamesPlayed: 0, recentScores: [] };
  }
}

export function saveScore(gameId: GameId, score: number): ScoreData {
  if (typeof window === "undefined") return { highScore: score };

  const existing = getScore(gameId);
  const recent = existing.recentScores ?? [];
  recent.unshift(score);
  if (recent.length > 5) recent.length = 5;

  const newData: ScoreData = {
    highScore: Math.max(existing.highScore, score),
    lastScore: score,
    gamesPlayed: (existing.gamesPlayed ?? 0) + 1,
    lastPlayed: new Date().toISOString(),
    recentScores: recent,
  };

  try {
    localStorage.setItem(
      `${SCORE_KEY_PREFIX}${gameId}`,
      JSON.stringify(newData)
    );
  } catch {
    // localStorage might be full or unavailable
  }

  return newData;
}

export function clearScore(gameId: GameId): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${SCORE_KEY_PREFIX}${gameId}`);
}

export function formatScore(score: number): string {
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return score.toString();
}