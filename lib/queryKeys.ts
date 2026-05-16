export const queryKeys = {
  // Auth
  me:    ["auth", "me"]  as const,
  xp:    ["auth", "xp"]  as const,

  // Users
  profile:     (username: string) => ["users", "profile", username] as const,
  searchUsers: (query: string)    => ["users", "search",  query]    as const,

  // Scores
  personalBests: (userId: string) =>
    ["scores", "personal", userId] as const,
  leaderboard: (gameId: string, limit?: number, offset?: number) =>
    ["scores", "leaderboard", gameId, limit, offset] as const,
  scoreHistory: (userId: string, gameId: string) =>
    ["scores", "history", userId, gameId] as const,

  // Notifications
  notifications:   (userId: string) => ["notifications",       userId] as const,
  unreadCount:     (userId: string) => ["notifications-count", userId] as const,

  // Friends
  friends:         (userId: string) => ["friends",         userId] as const,
  pendingRequests: (userId: string) => ["friends-pending", userId] as const,
  friendStatus:    (userId: string, otherId: string) =>
    ["friends-status", userId, otherId] as const,
} as const;