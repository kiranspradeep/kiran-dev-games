import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware/socketAuth";
import {
  createLudoGame,
  getLudoGame,
  destroyLudoGame,
} from "../managers/ludoEngine";
import { roomManager } from "../managers/roomManager";
import { presenceManager } from "../managers/presenceManager";
import prisma from "../../lib/prisma";
import { getTierFromElo, calculateElo } from "../../lib/xp";

// ── Turn timers ───────────────────────────────────────────────────────────────
const turnTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearTurnTimer(roomCode: string): void {
  const timer = turnTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomCode);
  }
}

function startTurnTimer(
  io: Server,
  roomCode: string,
  userId: string,
  timeLimit: number
): void {
  clearTurnTimer(roomCode);

  const timer = setTimeout(() => {
    const game = getLudoGame(roomCode);
    if (!game || game.isFinished()) return;

    game.handleTimeout();
    const state = game.serialize();

    io.to(`room:${roomCode}`).emit("ludo:timeout", {
      userId,
      state,
    });

    if (!game.isFinished()) {
      const next = game.getCurrentPlayer();
      if (next) {
        startTurnTimer(io, roomCode, next.userId, timeLimit);
        io.to(`room:${roomCode}`).emit("ludo:turn_start", {
          userId:    next.userId,
          color:     next.color,
          timeLimit,
        });
      }
    } else {
      handleGameEnd(io, roomCode, game.getState().matchId);
    }
  }, timeLimit * 1000);

  turnTimers.set(roomCode, timer);
}

// ── Handle game end ───────────────────────────────────────────────────────────
async function handleGameEnd(
  io: Server,
  roomCode: string,
  matchId: string
): Promise<void> {
  clearTurnTimer(roomCode);

  const game = getLudoGame(roomCode);
  if (!game) return;

  const state = game.getState();

  try {
    // Update match in DB
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status:  "COMPLETED",
        endedAt: new Date(),
      },
    });

    // Update match players
    for (let i = 0; i < state.rankings.length; i++) {
      const userId   = state.rankings[i];
      const isWinner = i === 0;
      const placement = i + 1;

      await prisma.matchPlayer.updateMany({
        where: { matchId, userId },
        data: {
          result:    isWinner ? "WIN" : "LOSS",
          placement,
        },
      });

      // Update profile stats
      await prisma.profile.update({
        where: { userId },
        data: {
          totalGamesPlayed: { increment: 1 },
          totalWins:        isWinner ? { increment: 1 } : undefined,
          totalLosses:      !isWinner ? { increment: 1 } : undefined,
        },
      });
    }

    // ELO updates for ranked matches
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { isRanked: true },
    });

    if (match?.isRanked && state.rankings.length >= 2) {
      await updateElo(state.rankings, matchId);
    }

    // Notify game over
    io.to(`room:${roomCode}`).emit("ludo:game_over", {
      state:    game.serialize(),
      rankings: state.rankings,
      winner:   state.winner,
    });

    // Update presence
    const room = roomManager.getRoom(roomCode);
    if (room) {
      for (const player of room.players.values()) {
  presenceManager.updateStatus(player.userId, "online", {
    currentGame: null,
    roomCode:    null,
  });
}
    }
  } catch (err) {
    console.error("[Ludo] handleGameEnd error:", err);
  } finally {
    destroyLudoGame(roomCode);
  }
}

// ── ELO update helper ─────────────────────────────────────────────────────────
async function updateElo(
  rankings: string[],
  matchId: string
): Promise<void> {
  const winner  = rankings[0];
  const loser   = rankings[rankings.length - 1];

  const [winnerRank, loserRank] = await Promise.all([
    prisma.playerRanking.findFirst({
      where: { userId: winner, gameId: "STRATEGY_LUDO", season: 1 },
    }),
    prisma.playerRanking.findFirst({
      where: { userId: loser, gameId: "STRATEGY_LUDO", season: 1 },
    }),
  ]);

  const winnerElo = winnerRank?.elo ?? 1000;
  const loserElo  = loserRank?.elo  ?? 1000;

  const newWinnerElo = calculateElo(winnerElo, loserElo, "win");
  const newLoserElo  = calculateElo(loserElo, winnerElo, "loss");

  const winnerChange = newWinnerElo - winnerElo;
  const loserChange  = newLoserElo  - loserElo;

  await Promise.all([
    prisma.playerRanking.upsert({
      where: {
        userId_gameId_season: {
          userId:  winner,
          gameId:  "STRATEGY_LUDO",
          season:  1,
        },
      },
      create: {
        userId:  winner,
        gameId:  "STRATEGY_LUDO",
        season:  1,
        elo:     newWinnerElo,
        tier:    getTierFromElo(newWinnerElo) as any,
        wins:    1,
      },
      update: {
        elo:  newWinnerElo,
        tier: getTierFromElo(newWinnerElo) as any,
        wins: { increment: 1 },
      },
    }),
    prisma.playerRanking.upsert({
      where: {
        userId_gameId_season: {
          userId:  loser,
          gameId:  "STRATEGY_LUDO",
          season:  1,
        },
      },
      create: {
        userId:  loser,
        gameId:  "STRATEGY_LUDO",
        season:  1,
        elo:     newLoserElo,
        tier:    getTierFromElo(newLoserElo) as any,
        losses:  1,
      },
      update: {
        elo:    newLoserElo,
        tier:   getTierFromElo(newLoserElo) as any,
        losses: { increment: 1 },
      },
    }),

    // Record ELO changes on match players
    prisma.matchPlayer.updateMany({
      where: { matchId, userId: winner },
      data: { eloChange: winnerChange },
    }),
    prisma.matchPlayer.updateMany({
      where: { matchId, userId: loser },
      data: { eloChange: loserChange },
    }),
  ]);
}

// ── Register handlers ─────────────────────────────────────────────────────────
export function registerLudoHandlers(
  io: Server,
  socket: AuthenticatedSocket
): void {
  // ── Game init (triggered by room:game_starting) ───────────────────────────
  socket.on(
    "ludo:init",
    (data: { roomCode: string; matchId: string }, callback?: Function) => {
      const room = roomManager.getRoom(data.roomCode);
      if (!room) {
        callback?.({ success: false, error: "Room not found" });
        return;
      }

      // Only create engine once (host triggers, others just get state)
      let game = getLudoGame(data.roomCode);

      if (!game) {
        game = createLudoGame(data.roomCode, data.matchId);

        // Add players in slot order
        const players = Array.from(room.players.values()).sort(
          (a, b) => a.slot - b.slot
        );
        for (const p of players) {
          game.addPlayer({
            userId:      p.userId,
            username:    p.username,
            displayName: p.displayName,
            avatarUrl:   p.avatarUrl,
            slot:        p.slot,
          });
        }

        game.start();

        // Start turn timer
        const state = game.getState();
        const first = game.getCurrentPlayer();
        if (first) {
          startTurnTimer(
            io,
            data.roomCode,
            first.userId,
            state.turnTimeLimit
          );
        }

        // Broadcast initial state to all in room
        io.to(`room:${data.roomCode}`).emit("ludo:state", {
          state: game.serialize(),
        });

        io.to(`room:${data.roomCode}`).emit("ludo:turn_start", {
          userId:    first?.userId,
          color:     first?.color,
          timeLimit: state.turnTimeLimit,
        });
      }

      callback?.({ success: true, state: game.serialize() });
    }
  );

  // ── Roll dice ─────────────────────────────────────────────────────────────
  socket.on(
    "ludo:roll",
    (
      data: { roomCode: string },
      callback?: Function
    ) => {
      const game = getLudoGame(data.roomCode);
      if (!game) {
        callback?.({ success: false, error: "Game not found" });
        return;
      }

      const result = game.rollDice(socket.userId);
      if ("error" in result) {
        callback?.({ success: false, error: result.error });
        return;
      }

      // Broadcast roll to all players
      io.to(`room:${data.roomCode}`).emit("ludo:rolled", {
        roll:  result,
        state: game.serialize(),
      });

      callback?.({ success: true, roll: result });

      // If no moves, turn already advanced — emit new turn
      if (result.canMove.length === 0) {
        const state = game.getState();
        if (!game.isFinished()) {
          const next = game.getCurrentPlayer();
          if (next) {
            clearTurnTimer(data.roomCode);
            startTurnTimer(
              io,
              data.roomCode,
              next.userId,
              state.turnTimeLimit
            );
            io.to(`room:${data.roomCode}`).emit("ludo:turn_start", {
              userId:    next.userId,
              color:     next.color,
              timeLimit: state.turnTimeLimit,
            });
          }
        } else {
          handleGameEnd(io, data.roomCode, game.getState().matchId);
        }
      }
    }
  );

  // ── Move piece ────────────────────────────────────────────────────────────
  socket.on(
    "ludo:move",
    (
      data: { roomCode: string; pieceId: string },
      callback?: Function
    ) => {
      const game = getLudoGame(data.roomCode);
      if (!game) {
        callback?.({ success: false, error: "Game not found" });
        return;
      }

      const result = game.movePiece(socket.userId, data.pieceId);
      if ("error" in result) {
        callback?.({ success: false, error: result.error });
        return;
      }

      const state = game.getState();

      // Broadcast move to all players
      io.to(`room:${data.roomCode}`).emit("ludo:moved", {
        move:  result,
        state: game.serialize(),
      });

      callback?.({ success: true, move: result });

      if (game.isFinished()) {
        handleGameEnd(io, data.roomCode, state.matchId);
        return;
      }

      // Start next turn timer
      const next = game.getCurrentPlayer();
      if (next && !result.rolledSix) {
        clearTurnTimer(data.roomCode);
        startTurnTimer(
          io,
          data.roomCode,
          next.userId,
          state.turnTimeLimit
        );
        io.to(`room:${data.roomCode}`).emit("ludo:turn_start", {
          userId:    next.userId,
          color:     next.color,
          timeLimit: state.turnTimeLimit,
        });
      } else if (result.rolledSix) {
        // Extra turn — reset timer for same player
        clearTurnTimer(data.roomCode);
        startTurnTimer(
          io,
          data.roomCode,
          socket.userId,
          state.turnTimeLimit
        );
      }
    }
  );

  // ── Forfeit ───────────────────────────────────────────────────────────────
  socket.on(
    "ludo:forfeit",
    (data: { roomCode: string }, callback?: Function) => {
      const game = getLudoGame(data.roomCode);
      if (!game) {
        callback?.({ success: false, error: "Game not found" });
        return;
      }

      io.to(`room:${data.roomCode}`).emit("ludo:player_forfeited", {
        userId:      socket.userId,
        displayName: socket.displayName,
      });

      // If < 2 active players remain, end game
      const state = game.getState();
      const activePlayers = state.players.filter(
        (p) => !state.rankings.includes(p.userId)
      );

      if (activePlayers.length <= 2) {
        handleGameEnd(io, data.roomCode, state.matchId);
      }

      callback?.({ success: true });
    }
  );

  // ── Disconnect during game ────────────────────────────────────────────────
  socket.on("disconnect", () => {
    // The room handler already handles room cleanup.
    // If a game is in progress, forfeit the player.
    const roomCode = roomManager.getUserRoomCode(socket.userId);
    if (!roomCode) return;

    const game = getLudoGame(roomCode);
    if (!game || game.isFinished()) return;

    io.to(`room:${roomCode}`).emit("ludo:player_disconnected", {
      userId:      socket.userId,
      displayName: socket.displayName,
    });

    const state = game.getState();
    const activePlayers = state.players.filter(
      (p) => !state.rankings.includes(p.userId)
    );
    if (activePlayers.length <= 2) {
      handleGameEnd(io, roomCode, state.matchId);
    }
  });
}