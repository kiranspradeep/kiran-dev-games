"use client";

import { useEffect, useRef, useCallback } from "react";
import type { LudoPlayer, LudoColor } from "@/types/ludo";

interface LudoBoardProps {
  players:       LudoPlayer[];
  currentColor:  LudoColor;
  canMovePieces: string[];
  selectedPiece: string | null;
  onPieceClick:  (pieceId: string) => void;
  lastCaptured:  string | null;
}

// ── Grid constants ────────────────────────────────────────────────────────────
const CELL = 40;
const COLS = 15;
const ROWS = 15;
const W    = CELL * COLS;
const H    = CELL * ROWS;

const COLOR_HEX: Record<LudoColor, string> = {
  RED:    "#ef4444",
  GREEN:  "#22c55e",
  YELLOW: "#eab308",
  BLUE:   "#3b82f6",
};

// ── Home base piece positions (2x2 inside each color's quadrant) ──────────────
// Each color owns a 6x6 quadrant. Pieces sit in inner 2x2 cells.
const HOME_POSITIONS: Record<LudoColor, [number, number][]> = {
  // Top-left quadrant
  RED:    [[2, 2], [3, 2], [2, 3], [3, 3]],
  // Top-right quadrant
  GREEN:  [[11, 2], [12, 2], [11, 3], [12, 3]],
  // Bottom-right quadrant
  YELLOW: [[11, 11], [12, 11], [11, 12], [12, 12]],
  // Bottom-left quadrant
  BLUE:   [[2, 11], [3, 11], [2, 12], [3, 12]],
};

// ── The canonical 52-cell main track ──────────────────────────────────────────
// Indexed 1..52 (slot 0 unused). cell number → [col, row].
// Cell 1 = RED start. Walks clockwise through all four arms.
const TRACK: ([number, number] | null)[] = [
  null,           // 0 — unused (positions are 1-indexed)
  [1, 6],   // 1   RED START
  [2, 6],   // 2
  [3, 6],   // 3
  [4, 6],   // 4
  [5, 6],   // 5
  [6, 5],   // 6
  [6, 4],   // 7
  [6, 3],   // 8
  [6, 2],   // 9
  [6, 1],   // 10
  [6, 0],   // 11
  [7, 0],   // 12  GREEN HOME ENTRY
  [8, 0],   // 13
  [8, 1],   // 14  GREEN START
  [8, 2],   // 15
  [8, 3],   // 16
  [8, 4],   // 17
  [8, 5],   // 18
  [9, 6],   // 19
  [10, 6],  // 20
  [11, 6],  // 21
  [12, 6],  // 22
  [13, 6],  // 23
  [14, 6],  // 24
  [14, 7],  // 25  YELLOW HOME ENTRY
  [14, 8],  // 26
  [13, 8],  // 27  YELLOW START
  [12, 8],  // 28
  [11, 8],  // 29
  [10, 8],  // 30
  [9, 8],   // 31
  [8, 9],   // 32
  [8, 10],  // 33
  [8, 11],  // 34
  [8, 12],  // 35
  [8, 13],  // 36
  [8, 14],  // 37
  [7, 14],  // 38  BLUE HOME ENTRY
  [6, 14],  // 39
  [6, 13],  // 40  BLUE START
  [6, 12],  // 41
  [6, 11],  // 42
  [6, 10],  // 43
  [6, 9],   // 44
  [5, 8],   // 45
  [4, 8],   // 46
  [3, 8],   // 47
  [2, 8],   // 48
  [1, 8],   // 49
  [0, 8],   // 50
  [0, 7],   // 51  RED HOME ENTRY
  [0, 6],   // 52
];

// ── Home columns (positions 52..56) — 5 cells leading to center ───────────────
const HOME_COLUMNS: Record<LudoColor, [number, number][]> = {
  RED:    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  GREEN:  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  YELLOW: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  BLUE:   [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
};

// ── Finish position (position 57) for finished pieces (small offset per color) ─
const FINISH_OFFSETS: Record<LudoColor, [number, number]> = {
  RED:    [-0.3, -0.3],
  GREEN:  [ 0.3, -0.3],
  YELLOW: [ 0.3,  0.3],
  BLUE:   [-0.3,  0.3],
};

// ── Safe cells (matches backend SAFE_CELLS) ──────────────────────────────────
const SAFE_CELLS = new Set([1, 9, 14, 22, 27, 35, 40, 48]);

// ── Get pixel center for a given grid cell ───────────────────────────────────
function gridToPixel(col: number, row: number): [number, number] {
  return [col * CELL + CELL / 2, row * CELL + CELL / 2];
}

// ── Resolve piece pixel position based on its state/position/cell ────────────
function getPiecePixel(
  piece: { state: string; position: number; cell: number; index: number; color: LudoColor }
): [number, number] | null {
  // FINISHED — draw inside center
  if (piece.state === "FINISHED" || piece.position >= 57) {
    const [ox, oy] = FINISH_OFFSETS[piece.color];
    return gridToPixel(7 + ox, 7 + oy);
  }

  // HOME — sitting in the color's home base
  if (piece.state === "HOME" || piece.position === 0) {
    const slot = HOME_POSITIONS[piece.color][piece.index];
    return gridToPixel(slot[0], slot[1]);
  }

  // ACTIVE on main track (positions 1..51) — use backend's cell number directly
  if (piece.position >= 1 && piece.position <= 51) {
    const coord = TRACK[piece.cell];
    if (!coord) return null;
    return gridToPixel(coord[0], coord[1]);
  }

  // ACTIVE in home column (positions 52..56)
  if (piece.position >= 52 && piece.position <= 56) {
    const idx = piece.position - 52; // 0..4
    const slot = HOME_COLUMNS[piece.color][idx];
    if (!slot) return null;
    return gridToPixel(slot[0], slot[1]);
  }

  return null;
}

export default function LudoBoard({
  players,
  currentColor,
  canMovePieces,
  selectedPiece,
  onPieceClick,
  lastCaptured,
}: LudoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = "#0e0e1a";
    ctx.fillRect(0, 0, W, H);

    // ── Draw the 4 home-base quadrants (6x6 colored squares) ────────────────
    const QUADS: Array<{ color: LudoColor; x: number; y: number }> = [
      { color: "RED",    x: 0, y: 0 },
      { color: "GREEN",  x: 9, y: 0 },
      { color: "YELLOW", x: 9, y: 9 },
      { color: "BLUE",   x: 0, y: 9 },
    ];

    for (const q of QUADS) {
      // Outer block
      ctx.fillStyle = `${COLOR_HEX[q.color]}1f`;
      ctx.fillRect(q.x * CELL, q.y * CELL, 6 * CELL, 6 * CELL);

      // Outer border
      ctx.strokeStyle = `${COLOR_HEX[q.color]}55`;
      ctx.lineWidth   = 2;
      ctx.strokeRect(q.x * CELL + 1, q.y * CELL + 1, 6 * CELL - 2, 6 * CELL - 2);

      // Inner "garage" (4x4 inside)
      ctx.fillStyle = "rgba(15,15,25,0.7)";
      ctx.fillRect(
        (q.x + 1) * CELL,
        (q.y + 1) * CELL,
        4 * CELL,
        4 * CELL
      );
    }

    // ── Draw all main-track cells (faint grid) ──────────────────────────────
    for (let i = 1; i <= 52; i++) {
      const coord = TRACK[i];
      if (!coord) continue;
      const [c, r] = coord;
      const x = c * CELL;
      const y = r * CELL;

      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth   = 1;
      ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    }

    // ── Color the START cell of each color ──────────────────────────────────
    const STARTS: Array<{ color: LudoColor; cell: number }> = [
      { color: "RED",    cell: 1 },
      { color: "GREEN",  cell: 14 },
      { color: "YELLOW", cell: 27 },
      { color: "BLUE",   cell: 40 },
    ];

    for (const s of STARTS) {
      const coord = TRACK[s.cell];
      if (!coord) continue;
      const [c, r] = coord;
      ctx.fillStyle = `${COLOR_HEX[s.color]}55`;
      ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
    }

    // ── Draw home columns (colored path to center) ──────────────────────────
    const colors: LudoColor[] = ["RED", "GREEN", "YELLOW", "BLUE"];
    for (const color of colors) {
      for (const [c, r] of HOME_COLUMNS[color]) {
        ctx.fillStyle = `${COLOR_HEX[color]}66`;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);

        ctx.strokeStyle = `${COLOR_HEX[color]}99`;
        ctx.lineWidth   = 1;
        ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // ── Draw safe-cell stars ────────────────────────────────────────────────
    for (const cellNum of SAFE_CELLS) {
      const coord = TRACK[cellNum];
      if (!coord) continue;
      const [c, r] = coord;
      const [cx, cy] = gridToPixel(c, r);

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle    = "rgba(255,255,255,0.55)";
      ctx.font         = `${CELL * 0.32}px sans-serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", cx, cy);
    }

    // ── Center 3x3 finish area ──────────────────────────────────────────────
    const cx0 = 6 * CELL;
    const cy0 = 6 * CELL;
    const cw  = 3 * CELL;

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(cx0, cy0, cw, cw);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(cx0 + 1, cy0 + 1, cw - 2, cw - 2);

    // Four center triangles meeting at the middle
    const mx = cx0 + cw / 2;
    const my = cy0 + cw / 2;

    const triangles: Array<{ color: LudoColor; pts: [number, number][] }> = [
      // Top triangle → GREEN
      { color: "GREEN",  pts: [[cx0, cy0],        [cx0 + cw, cy0],         [mx, my]] },
      // Right triangle → YELLOW
      { color: "YELLOW", pts: [[cx0 + cw, cy0],   [cx0 + cw, cy0 + cw],    [mx, my]] },
      // Bottom triangle → BLUE
      { color: "BLUE",   pts: [[cx0 + cw, cy0 + cw], [cx0, cy0 + cw],      [mx, my]] },
      // Left triangle → RED
      { color: "RED",    pts: [[cx0, cy0 + cw],   [cx0, cy0],              [mx, my]] },
    ];

    for (const tri of triangles) {
      ctx.fillStyle = `${COLOR_HEX[tri.color]}88`;
      ctx.beginPath();
      ctx.moveTo(tri.pts[0][0], tri.pts[0][1]);
      ctx.lineTo(tri.pts[1][0], tri.pts[1][1]);
      ctx.lineTo(tri.pts[2][0], tri.pts[2][1]);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // ── Draw home-base piece sockets ────────────────────────────────────────
    for (const color of colors) {
      for (const [col, row] of HOME_POSITIONS[color]) {
        const [px, py] = gridToPixel(col, row);

        ctx.fillStyle = `${COLOR_HEX[color]}40`;
        ctx.beginPath();
        ctx.arc(px, py, CELL * 0.36, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${COLOR_HEX[color]}aa`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }
    }

    // ── Draw all pieces ──────────────────────────────────────────────────────
    for (const player of players) {
      for (const piece of player.pieces) {
        const pixel = getPiecePixel({
          state:    piece.state,
          position: piece.position,
          cell:     piece.cell,
          index:    piece.index,
          color:    player.color,
        });
        if (!pixel) continue;

        const [px, py] = pixel;
        const isMovable   = canMovePieces.includes(piece.id);
        const isSelected  = selectedPiece === piece.id;
        const wasCaptured = lastCaptured === piece.id;
        const hex         = COLOR_HEX[player.color];
        const pr          = CELL * 0.32;

        // Glow for movable / selected
        if (isMovable || isSelected) {
          ctx.shadowColor = hex;
          ctx.shadowBlur  = isSelected ? 18 : 10;
        }

        ctx.fillStyle = wasCaptured ? "#ffffff" : hex;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = isSelected
          ? "#ffffff"
          : isMovable
          ? "rgba(255,255,255,0.85)"
          : "rgba(0,0,0,0.5)";
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.stroke();

        // Piece number
        ctx.fillStyle    = "#fff";
        ctx.font         = `bold ${CELL * 0.3}px Inter, sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(piece.index + 1), px, py);

        // Dashed pulse ring for movable pieces
        if (isMovable && !isSelected) {
          ctx.strokeStyle = `${hex}aa`;
          ctx.lineWidth   = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(px, py, pr + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  }, [players, currentColor, canMovePieces, selectedPiece, lastCaptured]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect   = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx     = (e.clientX - rect.left) * scaleX;
      const my     = (e.clientY - rect.top)  * scaleY;

      for (const player of players) {
        for (const piece of player.pieces) {
          const pixel = getPiecePixel({
            state:    piece.state,
            position: piece.position,
            cell:     piece.cell,
            index:    piece.index,
            color:    player.color,
          });
          if (!pixel) continue;

          const [px, py] = pixel;
          const dist     = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          if (dist <= CELL * 0.4) {
            onPieceClick(piece.id);
            return;
          }
        }
      }
    },
    [players, onPieceClick]
  );

  return (
    <div className="relative w-full" style={{ aspectRatio: "1" }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full rounded-2xl cursor-pointer"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}