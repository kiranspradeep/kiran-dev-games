// components/PacmanGame.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveScore, getScore } from "@/lib/scores";

// ─── Types ───────────────────────────────────────────────
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT" | "NONE";
type GameState = "idle" | "running" | "gameover" | "won" | "paused";
type GhostMode = "scatter" | "chase" | "frightened";
type Point = { x: number; y: number };

interface Ghost {
  pos: Point;
  dir: Direction;
  nextDir: Direction;
  mode: GhostMode;
  color: string;
  frightenedTimer: number;
  name: string;
  scatterTarget: Point;
  homePos: Point;
  isEaten: boolean;
  eatenTimer: number;
  speed: number;
}

// ─── Constants ───────────────────────────────────────────
const COLS = 21;
const ROWS = 23;
const CANVAS_RES_W = COLS * 24;
const CANVAS_RES_H = ROWS * 24;
const CELL = 24;

const TICK_RATE = 140;
const GHOST_FRIGHTENED_TICKS = 50;
const GHOST_EATEN_TICKS = 20;

const DOT_SCORE = 10;
const POWER_SCORE = 50;
const GHOST_EAT_SCORE = 200;

const GHOST_COLORS = ["#FF0000", "#FFB8FF", "#00FFFF", "#FFB852"];
const GHOST_NAMES = ["Blinky", "Pinky", "Inky", "Clyde"];

// prettier-ignore
const BASE_MAP: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
  [0,2,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,2,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,5,5,5,0,0,3,0,1,0,0,0,0],
  [3,3,3,3,1,3,3,0,4,4,4,4,4,0,3,3,1,3,3,3,3],
  [0,0,0,0,1,0,3,0,4,4,4,4,4,0,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,0,0,0,0,0,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0],
  [0,2,1,0,1,1,1,1,1,1,3,1,1,1,1,1,1,0,1,2,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0],
  [0,1,1,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const PACMAN_START: Point = { x: 10, y: 15 };
const GHOST_STARTS: Point[] = [
  { x: 10, y: 9 },
  { x: 9, y: 9 },
  { x: 11, y: 9 },
  { x: 10, y: 10 },
];
const GHOST_SCATTER_TARGETS: Point[] = [
  { x: COLS - 2, y: 1 },
  { x: 1, y: 1 },
  { x: COLS - 2, y: ROWS - 2 },
  { x: 1, y: ROWS - 2 },
];

// ─── Helpers ─────────────────────────────────────────────
function cloneMap(m: number[][]): number[][] {
  return m.map((r) => [...r]);
}

function isWalkable(
  map: number[][],
  x: number,
  y: number,
  isGhost = false
): boolean {
  if (y < 0 || y >= ROWS) return false;
  if (x < 0 || x >= COLS) return y === 9;
  const cell = map[y][x];
  if (cell === 0) return false;
  if (cell === 5) return isGhost;
  return true;
}

function wrapX(x: number): number {
  if (x < 0) return COLS - 1;
  if (x >= COLS) return 0;
  return x;
}

function dirDelta(d: Direction): Point {
  switch (d) {
    case "UP":
      return { x: 0, y: -1 };
    case "DOWN":
      return { x: 0, y: 1 };
    case "LEFT":
      return { x: -1, y: 0 };
    case "RIGHT":
      return { x: 1, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

function opposite(d: Direction): Direction {
  const m: Record<Direction, Direction> = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT",
    NONE: "NONE",
  };
  return m[d];
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function countDots(map: number[][]): number {
  let c = 0;
  for (const row of map)
    for (const cell of row) if (cell === 1 || cell === 2) c++;
  return c;
}

// ─── Component ───────────────────────────────────────────
export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [recentScores, setRecentScores] = useState<number[]>([]);
  const [displayW, setDisplayW] = useState(400);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [dotsLeft, setDotsLeft] = useState(0);

  const mapRef = useRef<number[][]>(cloneMap(BASE_MAP));
  const pacRef = useRef<Point>({ ...PACMAN_START });
  const pacDirRef = useRef<Direction>("NONE");
  const pacNextDirRef = useRef<Direction>("NONE");
  const pacMouthRef = useRef(0);

  const ghostsRef = useRef<Ghost[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const gameStateRef = useRef<GameState>("idle");
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tickCountRef = useRef(0);
  const modeTimerRef = useRef(0);
  const globalModeRef = useRef<"scatter" | "chase">("scatter");
  const ghostEatComboRef = useRef(0);

  const isRunning = gameState === "running";

  // Responsive sizing
  useEffect(() => {
    function resize() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const maxW = Math.min(w, 520);
      setDisplayW(maxW);
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

  // Prevent page scroll when touching the game area
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => el.removeEventListener("touchmove", preventScroll);
  }, []);

  const initGhosts = useCallback((): Ghost[] => {
    return GHOST_STARTS.map((pos, i) => ({
      pos: { ...pos },
      dir: "UP" as Direction,
      nextDir: "UP" as Direction,
      mode: "scatter" as GhostMode,
      color: GHOST_COLORS[i],
      frightenedTimer: 0,
      name: GHOST_NAMES[i],
      scatterTarget: GHOST_SCATTER_TARGETS[i],
      homePos: { ...pos },
      isEaten: false,
      eatenTimer: 0,
      speed: 1,
    }));
  }, []);

  const resetRound = useCallback(() => {
    pacRef.current = { ...PACMAN_START };
    pacDirRef.current = "NONE";
    pacNextDirRef.current = "NONE";
    pacMouthRef.current = 0;
    ghostsRef.current = initGhosts();
    tickCountRef.current = 0;
    modeTimerRef.current = 0;
    globalModeRef.current = "scatter";
    ghostEatComboRef.current = 0;
  }, [initGhosts]);

  // ─── Drawing ─────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_RES_W * dpr;
    canvas.height = CANVAS_RES_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, CANVAS_RES_W, CANVAS_RES_H);

    const map = mapRef.current;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = map[y][x];
        const px = x * CELL;
        const py = y * CELL;

        if (cell === 0) {
          ctx.fillStyle = "#1a237e";
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          ctx.strokeStyle = "#3949ab";
          ctx.lineWidth = 1;
          const top = y > 0 && map[y - 1][x] !== 0;
          const bot = y < ROWS - 1 && map[y + 1][x] !== 0;
          const lft = x > 0 && map[y][x - 1] !== 0;
          const rgt = x < COLS - 1 && map[y][x + 1] !== 0;
          if (top) {
            ctx.beginPath();
            ctx.moveTo(px, py + 1);
            ctx.lineTo(px + CELL, py + 1);
            ctx.stroke();
          }
          if (bot) {
            ctx.beginPath();
            ctx.moveTo(px, py + CELL - 1);
            ctx.lineTo(px + CELL, py + CELL - 1);
            ctx.stroke();
          }
          if (lft) {
            ctx.beginPath();
            ctx.moveTo(px + 1, py);
            ctx.lineTo(px + 1, py + CELL);
            ctx.stroke();
          }
          if (rgt) {
            ctx.beginPath();
            ctx.moveTo(px + CELL - 1, py);
            ctx.lineTo(px + CELL - 1, py + CELL);
            ctx.stroke();
          }
        } else if (cell === 5) {
          ctx.fillStyle = "#FFB8FF";
          ctx.fillRect(px + 2, py + CELL / 2 - 1, CELL - 4, 3);
        } else if (cell === 1) {
          ctx.fillStyle = "#FFB74D";
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py + CELL / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 2) {
          const pulse =
            Math.sin(tickCountRef.current * 0.15) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255,183,77,${pulse})`;
          ctx.shadowColor = "rgba(255,183,77,0.6)";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py + CELL / 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    for (const ghost of ghostsRef.current) {
      const gx = ghost.pos.x * CELL + CELL / 2;
      const gy = ghost.pos.y * CELL + CELL / 2;
      const gr = CELL / 2 - 2;

      if (ghost.isEaten) {
        drawGhostEyes(ctx, gx, gy, ghost.dir);
        continue;
      }

      let color = ghost.color;
      if (ghost.mode === "frightened") {
        const flash =
          ghost.frightenedTimer < 15 && ghost.frightenedTimer % 4 < 2;
        color = flash ? "#FFFFFF" : "#2222FF";
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(gx, gy - 2, gr, Math.PI, 0, false);
      ctx.lineTo(gx + gr, gy + gr - 2);
      const wave = Math.sin(tickCountRef.current * 0.3) * 2;
      for (let i = 0; i < 3; i++) {
        const wx = gx + gr - (i * 2 * gr) / 3;
        const wy = gy + gr - 2 + (i % 2 === 0 ? wave : -wave);
        ctx.lineTo(wx, wy);
      }
      ctx.lineTo(gx - gr, gy + gr - 2);
      ctx.closePath();
      ctx.fill();

      if (ghost.mode !== "frightened") {
        drawGhostEyes(ctx, gx, gy, ghost.dir);
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gx + 4, gy - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx - 5, gy + 3);
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            gx - 5 + i * 2.5,
            gy + 3 + (i % 2 === 0 ? 0 : 2)
          );
        }
        ctx.stroke();
      }
    }

    const pac = pacRef.current;
    const ppx = pac.x * CELL + CELL / 2;
    const ppy = pac.y * CELL + CELL / 2;
    const pr = CELL / 2 - 2;

    pacMouthRef.current += 0.25;
    const mouthAngle = Math.abs(Math.sin(pacMouthRef.current)) * 0.8;

    let startAngle = mouthAngle;
    let endAngle = Math.PI * 2 - mouthAngle;

    const dir = pacDirRef.current;
    if (dir === "UP") {
      startAngle += Math.PI * 1.5;
      endAngle += Math.PI * 1.5;
    } else if (dir === "DOWN") {
      startAngle += Math.PI * 0.5;
      endAngle += Math.PI * 0.5;
    } else if (dir === "LEFT") {
      startAngle += Math.PI;
      endAngle += Math.PI;
    }

    ctx.fillStyle = "#FFEB3B";
    ctx.shadowColor = "rgba(255,235,59,0.5)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ppx, ppy);
    ctx.arc(ppx, ppy, pr, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let i = 0; i < livesRef.current - 1; i++) {
      const lx = 20 + i * 22;
      const ly = CANVAS_RES_H - 14;
      ctx.fillStyle = "#FFEB3B";
      ctx.beginPath();
      ctx.arc(lx, ly, 7, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(lx, ly);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(
      `LVL ${levelRef.current}`,
      CANVAS_RES_W - 10,
      CANVAS_RES_H - 8
    );
  }, []);

  function drawGhostEyes(
    ctx: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    dir: Direction
  ) {
    const eyeOffX = dir === "LEFT" ? -2 : dir === "RIGHT" ? 2 : 0;
    const eyeOffY = dir === "UP" ? -2 : dir === "DOWN" ? 2 : 0;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(gx - 4, gy - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx + 4, gy - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(gx - 4 + eyeOffX, gy - 3 + eyeOffY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx + 4 + eyeOffX, gy - 3 + eyeOffY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Ghost AI ──────────────────────────────────────────
  const getGhostTarget = useCallback(
    (ghost: Ghost, pac: Point, pacDir: Direction): Point => {
      if (ghost.isEaten) return ghost.homePos;
      if (ghost.mode === "scatter") return ghost.scatterTarget;
      if (ghost.mode === "frightened") {
        return {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS),
        };
      }

      switch (ghost.name) {
        case "Blinky":
          return pac;
        case "Pinky": {
          const d = dirDelta(pacDir);
          return { x: pac.x + d.x * 4, y: pac.y + d.y * 4 };
        }
        case "Inky": {
          const d = dirDelta(pacDir);
          const ahead = { x: pac.x + d.x * 2, y: pac.y + d.y * 2 };
          const blinky = ghostsRef.current[0].pos;
          return {
            x: ahead.x * 2 - blinky.x,
            y: ahead.y * 2 - blinky.y,
          };
        }
        case "Clyde": {
          return dist(ghost.pos, pac) > 8 ? pac : ghost.scatterTarget;
        }
        default:
          return pac;
      }
    },
    []
  );

  const moveGhost = useCallback(
    (ghost: Ghost, map: number[][]): void => {
      const target = getGhostTarget(
        ghost,
        pacRef.current,
        pacDirRef.current
      );
      const dirs: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
      const opp = opposite(ghost.dir);

      let bestDir: Direction = ghost.dir;
      let bestDist = Infinity;

      for (const d of dirs) {
        if (d === opp && ghost.mode !== "frightened") continue;
        const delta = dirDelta(d);
        const nx = wrapX(ghost.pos.x + delta.x);
        const ny = ghost.pos.y + delta.y;
        if (!isWalkable(map, nx, ny, true)) continue;

        const distance = dist({ x: nx, y: ny }, target);
        if (distance < bestDist) {
          bestDist = distance;
          bestDir = d;
        }
      }

      const delta = dirDelta(bestDir);
      ghost.dir = bestDir;
      ghost.pos = {
        x: wrapX(ghost.pos.x + delta.x),
        y: ghost.pos.y + delta.y,
      };
    },
    [getGhostTarget]
  );

  // ─── Game Tick ─────────────────────────────────────────
  const tick = useCallback(() => {
    if (gameStateRef.current !== "running") return;

    tickCountRef.current++;
    modeTimerRef.current++;

    const map = mapRef.current;

    if (modeTimerRef.current === 50) globalModeRef.current = "chase";
    else if (modeTimerRef.current === 120)
      globalModeRef.current = "scatter";
    else if (modeTimerRef.current === 170)
      globalModeRef.current = "chase";

    const nextD = pacNextDirRef.current;
    if (nextD !== "NONE") {
      const nd = dirDelta(nextD);
      const nx = wrapX(pacRef.current.x + nd.x);
      const ny = pacRef.current.y + nd.y;
      if (isWalkable(map, nx, ny)) {
        pacDirRef.current = nextD;
      }
    }

    const curD = pacDirRef.current;
    if (curD !== "NONE") {
      const cd = dirDelta(curD);
      const cx = wrapX(pacRef.current.x + cd.x);
      const cy = pacRef.current.y + cd.y;
      if (isWalkable(map, cx, cy)) {
        pacRef.current = { x: cx, y: cy };
      }
    }

    const pac = pacRef.current;
    const cell = map[pac.y]?.[pac.x];
    if (cell === 1) {
      map[pac.y][pac.x] = 3;
      scoreRef.current += DOT_SCORE;
      setScore(scoreRef.current);
    } else if (cell === 2) {
      map[pac.y][pac.x] = 3;
      scoreRef.current += POWER_SCORE;
      setScore(scoreRef.current);
      ghostEatComboRef.current = 0;
      for (const ghost of ghostsRef.current) {
        if (!ghost.isEaten) {
          ghost.mode = "frightened";
          ghost.frightenedTimer = GHOST_FRIGHTENED_TICKS;
          ghost.dir = opposite(ghost.dir);
        }
      }
    }

    for (const ghost of ghostsRef.current) {
      if (ghost.isEaten) {
        ghost.eatenTimer--;
        if (ghost.eatenTimer <= 0) {
          ghost.isEaten = false;
          ghost.pos = { ...ghost.homePos };
          ghost.mode = globalModeRef.current;
        } else {
          moveGhost(ghost, map);
        }
        continue;
      }

      if (ghost.mode === "frightened") {
        ghost.frightenedTimer--;
        if (ghost.frightenedTimer <= 0) {
          ghost.mode = globalModeRef.current;
        }
      } else {
        ghost.mode = globalModeRef.current;
      }

      moveGhost(ghost, map);
    }

    for (const ghost of ghostsRef.current) {
      if (ghost.pos.x === pac.x && ghost.pos.y === pac.y) {
        if (ghost.mode === "frightened" && !ghost.isEaten) {
          ghost.isEaten = true;
          ghost.eatenTimer = GHOST_EATEN_TICKS;
          ghostEatComboRef.current++;
          const bonus = GHOST_EAT_SCORE * ghostEatComboRef.current;
          scoreRef.current += bonus;
          setScore(scoreRef.current);
        } else if (!ghost.isEaten) {
          livesRef.current--;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            gameStateRef.current = "gameover";
            setGameState("gameover");
            if (loopRef.current) clearTimeout(loopRef.current);
            const result = saveScore(
              "pacman" as Parameters<typeof saveScore>[0],
              scoreRef.current
            );
            setHighScore(result.highScore);
            setRecentScores(result.recentScores ?? []);
            draw();
            return;
          } else {
            resetRound();
            draw();
            loopRef.current = setTimeout(tick, 1000);
            return;
          }
        }
      }
    }

    const remaining = countDots(map);
    setDotsLeft(remaining);
    if (remaining === 0) {
      levelRef.current++;
      setLevel(levelRef.current);
      mapRef.current = cloneMap(BASE_MAP);
      resetRound();
      setDotsLeft(countDots(mapRef.current));
      draw();
      loopRef.current = setTimeout(tick, 1000);
      return;
    }

    draw();
    loopRef.current = setTimeout(
      tick,
      TICK_RATE - Math.min(levelRef.current * 5, 50)
    );
  }, [draw, moveGhost, resetRound]);

  const startGame = useCallback(() => {
    if (loopRef.current) clearTimeout(loopRef.current);
    mapRef.current = cloneMap(BASE_MAP);
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    setScore(0);
    setLives(3);
    setLevel(1);
    setDotsLeft(countDots(mapRef.current));
    resetRound();
    gameStateRef.current = "running";
    setGameState("running");
    draw();
    loopRef.current = setTimeout(tick, TICK_RATE);
  }, [draw, tick, resetRound]);

  useEffect(() => {
    ghostsRef.current = initGhosts();
    setDotsLeft(countDots(mapRef.current));
    draw();
    const data = getScore("pacman" as Parameters<typeof getScore>[0]);
    setHighScore(data.highScore);
    setRecentScores(data.recentScores ?? []);
  }, [draw, initGhosts]);

  useEffect(
    () => () => {
      if (loopRef.current) clearTimeout(loopRef.current);
    },
    []
  );

  useEffect(() => {
    if (gameState !== "running") {
      const interval = setInterval(() => draw(), 100);
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
      if (next) pacNextDirRef.current = next;
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
    const next: Direction =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "RIGHT"
          : "LEFT"
        : dy > 0
        ? "DOWN"
        : "UP";
    pacNextDirRef.current = next;
  };

  const mobileDir = (dir: Direction) => {
    if (
      gameStateRef.current === "idle" ||
      gameStateRef.current === "gameover"
    ) {
      startGame();
      return;
    }
    pacNextDirRef.current = dir;
  };

  const displayH = displayW * (CANVAS_RES_H / CANVAS_RES_W);
  const totalDots = countDots(cloneMap(BASE_MAP));

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full pb-8">
      {/* ── Left sidebar ── */}
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
              {Math.max(highScore, score)}
            </div>
          </div>

          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
              Lives
            </div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: lives }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full bg-yellow-400"
                />
              ))}
              {lives === 0 && (
                <span className="font-inter text-xs text-red-400">
                  None
                </span>
              )}
            </div>
          </div>

          {/* Hide these on mobile when running */}
          <div
            className={`bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none ${
              isRunning ? "hidden sm:block" : ""
            }`}
          >
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-1">
              Level
            </div>
            <div className="font-cormorant text-2xl text-accent leading-none">
              {level}
            </div>
          </div>

          <div
            className={`bg-card border border-white/[0.06] rounded-xl p-3 min-w-[85px] flex-1 lg:flex-none ${
              isRunning ? "hidden sm:block" : ""
            }`}
          >
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Progress
            </div>
            <div className="w-full bg-white/[0.04] rounded-full h-1.5">
              <div
                className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(
                    ((totalDots - dotsLeft) / totalDots) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="font-inter text-[9px] text-muted/60 mt-1">
              {totalDots - dotsLeft}/{totalDots} dots
            </p>
          </div>

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
                {gameState === "gameover"
                  ? "Game Over"
                  : gameState === "won"
                  ? "You Win!"
                  : gameState}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Center: Game ── */}
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
              width: displayW,
              height: displayH,
              imageRendering: "auto",
            }}
          />

          <AnimatePresence>
            {gameState === "idle" && (
              <Overlay key="idle">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                  <span className="text-3xl">👾</span>
                </div>
                <p className="font-inter text-[11px] text-muted uppercase tracking-[0.2em] mb-1">
                  Pac-Man
                </p>
                <p className="font-inter text-xs text-muted/60 mb-6 max-w-[240px] leading-relaxed">
                  Eat all dots, avoid ghosts. Power pellets let you eat
                  them!
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-2.5 bg-yellow-400 text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-yellow-300 transition-colors
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
                <p className="font-inter text-xs text-muted mb-1">
                  Level {level}
                </p>
                <p className="font-inter text-sm text-muted mb-6">
                  {score > 0 && score >= highScore
                    ? "🏆 New high score!"
                    : `Best: ${Math.max(highScore, score)}`}
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-2.5 bg-yellow-400 text-background font-inter text-sm
                             font-medium rounded-lg hover:bg-yellow-300 transition-colors
                             cursor-pointer"
                >
                  Play Again
                </button>
              </Overlay>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile D-pad - larger buttons with more spacing */}
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
              Ghosts
            </div>
            <div className="flex flex-col gap-1.5">
              {GHOST_NAMES.map((name, i) => (
                <div key={name} className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: GHOST_COLORS[i] }}
                  />
                  <span className="font-inter text-[10px] text-muted">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[100px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Scoring
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="font-inter text-[10px] text-muted">
                  Dot: +{DOT_SCORE}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400/70 shrink-0 animate-pulse" />
                <span className="font-inter text-[10px] text-muted">
                  Power: +{POWER_SCORE}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="font-inter text-[10px] text-muted">
                  Ghost: +{GHOST_EAT_SCORE}×
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/[0.06] rounded-xl p-3 min-w-[100px] flex-1 lg:flex-none">
            <div className="font-inter text-[10px] text-muted uppercase tracking-widest mb-2">
              Tips
            </div>
            <p className="font-inter text-[9px] text-muted/60 leading-relaxed">
              Use tunnels on the sides to escape. Eat power pellets to
              turn ghosts blue and eat them for bonus points!
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