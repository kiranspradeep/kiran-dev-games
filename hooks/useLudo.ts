"use client";

import { useEffect, useCallback, useRef } from "react";
import { useLudoStore } from "@/store/ludoStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketEvent, useSocketEmit } from "./useSocket";
import { useToast } from "@/store/uiStore";
import type { LudoGameState } from "@/store/ludoStore";

interface LudoRollResult {
  success: boolean;
  error?:  string;
  roll?:   { value: number; canMove: string[] };
}

interface LudoMoveResult {
  success: boolean;
  error?:  string;
  move?:   object;
}

export function useLudo(roomCode: string, matchId: string) {
  const {
    gameState,
    isMyTurn,
    myColor,
    myPlayer,
    isRolling,
    isMoving,
    selectedPiece,
    turnTimeLeft,
    showResult,
    lastCaptured,
    setGameState,
    setMyUserId,
    setRolling,
    setMoving,
    selectPiece,
    setTimeLeft,
    setShowResult,
    setLastCaptured,
    reset,
  } = useLudoStore();

  const { user }    = useAuthStore();
  const emit        = useSocketEmit();
  const toast       = useToast();
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef<number>(30); // track value outside React state
  const initialized = useRef(false);

  // Set my user ID
  useEffect(() => {
    if (user) setMyUserId(user.id);
  }, [user, setMyUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      reset();
    };
  }, [reset]);

  // ── Turn timer countdown ──────────────────────────────────────────────────
  const startCountdown = useCallback(
    (timeLimit: number) => {
      if (timerRef.current) clearInterval(timerRef.current);

      timeLeftRef.current = timeLimit;
      setTimeLeft(timeLimit);

      timerRef.current = setInterval(() => {
        timeLeftRef.current = timeLeftRef.current - 1;

        if (timeLeftRef.current <= 0) {
          timeLeftRef.current = 0;
          setTimeLeft(0);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setTimeLeft(timeLeftRef.current);
        }
      }, 1000);
    },
    [setTimeLeft]
  );

  // ── Socket event listeners ────────────────────────────────────────────────
  useSocketEvent<{ state: LudoGameState }>(
    "ludo:state",
    ({ state }) => {
      setGameState(state);
    }
  );

  useSocketEvent<{ roll: object; state: LudoGameState }>(
    "ludo:rolled",
    ({ state }) => {
      setGameState(state);
      setRolling(false);
    }
  );

  useSocketEvent<{ move: object; state: LudoGameState }>(
    "ludo:moved",
    ({ move, state }) => {
      setGameState(state);
      setMoving(false);
      selectPiece(null);

      const m = move as { captured?: string };
      if (m.captured) {
        setLastCaptured(m.captured);
        setTimeout(() => setLastCaptured(null), 2000);
      }
    }
  );

  useSocketEvent<{
    userId:    string;
    color:     string;
    timeLimit: number;
  }>("ludo:turn_start", ({ userId, timeLimit }) => {
    startCountdown(timeLimit);

    if (userId === user?.id) {
      toast.info("Your turn!", "Roll the dice");
    }
  });

  useSocketEvent<{ state: LudoGameState }>(
    "ludo:timeout",
    ({ state }) => {
      setGameState(state);
      toast.warning("Turn skipped", "Time ran out");
    }
  );

  useSocketEvent<{
    state:    object;
    rankings: string[];
    winner:   string;
  }>("ludo:game_over", ({ winner }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowResult(true);

    if (winner === user?.id) {
      toast.success("You won! 🎉", "Congratulations!");
    } else {
      toast.info("Game over", "Better luck next time");
    }
  });

  useSocketEvent<{ userId: string; displayName: string }>(
    "ludo:player_forfeited",
    ({ displayName }) => {
      toast.warning(`${displayName} forfeited`);
    }
  );

  useSocketEvent<{ userId: string; displayName: string }>(
    "ludo:player_disconnected",
    ({ displayName }) => {
      toast.error(`${displayName} disconnected`);
    }
  );

  // ── Initialize game ───────────────────────────────────────────────────────
  const initGame = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const res = await emit<{ success: boolean; state: LudoGameState }>(
        "ludo:init",
        { roomCode, matchId }
      );
      if (res.success && res.state) {
        setGameState(res.state);
      }
    } catch {
      toast.error("Failed to start game");
    }
  }, [roomCode, matchId, emit, setGameState, toast]);

  // ── Roll dice ─────────────────────────────────────────────────────────────
  const rollDice = useCallback(async () => {
    if (!isMyTurn || isRolling || isMoving) return;

    setRolling(true);
    try {
      const res = await emit<LudoRollResult>("ludo:roll", { roomCode });
      if (!res.success) {
        toast.error("Cannot roll", res.error ?? "Unknown error");
        setRolling(false);
      }
    } catch {
      setRolling(false);
      toast.error("Connection error");
    }
  }, [isMyTurn, isRolling, isMoving, roomCode, emit, toast, setRolling]);

  // ── Move piece ────────────────────────────────────────────────────────────
  const movePiece = useCallback(
    async (pieceId: string) => {
      if (!isMyTurn || isMoving) return;

      const canMove = gameState?.lastRoll?.canMove ?? [];
      if (!canMove.includes(pieceId)) {
        toast.error(
          "Cannot move",
          "This piece cannot move with the current roll"
        );
        return;
      }

      setMoving(true);
      selectPiece(pieceId);

      try {
        const res = await emit<LudoMoveResult>("ludo:move", {
          roomCode,
          pieceId,
        });
        if (!res.success) {
          toast.error("Invalid move", res.error ?? "Unknown error");
          setMoving(false);
          selectPiece(null);
        }
      } catch {
        setMoving(false);
        selectPiece(null);
        toast.error("Connection error");
      }
    },
    [isMyTurn, isMoving, gameState, roomCode, emit, toast, setMoving, selectPiece]
  );

  // ── Forfeit ───────────────────────────────────────────────────────────────
  const forfeit = useCallback(async () => {
    try {
      await emit("ludo:forfeit", { roomCode });
    } catch {
      toast.error("Failed to forfeit");
    }
  }, [roomCode, emit, toast]);

  return {
    gameState,
    isMyTurn,
    myColor,
    myPlayer,
    isRolling,
    isMoving,
    selectedPiece,
    turnTimeLeft,
    showResult,
    lastCaptured,
    initGame,
    rollDice,
    movePiece,
    forfeit,
    selectPiece,
  };
}