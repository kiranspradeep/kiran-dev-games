// components/SnakeGame.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveScore, getScore } from "@/lib/scores";

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type GameState = "idle" | "running" | "gameover";
type GameMode = "classic" | "wrap";

interface FoodItem {
  pos: Point;
  big: boolean;
}

const GRID_SIZE = 20;
const INITIAL_SPEED = 130;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 60;
const BIG_FOOD_CHANCE = 0.25;
const BIG_FOOD_SCORE = 30;
const SMALL_FOOD_SCORE = 10;
const BIG_FOOD_GROWTH = 3;

const SNAKE_COLOR_PHASES = [
  { head: "#C8A97E", body: [160, 130, 90] },
  { head: "#7EC8A9", body: [90, 170, 140] },
  { head: "#A97EC8", body: [140, 90, 170] },
  { head: "#C87E7E", body: [180, 100, 100] },
  { head: "#7EA9C8", body: [90, 140, 180] },
  { head: "#C8C87E", body: [180, 180, 90] },
  { head: "#C87EB8", body: [180, 100, 160] },
  { head: "#7EC8C8", body: [90, 180, 180] },
];

const COLOR_CHANGE_INTERVAL = 5;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w <= 0 || h <= 0) return;
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

function randomFood(snake: Point[]): FoodItem {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return { pos, big: Math.random() < BIG_FOOD_CHANCE };
}

function lerpColor(from: number[], to: number[], t: number): number[] {
  return from.map((f, i) => Math.floor(f + (to[i] - f) * t));
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [recentScores, setRecentScores] = useState<number[]>([]);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState(400);
  const [gameMode, setGameMode] = useState<GameMode>("classic");

  const snakeRef = useRef<Point[]>(getInitialSnake());
  const foodRef = useRef<FoodItem>(randomFood(snakeRef.current));
  const directionRef = useRef<Direction>("RIGHT");
  const nextDirRef = useRef<Direction>("RIGHT");
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const gameStateRef = useRef<GameState>("idle");
  const gameModeRef = useRef<GameMode>("classic");
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const growQueueRef = useRef(0);
  const foodPulseRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const foodEatenRef = useRef(0);
  const colorTransitionRef = useRef(0);
  const colorPhaseRef = useRef(0);

  const CANVAS_RES = GRID_SIZE * 24;
  const cellSize = CANVAS_RES / GRID_SIZE;

  const isRunning = gameState === "running";

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    function resize() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const maxSize = Math.min(w, 520);
      setCanvasDisplaySize(maxSize);
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Prevent page scroll on game area touch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => el.removeEventListener("touchmove", preventScroll);
  }, []);

  const getSnakeColors = useCallback(() => {
    const phase = colorPhaseRef.current % SNAKE_COLOR_PHASES.length;
    const nextPhase = (phase + 1) % SNAKE_COLOR_PHASES.length;
    const t = colorTransitionRef.current;

    const current = SNAKE_COLOR_PHASES[phase];
    const next = SNAKE_COLOR_PHASES[nextPhase];

    const parseHex = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const headRGB = lerpColor(parseHex(current.head), parseHex(next.head), t);
    const headColor = `rgb(${headRGB[0]},${headRGB[1]},${headRGB[2]})`;

    const bodyBase = lerpColor(current.body, next.body, t);

    return { headColor, bodyBase, headRGB };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = CANVAS_RES;
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    if (gameModeRef.current === "wrap") {
      ctx.strokeStyle = "rgba(100,200,255,0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(1, 1, size - 2, size - 2);
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, size, size);
    }

    const food = foodRef.current;
    const fx = food.pos.x * cellSize;
    const fy = food.pos.y * cellSize;
    foodPulseRef.current += 0.06;
    const pulse = Math.sin(foodPulseRef.current) * 0.15 + 0.85;

    if (food.big) {
      const bp = 2;
      const br = 6;
      ctx.shadowColor = "rgba(255,200,100,0.6)";
      ctx.shadowBlur = 18 * pulse;
      ctx.fillStyle = `rgba(255,200,100,${0.95 * pulse})`;
      roundRect(
        ctx,
        fx + bp,
        fy + bp,
        cellSize - bp * 2,
        cellSize - bp * 2,
        br
      );
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255,240,200,${0.35 * pulse})`;
      const ip = 7;
      roundRect(
        ctx,
        fx + ip,
        fy + ip,
        cellSize - ip * 2,
        cellSize - ip * 2,
        3
      );
    } else {
      const fp = 5;
      ctx.shadowColor = `rgba(255,255,255,${0.35 * pulse})`;
      ctx.shadowBlur = 12 * pulse;
      ctx.fillStyle = `rgba(240,240,240,${0.95 * pulse})`;
      roundRect(
        ctx,
        fx + fp,
        fy + fp,
        cellSize - fp * 2,
        cellSize - fp * 2,
        fp
      );
    }
    ctx.shadowBlur = 0;

    const { headColor, bodyBase, headRGB } = getSnakeColors();

    const snake = snakeRef.current;
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      const gap = 1;
      const r = 5;

      if (i === 0) {
        ctx.shadowColor = `rgba(${headRGB[0]},${headRGB[1]},${headRGB[2]},0.6)`;
        ctx.shadowBlur = 12;
        ctx.fillStyle = headColor;
        roundRect(
          ctx,
          x + gap,
          y + gap,
          cellSize - gap * 2,
          cellSize - gap * 2,
          r
        );
        ctx.shadowBlur = 0;
      } else {
        const t = i / Math.max(snake.length - 1, 1);
        const r1 = Math.floor(bodyBase[0] - t * 60);
        const g1 = Math.floor(bodyBase[1] - t * 50);
        const b1 = Math.floor(bodyBase[2] - t * 40);
        ctx.fillStyle = `rgb(${Math.max(20, r1)},${Math.max(20, g1)},${Math.max(
          15,
          b1
        )})`;
        roundRect(
          ctx,
          x + gap,
          y + gap,
          cellSize - gap * 2,
          cellSize - gap * 2,
          r
        );
      }

      if (i > 0) {
        const prev = snake[i - 1];
        const dx = prev.x - seg.x;
        const dy = prev.y - seg.y;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          if (i === 1) ctx.fillStyle = headColor;
          const ci = 4;
          if (dx === 1)
            roundRect(
              ctx,
              x + cellSize - gap,
              y + ci,
              gap * 2,
              cellSize - ci * 2,
              1
            );
          else if (dx === -1)
            roundRect(ctx, x - gap, y + ci, gap * 2, cellSize - ci * 2, 1);
          if (dy === 1)
            roundRect(
              ctx,
              x + ci,
              y + cellSize - gap,
              cellSize - ci * 2,
              gap * 2,
              1
            );
          else if (dy === -1)
            roundRect(ctx, x + ci, y - gap, cellSize - ci * 2, gap * 2, 1);
        }
      }
    }

    if (snake.length > 0) {
      const hx = snake[0].x * cellSize;
      const hy = snake[0].y * cellSize;
      const eyeR = 3;
      const pupilR = 1.5;
      const dir = directionRef.current;

      let e1x: number, e1y: number, e2x: number, e2y: number;
      if (dir === "UP") {
        e1x = hx + cellSize * 0.3;
        e1y = hy + cellSize * 0.3;
        e2x = hx + cellSize * 0.7;
        e2y = hy + cellSize * 0.3;
      } else if (dir === "DOWN") {
        e1x = hx + cellSize * 0.3;
        e1y = hy + cellSize * 0.7;
        e2x = hx + cellSize * 0.7;
        e2y = hy + cellSize * 0.7;
      } else if (dir === "LEFT") {
        e1x = hx + cellSize * 0.3;
        e1y = hy + cellSize * 0.3;
        e2x = hx + cellSize * 0.3;
        e2y = hy + cellSize * 0.7;
      } else {
        e1x = hx + cellSize * 0.7;
        e1y = hy + cellSize * 0.3;
        e2x = hx + cellSize * 0.7;
        e2y = hy + cellSize * 0.7;
      }

      ctx.fillStyle = "#f5f0e0";
      ctx.beginPath();
      ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(e1x, e1y, pupilR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2x, e2y, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [cellSize, CANVAS_RES, getSnakeColors]);

  const endGame = useCallback(() => {
    gameStateRef.current = "gameover";
    setGameState("gameover");
    if (loopRef.current) clearTimeout(loopRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const result = saveScore("snake", scoreRef.current);
    setHighScore(result.highScore);
    setRecentScores(result.recentScores ?? []);
    draw();
  }, [draw]);

  const tick = useCallback(() => {
    if (gameStateRef.current !== "running") return;

    directionRef.current = nextDirRef.current;
    const head = snakeRef.current[0];
    const dir = directionRef.current;

    let newHead: Point = {
      x: head.x + (dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0),
      y: head.y + (dir === "DOWN" ? 1 : dir === "UP" ? -1 : 0),
    };

    const isWrap = gameModeRef.current === "wrap";

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      if (isWrap) {
        newHead = {
          x: (newHead.x + GRID_SIZE) % GRID_SIZE,
          y: (newHead.y + GRID_SIZE) % GRID_SIZE,
        };
      } else {
        endGame();
        return;
      }
    }

    const bodyToCheck =
      growQueueRef.current > 0
        ? snakeRef.current
        : snakeRef.current.slice(0, -1);
    if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      endGame();
      return;
    }

    const food = foodRef.current;
    const ateFood = newHead.x === food.pos.x && newHead.y === food.pos.y;

    if (ateFood) {
      const pts = food.big ? BIG_FOOD_SCORE : SMALL_FOOD_SCORE;
      const growth = food.big ? BIG_FOOD_GROWTH : 1;
      growQueueRef.current += growth;
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);
      foodRef.current = randomFood(snakeRef.current);
      speedRef.current = Math.max(
        MIN_SPEED,
        speedRef.current - SPEED_INCREMENT
      );

      foodEatenRef.current += 1;
      const eaten = foodEatenRef.current;
      const phaseIndex = Math.floor(eaten / COLOR_CHANGE_INTERVAL);
      const progress =
        (eaten % COLOR_CHANGE_INTERVAL) / COLOR_CHANGE_INTERVAL;
      colorPhaseRef.current = phaseIndex;
      colorTransitionRef.current = progress;
    }

    if (growQueueRef.current > 0) {
      snakeRef.current = [newHead, ...snakeRef.current];
      growQueueRef.current--;
    } else {
      snakeRef.current = [newHead, ...snakeRef.current.slice(0, -1)];
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
    growQueueRef.current = 0;
    foodEatenRef.current = 0;
    colorPhaseRef.current = 0;
    colorTransitionRef.current = 0;
    setScore(0);
    gameStateRef.current = "running";
    setGameState("running");
    draw();
    loopRef.current = setTimeout(tick, speedRef.current);
  }, [draw, tick]);

  useEffect(() => {
    draw();
    const data = getScore("snake");
    setHighScore(data.highScore);
    setRecentScores(data.recentScores ?? []);
  }, [draw]);

  useEffect(
    () => () => {
      if (loopRef.current) clearTimeout(loopRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    },
    []
  );

  useEffect(() => {
    if (gameState !== "running") {
      const interval = setInterval(() => draw(), 80);
      return () => clearInterval(interval);
    }
  }, [gameState, draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(
          e.key
        )
      )
        e.preventDefault();

      if (
        gameStateRef.current === "idle" ||
        gameStateRef.current === "gameover"
      ) {
        if (
          [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d",
          ].includes(e.key.toLowerCase())
        ) {
          startGame();
          return;
        }
      }

      if (gameStateRef.current !== "running") return;

      const map: Record<string, Direction> = {
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
      const next = map[e.key];
      if (!next) return;

      const opp: Record<Direction, Direction> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      if (next !== opp[directionRef.current]) nextDirRef.current = next;
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startGame]);

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

    if (
      gameStateRef.current === "idle" ||
      gameStateRef.current === "gameover"
    ) {
      startGame();
      return;
    }

    const opp: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };
    const next: Direction =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "RIGHT"
          : "LEFT"
        : dy > 0
        ? "DOWN"
        : "UP";
    if (next !== opp[directionRef.current]) nextDirRef.current = next;
  };

  const mobileDir = (dir: Direction) => {
    if (
      gameStateRef.current === "idle" ||
      gameStateRef.current === "gameover"
    ) {
      startGame();
      return;
    }
    const opp: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };
    if (dir !== opp[directionRef.current]) nextDirRef.current = dir;
  };

  const speedPercent = Math.round(
    ((INITIAL_SPEED - speedRef.current) / (INITIAL_SPEED - MIN_SPEED)) * 100
  );

  const toggleMode = () => {
    const next: GameMode = gameMode === "classic" ? "wrap" : "classic";
    setGameMode(next);
    if (gameStateRef.current !== "idle") {
      if (loopRef.current) clearTimeout(loopRef.current);
      snakeRef.current = getInitialSnake();
      foodRef.current = randomFood(snakeRef.current);
      directionRef.current = "RIGHT";
      nextDirRef.current = "RIGHT";
      scoreRef.current = 0;
      speedRef.current = INITIAL_SPEED;
      growQueueRef.current = 0;
      foodEatenRef.current = 0;
      colorPhaseRef.current = 0;
      colorTransitionRef.current = 0;
      setScore(0);
      gameStateRef.current = "idle";
      setGameState("idle");
      draw();
    }
  };

  const currentColorName = [
    "Gold",
    "Teal",
    "Purple",
    "Coral",
    "Blue",
    "Yellow",
    "Pink",
    "Cyan",
  ][colorPhaseRef.current % SNAKE_COLOR_PHASES.length];

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full pb-8">
      {/* ── Left sidebar (top on mobile) ── */}
      <div className="w-full lg:w-44 shrink-0 lg:order-1">
        <div className="flex flex-row lg:flex-col gap-2 flex-wrap lg:flex-nowrap">
          {/* Score */}
          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
              Score
            </div>
            <div className="font-cormorant text-3xl text-primary leading-none">
              {score}
            </div>
          </div>

          {/* Best */}
          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
              Best
            </div>
            <div className="font-cormorant text-3xl text-accent leading-none">
              {Math.max(highScore, score)}
            </div>
          </div>

          {/* Speed - hide on mobile when running */}
          {gameState === "running" && (
            <div
              className={`bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none ${
                isRunning ? "hidden sm:block" : ""
              }`}
            >
              <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
                Speed
              </div>
              <div className="font-cormorant text-2xl text-accent leading-none">
                {speedPercent}%
              </div>
              <div className="mt-2 w-full bg-white/[0.04] rounded-full h-1">
                <div
                  className="bg-accent h-1 rounded-full transition-all duration-300"
                  style={{ width: `${speedPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Mode - hide on mobile when running */}
          <div
            className={`bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none ${
              isRunning ? "hidden sm:block" : ""
            }`}
          >
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Mode
            </div>
            <button
              onClick={toggleMode}
              className={`w-full px-3 py-2 rounded-lg font-inter text-xs font-medium
                transition-all cursor-pointer border
                ${
                  gameMode === "classic"
                    ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
                    : "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
                }`}
            >
              {gameMode === "classic" ? "⬜ Classic" : "🔄 Wrap"}
            </button>
            <p className="font-inter text-[9px] text-muted/60 mt-1.5 leading-tight">
              {gameMode === "classic" ? "Walls kill" : "Go through walls"}
            </p>
          </div>

          {/* Status - hide on mobile when running */}
          <div
            className={`bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none ${
              isRunning ? "hidden sm:block" : ""
            }`}
          >
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Status
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  gameState === "running"
                    ? "bg-green-500 animate-pulse"
                    : gameState === "gameover"
                    ? "bg-red-500"
                    : "bg-muted/50"
                }`}
              />
              <span className="font-inter text-xs text-muted capitalize">
                {gameState === "gameover" ? "Game Over" : gameState}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Center: Game canvas ── */}
      <div className="flex flex-col items-center gap-3 w-full lg:flex-1 lg:order-2">
        <div
          ref={containerRef}
          className="relative w-full flex items-center justify-center touch-none"
          style={{ maxWidth: 520 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            className="block rounded-xl"
            style={{
              width: canvasDisplaySize,
              height: canvasDisplaySize,
              imageRendering: "auto",
            }}
          />

          <AnimatePresence>
            {gameState === "idle" && (
              <Overlay key="idle">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <span className="text-3xl">🐍</span>
                </div>
                <p className="font-inter text-[11px] text-muted uppercase tracking-[0.2em] mb-1">
                  {gameMode === "classic" ? "Classic Mode" : "Wrap Mode"}
                </p>
                <p className="font-inter text-xs text-muted/60 mb-6 max-w-[220px] leading-relaxed">
                  {gameMode === "classic"
                    ? "Eat food, avoid walls & yourself"
                    : "Go through walls, avoid yourself"}
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-2.5 bg-accent text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-accent/90 transition-colors
                             cursor-pointer mb-3"
                >
                  Start Game
                </button>
                <p className="font-inter text-[10px] text-muted/40">
                  or press any arrow key
                </p>
              </Overlay>
            )}

            {gameState === "gameover" && (
              <Overlay key="gameover">
                <p className="font-inter text-[11px] text-red-400/80 uppercase tracking-[0.2em] mb-3">
                  Game Over
                </p>
                <p className="font-cormorant text-5xl font-light text-primary mb-1">
                  {score}
                </p>
                <p className="font-inter text-sm text-muted mb-6">
                  {score > 0 && score >= highScore
                    ? "🏆 New high score!"
                    : `Best: ${Math.max(highScore, score)}`}
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-2.5 bg-accent text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-accent/90 transition-colors
                             cursor-pointer"
                >
                  Play Again
                </button>
              </Overlay>
            )}
          </AnimatePresence>
        </div>

        {/* Snake color indicator during gameplay */}
        {gameState === "running" && foodEatenRef.current > 0 && (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border border-white/10"
              style={{ backgroundColor: getSnakeColors().headColor }}
            />
            <span className="font-inter text-[10px] text-muted">
              {currentColorName} • {foodEatenRef.current} eaten
            </span>
          </div>
        )}

        {/* Mobile D-pad - larger buttons with proper spacing */}
        <div className="flex flex-col items-center gap-2 sm:hidden select-none mt-2">
          <button
            onClick={() => mobileDir("UP")}
            className="w-16 h-16 bg-card border border-white/[0.10] rounded-2xl
                       flex items-center justify-center text-muted text-xl
                       active:bg-white/[0.08] active:scale-90 active:text-accent
                       transition-all cursor-pointer"
          >
            ▲
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => mobileDir("LEFT")}
              className="w-16 h-16 bg-card border border-white/[0.10] rounded-2xl
                         flex items-center justify-center text-muted text-xl
                         active:bg-white/[0.08] active:scale-90 active:text-accent
                         transition-all cursor-pointer"
            >
              ◀
            </button>
            <div className="w-16 h-16" />
            <button
              onClick={() => mobileDir("RIGHT")}
              className="w-16 h-16 bg-card border border-white/[0.10] rounded-2xl
                         flex items-center justify-center text-muted text-xl
                         active:bg-white/[0.08] active:scale-90 active:text-accent
                         transition-all cursor-pointer"
            >
              ▶
            </button>
          </div>
          <button
            onClick={() => mobileDir("DOWN")}
            className="w-16 h-16 bg-card border border-white/[0.10] rounded-2xl
                       flex items-center justify-center text-muted text-xl
                       active:bg-white/[0.08] active:scale-90 active:text-accent
                       transition-all cursor-pointer"
          >
            ▼
          </button>
        </div>
      </div>

      {/* ── Right sidebar - hide on mobile when running ── */}
      <div
        className={`w-full lg:w-44 shrink-0 lg:order-3 ${
          isRunning ? "hidden lg:block" : ""
        }`}
      >
        <div className="flex flex-row lg:flex-col gap-2 flex-wrap lg:flex-nowrap">
          {recentScores.length > 0 && (
            <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[100px] flex-1 lg:flex-none">
              <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
                Recent Games
              </div>
              <div className="flex flex-col gap-1.5">
                {recentScores.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="font-inter text-[10px] text-muted/50">
                      #{i + 1}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                    <span
                      className={`font-inter text-xs font-medium tabular-nums ${
                        i === 0 ? "text-primary" : "text-muted"
                      }`}
                    >
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[100px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Food
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-white/90 shrink-0" />
                <div>
                  <span className="font-inter text-[10px] text-muted block">
                    Regular
                  </span>
                  <span className="font-inter text-[9px] text-muted/50">
                    +{SMALL_FOOD_SCORE} pts
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-amber-400/90 shrink-0" />
                <div>
                  <span className="font-inter text-[10px] text-muted block">
                    Golden
                  </span>
                  <span className="font-inter text-[9px] text-muted/50">
                    +{BIG_FOOD_SCORE} pts, +{BIG_FOOD_GROWTH} size
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[100px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Snake Colors
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SNAKE_COLOR_PHASES.map((phase, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-md border transition-all ${
                    colorPhaseRef.current % SNAKE_COLOR_PHASES.length ===
                      i && gameState === "running"
                      ? "border-white/30 scale-110"
                      : "border-white/[0.06]"
                  }`}
                  style={{ backgroundColor: phase.head }}
                  title={`Phase ${i + 1} — every ${COLOR_CHANGE_INTERVAL} food`}
                />
              ))}
            </div>
            <p className="font-inter text-[9px] text-muted/50 mt-1.5">
              Changes every {COLOR_CHANGE_INTERVAL} food eaten
            </p>
          </div>
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
      transition={{ duration: 0.25 }}
      className="absolute inset-0 flex flex-col items-center justify-center
                 text-center px-6 rounded-xl bg-[rgba(10,10,10,0.93)]"
    >
      {children}
    </motion.div>
  );
}