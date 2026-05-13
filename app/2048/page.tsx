import GameLayout from "@/components/GameLayout";
import Game2048 from "@/components/games/Game2048";

const CONTROLS = [
  { key: "↑ ↓ ← →", description: "Slide tiles" },
  { key: "W A S D", description: "Slide (alt)" },
  { key: "Swipe", description: "Mobile" },
];

export default function Page2048() {
  return (
    <GameLayout title="2048" controls={CONTROLS}>
      <Game2048 />
    </GameLayout>
  );
}