// ── In-memory presence tracking ───────────────────────────────────────────────
// Tracks who is online, what game they're in, last heartbeat

export type UserStatus =
  | "online"
  | "in_game"
  | "in_lobby"
  | "away"
  | "offline";

export interface PresenceEntry {
  userId:     string;
  username:   string;
  displayName:string;
  avatarUrl:  string | null;
  status:     UserStatus;
  currentGame:string | null;
  roomCode:   string | null;
  socketId:   string;
  connectedAt:Date;
  lastSeen:   Date;
}

class PresenceManager {
  // userId → PresenceEntry
  private presence = new Map<string, PresenceEntry>();

  // socketId → userId  (for disconnect lookup)
  private socketMap = new Map<string, string>();

  // ── Connect ──────────────────────────────────────────────────────────────────
  connect(entry: Omit<PresenceEntry, "connectedAt" | "lastSeen">): void {
    const now = new Date();

    // Clean up old socket if user reconnects
    const existing = this.presence.get(entry.userId);
    if (existing) {
      this.socketMap.delete(existing.socketId);
    }

    this.presence.set(entry.userId, {
      ...entry,
      connectedAt: now,
      lastSeen: now,
    });
    this.socketMap.set(entry.socketId, entry.userId);
  }

  // ── Disconnect by socket ID ───────────────────────────────────────────────────
  disconnectBySocket(socketId: string): PresenceEntry | null {
    const userId = this.socketMap.get(socketId);
    if (!userId) return null;

    const entry = this.presence.get(userId);
    this.presence.delete(userId);
    this.socketMap.delete(socketId);

    return entry ?? null;
  }

  // ── Update status ─────────────────────────────────────────────────────────────
// ── Update status ─────────────────────────────────────────────────────────────
updateStatus(
  userId: string,
  status: UserStatus,
  meta?: { currentGame?: string | null; roomCode?: string | null }
): void {
  const entry = this.presence.get(userId);
  if (!entry) return;

  this.presence.set(userId, {
    ...entry,
    status,
    lastSeen: new Date(),
    currentGame:
      meta !== undefined && "currentGame" in meta
        ? (meta.currentGame ?? null)
        : entry.currentGame,
    roomCode:
      meta !== undefined && "roomCode" in meta
        ? (meta.roomCode ?? null)
        : entry.roomCode,
  });
}

  // ── Heartbeat ─────────────────────────────────────────────────────────────────
  heartbeat(userId: string): void {
    const entry = this.presence.get(userId);
    if (!entry) return;
    this.presence.set(userId, { ...entry, lastSeen: new Date() });
  }

  // ── Getters ───────────────────────────────────────────────────────────────────
  get(userId: string): PresenceEntry | null {
    return this.presence.get(userId) ?? null;
  }

  getBySocket(socketId: string): PresenceEntry | null {
    const userId = this.socketMap.get(socketId);
    if (!userId) return null;
    return this.presence.get(userId) ?? null;
  }

  isOnline(userId: string): boolean {
    return this.presence.has(userId);
  }

  getOnlineCount(): number {
    return this.presence.size;
  }

  getAll(): PresenceEntry[] {
    return Array.from(this.presence.values());
  }

  getFriendPresence(userIds: string[]): PresenceEntry[] {
    return userIds
      .map((id) => this.presence.get(id))
      .filter((e): e is PresenceEntry => !!e);
  }

  // ── Stale cleanup (call every 2 min) ─────────────────────────────────────────
  cleanup(maxAgeMs: number = 5 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [userId, entry] of this.presence.entries()) {
      if (entry.lastSeen.getTime() < cutoff) {
        this.socketMap.delete(entry.socketId);
        this.presence.delete(userId);
      }
    }
  }
}

// Singleton
export const presenceManager = new PresenceManager();