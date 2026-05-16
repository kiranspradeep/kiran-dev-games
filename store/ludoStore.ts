"use client";

import { create } from "zustand";
import type {
  LudoColor,
  LudoPiece,
  LudoPlayer,
  DiceRoll,
  LudoMove,
} from "@/types/ludo";

export interface LudoGameState {
  roomCode:         string;
  matchId:          string;
  players:          LudoPlayer[];
  currentTurn:      string;
  currentColor:     LudoColor;
  phase:            "waiting" | "playing" | "finished";
  turnOrder:        string[];
  lastRoll:         DiceRoll | null;
  lastMove:         LudoMove | null;
  winner:           string | null;
  rankings:         string[];
  consecutiveSixes: number;
  turnStartedAt:    string;
  turnTimeLimit:    number;
}

interface LudoStoreState {
  gameState:       LudoGameState | null;
  isMyTurn:        boolean;
  myColor:         LudoColor | null;
  myPlayer:        LudoPlayer | null;
  isRolling:       boolean;
  isMoving:        boolean;
  selectedPiece:   string | null;
  turnTimeLeft:    number;
  showResult:      boolean;
  lastCaptured:    string | null;

  setGameState:    (state: LudoGameState) => void;
  setMyUserId:     (userId: string) => void;
  setRolling:      (v: boolean) => void;
  setMoving:       (v: boolean) => void;
  selectPiece:     (id: string | null) => void;
  setTimeLeft:     (n: number) => void;
  setShowResult:   (v: boolean) => void;
  setLastCaptured: (id: string | null) => void;
  reset:           () => void;

  _myUserId: string;
}

export const useLudoStore = create<LudoStoreState>()((set) => ({
  gameState:     null,
  isMyTurn:      false,
  myColor:       null,
  myPlayer:      null,
  isRolling:     false,
  isMoving:      false,
  selectedPiece: null,
  turnTimeLeft:  30,
  showResult:    false,
  lastCaptured:  null,
  _myUserId:     "",

  setGameState: (state) =>
    set((s) => {
      const myPlayer = state.players.find(
        (p) => p.userId === s._myUserId
      );
      return {
        gameState:   state,
        isMyTurn:    state.currentTurn === s._myUserId,
        myColor:     myPlayer?.color ?? null,
        myPlayer:    myPlayer ?? null,
      };
    }),

  setMyUserId: (userId) =>
    set((s) => {
      const myPlayer = s.gameState?.players.find(
        (p) => p.userId === userId
      );
      return {
        _myUserId: userId,
        myColor:   myPlayer?.color ?? null,
        myPlayer:  myPlayer ?? null,
        isMyTurn:  s.gameState?.currentTurn === userId,
      };
    }),

  setRolling:      (v)  => set({ isRolling: v }),
  setMoving:       (v)  => set({ isMoving: v }),
  selectPiece:     (id) => set({ selectedPiece: id }),
  setTimeLeft:     (n)  => set({ turnTimeLeft: n }),
  setShowResult:   (v)  => set({ showResult: v }),
  setLastCaptured: (id) => set({ lastCaptured: id }),

  reset: () =>
    set({
      gameState:     null,
      isMyTurn:      false,
      myColor:       null,
      myPlayer:      null,
      isRolling:     false,
      isMoving:      false,
      selectedPiece: null,
      turnTimeLeft:  30,
      showResult:    false,
      lastCaptured:  null,
    }),
}));