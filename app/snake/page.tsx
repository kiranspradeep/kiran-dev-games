import GameLayout from "@/components/GameLayout";
import SnakeGame from "@/components/games/SnakeGame";
import ScoreSyncWrapper from "@/components/games/ScoreSyncWrapper";

const CONTROLS = [
  { key: "↑ ↓ ← →", description: "Move" },
  { key: "W A S D", description: "Move (alt)" },
  { key: "Swipe", description: "Mobile" },
];

export default function SnakePage() {
  return (
    <GameLayout title="Snake" controls={CONTROLS}>
      <ScoreSyncWrapper gameId="snake">
        <SnakeGame />
      </ScoreSyncWrapper>
    </GameLayout>
  );
}