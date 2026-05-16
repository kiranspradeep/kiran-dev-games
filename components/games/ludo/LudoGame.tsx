"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import LudoBoard from "./LudoBoard";
import LudoHUD from "./LudoHUD";
import LudoDice from "./LudoDice";
import LudoResultModal from "./LudoResultModal";
import { useLudo } from "@/hooks/useLudo";
import { useAuthStore } from "@/store/authStore";

interface LudoGameProps {
  roomCode: string;
  matchId:  string;
}

const COLOR_MAP: Record<string, string> = {
  RED:    "#ef4444",
  GREEN:  "#22c55e",
  YELLOW: "#eab308",
  BLUE:   "#3b82f6",
};

export default function LudoGame({ roomCode, matchId }: LudoGameProps) {
  const { user } = useAuthStore();

  const {
    gameState,
    isMyTurn,
    myColor,
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
  } = useLudo(roomCode, matchId);

  // Initialize game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--neon)",
          }}
        />
      </div>
    );
  }

  const canMovePieces = isMyTurn
    ? (gameState.lastRoll?.canMove ?? [])
    : [];

  const currentPlayer = gameState.players.find(
    (p) => p.userId === gameState.currentTurn
  );

  const handlePieceClick = (pieceId: string) => {
    if (!isMyTurn) return;
    if (canMovePieces.includes(pieceId)) {
      movePiece(pieceId);
    } else {
      selectPiece(pieceId === selectedPiece ? null : pieceId);
    }
  };

  const accentColor = myColor ? COLOR_MAP[myColor] : "var(--neon)";

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* ── Board ── */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Turn indicator */}
        <div
          className="flex items-center justify-between px-4 py-2 rounded-xl"
          style={{
            background: isMyTurn
              ? `${accentColor}10`
              : "var(--card)",
            border: isMyTurn
              ? `1px solid ${accentColor}30`
              : "1px solid var(--border)",
          }}
        >
          <span
            className="font-inter text-sm font-bold"
            style={{
              color: isMyTurn ? accentColor : "var(--muted)",
            }}
          >
            {isMyTurn
              ? "Your Turn!"
              : `${currentPlayer?.displayName ?? "..."}'s Turn`}
          </span>
          {gameState.consecutiveSixes > 0 && (
            <span
              className="font-inter text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(200,169,126,0.1)",
                border: "1px solid rgba(200,169,126,0.2)",
                color: "var(--accent)",
              }}
            >
              {gameState.consecutiveSixes}× Six!
            </span>
          )}
        </div>

        <LudoBoard
          players={gameState.players}
          currentColor={gameState.currentColor}
          canMovePieces={canMovePieces}
          selectedPiece={selectedPiece}
          onPieceClick={handlePieceClick}
          lastCaptured={lastCaptured}
        />

        {/* Dice + controls */}
        <div className="flex items-center justify-between px-2">
          <LudoDice
            value={gameState.lastRoll?.value ?? null}
            isRolling={isRolling}
            canRoll={
              isMyTurn &&
              !isRolling &&
              !isMoving &&
              !gameState.lastRoll
            }
            onRoll={rollDice}
            color={myColor ?? "RED"}
            isMyTurn={isMyTurn}
          />

          {/* Forfeit */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to forfeit this match?"
                )
              ) {
                forfeit();
              }
            }}
            className="px-4 py-2 rounded-xl font-inter text-xs font-medium
                       transition-all cursor-pointer"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#ef4444",
            }}
          >
            Forfeit
          </button>
        </div>
      </div>

      {/* ── HUD sidebar ── */}
      <div className="w-full lg:w-60 shrink-0">
        <LudoHUD
          players={gameState.players}
          currentTurn={gameState.currentTurn}
          turnTimeLeft={turnTimeLeft}
          turnTimeLimit={gameState.turnTimeLimit}
          rankings={gameState.rankings}
          myUserId={user?.id ?? ""}
        />
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {showResult && gameState.phase === "finished" && (
          <LudoResultModal
            players={gameState.players}
            rankings={gameState.rankings}
            winner={gameState.winner}
          />
        )}
      </AnimatePresence>
    </div>
  );
}