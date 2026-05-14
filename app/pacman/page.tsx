import GameLayout from "@/components/GameLayout";
import PacmanGame from "@/components/games/PacmanGame";

const CONTROLS = [
  { key: "↑ ↓ ← →", description: "Move" },
  { key: "W A S D", description: "Move (alt)" },
  { key: "Swipe", description: "Mobile" },
];

export default function PacmanPage() {
  return (
    <GameLayout title="Pac-Man" controls={CONTROLS}>
      <PacmanGame />
    </GameLayout>
  );
}