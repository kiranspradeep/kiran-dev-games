import { randomInt } from "crypto";

// ── Strategy Ludo Game Engine ─────────────────────────────────────────────────
// Full deterministic game logic. Server is authoritative.

export type LudoColor = "RED" | "GREEN" | "YELLOW" | "BLUE";
export type PieceState = "HOME" | "ACTIVE" | "FINISHED";

export interface LudoPiece {
  id:       string;   // e.g. "RED_0"
  color:    LudoColor;
  index:    number;   // 0-3
  state:    PieceState;
  position: number;   // 0 = home, 1-56 = board, 57 = finished
  cell:     number;   // absolute cell on 52-square track
}

export interface LudoPlayer {
  userId:      string;
  username:    string;
  displayName: string;
  avatarUrl:   string | null;
  color:       LudoColor;
  slot:        number;
  pieces:      LudoPiece[];
  piecesHome:  number;  // count still in home
  piecesFinished: number;
  isEliminated:boolean;
}

export interface DiceRoll {
  value:     number;
  rolledBy:  string; // userId
  timestamp: Date;
  canMove:   string[]; // piece IDs that can move
}

export interface LudoMove {
  pieceId:      string;
  fromPosition: number;
  toPosition:   number;
  captured:     string | null; // captured piece ID
  enteredHome:  boolean;
  rolledSix:    boolean;
}

export interface LudoGameState {
  roomCode:       string;
  matchId:        string;
  players:        LudoPlayer[];
  currentTurn:    string;    // userId
  currentColor:   LudoColor;
  phase:          "waiting" | "playing" | "finished";
  turnOrder:      string[];  // userIds in order
  lastRoll:       DiceRoll | null;
  lastMove:       LudoMove | null;
  moveHistory:    LudoMove[];
  winner:         string | null;
  rankings:       string[];  // userIds in finish order
  consecutiveSixes: number;
  turnStartedAt:  Date;
  turnTimeLimit:  number;    // seconds
  createdAt:      Date;
}

// ── Board constants ───────────────────────────────────────────────────────────
// 52-square main track. Each color starts at a different entry point.
const COLOR_START_CELLS: Record<LudoColor, number> = {
  RED:    1,
  GREEN:  14,
  YELLOW: 27,
  BLUE:   40,
};

const COLOR_HOME_ENTRY: Record<LudoColor, number> = {
  RED:    51,
  GREEN:  12,
  YELLOW: 25,
  BLUE:   38,
};

const SAFE_CELLS = new Set([1, 9, 14, 22, 27, 35, 40, 48]);

// ── Dice RNG with anti-streak guard ───────────────────────────────────────────
// Per-player rolling history (last 3 values). If all 3 are identical,
// the next roll for that player excludes that value to prevent visible streaks.
const rollHistory = new Map<string, number[]>();

function rollDiceFor(userId: string): number {
  const history = rollHistory.get(userId) ?? [];

  // Check for streak: last 3 rolls all the same
  const streakValue =
    history.length >= 3 &&
    history[history.length - 1] === history[history.length - 2] &&
    history[history.length - 2] === history[history.length - 3]
      ? history[history.length - 1]
      : null;

  let value: number;

  if (streakValue !== null) {
    // Pick from {1..6} excluding the streak value — 5 possibilities
    const pool = [1, 2, 3, 4, 5, 6].filter((v) => v !== streakValue);
    value = pool[randomInt(0, pool.length)];
  } else {
    value = randomInt(1, 7); // 1..6 inclusive
  }

  // Update history (keep last 3)
  const next = [...history, value].slice(-3);
  rollHistory.set(userId, next);

  return value;
}

function clearRollHistory(userId: string): void {
  rollHistory.delete(userId);
}

// ── Engine ────────────────────────────────────────────────────────────────────
export class LudoEngine {
  private state: LudoGameState;

  constructor(roomCode: string, matchId: string) {
    this.state = {
      roomCode,
      matchId,
      players: [],
      currentTurn: "",
      currentColor: "RED",
      phase: "waiting",
      turnOrder: [],
      lastRoll: null,
      lastMove: null,
      moveHistory: [],
      winner: null,
      rankings: [],
      consecutiveSixes: 0,
      turnStartedAt: new Date(),
      turnTimeLimit: 30,
      createdAt: new Date(),
    };
  }

  // ── Add player ────────────────────────────────────────────────────────────
  addPlayer(player: {
    userId:      string;
    username:    string;
    displayName: string;
    avatarUrl:   string | null;
    slot:        number;
  }): void {
    const colors: LudoColor[] = ["RED", "GREEN", "YELLOW", "BLUE"];
    const color = colors[player.slot % 4];

    const pieces: LudoPiece[] = Array.from({ length: 4 }, (_, i) => ({
      id:       `${color}_${i}`,
      color,
      index:    i,
      state:    "HOME",
      position: 0,
      cell:     -1,
    }));

    this.state.players.push({
      ...player,
      color,
      pieces,
      piecesHome:     4,
      piecesFinished: 0,
      isEliminated:   false,
    });

    this.state.turnOrder.push(player.userId);
  }

  // ── Start game ────────────────────────────────────────────────────────────
  start(): void {
    if (this.state.players.length < 2) {
      throw new Error("Need at least 2 players");
    }

    // Shuffle turn order
    this.state.turnOrder = [...this.state.turnOrder].sort(
      () => Math.random() - 0.5
    );

    this.state.currentTurn  = this.state.turnOrder[0];
    this.state.currentColor = this.getPlayerColor(this.state.currentTurn);
    this.state.phase        = "playing";
    this.state.turnStartedAt = new Date();
  }

  // ── Roll dice ─────────────────────────────────────────────────────────────
  rollDice(userId: string): DiceRoll | { error: string } {
    if (this.state.phase !== "playing") {
      return { error: "Game not in progress" };
    }
    if (this.state.currentTurn !== userId) {
      return { error: "Not your turn" };
    }
    if (this.state.lastRoll && this.state.lastRoll.rolledBy === userId) {
      // Already rolled this turn — must move first (unless no moves)
      const movable = this.getMovablePieces(
        userId,
        this.state.lastRoll.value
      );
      if (movable.length > 0) {
        return { error: "You must move a piece first" };
      }
    }

    const value = rollDiceFor(userId);
    const canMove = this.getMovablePieces(userId, value).map((p) => p.id);

    const roll: DiceRoll = {
      value,
      rolledBy: userId,
      timestamp: new Date(),
      canMove,
    };

    this.state.lastRoll = roll;

    // No moves available — auto advance turn
    if (canMove.length === 0) {
      this.advanceTurn(value === 6);
    }

    return roll;
  }

  // ── Move piece ────────────────────────────────────────────────────────────
  movePiece(
    userId: string,
    pieceId: string
  ): LudoMove | { error: string } {
    if (this.state.phase !== "playing") {
      return { error: "Game not in progress" };
    }
    if (this.state.currentTurn !== userId) {
      return { error: "Not your turn" };
    }
    if (!this.state.lastRoll) {
      return { error: "Roll the dice first" };
    }

    const player = this.getPlayer(userId);
    if (!player) return { error: "Player not found" };

    const piece = player.pieces.find((p) => p.id === pieceId);
    if (!piece) return { error: "Piece not found" };

    const roll = this.state.lastRoll.value;

    // Validate piece can move
    if (
      !this.state.lastRoll.canMove.includes(pieceId)
    ) {
      return { error: "This piece cannot move" };
    }

    const fromPosition = piece.position;
    let toPosition     = fromPosition;
    let enteredHome    = false;
    let captured: string | null = null;

    // Move from home (requires 6)
    if (piece.state === "HOME") {
      if (roll !== 6) return { error: "Need a 6 to leave home" };
      piece.state    = "ACTIVE";
      piece.position = 1;
      piece.cell     = COLOR_START_CELLS[piece.color];
      toPosition     = 1;
    } else if (piece.state === "ACTIVE") {
      const newPosition = fromPosition + roll;

      // Check if piece reaches or passes finish
      if (newPosition >= 57) {
        if (newPosition === 57) {
          piece.state    = "FINISHED";
          piece.position = 57;
          piece.cell     = -1;
          toPosition     = 57;
          enteredHome    = true;
          player.piecesFinished++;
        } else {
          // Overshoots — cannot move
          return { error: "Cannot move: would overshoot finish" };
        }
      } else {
        piece.position = newPosition;
        piece.cell     = this.positionToCell(piece.color, newPosition);
        toPosition     = newPosition;

        // Check captures (not on safe cells)
        if (!SAFE_CELLS.has(piece.cell)) {
          captured = this.checkCapture(piece, player.userId);
        }
      }
    }

    const rolledSix = roll === 6;

    const move: LudoMove = {
      pieceId,
      fromPosition,
      toPosition,
      captured,
      enteredHome,
      rolledSix,
    };

    this.state.lastMove = move;
    this.state.moveHistory.push(move);

    // Check win condition
    if (player.piecesFinished === 4) {
      this.handlePlayerFinished(userId);
    }

    // Six = extra turn (max 3 consecutive sixes)
    if (rolledSix) {
      this.state.consecutiveSixes++;
      if (this.state.consecutiveSixes >= 3) {
        // Three consecutive sixes — lose turn
        this.state.consecutiveSixes = 0;
        this.advanceTurn(false);
      } else {
        // Extra turn — reset lastRoll so they can roll again
        this.state.lastRoll = null;
        this.state.turnStartedAt = new Date();
      }
    } else {
      this.state.consecutiveSixes = 0;
      this.advanceTurn(false);
    }

    return move;
  }

  // ── Handle player finishing ───────────────────────────────────────────────
  private handlePlayerFinished(userId: string): void {
    this.state.rankings.push(userId);

    const activePlayers = this.state.players.filter(
      (p) => !this.state.rankings.includes(p.userId)
    );

    if (activePlayers.length <= 1) {
      // Game over
      if (activePlayers.length === 1) {
        this.state.rankings.push(activePlayers[0].userId);
      }
      this.state.winner = this.state.rankings[0];
      this.state.phase  = "finished";
    }
  }

  // ── Advance turn ──────────────────────────────────────────────────────────
  private advanceTurn(extraTurn: boolean): void {
    if (this.state.phase === "finished") return;
    if (extraTurn) return; // same player goes again

    // Skip finished players
    const currentIndex = this.state.turnOrder.indexOf(
      this.state.currentTurn
    );
    let nextIndex = (currentIndex + 1) % this.state.turnOrder.length;
    let attempts  = 0;

    while (
      this.state.rankings.includes(
        this.state.turnOrder[nextIndex]
      ) &&
      attempts < this.state.turnOrder.length
    ) {
      nextIndex = (nextIndex + 1) % this.state.turnOrder.length;
      attempts++;
    }

    this.state.currentTurn  = this.state.turnOrder[nextIndex];
    this.state.currentColor = this.getPlayerColor(this.state.currentTurn);
    this.state.lastRoll     = null;
    this.state.turnStartedAt = new Date();
    this.state.consecutiveSixes = 0;
  }

  // ── Check for captures ────────────────────────────────────────────────────
  private checkCapture(
    movingPiece: LudoPiece,
    movingUserId: string
  ): string | null {
    for (const player of this.state.players) {
      if (player.userId === movingUserId) continue;

      for (const piece of player.pieces) {
        if (
          piece.state === "ACTIVE" &&
          piece.cell === movingPiece.cell &&
          !SAFE_CELLS.has(piece.cell)
        ) {
          // Send piece back home
          piece.state    = "HOME";
          piece.position = 0;
          piece.cell     = -1;
          player.piecesFinished = Math.max(0, player.piecesFinished);
          return piece.id;
        }
      }
    }
    return null;
  }

  // ── Get movable pieces for a roll ─────────────────────────────────────────
  private getMovablePieces(userId: string, roll: number): LudoPiece[] {
    const player = this.getPlayer(userId);
    if (!player) return [];

    return player.pieces.filter((piece) => {
      if (piece.state === "FINISHED") return false;

      if (piece.state === "HOME") {
        return roll === 6;
      }

      // Active piece — check it won't overshoot (unless exactly 57)
      const newPos = piece.position + roll;
      return newPos <= 57;
    });
  }

  // ── Convert relative position to absolute cell ────────────────────────────
  private positionToCell(color: LudoColor, position: number): number {
    const startCell = COLOR_START_CELLS[color];
    // Positions 1-51 = main track
    // Positions 52-56 = home column (color-specific, no capture)
    if (position >= 52) return -1; // in home column
    return ((startCell - 1 + position - 1) % 52) + 1;
  }

  // ── Handle turn timeout ───────────────────────────────────────────────────
  handleTimeout(): void {
    if (this.state.phase !== "playing") return;

    // Auto-roll if not rolled yet
    if (!this.state.lastRoll) {
      const value   = rollDiceFor(this.state.currentTurn);
      const canMove = this.getMovablePieces(
        this.state.currentTurn,
        value
      ).map((p) => p.id);

      this.state.lastRoll = {
        value,
        rolledBy:  this.state.currentTurn,
        timestamp: new Date(),
        canMove,
      };

      if (canMove.length > 0) {
        // Auto-move first available piece
        this.movePiece(this.state.currentTurn, canMove[0]);
        return;
      }
    }

    // Advance turn
    this.advanceTurn(false);
  }

  // ── Getters ───────────────────────────────────────────────────────────────
  getState(): LudoGameState {
    return { ...this.state };
  }

  getPlayer(userId: string): LudoPlayer | undefined {
    return this.state.players.find((p) => p.userId === userId);
  }

  private getPlayerColor(userId: string): LudoColor {
    return this.getPlayer(userId)?.color ?? "RED";
  }

  isFinished(): boolean {
    return this.state.phase === "finished";
  }

  getCurrentPlayer(): LudoPlayer | undefined {
    return this.getPlayer(this.state.currentTurn);
  }

  // ── Serialize for clients ─────────────────────────────────────────────────
  serialize(): object {
    return {
      roomCode:       this.state.roomCode,
      matchId:        this.state.matchId,
      players:        this.state.players.map((p) => ({
        userId:         p.userId,
        username:       p.username,
        displayName:    p.displayName,
        avatarUrl:      p.avatarUrl,
        color:          p.color,
        slot:           p.slot,
        pieces:         p.pieces,
        piecesHome:     p.piecesHome,
        piecesFinished: p.piecesFinished,
        isEliminated:   p.isEliminated,
      })),
      currentTurn:    this.state.currentTurn,
      currentColor:   this.state.currentColor,
      phase:          this.state.phase,
      turnOrder:      this.state.turnOrder,
      lastRoll:       this.state.lastRoll,
      lastMove:       this.state.lastMove,
      winner:         this.state.winner,
      rankings:       this.state.rankings,
      consecutiveSixes: this.state.consecutiveSixes,
      turnStartedAt:  this.state.turnStartedAt,
      turnTimeLimit:  this.state.turnTimeLimit,
    };
  }
}

// ── Game registry ─────────────────────────────────────────────────────────────
const activeGames = new Map<string, LudoEngine>();

export function createLudoGame(
  roomCode: string,
  matchId: string
): LudoEngine {
  const engine = new LudoEngine(roomCode, matchId);
  activeGames.set(roomCode, engine);
  return engine;
}

export function getLudoGame(roomCode: string): LudoEngine | null {
  return activeGames.get(roomCode) ?? null;
}

export function destroyLudoGame(roomCode: string): void {
  const game = activeGames.get(roomCode);
  if (game) {
    // Clear roll history for all players in this game
    const state = game.getState();
    for (const player of state.players) {
      clearRollHistory(player.userId);
    }
  }
  activeGames.delete(roomCode);
}