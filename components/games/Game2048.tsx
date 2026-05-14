// components/Game2048.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveScore, getScore } from "@/lib/scores";

type Board = number[][];
type MoveDir = "UP" | "DOWN" | "LEFT" | "RIGHT";

const BOARD_SIZE = 4;

const TILE_STYLES: Record<number, { bg: string; color: string }> = {
  0: { bg: "rgba(255,255,255,0.03)", color: "transparent" },
  2: { bg: "#1a1a1a", color: "#e7e7e7" },
  4: { bg: "#1e1e1e", color: "#e7e7e7" },
  8: { bg: "#3d2b1a", color: "#e7e7e7" },
  16: { bg: "#4a2e12", color: "#e7e7e7" },
  32: { bg: "#6b3a10", color: "#e7e7e7" },
  64: { bg: "#8a4510", color: "#ffffff" },
  128: { bg: "#a05a1a", color: "#ffffff" },
  256: { bg: "#b87030", color: "#ffffff" },
  512: { bg: "#c8853f", color: "#0a0a0a" },
  1024: { bg: "#d49a50", color: "#0a0a0a" },
  2048: { bg: "#C8A97E", color: "#0a0a0a" },
};

function getTileStyle(val: number) {
  return TILE_STYLES[val] ?? { bg: "#e8d5b8", color: "#0a0a0a" };
}

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  board.forEach((row, r) =>
    row.forEach((val, c) => {
      if (val === 0) empty.push([r, c]);
    })
  );
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const nb = board.map((row) => [...row]);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}

function initBoard(): Board {
  return addRandomTile(addRandomTile(emptyBoard()));
}

function slideRow(row: number[]): { row: number[]; score: number } {
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i++;
    }
  }
  while (merged.length < BOARD_SIZE) merged.push(0);
  return { row: merged, score };
}

function move(
  board: Board,
  dir: MoveDir
): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;

  const rotR = (b: Board): Board =>
    b[0].map((_, ci) => b.map((row) => row[ci]).reverse());
  const rotL = (b: Board): Board =>
    b[0].map((_, ci) => b.map((row) => row[row.length - 1 - ci]));

  let work = board.map((r) => [...r]);
  if (dir === "RIGHT") work = work.map((r) => [...r].reverse());
  if (dir === "UP") work = rotL(work);
  if (dir === "DOWN") work = rotR(work);

  const newWork = work.map((row) => {
    const res = slideRow(row);
    if (res.row.join(",") !== row.join(",")) moved = true;
    totalScore += res.score;
    return res.row;
  });

  let result = newWork;
  if (dir === "RIGHT") result = result.map((r) => [...r].reverse());
  if (dir === "UP") result = rotR(result);
  if (dir === "DOWN") result = rotL(result);

  return { board: result, score: totalScore, moved };
}

function hasWon(board: Board) {
  return board.some((row) => row.some((v) => v >= 2048));
}

function canMove(board: Board) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < BOARD_SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < BOARD_SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function getMaxTile(board: Board): number {
  let max = 0;
  board.forEach((row) =>
    row.forEach((v) => {
      if (v > max) max = v;
    })
  );
  return max;
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(initBoard);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [continueAfterWin, setContinueAfterWin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const boardRef = useRef(board);
  boardRef.current = board;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHighScore(getScore("2048").highScore);
  }, []);

  // Prevent page scroll when touching the game area
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;

    const preventScroll = (e: TouchEvent) => {
      if (isPlaying || (!gameOver && !won)) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => el.removeEventListener("touchmove", preventScroll);
  }, [isPlaying, gameOver, won]);

  const handleMove = useCallback(
    (dir: MoveDir) => {
      if (gameOver || (won && !continueAfterWin)) return;
      if (!isPlaying) setIsPlaying(true);
      const result = move(boardRef.current, dir);
      if (!result.moved) return;

      const newBoard = addRandomTile(result.board);
      setBoard(newBoard);
      setMoves((m) => m + 1);

      setScore((prev) => {
        const next = prev + result.score;
        setHighScore((h) => {
          const newH = Math.max(h, next);
          saveScore("2048", next);
          return newH;
        });
        return next;
      });

      if (!won && hasWon(newBoard)) setWon(true);
      if (!canMove(newBoard)) {
        setGameOver(true);
        setIsPlaying(false);
      }
    },
    [gameOver, won, continueAfterWin, isPlaying]
  );

  const newGame = () => {
    setBoard(initBoard());
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setWon(false);
    setContinueAfterWin(false);
    setIsPlaying(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, MoveDir> = {
        ArrowUp: "UP",
        w: "UP",
        W: "UP",
        ArrowDown: "DOWN",
        s: "DOWN",
        S: "DOWN",
        ArrowLeft: "LEFT",
        a: "LEFT",
        A: "LEFT",
        ArrowRight: "RIGHT",
        d: "RIGHT",
        D: "RIGHT",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    const dir: MoveDir =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "RIGHT"
          : "LEFT"
        : dy > 0
        ? "DOWN"
        : "UP";
    handleMove(dir);
  };

  const maxTile = getMaxTile(board);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start select-none">
      {/* Score bar - compact row on mobile when playing, sidebar on desktop */}
      <div
        className={`w-full lg:w-[10%] lg:min-w-[140px] flex lg:flex-col gap-2 lg:gap-4
                    lg:sticky lg:top-24 shrink-0 ${
                      isPlaying ? "flex-row flex-wrap sm:flex-nowrap" : ""
                    }`}
      >
        {/* Score */}
        <div className="bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none min-w-0">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Score
          </div>
          <motion.div
            key={score}
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-cormorant text-2xl lg:text-3xl text-primary"
          >
            {score.toLocaleString()}
          </motion.div>
        </div>

        {/* Best */}
        <div className="bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none min-w-0">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Best
          </div>
          <div className="font-cormorant text-2xl lg:text-3xl text-accent">
            {highScore.toLocaleString()}
          </div>
        </div>

        {/* Max tile - hide on mobile when playing */}
        <div
          className={`bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none min-w-0 ${
            isPlaying ? "hidden sm:block" : ""
          }`}
        >
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Max Tile
          </div>
          <div className="font-cormorant text-2xl lg:text-3xl text-accent">
            {maxTile || "—"}
          </div>
        </div>

        {/* Moves - hide on mobile when playing */}
        <div
          className={`bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4 flex-1 lg:flex-none min-w-0 ${
            isPlaying ? "hidden sm:block" : ""
          }`}
        >
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Moves
          </div>
          <div className="font-cormorant text-2xl lg:text-3xl text-primary">
            {moves}
          </div>
        </div>

        {/* New game button */}
        <button
          onClick={newGame}
          className="bg-card border border-white/[0.06] rounded-xl px-3 lg:px-4 py-2 lg:py-3
                     font-inter text-xs text-muted hover:text-primary
                     hover:border-accent/20 transition-all cursor-pointer
                     flex-1 lg:flex-none"
        >
          New Game
        </button>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center gap-4 w-full lg:w-[90%]">
        {/* Board */}
        <div
          ref={gameAreaRef}
          className="relative w-full max-w-[420px] touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="grid gap-2 p-3 rounded-2xl bg-surface border border-white/[0.06]"
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
          >
            {board.map((row, r) =>
              row.map((val, c) => <Tile key={`${r}-${c}`} value={val} />)
            )}
          </div>

          {/* Win overlay */}
          <AnimatePresence>
            {won && !continueAfterWin && (
              <motion.div
                key="win"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-2xl flex flex-col items-center
                           justify-center text-center p-6"
                style={{
                  background: "rgba(10,10,10,0.9)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <p className="font-inter text-[11px] text-accent uppercase tracking-[0.2em] mb-2">
                  You reached
                </p>
                <p className="font-cormorant text-7xl font-medium text-accent mb-2">
                  2048
                </p>
                <p className="font-inter text-sm text-muted mb-8">
                  Magnificent. Keep going?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setContinueAfterWin(true);
                      setIsPlaying(true);
                    }}
                    className="px-6 py-2.5 bg-accent text-background font-inter text-sm
                               font-medium rounded-lg hover:bg-accent/90 transition-colors
                               cursor-pointer"
                  >
                    Keep Going
                  </button>
                  <button
                    onClick={newGame}
                    className="px-6 py-2.5 bg-card border border-white/[0.06] text-muted
                               font-inter text-sm rounded-lg hover:text-primary
                               hover:border-accent/20 transition-all cursor-pointer"
                  >
                    New Game
                  </button>
                </div>
              </motion.div>
            )}

            {gameOver && (
              <motion.div
                key="over"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-2xl flex flex-col items-center
                           justify-center text-center p-6"
                style={{
                  background: "rgba(10,10,10,0.9)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <p className="font-inter text-[11px] text-muted uppercase tracking-[0.2em] mb-3">
                  Game Over
                </p>
                <p className="font-cormorant text-6xl font-light text-primary mb-2">
                  {score.toLocaleString()}
                </p>
                {score >= highScore && score > 0 && (
                  <p className="font-inter text-xs text-accent mb-2">
                    🏆 New high score!
                  </p>
                )}
                <button
                  onClick={newGame}
                  className="mt-6 px-8 py-3 bg-accent text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-accent/90 transition-colors
                             cursor-pointer"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p
          className={`font-inter text-xs text-muted/50 text-center max-w-[300px] ${
            isPlaying ? "hidden sm:block" : ""
          }`}
        >
          Arrow keys or swipe to slide. Merge matching numbers to reach 2048.
        </p>
      </div>
    </div>
  );
}

function Tile({ value }: { value: number }) {
  const style = getTileStyle(value);
  const fontSize =
    value >= 1024 ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl";

  return (
    <motion.div
      layout
      animate={value > 0 ? { scale: [0.9, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`aspect-square flex items-center justify-center rounded-xl
                  font-cormorant font-semibold select-none ${fontSize}`}
      style={{
        backgroundColor: style.bg,
        color: style.color,
        border:
          value === 0 ? "1px solid rgba(255,255,255,0.03)" : "none",
        boxShadow:
          value >= 2048
            ? "0 0 20px rgba(200,169,126,0.3)"
            : value >= 128
            ? "0 0 8px rgba(200,169,126,0.1)"
            : "none",
      }}
    >
      {value !== 0 ? value : ""}
    </motion.div>
  );
}