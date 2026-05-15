"use client";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

const RANK_STYLES: Record<number, { bg: string; color: string; label: string }> = {
  1: {
    bg: "linear-gradient(135deg, #FFD700, #FFA500)",
    color: "#000",
    label: "1st",
  },
  2: {
    bg: "linear-gradient(135deg, #C0C0C0, #A0A0A0)",
    color: "#000",
    label: "2nd",
  },
  3: {
    bg: "linear-gradient(135deg, #CD7F32, #A0522D)",
    color: "#fff",
    label: "3rd",
  },
};

const SIZE_CLASSES = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

export default function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const special = RANK_STYLES[rank];

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full flex items-center
                  justify-center font-inter font-black shrink-0`}
      style={
        special
          ? {
              background: special.bg,
              color: special.color,
            }
          : {
              background: "rgba(255,255,255,0.06)",
              color: "var(--muted)",
              border: "1px solid rgba(255,255,255,0.08)",
            }
      }
    >
      {special ? special.label : `#${rank}`}
    </div>
  );
}