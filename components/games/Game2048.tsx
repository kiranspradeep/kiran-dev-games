// components/Game2048.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface Tile {
  id: number;
  value: number;
  x: number;
  y: number;
  isNew: boolean;
  isMerged: boolean;
}

const BOARD_SIZE = 4;
const TILE_SIZE = 100;
const GAP = 10;
const COLORS: Record<number, string> = {
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
  256: "#edcc61",
  512: "#edc850",
  1024: "#edc53f",
  2048: "#edc22e",
};

const TEXT_COLORS: Record<number, string> = {
  2: "#776e65",
  4: "#776e65",
  8: "#f9f6f2",
  16: "#f9f6f2",
  32: "#f9f6f2",
  64: "#f9f6f2",
  128: "#f9f6f2",
  256: "#f9f6f2",
  512: "#f9f6f2",
  1024: "#f9f6f2",
  2048: "#f9f6f2",
};

function getMaxTile(tiles: Tile[]): number {
  return tiles.length > 0 ? Math.max(...tiles.map((t) => t.value)) : 0;
}

function canMoveTile(
  tiles: Tile[],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): boolean {
  if (toX < 0 || toX >= BOARD_SIZE || toY < 0 || toY >= BOARD_SIZE)
    return false;
  const target = tiles.find((t) => t.x === toX && t.y === toY);
  const source = tiles.find((t) => t.x === fromX && t.y === fromY);
  if (!source) return false;
  if (!target) return true;
  return target.value === source.value;
}

export default function Game2048() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("");

  const scoreRef = useRef(0);
  const tileIdRef = useRef(0);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("2048_high");
    if (saved) setHighScore(parseInt(saved));
    newGame();
  }, []);

  const newGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setMessage("");
    tileIdRef.current = 0;

    const t1: Tile = {
      id: tileIdRef.current++,
      value: 2,
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
      isNew: true,
      isMerged: false,
    };
    const t2: Tile = {
      id: tileIdRef.current++,
      value: 2,
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
      isNew: true,
      isMerged: false,
    };
    setTiles([t1, t2]);
  }, []);

  const addNewTile = useCallback((currentTiles: Tile[]): Tile[] => {
    const empty: Array<[number, number]> = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (!currentTiles.find((t) => t.x === x && t.y === y)) {
          empty.push([x, y]);
        }
      }
    }
    if (empty.length === 0) return currentTiles;
    const pos = empty[Math.floor(Math.random() * empty.length)];
    return [
      ...currentTiles,
      {
        id: tileIdRef.current++,
        value: 2,
        x: pos[0],
        y: pos[1],
        isNew: true,
        isMerged: false,
      },
    ];
  }, []);

  const canMove = useCallback((board: Tile[]): boolean => {
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        const tile = board.find((t) => t.x === x && t.y === y);
        if (!tile) continue;

        if (x > 0) {
          const left = board.find((t) => t.x === x - 1 && t.y === y);
          if (!left || left.value === tile.value) return true;
        }
        if (x < BOARD_SIZE - 1) {
          const right = board.find((t) => t.x === x + 1 && t.y === y);
          if (!right || right.value === tile.value) return true;
        }
        if (y > 0) {
          const up = board.find((t) => t.x === x && t.y === y - 1);
          if (!up || up.value === tile.value) return true;
        }
        if (y < BOARD_SIZE - 1) {
          const down = board.find((t) => t.x === x && t.y === y + 1);
          if (!down || down.value === tile.value) return true;
        }
      }
    }
    return false;
  }, []);

  const handleMove = useCallback(
    (dir: Direction) => {
      if (gameOver || !isPlaying) return;

      let newBoard: Tile[] = tiles.map((t) => ({
        ...t,
        isNew: false,
        isMerged: false,
      }));
      let moved = false;
      let merged = new Set<number>();

      const dirMap: Record<Direction, [number, number]> = {
        UP: [0, -1],
        DOWN: [0, 1],
        LEFT: [-1, 0],
        RIGHT: [1, 0],
      };

      const [dx, dy] = dirMap[dir];

      const xRange =
        dx !== 0
          ? dx > 0
            ? Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - 1 - i)
            : Array.from({ length: BOARD_SIZE }, (_, i) => i)
          : Array.from({ length: BOARD_SIZE }, (_, i) => i);

      const yRange =
        dy !== 0
          ? dy > 0
            ? Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - 1 - i)
            : Array.from({ length: BOARD_SIZE }, (_, i) => i)
          : Array.from({ length: BOARD_SIZE }, (_, i) => i);

      for (const x of xRange) {
        for (const y of yRange) {
          const tile = newBoard.find((t) => t.x === x && t.y === y);
          if (!tile) continue;

          let nx = x;
          let ny = y;
          let moved_tile = false;

          while (canMoveTile(newBoard, nx, ny, nx + dx, ny + dy)) {
            const target = newBoard.find((t) => t.x === nx + dx && t.y === ny + dy);
            if (target && target.value === tile.value && !merged.has(target.id)) {
              newBoard = newBoard.filter((t) => t.id !== tile.id);
              target.value *= 2;
              target.isMerged = true;
              merged.add(target.id);
              scoreRef.current += target.value;
              setScore(scoreRef.current);
              moved_tile = true;
              moved = true;
              break;
            }
            nx += dx;
            ny += dy;
            moved_tile = true;
          }

          if (moved_tile) {
            tile.x = nx;
            tile.y = ny;
            moved = true;
          }
        }
      }

      if (!moved) return;

      newBoard = addNewTile(newBoard);
      setTiles(newBoard);

      if (!canMove(newBoard)) {
        setGameOver(true);
        setIsPlaying(false);
        const newHigh = Math.max(highScore, scoreRef.current);
        setHighScore(newHigh);
        localStorage.setItem("2048_high", newHigh.toString());

        // ── Score sync (1 line) ──
        if (typeof window !== "undefined" && window.__syncScore) {
          window.__syncScore(scoreRef.current, { maxTile: getMaxTile(newBoard) });
        }
      }
    },
    [tiles, gameOver, isPlaying, highScore, canMove, addNewTile]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        W: "UP",
        s: "DOWN",
        S: "DOWN",
        a: "LEFT",
        A: "LEFT",
        d: "RIGHT",
        D: "RIGHT",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  const maxTile = getMaxTile(tiles);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full pb-8">
      {/* Left sidebar */}
      <div className="w-full lg:w-44 shrink-0 lg:order-1">
        <div className="flex flex-row lg:flex-col gap-2 flex-wrap lg:flex-nowrap">
          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
              Score
            </div>
            <div className="font-cormorant text-3xl text-primary leading-none">
              {score}
            </div>
          </div>

          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
              Best
            </div>
            <div className="font-cormorant text-3xl text-accent leading-none">
              {highScore}
            </div>
          </div>

          {!gameOver && (
            <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none">
              <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
                Max Tile
              </div>
              <div className="font-cormorant text-3xl text-accent leading-none">
                {maxTile}
              </div>
            </div>
          )}

          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Status
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isPlaying ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="font-inter text-xs text-muted capitalize">
                {gameOver ? "Game Over" : "Playing"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Game */}
      <div className="flex flex-col items-center gap-4 w-full lg:flex-1 lg:order-2">
        {/* Controls */}
        <div className="flex gap-2 sm:hidden flex-wrap justify-center">
          <button
            onClick={() => handleMove("UP")}
            className="w-14 h-14 bg-card border border-white/[0.10] rounded-xl
                       flex items-center justify-center text-muted
                       active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
          >
            ▲
          </button>
          <div className="w-full flex gap-2 justify-center">
            <button
              onClick={() => handleMove("LEFT")}
              className="w-14 h-14 bg-card border border-white/[0.10] rounded-xl
                         flex items-center justify-center text-muted
                         active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
            >
              ◀
            </button>
            <button
              onClick={() => handleMove("DOWN")}
              className="w-14 h-14 bg-card border border-white/[0.10] rounded-xl
                         flex items-center justify-center text-muted
                         active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
            >
              ▼
            </button>
            <button
              onClick={() => handleMove("RIGHT")}
              className="w-14 h-14 bg-card border border-white/[0.10] rounded-xl
                         flex items-center justify-center text-muted
                         active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
            >
              ▶
            </button>
          </div>
          <button
            onClick={newGame}
            className="flex-1 px-4 py-2 bg-accent text-background font-inter text-sm
                       font-medium rounded-lg hover:bg-accent/90 transition-colors
                       cursor-pointer"
          >
            New Game
          </button>
        </div>

        {/* Board */}
        <div
          className="relative rounded-xl bg-gray-400"
          style={{
            width: BOARD_SIZE * TILE_SIZE + (BOARD_SIZE + 1) * GAP,
            height: BOARD_SIZE * TILE_SIZE + (BOARD_SIZE + 1) * GAP,
            padding: GAP,
            gap: GAP,
          }}
        >
          {/* Grid background */}
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => (
            <div
              key={`bg-${i}`}
              className="absolute bg-gray-500 rounded"
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                left: GAP + (i % BOARD_SIZE) * (TILE_SIZE + GAP),
                top: GAP + Math.floor(i / BOARD_SIZE) * (TILE_SIZE + GAP),
              }}
            />
          ))}

          {/* Tiles */}
          <AnimatePresence>
            {tiles.map((tile) => (
              <motion.div
                key={tile.id}
                initial={tile.isNew ? { scale: 0 } : { opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute rounded font-bold flex items-center justify-center select-none"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  left: GAP + tile.x * (TILE_SIZE + GAP),
                  top: GAP + tile.y * (TILE_SIZE + GAP),
                  backgroundColor: COLORS[tile.value] || "#3c3c3c",
                  color: TEXT_COLORS[tile.value] || "#e7e7e7",
                  fontSize: tile.value > 999 ? "32px" : "48px",
                }}
              >
                {tile.value}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Game over overlay */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded bg-black/70 flex flex-col items-center justify-center gap-4"
              >
                <p className="font-inter text-sm text-muted">Game Over</p>
                <p className="font-cormorant text-4xl text-primary">
                  {score}
                </p>
                <button
                  onClick={newGame}
                  className="px-6 py-2 bg-accent text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-accent/90 transition-colors
                             cursor-pointer"
                >
                  New Game
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop controls */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => handleMove("UP")}
            className="w-12 h-12 bg-card border border-white/[0.10] rounded-lg
                       flex items-center justify-center text-muted
                       active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
          >
            ▲
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleMove("LEFT")}
              className="w-12 h-12 bg-card border border-white/[0.10] rounded-lg
                         flex items-center justify-center text-muted
                         active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
            >
              ◀
            </button>
            <button
              onClick={() => handleMove("DOWN")}
              className="w-12 h-12 bg-card border border-white/[0.10] rounded-lg
                         flex items-center justify-center text-muted
                         active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
            >
              ▼
            </button>
            <button
              onClick={() => handleMove("RIGHT")}
              className="w-12 h-12 bg-card border border-white/[0.10] rounded-lg
                         flex items-center justify-center text-muted
                         active:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
            >
              ▶
            </button>
          </div>
          <button
            onClick={newGame}
            className="px-6 bg-accent text-background font-inter text-sm
                       font-medium rounded-lg hover:bg-accent/90 transition-colors
                       cursor-pointer"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-full lg:w-44 shrink-0 lg:order-3">
        <div className="bg-card border border-white/[0.06] rounded-xl p-3 lg:p-4">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-3">
            How to Play
          </div>
          <div className="space-y-3">
            <p className="font-inter text-[10px] text-muted/70 leading-relaxed">
              🎮 Use arrow keys or WASD to move
            </p>
            <p className="font-inter text-[10px] text-muted/70 leading-relaxed">
              ➕ When two tiles with the same number touch, they merge
            </p>
            <p className="font-inter text-[10px] text-muted/70 leading-relaxed">
              🎯 Reach 2048 to win! Keep going for higher scores
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}