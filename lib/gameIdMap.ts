// Maps frontend game IDs to backend GameId enum values

export const GAME_ID_MAP: Record<string, string> = {
  snake:    "SNAKE",
  pacman:   "PACMAN",
  "2048":   "GAME_2048",
  wordle:   "WORDLE",
};

export const GAME_DISPLAY: Record<string, {
  label: string;
  color: string;
  icon: string;
  description: string;
  maxScore?: number;
}> = {
  SNAKE: {
    label: "Snake",
    color: "#22c55e",
    icon: "🐍",
    description: "Eat food, grow longer, avoid walls",
  },
  PACMAN: {
    label: "Pac-Man",
    color: "#eab308",
    icon: "👾",
    description: "Eat dots, avoid ghosts, clear the maze",
  },
  GAME_2048: {
    label: "2048",
    color: "#a855f7",
    icon: "🔢",
    description: "Merge tiles to reach 2048",
  },
  WORDLE: {
    label: "Wordle",
    color: "#22c55e",
    icon: "📝",
    description: "Guess the 5-letter word in 6 tries",
  },
  STRATEGY_LUDO: {
    label: "Strategy Ludo",
    color: "#00A8FF",
    icon: "🎲",
    description: "Competitive ranked Ludo",
  },
};

export function toBackendGameId(frontendId: string): string {
  return GAME_ID_MAP[frontendId] ?? frontendId.toUpperCase();
}

export function toFrontendGameId(backendId: string): string {
  const entry = Object.entries(GAME_ID_MAP).find(
    ([, v]) => v === backendId
  );
  return entry?.[0] ?? backendId.toLowerCase();
}

// ── STRATEGY_LUDO added here ──────────────────────────────────────────────────
export const LIVE_GAME_IDS = [
  "SNAKE",
  "PACMAN",
  "GAME_2048",
  "WORDLE",
  "STRATEGY_LUDO",
];

export const ALL_GAME_IDS = Object.values(GAME_ID_MAP);