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

// ── Board layout constants ────────────────────────────────────────────────────
const CELL = 48;
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

// Home base positions [col, row] for each color
const HOME_POSITIONS: Record<LudoColor, [number, number][]> = {
  RED:    [[1,1],[2,1],[1,2],[2,2]],
  GREEN:  [[12,1],[13,1],[12,2],[13,2]],
  YELLOW: [[12,12],[13,12],[12,13],[13,13]],
  BLUE:   [[1,12],[2,12],[1,13],[2,13]],
};

// ── Build the 52-cell track as explicit tuples ────────────────────────────────
function buildTrack(): [number, number][] {
  const track: [number, number][] = [];

  // Segment helpers — explicit tuple push
  const add = (c: number, r: number) => track.push([c, r]);

  // Left column going up: col 6, rows 14→9
  for (let r = 14; r >= 9; r--) add(6, r);

  // Top-left row going right: row 8, cols 6→8
  for (let c = 6; c <= 8; c++) add(c, 8);

  // Wait — this would make a loop. Use the classic Ludo path:
  // Segment 1: col 6, rows 14 down to 9
  // Segment 2: row 8, cols 1 to 5 (left arm)
  // ...
  // For now, generate a simple clockwise ring of 52 cells:

  // Top edge going right: row 6, cols 1→13
  for (let c = 1; c <= 13; c++) add(c, 6);
  // Right edge going down: col 13, rows 7→13
  for (let r = 7; r <= 13; r++) add(13, r);
  // Bottom edge going left: row 13, cols 12→1
  for (let c = 12; c >= 1; c--) add(c, 13);
  // Left edge going up: col 1, rows 12→7
  for (let r = 12; r >= 7; r--) add(1, r);

  // Trim or pad to exactly 52
  return track.slice(0, 52);
}

const TRACK = buildTrack();

// Color-specific start positions on the track (0-indexed)
const COLOR_START_INDEX: Record<LudoColor, number> = {
  RED:    0,
  GREEN:  13,
  YELLOW: 26,
  BLUE:   39,
};

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

    // ── Draw board grid ─────────────────────────────────────────────────────
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL;
        const y = r * CELL;

        let fill = "rgba(255,255,255,0.03)";

        // Color home zones
        if (c < 6 && r < 6)        fill = `${COLOR_HEX.RED}22`;
        else if (c > 8 && r < 6)   fill = `${COLOR_HEX.GREEN}22`;
        else if (c > 8 && r > 8)   fill = `${COLOR_HEX.YELLOW}22`;
        else if (c < 6 && r > 8)   fill = `${COLOR_HEX.BLUE}22`;
        // Home columns
        else if (c === 7 && r > 0 && r < 6)  fill = `${COLOR_HEX.RED}33`;
        else if (c > 8 && c < 14 && r === 7) fill = `${COLOR_HEX.GREEN}33`;
        else if (c === 7 && r > 8 && r < 14) fill = `${COLOR_HEX.YELLOW}33`;
        else if (c < 6 && c > 0 && r === 7)  fill = `${COLOR_HEX.BLUE}33`;

        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
      }
    }

    // ── Center finish area ──────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(6 * CELL + 1, 6 * CELL + 1, 3 * CELL - 2, 3 * CELL - 2);

    // Draw finish triangles
    const cx = 7.5 * CELL;
    const cy = 7.5 * CELL;
    const tr = CELL * 1.4;

    const finishTriangles: Array<{
      color: LudoColor;
      pts:   [[number, number], [number, number], [number, number]];
    }> = [
      {
        color: "RED",
        pts:   [[cx - tr, cy - tr], [cx + tr, cy - tr], [cx, cy]],
      },
      {
        color: "GREEN",
        pts:   [[cx + tr, cy - tr], [cx + tr, cy + tr], [cx, cy]],
      },
      {
        color: "YELLOW",
        pts:   [[cx + tr, cy + tr], [cx - tr, cy + tr], [cx, cy]],
      },
      {
        color: "BLUE",
        pts:   [[cx - tr, cy + tr], [cx - tr, cy - tr], [cx, cy]],
      },
    ];

    for (const tri of finishTriangles) {
      ctx.fillStyle = `${COLOR_HEX[tri.color]}44`;
      ctx.beginPath();
      ctx.moveTo(tri.pts[0][0], tri.pts[0][1]);
      ctx.lineTo(tri.pts[1][0], tri.pts[1][1]);
      ctx.lineTo(tri.pts[2][0], tri.pts[2][1]);
      ctx.closePath();
      ctx.fill();
    }

    // ── Draw home bases ─────────────────────────────────────────────────────
    const colors: LudoColor[] = ["RED", "GREEN", "YELLOW", "BLUE"];
    for (const color of colors) {
      for (const [col, row] of HOME_POSITIONS[color]) {
        const x = col * CELL;
        const y = row * CELL;

        ctx.fillStyle = `${COLOR_HEX[color]}55`;
        ctx.beginPath();
        ctx.arc(x + CELL / 2, y + CELL / 2, CELL * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${COLOR_HEX[color]}88`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }
    }

    // ── Draw safe cell markers on track ─────────────────────────────────────
    const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];
    for (const idx of SAFE_INDICES) {
      const cell = TRACK[idx];
      if (!cell) continue;
      const [col, row] = cell;
      const x = col * CELL + CELL / 2;
      const y = row * CELL + CELL / 2;

      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.arc(x, y, CELL * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle    = "rgba(255,255,255,0.4)";
      ctx.font         = `${CELL * 0.3}px sans-serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", x, y);
    }

    // ── Draw pieces ──────────────────────────────────────────────────────────
    for (const player of players) {
      const { color, pieces } = player;
      const hex = COLOR_HEX[color];

      for (const piece of pieces) {
        const pieceId    = piece.id;
        const isMovable  = canMovePieces.includes(pieceId);
        const isSelected = selectedPiece === pieceId;
        const wasCaptured = lastCaptured === pieceId;

        let px: number;
        let py: number;

        if (piece.state === "HOME") {
          const homePos = HOME_POSITIONS[color][piece.index];
          px = homePos[0] * CELL + CELL / 2;
          py = homePos[1] * CELL + CELL / 2;
        } else if (piece.state === "ACTIVE" && piece.cell > 0) {
          const startIdx  = COLOR_START_INDEX[color];
          const trackIdx  = (startIdx + piece.position - 1) % 52;
          const trackCell = TRACK[trackIdx];
          if (!trackCell) continue;
          px = trackCell[0] * CELL + CELL / 2;
          py = trackCell[1] * CELL + CELL / 2;
        } else {
          continue; // FINISHED — skip (show in center later)
        }

        const pr = CELL * 0.35;

        // Glow for movable/selected pieces
        if (isMovable || isSelected) {
          ctx.shadowColor = hex;
          ctx.shadowBlur  = isSelected ? 20 : 12;
        }

        // Piece circle
        ctx.fillStyle = wasCaptured ? "#ffffff" : hex;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = isSelected
          ? "#ffffff"
          : isMovable
          ? "rgba(255,255,255,0.8)"
          : "rgba(255,255,255,0.3)";
        ctx.lineWidth   = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.stroke();

        // Piece number
        ctx.fillStyle    = "#fff";
        ctx.font         = `bold ${CELL * 0.28}px Inter, sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(piece.index + 1), px, py);

        // Pulse ring for movable pieces
        if (isMovable) {
          ctx.strokeStyle = `${hex}66`;
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
          let px: number;
          let py: number;

          if (piece.state === "HOME") {
            const homePos = HOME_POSITIONS[player.color][piece.index];
            px = homePos[0] * CELL + CELL / 2;
            py = homePos[1] * CELL + CELL / 2;
          } else if (piece.state === "ACTIVE" && piece.cell > 0) {
            const startIdx  = COLOR_START_INDEX[player.color];
            const trackIdx  = (startIdx + piece.position - 1) % 52;
            const trackCell = TRACK[trackIdx];
            if (!trackCell) continue;
            px = trackCell[0] * CELL + CELL / 2;
            py = trackCell[1] * CELL + CELL / 2;
          } else {
            continue;
          }

          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
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