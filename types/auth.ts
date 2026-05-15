export interface User {
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
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface XpProgress {
  current: number;
  required: number;
  progress: number;
  level: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  xp: number;
  xpProgress: XpProgress;
  createdAt: string;
  stats: {
    totalGamesPlayed: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    favoriteGame: string | null;
    isPublic: boolean;
  } | null;
  recentAchievements: Array<{
    key: string;
    title: string;
    icon: string;
    rarity: string;
  }>;
  rankings: Array<{
    gameId: string;
    elo: number;
    tier: string;
    wins: number;
    losses: number;
  }>;
}