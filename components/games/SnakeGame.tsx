"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveScore } from "@/lib/scores";

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type GameState = "idle" | "running" | "gameover";

const GRID_SIZE = 20;
const INITIAL_SPEED = 130;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 60;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function getInitialSnake(): Point[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

function randomFood(snake: Point[]): Point {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [cellSize, setCellSize] = useState(24);

  const snakeRef = useRef<Point[]>(getInitialSnake());
  const foodRef = useRef<Point>(randomFood(snakeRef.current));
  const directionRef = useRef<Direction>("RIGHT");
  const nextDirRef = useRef<Direction>("RIGHT");
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const gameStateRef = useRef<GameState>("idle");
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function resize() {
      if (!containerRef.current) return;
      // Use the container width, capped at 480px for a clean fit
      const w = containerRef.current.clientWidth;
      const maxCanvas = Math.min(w, 480);
      const cs = Math.floor(maxCanvas / GRID_SIZE);
      setCellSize(cs);
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = cellSize * GRID_SIZE;
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, size, size);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    const fc = food.x * cellSize;
    const fr = food.y * cellSize;
    const fp = Math.max(2, Math.floor(cellSize * 0.15));
    const fr2 = Math.max(2, Math.floor(cellSize * 0.2));

    ctx.shadowColor = "rgba(231,231,231,0.3)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#e7e7e7";
    roundRect(ctx, fc + fp, fr + fp, cellSize - fp * 2, cellSize - fp * 2, fr2);
    ctx.shadowBlur = 0;

    // Snake
    snakeRef.current.forEach((seg, i) => {
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      const p = Math.max(1, Math.floor(cellSize * 0.08));
      const r = Math.max(1, Math.floor(cellSize * 0.15));

      if (i === 0) {
        ctx.shadowColor = "rgba(200,169,126,0.4)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#C8A97E";
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = i % 2 === 0 ? "#9a7d5a" : "#8a6d4a";
      }
      roundRect(ctx, x + p, y + p, cellSize - p * 2, cellSize - p * 2, r);
    });
    ctx.shadowBlur = 0;

    // Eyes
    if (snakeRef.current.length > 0) {
      const hx = snakeRef.current[0].x * cellSize;
      const hy = snakeRef.current[0].y * cellSize;
      const eyeSize = Math.max(1.5, cellSize * 0.1);
      ctx.fillStyle = "#0a0a0a";
      const dir = directionRef.current;

      let e1x = hx + cellSize * 0.25;
      let e1y = hy + cellSize * 0.3;
      let e2x = hx + cellSize * 0.25;
      let e2y = hy + cellSize * 0.65;

      if (dir === "UP") {
        e1x = hx + cellSize * 0.3; e1y = hy + cellSize * 0.25;
        e2x = hx + cellSize * 0.65; e2y = hy + cellSize * 0.25;
      } else if (dir === "DOWN") {
        e1x = hx + cellSize * 0.3; e1y = hy + cellSize * 0.65;
        e2x = hx + cellSize * 0.65; e2y = hy + cellSize * 0.65;
      } else if (dir === "RIGHT") {
        e1x = hx + cellSize * 0.65; e1y = hy + cellSize * 0.3;
        e2x = hx + cellSize * 0.65; e2y = hy + cellSize * 0.65;
      }

      ctx.beginPath();
      ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [cellSize]);

  const endGame = useCallback(() => {
    gameStateRef.current = "gameover";
    setGameState("gameover");
    if (loopRef.current) clearTimeout(loopRef.current);
    const result = saveScore("snake", scoreRef.current);
    setHighScore(result.highScore);
    draw();
  }, [draw]);

  const tick = useCallback(() => {
    if (gameStateRef.current !== "running") return;

    directionRef.current = nextDirRef.current;
    const head = snakeRef.current[0];
    const dir = directionRef.current;

    const newHead: Point = {
      x: head.x + (dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0),
      y: head.y + (dir === "DOWN" ? 1 : dir === "UP" ? -1 : 0),
    };

    if (
      newHead.x < 0 || newHead.x >= GRID_SIZE ||
      newHead.y < 0 || newHead.y >= GRID_SIZE
    ) { endGame(); return; }

    if (snakeRef.current.slice(0, -1).some(
      (s) => s.x === newHead.x && s.y === newHead.y
    )) { endGame(); return; }

    const ateFood =
      newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;

    snakeRef.current = ateFood
      ? [newHead, ...snakeRef.current]
      : [newHead, ...snakeRef.current.slice(0, -1)];

    if (ateFood) {
      const newScore = scoreRef.current + 10;
      scoreRef.current = newScore;
      setScore(newScore);
      foodRef.current = randomFood(snakeRef.current);
      speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
    }

    draw();
    loopRef.current = setTimeout(tick, speedRef.current);
  }, [draw, endGame]);

  const startGame = useCallback(() => {
    if (loopRef.current) clearTimeout(loopRef.current);
    snakeRef.current = getInitialSnake();
    foodRef.current = randomFood(snakeRef.current);
    directionRef.current = "RIGHT";
    nextDirRef.current = "RIGHT";
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    setScore(0);
    gameStateRef.current = "running";
    setGameState("running");
    draw();
    loopRef.current = setTimeout(tick, speedRef.current);
  }, [draw, tick]);

  useEffect(() => {
    draw();
    import("@/lib/scores").then(({ getScore }) => {
      setHighScore(getScore("snake").highScore);
    });
  }, [draw]);

  useEffect(() => () => {
    if (loopRef.current) clearTimeout(loopRef.current);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key))
        e.preventDefault();

      if (gameStateRef.current === "idle" || gameStateRef.current === "gameover") {
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"]
          .includes(e.key.toLowerCase())) {
          startGame();
          return;
        }
      }

      if (gameStateRef.current !== "running") return;

      const map: Record<string, Direction> = {
        ArrowUp: "UP", w: "UP", W: "UP",
        ArrowDown: "DOWN", s: "DOWN", S: "DOWN",
        ArrowLeft: "LEFT", a: "LEFT", A: "LEFT",
        ArrowRight: "RIGHT", d: "RIGHT", D: "RIGHT",
      };
      const next = map[e.key];
      if (!next) return;

      const opp: Record<Direction, Direction> = {
        UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
      };
      if (next !== opp[directionRef.current]) nextDirRef.current = next;
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startGame]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

    if (gameStateRef.current === "idle" || gameStateRef.current === "gameover") {
      startGame(); return;
    }

    const opp: Record<Direction, Direction> = {
      UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
    };
    const next: Direction = Math.abs(dx) > Math.abs(dy)
      ? dx > 0 ? "RIGHT" : "LEFT"
      : dy > 0 ? "DOWN" : "UP";

    if (next !== opp[directionRef.current]) nextDirRef.current = next;
  };

  const mobileDir = (dir: Direction) => {
    if (gameStateRef.current === "idle" || gameStateRef.current === "gameover") {
      startGame(); return;
    }
    const opp: Record<Direction, Direction> = {
      UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
    };
    if (dir !== opp[directionRef.current]) nextDirRef.current = dir;
  };

  const canvasSize = cellSize * GRID_SIZE;
  const speedPercent = Math.round(
    ((INITIAL_SPEED - speedRef.current) / (INITIAL_SPEED - MIN_SPEED)) * 100
  );

  return (
    // Outer: row on lg, column on mobile
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full pb-10">

      {/* ── Sidebar ── */}
      <div className="w-full lg:w-36 shrink-0 flex flex-row lg:flex-col gap-3">

        <div className="bg-card border border-white/[0.06] rounded-xl p-4 flex-1 lg:flex-none">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Score
          </div>
          <div className="font-cormorant text-3xl text-primary">{score}</div>
        </div>

        <div className="bg-card border border-white/[0.06] rounded-xl p-4 flex-1 lg:flex-none">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
            Best
          </div>
          <div className="font-cormorant text-3xl text-accent">
            {Math.max(highScore, score)}
          </div>
        </div>

        {gameState === "running" && (
          <div className="bg-card border border-white/[0.06] rounded-xl p-4 flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
              Speed
            </div>
            <div className="font-cormorant text-3xl text-accent">{speedPercent}%</div>
            <div className="mt-2 w-full bg-surface rounded-full h-1">
              <div
                className="bg-accent h-1 rounded-full transition-all duration-300"
                style={{ width: `${speedPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-card border border-white/[0.06] rounded-xl p-4 flex-1 lg:flex-none">
          <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
            Status
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              gameState === "running"
                ? "bg-green-500 animate-pulse"
                : gameState === "gameover"
                ? "bg-red-500"
                : "bg-muted"
            }`} />
            <span className="font-inter text-xs text-muted capitalize">
              {gameState === "gameover" ? "Game Over" : gameState}
            </span>
          </div>
        </div>
      </div>

      {/* ── Game area ── */}
      <div className="flex flex-col items-center gap-4 w-full">

        {/* Canvas wrapper — drives its own size */}
        <div
          ref={containerRef}
          className="relative w-full max-w-[480px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="w-full block rounded-xl border border-white/[0.06]"
            style={{ aspectRatio: "1 / 1" }}
          />

          <AnimatePresence>
            {gameState === "idle" && (
              <Overlay key="idle">
                <p className="font-cormorant text-5xl font-light text-primary mb-2">
                  Snake
                </p>
                <p className="font-inter text-sm text-muted mb-8">
                  Eat the white dots. Don&apos;t hit the walls.
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-accent text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-accent/90 transition-colors
                             cursor-pointer"
                >
                  Start Game
                </button>
              </Overlay>
            )}

            {gameState === "gameover" && (
              <Overlay key="gameover">
                <p className="font-inter text-[11px] text-muted uppercase tracking-[0.2em] mb-3">
                  Game Over
                </p>
                <p className="font-cormorant text-6xl font-light text-primary mb-1">
                  {score}
                </p>
                <p className="font-inter text-sm text-muted mb-2">
                  {score > 0 && score >= highScore
                    ? "🏆 New high score!"
                    : `Best: ${highScore}`}
                </p>
                <button
                  onClick={startGame}
                  className="mt-6 px-8 py-3 bg-accent text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-accent/90 transition-colors
                             cursor-pointer"
                >
                  Play Again
                </button>
              </Overlay>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile D-pad */}
        <div className="flex flex-col items-center gap-1 sm:hidden">
          <button
            onClick={() => mobileDir("UP")}
            className="w-12 h-12 bg-card border border-white/[0.06] rounded-lg
                       flex items-center justify-center text-muted
                       hover:text-accent hover:border-accent/20 transition-colors
                       active:scale-95 cursor-pointer"
          >▲</button>
          <div className="flex gap-1">
            <button
              onClick={() => mobileDir("LEFT")}
              className="w-12 h-12 bg-card border border-white/[0.06] rounded-lg
                         flex items-center justify-center text-muted
                         hover:text-accent hover:border-accent/20 transition-colors
                         active:scale-95 cursor-pointer"
            >◀</button>
            <div className="w-12 h-12" />
            <button
              onClick={() => mobileDir("RIGHT")}
              className="w-12 h-12 bg-card border border-white/[0.06] rounded-lg
                         flex items-center justify-center text-muted
                         hover:text-accent hover:border-accent/20 transition-colors
                         active:scale-95 cursor-pointer"
            >▶</button>
          </div>
          <button
            onClick={() => mobileDir("DOWN")}
            className="w-12 h-12 bg-card border border-white/[0.06] rounded-lg
                       flex items-center justify-center text-muted
                       hover:text-accent hover:border-accent/20 transition-colors
                       active:scale-95 cursor-pointer"
          >▼</button>
        </div>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex flex-col items-center justify-center
                 text-center px-8 rounded-xl"
      style={{
        background: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(4px)",
      }}
    >
      {children}
    </motion.div>
  );
}