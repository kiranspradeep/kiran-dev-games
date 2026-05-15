import GameLayout from "@/components/GameLayout";
import PacmanGame from "@/components/games/PacmanGame";
import ScoreSyncWrapper from "@/components/games/ScoreSyncWrapper";

const CONTROLS = [
  { key: "↑ ↓ ← →", description: "Move" },
  { key: "W A S D", description: "Move (alt)" },
  { key: "Swipe", description: "Mobile" },
];

export default function PacmanPage() {
  return (
    <GameLayout title="Pac-Man" controls={CONTROLS}>
      <ScoreSyncWrapper gameId="pacman">
        <PacmanGame />
      </ScoreSyncWrapper>
    </GameLayout>
  );
}