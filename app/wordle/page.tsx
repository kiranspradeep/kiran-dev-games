//app\wordle\page.tsx
import GameLayout from "@/components/GameLayout";
import WordleGame from "@/components/games/WordleGame";

const CONTROLS = [
  { key: "A–Z", description: "Type a letter" },
  { key: "Enter", description: "Submit guess" },
  { key: "⌫", description: "Delete letter" },
];

export default function WordlePage() {
  return (
    <GameLayout title="Wordle" controls={CONTROLS}>
      <WordleGame />
    </GameLayout>
  );
}